import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import QRCode from "qrcode";
import "./styles.css";

const emptyEvent = { name: "", description: "", date: "", time: "", location: "", ticketPrice: "0", capacity: "100" };

async function request(url, options = {}) {
  const token = localStorage.getItem("gatherly_token");
  const apiBaseUrl = import.meta.env.VITE_API_URL || "";
  const response = await fetch(`${apiBaseUrl}${url}`, {
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    ...options
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || "The request could not be completed.");
  }

  function TicketQr({ registrationId }) {
    const [src, setSrc] = useState("");
    useEffect(() => {
      QRCode.toDataURL(`${window.location.origin}/#ticket-${registrationId}`, { width: 140, margin: 1 }).then(setSrc);
    }, [registrationId]);
    return src ? <img src={src} alt="Ticket QR code" /> : <span className="qr-loading">Preparing QR...</span>;
  }

  function MyTickets({ tickets, loading, openEvent }) {
    return <section className="tickets-panel panel page-card">
      <div className="panel-heading"><div><p className="eyebrow">YOUR PASSES</p><h2>My tickets</h2><p>Keep every registration ready for the event day.</p></div></div>
      {loading ? <div className="empty"><p>Loading your tickets...</p></div> : tickets.length === 0 ? <div className="empty"><div className="empty-icon"><Icon name="ticket" /></div><h3>No tickets yet</h3><p>Register for a public event and it will appear here.</p></div> : <div className="ticket-list">{tickets.map((ticket) => {
        return <article className="ticket-card" key={ticket.registrationId}>
          <div className="ticket-info"><p className="eyebrow">{ticket.status === "CONFIRMED" ? "CONFIRMED TICKET" : "PAYMENT PENDING"}</p><h3>{ticket.eventName}</h3><p>{formatDate(ticket.date)} at {ticket.time} · {ticket.location}</p><strong>{Number(ticket.ticketPrice || 0) === 0 ? "Free ticket" : `₹${Number(ticket.ticketPrice).toFixed(2)} paid ticket`}</strong><button className="secondary-action" onClick={() => openEvent(ticket.eventId)}>View event <Icon name="arrow" /></button></div>
          <div className="ticket-qr"><TicketQr registrationId={ticket.registrationId} /><small>Show this QR at check-in</small></div>
        </article>;
      })}</div>}
    </section>;
  }
  return response.status === 204 ? null : response.json();
}

function Icon({ name }) {
  const paths = {
    grid: "M4 4h6v6H4V4Zm10 0h6v6h-6V4ZM4 14h6v6H4v-6Zm10 0h6v6h-6v-6Z",
    calendar: "M6 3v3m12-3v3M4 9h16M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z",
    clock: "M12 7v5l3 2m7-2a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z",
    location: "m20 10-8 8-8-8m8 8V3",
    plus: "M12 5v14m-7-7h14",
    search: "m21 21-4.35-4.35m2.35-5.65a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z",
    edit: "m4 16-1 5 5-1L19 9l-4-4L4 16Zm10-10 4 4",
    trash: "M5 7h14m-9 4v6m4-6v6M9 7V4h6v3m4 0-1 13H6L5 7h14Z",
    arrow: "M5 12h14m-6-6 6 6-6 6",
    ticket: "M4 7a3 3 0 0 0 0 6v4h16V7h-4a3 3 0 0 0-6 0H4Zm6 6h.01M14 13h.01"
  };
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d={paths[name]} /></svg>;
}

function formatDate(date) {
  const parsed = new Date(`${date}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? date : parsed.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function loadRazorpay() {
  if (window.Razorpay) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = resolve;
    script.onerror = () => reject(new Error("Razorpay checkout could not be loaded."));
    document.body.appendChild(script);
  });
}

function Layout({ page, setPage, events, error, loadEvents, user, logout, children }) {
  const pageName = page.startsWith("event-") ? "Event details" : page === "overview" ? "Overview" : page === "events" ? "All events" : page === "calendar" ? "Calendar" : page === "tickets" ? "My tickets" : "Create event";
  const pageTitle = page.startsWith("event-") ? "Event details" : page === "overview" ? "Good morning, planner" : page === "events" ? "All your events" : page === "calendar" ? "Your calendar" : page === "tickets" ? "Your tickets" : "Create something memorable";
  return <div className="app-shell">
    <aside className="sidebar">
      <button className="brand" onClick={() => setPage("overview")}><span className="brand-mark"><Icon name="calendar" /></span><span>Gatherly</span></button>
      <nav>
        <button className={page === "overview" ? "active" : ""} onClick={() => setPage("overview")}><Icon name="grid" /> Overview</button>
        <button className={page === "events" || page.startsWith("event-") ? "active" : ""} onClick={() => setPage("events")}><Icon name="calendar" /> All events <span className="nav-count">{events.length}</span></button>
        <button className={page === "calendar" ? "active" : ""} onClick={() => setPage("calendar")}><Icon name="calendar" /> Calendar</button>
        <button className={page === "tickets" ? "active" : ""} onClick={() => setPage("tickets")}><Icon name="ticket" /> My tickets</button>
        <button className={page === "create" ? "active" : ""} onClick={() => setPage("create")}><Icon name="plus" /> Create event</button>
      </nav>
      <div className="sidebar-footer"><div className="avatar">{user?.name?.slice(0, 2).toUpperCase() || "EM"}</div><div><strong>{user?.name || "Event Manager"}</strong><small>{user?.email || "Workspace"}</small></div><button className="logout" onClick={logout}>Log out</button></div>
    </aside>
    <main className="content">
      <header className="topbar"><div><p className="crumb">Workspace / {pageName}</p><h1>{pageTitle} <span>✦</span></h1></div><div className="topbar-actions"><div className="status"><span className="status-dot" /> All systems operational</div><button className="mobile-logout" onClick={logout}>Log out</button></div></header>
      {error && <div className="error"><strong>Something went wrong.</strong> {error}<button onClick={loadEvents}>Retry</button></div>}
      {children}
      <footer>Gatherly <span>·</span> Make room for what matters.</footer>
    </main>
  </div>;
}

function EventForm({ form, setForm, editingId, submit, cancel }) {
  return <form onSubmit={submit} className="create-panel panel page-card">
    <div className="panel-heading"><div><h2>{editingId ? "Edit event" : "Create an event"}</h2><p>{editingId ? "Update the details below" : "Bring your next idea to life"}</p></div><span className="form-spark">✦</span></div>
    <label>Event name<input required placeholder="e.g. Product launch" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
    <label>Description <span className="optional">Optional</span><textarea placeholder="What is this event about?" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></label>
    <div className="form-row"><label>Date<input required type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></label><label>Time<input required type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} /></label></div>
    <label>Location<input required placeholder="e.g. The Grand Hall" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></label>
    <div className="form-row"><label>Ticket price (INR)<input required min="0" step="0.01" type="number" value={form.ticketPrice} onChange={(e) => setForm({ ...form, ticketPrice: e.target.value })} /></label><label>Capacity<input required min="1" type="number" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} /></label></div>
    <button className="primary submit" type="submit"><Icon name={editingId ? "edit" : "plus"} /> {editingId ? "Save changes" : "Add event"}</button>
    {editingId && <button className="cancel" type="button" onClick={cancel}>Cancel editing</button>}
  </form>;
}

function EventList({ events, loading, edit, remove, openDetails }) {
  const [search, setSearch] = useState("");
  const [eventFilter, setEventFilter] = useState("all");
  const filtered = useMemo(() => events.filter((event) => {
    const textMatch = [event.name, event.description, event.location].some((value) => value?.toLowerCase().includes(search.toLowerCase()));
    const upcoming = new Date(`${event.date}T${event.time || "00:00"}`) >= new Date();
    return textMatch && (eventFilter === "all" || upcoming);
  }), [events, search, eventFilter]);
  return <section className="events-panel panel page-card">
    <div className="panel-heading"><div><h2>{eventFilter === "all" ? "All events" : "Upcoming events"}</h2><p>Everything you have planned</p></div></div>
    <div className="toolbar"><div className="search"><Icon name="search" /><input aria-label="Search events" placeholder="Search events..." value={search} onChange={(event) => setSearch(event.target.value)} /></div><select className="filter" value={eventFilter} onChange={(event) => setEventFilter(event.target.value)}><option value="all">All events</option><option value="upcoming">Upcoming</option></select></div>
    {loading ? <div className="empty"><p>Loading your events...</p></div> : filtered.length === 0 ? <div className="empty"><div className="empty-icon"><Icon name="calendar" /></div><h3>{search ? "No matching events" : "Your calendar is clear"}</h3><p>{search ? "Try another search term." : "Create an event to get your plans moving."}</p></div> : <div className="event-list">{filtered.map((event) => <article className="event-row event-row-clickable" key={event.id} onClick={() => openDetails(event.id)}><div className="date-block"><strong>{new Date(`${event.date}T00:00:00`).getDate() || "--"}</strong><span>{new Date(`${event.date}T00:00:00`).toLocaleDateString("en-US", { month: "short" })}</span></div><div className="event-info"><h3>{event.name}</h3><p><Icon name="clock" /> {formatDate(event.date)} at {event.time} <span>·</span> <Icon name="location" /> {event.location}</p>{event.description && <small>{event.description}</small>}</div><div className="row-actions"><button aria-label={`Edit ${event.name}`} onClick={(clickEvent) => { clickEvent.stopPropagation(); edit(event); }}><Icon name="edit" /></button><button aria-label={`Delete ${event.name}`} onClick={(clickEvent) => { clickEvent.stopPropagation(); remove(event.id); }}><Icon name="trash" /></button></div></article>)}</div>}
  </section>;
}

function PublicEvents({ events, loading, openDetails, openLogin }) {
  const [search, setSearch] = useState("");
  const filtered = events.filter((event) => [event.name, event.description, event.location]
    .some((value) => value?.toLowerCase().includes(search.toLowerCase())));
  return <main className="public-shell">
    <header className="public-header"><button className="brand" onClick={() => window.location.hash = ""}><span className="brand-mark"><Icon name="calendar" /></span><span>Gatherly</span></button><div><button className="public-login" onClick={() => openLogin("login")}>Sign in</button><button className="primary public-cta" onClick={() => openLogin("register")}>Create an event</button></div></header>
    <section className="public-hero"><p className="eyebrow">DISCOVER WHAT'S HAPPENING</p><h1>Find your next<br /><em>memorable moment.</em></h1><p>Explore events from local organizers and communities. Register for the ones you love.</p></section>
    <section className="public-events"><div className="public-section-heading"><div><p className="eyebrow">OPEN TO EVERYONE</p><h2>Upcoming events</h2></div><div className="search public-search"><Icon name="search" /><input aria-label="Search public events" placeholder="Search events..." value={search} onChange={(event) => setSearch(event.target.value)} /></div></div>
      {loading ? <div className="empty"><p>Loading events...</p></div> : filtered.length === 0 ? <div className="empty"><h3>No events found</h3><p>Try a different search.</p></div> : <div className="public-event-grid">{filtered.map((event) => <article className="public-event-card" key={event.id} onClick={() => openDetails(event.id)}><div className="public-date"><strong>{new Date(`${event.date}T00:00:00`).getDate()}</strong><span>{new Date(`${event.date}T00:00:00`).toLocaleDateString("en-US", { month: "short" })}</span></div><h3>{event.name}</h3>{event.description && <p>{event.description}</p>}<small><Icon name="clock" /> {formatDate(event.date)} at {event.time}</small><small><Icon name="location" /> {event.location}</small><button className="public-register" onClick={(clickEvent) => { clickEvent.stopPropagation(); openLogin("register"); }}>Register to attend <Icon name="arrow" /></button></article>)}</div>}
    </section>
    <footer>Gatherly <span>·</span> Make room for what matters.</footer>
  </main>;
}

function PublicEventDetails({ event, openLogin, goBack }) {
  const price = Number(event.ticketPrice || 0);
  return <main className="public-shell"><header className="public-header"><button className="brand" onClick={goBack}><span className="brand-mark"><Icon name="calendar" /></span><span>Gatherly</span></button><button className="primary public-cta" onClick={() => openLogin("register")}>Register to attend</button></header><section className="public-detail panel"><button className="back-link" onClick={goBack}>← Back to events</button><p className="eyebrow">EVENT DETAILS</p><h1>{event.name}</h1><p className="public-detail-meta"><Icon name="calendar" /> {formatDate(event.date)} at {event.time} <span>·</span> <Icon name="location" /> {event.location}</p>{event.description && <p className="details-description">{event.description}</p>}<div className="public-ticket-meta"><strong>{price === 0 ? "Free entry" : `₹${price.toFixed(2)} per ticket`}</strong><span>{event.capacity || "Limited"} spots</span></div><div className="public-register-box"><div><h2>Want to attend?</h2><p>Sign in to register{price > 0 ? " and continue to secure payment" : ""}.</p></div><button className="primary" onClick={() => openLogin("register")}>Register now <Icon name="arrow" /></button></div></section><footer>Gatherly <span>·</span> Make room for what matters.</footer></main>;
}

function EventDetails({ event, goBack, updateRsvp }) {
  const [summary, setSummary] = useState(null);
  const [attendees, setAttendees] = useState([]);
  const [checkIn, setCheckIn] = useState(null);
  const [checkedInAttendees, setCheckedInAttendees] = useState([]);
  const [registration, setRegistration] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [qrCode, setQrCode] = useState("");
  const [error, setError] = useState("");
  useEffect(() => {
    Promise.all([request(`/api/events/${event.id}/rsvp`), request(`/api/events/${event.id}/rsvp/attendees`).catch(() => []), request(`/api/events/${event.id}/check-in`), request(`/api/events/${event.id}/check-in/attendees`).catch(() => []), request(`/api/events/${event.id}/registrations`).catch(() => []), request(`/api/events/${event.id}/registrations/analytics`).catch(() => null)])
      .then(([nextSummary, nextAttendees, nextCheckIn, nextCheckedIn, nextRegistrations, nextAnalytics]) => { setSummary(nextSummary); setAttendees(nextAttendees); setCheckIn(nextCheckIn); setCheckedInAttendees(nextCheckedIn); setRegistrations(nextRegistrations); setAnalytics(nextAnalytics); })
      .catch((err) => setError(err.message));
    QRCode.toDataURL(`${window.location.origin}/#event-${event.id}`, { width: 220, margin: 2 })
      .then(setQrCode).catch(() => setError("Could not generate the event QR code."));
  }, [event.id]);
  const respond = async (status) => {
    try {
      const nextSummary = await request(`/api/events/${event.id}/rsvp`, { method: "PUT", body: JSON.stringify({ status }) });
      setSummary(nextSummary);
      if (nextSummary.owner) setAttendees(await request(`/api/events/${event.id}/rsvp/attendees`));
    } catch (err) { setError(err.message); }
  };
  const selfCheckIn = async () => {
    try { setCheckIn(await request(`/api/events/${event.id}/check-in`, { method: "POST" })); }
    catch (err) { setError(err.message); }
  };
  const checkInAttendee = async (email) => {
    try {
      setCheckIn(await request(`/api/events/${event.id}/check-in/attendees`, { method: "POST", body: JSON.stringify({ email }) }));
      setCheckedInAttendees(await request(`/api/events/${event.id}/check-in/attendees`));
    } catch (err) { setError(err.message); }
  };
  const register = async () => {
    try {
      if (Number(event.ticketPrice || 0) === 0) {
        setRegistration(await request(`/api/events/${event.id}/registrations`, { method: "POST" }));
        return;
      }
      await loadRazorpay();
      const order = await request(`/api/events/${event.id}/registrations/payment-order`, { method: "POST" });
      const result = await new Promise((resolve, reject) => {
        const checkout = new window.Razorpay({
          key: order.keyId,
          amount: order.amount,
          currency: order.currency,
          name: "Gatherly",
          description: event.name,
          order_id: order.orderId,
          prefill: { name: JSON.parse(localStorage.getItem("gatherly_user") || "{}").name },
          handler: resolve,
          modal: { ondismiss: () => reject(new Error("Payment was cancelled.")) }
        });
        checkout.on("payment.failed", () => reject(new Error("Payment failed. Please try again.")));
        checkout.open();
      });
      setRegistration(await request(`/api/events/${event.id}/registrations/verify-payment`, {
        method: "POST",
        body: JSON.stringify({ razorpayOrderId: result.razorpay_order_id, razorpayPaymentId: result.razorpay_payment_id, razorpaySignature: result.razorpay_signature })
      }));
    }
    catch (err) { setRegistration({ error: err.message }); }
  };
  return <section className="details-panel panel page-card">
    <button className="back-link" onClick={goBack}>← Back to all events</button>
    <div className="details-heading"><div><p className="eyebrow">EVENT DETAILS</p><h2>{event.name}</h2><p>{formatDate(event.date)} at {event.time} · {event.location}</p></div><span className="form-spark">✦</span></div>
    {event.description && <p className="details-description">{event.description}</p>}
    {error && <div className="error">{error}</div>}
    <div className="rsvp-card registration-card"><div><strong>{Number(event.ticketPrice || 0) === 0 ? "Free registration" : `₹${Number(event.ticketPrice).toFixed(2)} registration`}</strong><p>{registration?.error || `${registration?.registered || 0} of ${event.capacity || "limited"} spots registered`}</p></div><button className="primary" onClick={register}>{registration?.status === "CONFIRMED" ? "Registered" : Number(event.ticketPrice || 0) === 0 ? "Register now" : "Start payment"}</button></div>
    <div className="rsvp-card"><div><strong>RSVP</strong><p>{summary?.attending || 0} attending · {summary?.declined || 0} declined</p></div><div className="rsvp-actions"><button className={summary?.currentUserStatus === "ATTENDING" ? "rsvp active" : "rsvp"} onClick={() => respond("ATTENDING")}>I’m attending</button><button className={summary?.currentUserStatus === "DECLINED" ? "rsvp declined active" : "rsvp declined"} onClick={() => respond("DECLINED")}>Can’t attend</button></div></div>
    <div className="checkin-card"><div><h3>Event check-in</h3><p>{checkIn?.checkedIn || 0} people checked in</p><button className={checkIn?.currentUserCheckedIn ? "rsvp active" : "rsvp"} onClick={selfCheckIn}>{checkIn?.currentUserCheckedIn ? "Checked in" : "Check myself in"}</button></div>{qrCode && <div className="qr-code"><img src={qrCode} alt={`QR code for ${event.name}`} /><small>Scan to open this event</small></div>}</div>
    {summary?.owner && <div className="attendee-list"><div className="panel-heading"><h3>Registrations</h3><button className="secondary-action" onClick={async () => { const response = await fetch(`${import.meta.env.VITE_API_URL || ""}/api/events/${event.id}/registrations/export`, { headers: { Authorization: `Bearer ${localStorage.getItem("gatherly_token")}` } }); const blob = await response.blob(); const link = document.createElement("a"); link.href = URL.createObjectURL(blob); link.download = `event-${event.id}-registrations.csv`; link.click(); URL.revokeObjectURL(link.href); }}>Export CSV</button></div>{analytics && <div className="analytics-row"><span><strong>{analytics.confirmed}</strong> confirmed</span><span><strong>{analytics.pending}</strong> pending</span><span><strong>{analytics.remaining}</strong> seats left</span><span><strong>₹{Number(analytics.revenue || 0).toFixed(2)}</strong> revenue</span></div>}{registrations.length === 0 ? <p className="muted">No registrations yet.</p> : registrations.map((attendee) => <div className="attendee" key={attendee.email}><span className="avatar">{attendee.name.slice(0, 2).toUpperCase()}</span><span><strong>{attendee.name}</strong><small>{attendee.email}</small></span><em>{attendee.status === "CONFIRMED" ? "Registered" : "Payment pending"}</em></div>)}</div>}
  </section>;
}

function CalendarView({ events, openDetails }) {
  const [month, setMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const firstDay = new Date(year, monthIndex, 1).getDay();
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const cells = Array.from({ length: Math.ceil((firstDay + daysInMonth) / 7) * 7 }, (_, index) => {
    const day = index - firstDay + 1;
    return day > 0 && day <= daysInMonth ? new Date(year, monthIndex, day) : null;
  });
  const eventsForDay = (day) => events.filter((event) => event.date === `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`);
  return <section className="calendar-panel panel">
    <div className="calendar-heading"><div><h2>{month.toLocaleDateString("en-US", { month: "long", year: "numeric" })}</h2><p>Plan and review your schedule</p></div><div className="month-actions"><button onClick={() => setMonth(new Date(year, monthIndex - 1, 1))} aria-label="Previous month">‹</button><button onClick={() => setMonth(new Date())}>Today</button><button onClick={() => setMonth(new Date(year, monthIndex + 1, 1))} aria-label="Next month">›</button></div></div>
    <div className="calendar-grid calendar-weekdays">{["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => <span key={day}>{day}</span>)}</div>
    <div className="calendar-grid calendar-days">{cells.map((date, index) => {
      const dayEvents = date ? eventsForDay(date.getDate()) : [];
      return <div className={date ? "calendar-day" : "calendar-day empty-day"} key={`${date || "empty"}-${index}`}>{date && <><strong>{date.getDate()}</strong>{dayEvents.map((event) => <button className="calendar-event" key={event.id} onClick={() => openDetails(event.id)}>{event.name}</button>)}</>}</div>;
    })}</div>
  </section>;
}

function AuthPage({ onAuthenticated }) {
  const [mode, setMode] = useState(() => localStorage.getItem("gatherly_auth_mode") || "login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const submit = async (event) => {
    event.preventDefault();
    try {
      const response = await request(`/api/auth/${mode}`, { method: "POST", body: JSON.stringify(form) });
      localStorage.setItem("gatherly_token", response.token);
      localStorage.setItem("gatherly_user", JSON.stringify(response));
      localStorage.removeItem("gatherly_auth_mode");
      onAuthenticated(response);
    } catch (err) {
      setError(err.message);
    }
  };
  return <main className="auth-shell"><div className="auth-brand"><span className="brand-mark"><Icon name="calendar" /></span> Gatherly</div><section className="auth-card"><p className="eyebrow">WELCOME BACK</p><h1>{mode === "login" ? "Sign in to your workspace" : "Create your workspace"}</h1><p className="auth-subtitle">{mode === "login" ? "Plan memorable moments with your team." : "Start organizing your events today."}</p>{error && <div className="error">{error}</div>}<form onSubmit={submit}>{mode === "register" && <label>Full name<input required placeholder="Your name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>}<label>Email<input required type="email" placeholder="you@example.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label><label>Password<input required minLength="8" type="password" placeholder="At least 8 characters" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></label><button className="primary submit" type="submit">{mode === "login" ? "Sign in" : "Create account"} <Icon name="arrow" /></button></form><p className="auth-switch">{mode === "login" ? "New to Gatherly?" : "Already have an account?"} <button onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }}> {mode === "login" ? "Create an account" : "Sign in"}</button></p></section></main>;
}

function App() {
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem("gatherly_user") || "null"));
  const [page, setPageState] = useState(window.location.hash.slice(1) || "overview");
  const [events, setEvents] = useState([]);
  const [publicEvents, setPublicEvents] = useState([]);
  const [publicLoading, setPublicLoading] = useState(true);
  const [publicSelectedEvent, setPublicSelectedEvent] = useState(null);
  const [sharedEvent, setSharedEvent] = useState(null);
  const [form, setForm] = useState(emptyEvent);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [tickets, setTickets] = useState([]);
  const [ticketsLoading, setTicketsLoading] = useState(false);
  const setPage = (nextPage) => { setPageState(nextPage); window.history.pushState({}, "", `#${nextPage}`); window.scrollTo(0, 0); };
  const loadEvents = async () => { try { setLoading(true); setEvents(await request("/api/events")); setError(""); } catch (err) { setError(err.message); } finally { setLoading(false); } };
  const loadPublicEvents = async () => { try { setPublicLoading(true); setPublicEvents(await request("/api/public/events")); } catch (err) { setError(err.message); } finally { setPublicLoading(false); } };
  const loadTickets = async () => { try { setTicketsLoading(true); setTickets(await request("/api/registrations/me")); } catch (err) { setError(err.message); } finally { setTicketsLoading(false); } };
  useEffect(() => { if (user) loadEvents(); const onPop = () => setPageState(window.location.hash.slice(1) || "overview"); window.addEventListener("popstate", onPop); return () => window.removeEventListener("popstate", onPop); }, [user]);
  useEffect(() => { if (user && page === "tickets") loadTickets(); }, [user, page]);
  useEffect(() => { if (!user) loadPublicEvents(); }, [user]);
  useEffect(() => {
    const eventId = page.startsWith("public-event-") ? page.slice(13) : null;
    if (!eventId) return setPublicSelectedEvent(null);
    const cached = publicEvents.find((event) => String(event.id) === eventId);
    if (cached) return setPublicSelectedEvent(cached);
    request(`/api/public/events/${eventId}`).then(setPublicSelectedEvent).catch((err) => setError(err.message));
  }, [page, publicEvents]);
  useEffect(() => {
    const eventId = page.startsWith("event-") ? page.slice(6) : null;
    if (!user || !eventId || events.some((event) => String(event.id) === eventId)) {
      if (!eventId) setSharedEvent(null);
      return;
    }
    request(`/api/events/${eventId}`).then(setSharedEvent).catch((err) => setError(err.message));
  }, [user, page, events]);
  const submit = async (event) => { event.preventDefault(); try { await request(editingId ? `/api/events/${editingId}` : "/api/events", { method: editingId ? "PUT" : "POST", body: JSON.stringify(form) }); setForm(emptyEvent); setEditingId(null); await loadEvents(); setPage("events"); } catch (err) { setError(err.message); } };
  const edit = (event) => { setEditingId(event.id); setForm({ name: event.name, description: event.description || "", date: event.date, time: event.time, location: event.location, ticketPrice: event.ticketPrice || "0", capacity: event.capacity || "100" }); setPage("create"); };
  const remove = async (id) => { if (!window.confirm("Delete this event?")) return; try { await request(`/api/events/${id}`, { method: "DELETE" }); await loadEvents(); } catch (err) { setError(err.message); } };
  const cancel = () => { setEditingId(null); setForm(emptyEvent); setPage("events"); };
  const upcoming = events.filter((event) => new Date(`${event.date}T${event.time || "00:00"}`) >= new Date()).length;
  const overview = <><section className="hero"><div><p className="eyebrow">YOUR EVENT HUB</p><h2>Make every moment<br /><em>memorable.</em></h2><p>Keep your plans clear, your team aligned, and every detail in one place.</p></div><div className="hero-shape"><span>✦</span><span>✧</span><span>✦</span></div></section><section className="stats"><div className="stat-card"><span className="stat-icon purple"><Icon name="calendar" /></span><div><small>Total events</small><strong>{events.length}</strong></div><span className="trend">Live</span></div><div className="stat-card"><span className="stat-icon orange"><Icon name="clock" /></span><div><small>Upcoming</small><strong>{upcoming}</strong></div><span className="trend neutral">Scheduled</span></div><div className="stat-card"><span className="stat-icon green"><Icon name="location" /></span><div><small>Locations</small><strong>{new Set(events.map((event) => event.location)).size}</strong></div><span className="trend neutral">All time</span></div></section><div className="overview-actions"><button className="primary" onClick={() => setPage("create")}><Icon name="plus" /> Create event</button><button className="secondary-action" onClick={() => setPage("events")}>View all events <Icon name="arrow" /></button></div></>;
  const selectedEvent = page.startsWith("event-") ? events.find((event) => String(event.id) === page.slice(6)) || sharedEvent : null;
  const content = page === "overview" ? overview : page === "create" ? <EventForm form={form} setForm={setForm} editingId={editingId} submit={submit} cancel={cancel} /> : page === "events" ? <EventList events={events} loading={loading} edit={edit} remove={remove} openDetails={(id) => setPage(`event-${id}`)} /> : page === "calendar" ? <CalendarView events={events} openDetails={(id) => setPage(`event-${id}`)} /> : page === "tickets" ? <MyTickets tickets={tickets} loading={ticketsLoading} openEvent={(id) => setPage(`event-${id}`)} /> : selectedEvent ? <EventDetails event={selectedEvent} goBack={() => setPage("events")} /> : <EventList events={events} loading={loading} edit={edit} remove={remove} openDetails={(id) => setPage(`event-${id}`)} />;
  if (!user) {
    const openLogin = (mode) => { localStorage.setItem("gatherly_auth_mode", mode); setPageState("login"); };
    if (page === "login") return <AuthPage onAuthenticated={setUser} />;
    if (page.startsWith("public-event-") && publicSelectedEvent) return <PublicEventDetails event={publicSelectedEvent} openLogin={openLogin} goBack={() => { setPageState("events"); setPublicSelectedEvent(null); }} />;
    return <PublicEvents events={publicEvents} loading={publicLoading} openDetails={(id) => { setPageState(`public-event-${id}`); }} openLogin={openLogin} />;
  }
  return <Layout page={page} setPage={setPage} events={events} error={error} loadEvents={loadEvents} user={user} logout={() => { localStorage.removeItem("gatherly_token"); localStorage.removeItem("gatherly_user"); setUser(null); }} >{content}</Layout>;
}

createRoot(document.getElementById("root")).render(<React.StrictMode><App /></React.StrictMode>);

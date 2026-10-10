import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

const emptyEvent = { name: "", description: "", date: "", time: "", location: "" };

async function request(url, options = {}) {
  const token = localStorage.getItem("gatherly_token");
  const response = await fetch(url, {
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    ...options
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || "The request could not be completed.");
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
    arrow: "M5 12h14m-6-6 6 6-6 6"
  };
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d={paths[name]} /></svg>;
}

function formatDate(date) {
  const parsed = new Date(`${date}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? date : parsed.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function Layout({ page, setPage, events, error, loadEvents, user, logout, children }) {
  return <div className="app-shell">
    <aside className="sidebar">
      <button className="brand" onClick={() => setPage("overview")}><span className="brand-mark"><Icon name="calendar" /></span><span>Gatherly</span></button>
      <nav>
        <button className={page === "overview" ? "active" : ""} onClick={() => setPage("overview")}><Icon name="grid" /> Overview</button>
        <button className={page === "events" ? "active" : ""} onClick={() => setPage("events")}><Icon name="calendar" /> All events <span className="nav-count">{events.length}</span></button>
        <button className={page === "create" ? "active" : ""} onClick={() => setPage("create")}><Icon name="plus" /> Create event</button>
      </nav>
      <div className="sidebar-footer"><div className="avatar">{user?.name?.slice(0, 2).toUpperCase() || "EM"}</div><div><strong>{user?.name || "Event Manager"}</strong><small>{user?.email || "Workspace"}</small></div><button className="logout" onClick={logout}>Log out</button></div>
    </aside>
    <main className="content">
      <header className="topbar"><div><p className="crumb">Workspace / {page === "overview" ? "Overview" : page === "events" ? "All events" : "Create event"}</p><h1>{page === "overview" ? "Good morning, planner" : page === "events" ? "All your events" : "Create something memorable"} <span>✦</span></h1></div><div className="status"><span className="status-dot" /> All systems operational</div></header>
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
    <button className="primary submit" type="submit"><Icon name={editingId ? "edit" : "plus"} /> {editingId ? "Save changes" : "Add event"}</button>
    {editingId && <button className="cancel" type="button" onClick={cancel}>Cancel editing</button>}
  </form>;
}

function EventList({ events, loading, edit, remove }) {
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
    {loading ? <div className="empty"><p>Loading your events...</p></div> : filtered.length === 0 ? <div className="empty"><div className="empty-icon"><Icon name="calendar" /></div><h3>{search ? "No matching events" : "Your calendar is clear"}</h3><p>{search ? "Try another search term." : "Create an event to get your plans moving."}</p></div> : <div className="event-list">{filtered.map((event) => <article className="event-row" key={event.id}><div className="date-block"><strong>{new Date(`${event.date}T00:00:00`).getDate() || "--"}</strong><span>{new Date(`${event.date}T00:00:00`).toLocaleDateString("en-US", { month: "short" })}</span></div><div className="event-info"><h3>{event.name}</h3><p><Icon name="clock" /> {formatDate(event.date)} at {event.time} <span>·</span> <Icon name="location" /> {event.location}</p>{event.description && <small>{event.description}</small>}</div><div className="row-actions"><button aria-label={`Edit ${event.name}`} onClick={() => edit(event)}><Icon name="edit" /></button><button aria-label={`Delete ${event.name}`} onClick={() => remove(event.id)}><Icon name="trash" /></button></div></article>)}</div>}
  </section>;
}

function AuthPage({ onAuthenticated }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const submit = async (event) => {
    event.preventDefault();
    try {
      const response = await request(`/api/auth/${mode}`, { method: "POST", body: JSON.stringify(form) });
      localStorage.setItem("gatherly_token", response.token);
      localStorage.setItem("gatherly_user", JSON.stringify(response));
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
  const [form, setForm] = useState(emptyEvent);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const setPage = (nextPage) => { setPageState(nextPage); window.history.pushState({}, "", `#${nextPage}`); window.scrollTo(0, 0); };
  const loadEvents = async () => { try { setLoading(true); setEvents(await request("/api/events")); setError(""); } catch (err) { setError(err.message); } finally { setLoading(false); } };
  useEffect(() => { if (user) loadEvents(); const onPop = () => setPageState(window.location.hash.slice(1) || "overview"); window.addEventListener("popstate", onPop); return () => window.removeEventListener("popstate", onPop); }, [user]);
  const submit = async (event) => { event.preventDefault(); try { await request(editingId ? `/api/events/${editingId}` : "/api/events", { method: editingId ? "PUT" : "POST", body: JSON.stringify(form) }); setForm(emptyEvent); setEditingId(null); await loadEvents(); setPage("events"); } catch (err) { setError(err.message); } };
  const edit = (event) => { setEditingId(event.id); setForm({ name: event.name, description: event.description || "", date: event.date, time: event.time, location: event.location }); setPage("create"); };
  const remove = async (id) => { if (!window.confirm("Delete this event?")) return; try { await request(`/api/events/${id}`, { method: "DELETE" }); await loadEvents(); } catch (err) { setError(err.message); } };
  const cancel = () => { setEditingId(null); setForm(emptyEvent); setPage("events"); };
  const upcoming = events.filter((event) => new Date(`${event.date}T${event.time || "00:00"}`) >= new Date()).length;
  const overview = <><section className="hero"><div><p className="eyebrow">YOUR EVENT HUB</p><h2>Make every moment<br /><em>memorable.</em></h2><p>Keep your plans clear, your team aligned, and every detail in one place.</p></div><div className="hero-shape"><span>✦</span><span>✧</span><span>✦</span></div></section><section className="stats"><div className="stat-card"><span className="stat-icon purple"><Icon name="calendar" /></span><div><small>Total events</small><strong>{events.length}</strong></div><span className="trend">Live</span></div><div className="stat-card"><span className="stat-icon orange"><Icon name="clock" /></span><div><small>Upcoming</small><strong>{upcoming}</strong></div><span className="trend neutral">Scheduled</span></div><div className="stat-card"><span className="stat-icon green"><Icon name="location" /></span><div><small>Locations</small><strong>{new Set(events.map((event) => event.location)).size}</strong></div><span className="trend neutral">All time</span></div></section><div className="overview-actions"><button className="primary" onClick={() => setPage("create")}><Icon name="plus" /> Create event</button><button className="secondary-action" onClick={() => setPage("events")}>View all events <Icon name="arrow" /></button></div></>;
  const content = page === "overview" ? overview : page === "create" ? <EventForm form={form} setForm={setForm} editingId={editingId} submit={submit} cancel={cancel} /> : <EventList events={events} loading={loading} edit={edit} remove={remove} />;
  if (!user) return <AuthPage onAuthenticated={setUser} />;
  return <Layout page={page} setPage={setPage} events={events} error={error} loadEvents={loadEvents} user={user} logout={() => { localStorage.removeItem("gatherly_token"); localStorage.removeItem("gatherly_user"); setUser(null); }} >{content}</Layout>;
}

createRoot(document.getElementById("root")).render(<React.StrictMode><App /></React.StrictMode>);

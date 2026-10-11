package com.event.management.event_management_system.entity;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "event_registrations", uniqueConstraints = @UniqueConstraint(columnNames = {"event_id", "attendee_id"}))
public class EventRegistration {
    public enum Status { PENDING_PAYMENT, CONFIRMED, CANCELLED }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    private Event event;

    @ManyToOne(optional = false)
    private User attendee;

    @Enumerated(EnumType.STRING)
    private Status status;

    private String razorpayOrderId;
    private String razorpayPaymentId;
    private Instant createdAt = Instant.now();

    protected EventRegistration() {}

    public EventRegistration(Event event, User attendee, Status status) {
        this.event = event;
        this.attendee = attendee;
        this.status = status;
    }

    public Long getId() { return id; }
    public Event getEvent() { return event; }
    public User getAttendee() { return attendee; }
    public Status getStatus() { return status; }
    public void setStatus(Status status) { this.status = status; }
    public String getRazorpayOrderId() { return razorpayOrderId; }
    public void setRazorpayOrderId(String razorpayOrderId) { this.razorpayOrderId = razorpayOrderId; }
    public String getRazorpayPaymentId() { return razorpayPaymentId; }
    public void setRazorpayPaymentId(String razorpayPaymentId) { this.razorpayPaymentId = razorpayPaymentId; }
    public Instant getCreatedAt() { return createdAt; }
}

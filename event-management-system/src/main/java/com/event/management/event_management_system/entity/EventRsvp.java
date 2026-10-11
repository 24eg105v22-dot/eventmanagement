package com.event.management.event_management_system.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

@Entity
@Table(name = "event_rsvps", uniqueConstraints = @UniqueConstraint(columnNames = {"event_id", "user_id"}))
public class EventRsvp {
    public enum Status { ATTENDING, DECLINED }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    private Event event;

    @ManyToOne(optional = false)
    private User user;

    @Enumerated(EnumType.STRING)
    private Status status;

    protected EventRsvp() {
    }

    public EventRsvp(Event event, User user, Status status) {
        this.event = event;
        this.user = user;
        this.status = status;
    }

    public Long getId() { return id; }
    public Event getEvent() { return event; }
    public User getUser() { return user; }
    public Status getStatus() { return status; }
    public void setStatus(Status status) { this.status = status; }
}

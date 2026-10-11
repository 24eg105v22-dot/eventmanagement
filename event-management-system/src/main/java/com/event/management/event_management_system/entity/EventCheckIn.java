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

import java.time.Instant;

@Entity
@Table(name = "event_check_ins", uniqueConstraints = @UniqueConstraint(columnNames = {"event_id", "user_id"}))
public class EventCheckIn {
    public enum Status { CHECKED_IN }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    private Event event;

    @ManyToOne(optional = false)
    private User user;

    @Enumerated(EnumType.STRING)
    private Status status = Status.CHECKED_IN;

    private Instant checkedInAt;

    protected EventCheckIn() {
    }

    public EventCheckIn(Event event, User user) {
        this.event = event;
        this.user = user;
        this.checkedInAt = Instant.now();
    }

    public User getUser() { return user; }
    public Instant getCheckedInAt() { return checkedInAt; }
}

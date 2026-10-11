package com.event.management.event_management_system.repository;

import com.event.management.event_management_system.entity.EventRsvp;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface EventRsvpRepository extends JpaRepository<EventRsvp, Long> {
    Optional<EventRsvp> findByEventIdAndUserEmailIgnoreCase(Long eventId, String email);
    List<EventRsvp> findAllByEventId(Long eventId);
    long countByEventIdAndStatus(Long eventId, EventRsvp.Status status);
}

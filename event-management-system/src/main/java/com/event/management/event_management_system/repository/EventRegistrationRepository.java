package com.event.management.event_management_system.repository;

import com.event.management.event_management_system.entity.EventRegistration;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface EventRegistrationRepository extends JpaRepository<EventRegistration, Long> {
    Optional<EventRegistration> findByEventIdAndAttendeeEmailIgnoreCase(Long eventId, String email);
    List<EventRegistration> findAllByEventId(Long eventId);
    long countByEventIdAndStatus(Long eventId, EventRegistration.Status status);
}

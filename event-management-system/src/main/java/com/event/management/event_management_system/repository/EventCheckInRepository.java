package com.event.management.event_management_system.repository;

import com.event.management.event_management_system.entity.EventCheckIn;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface EventCheckInRepository extends JpaRepository<EventCheckIn, Long> {
    Optional<EventCheckIn> findByEventIdAndUserEmailIgnoreCase(Long eventId, String email);
    List<EventCheckIn> findAllByEventId(Long eventId);
}

package com.event.management.event_management_system.service;

import com.event.management.event_management_system.entity.Event;
import com.event.management.event_management_system.entity.EventCheckIn;
import com.event.management.event_management_system.entity.User;
import com.event.management.event_management_system.repository.EventCheckInRepository;
import com.event.management.event_management_system.repository.EventRepository;
import com.event.management.event_management_system.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class EventCheckInService {
    private final EventRepository eventRepository;
    private final EventCheckInRepository checkInRepository;
    private final UserRepository userRepository;

    public EventCheckInService(EventRepository eventRepository, EventCheckInRepository checkInRepository,
                               UserRepository userRepository) {
        this.eventRepository = eventRepository;
        this.checkInRepository = checkInRepository;
        this.userRepository = userRepository;
    }

    public CheckInSummary summary(Long eventId, String email) {
        Event event = event(eventId);
        boolean owner = event.getOwner() != null && event.getOwner().getEmail().equalsIgnoreCase(email);
        return new CheckInSummary(eventId, owner,
                checkInRepository.findByEventIdAndUserEmailIgnoreCase(eventId, email).isPresent(),
                checkInRepository.findAllByEventId(eventId).size());
    }

    public CheckInSummary selfCheckIn(Long eventId, String email) {
        Event event = event(eventId);
        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new IllegalArgumentException("Authenticated user not found."));
        checkInRepository.findByEventIdAndUserEmailIgnoreCase(eventId, email)
                .orElseGet(() -> checkInRepository.save(new EventCheckIn(event, user)));
        return summary(eventId, email);
    }

    public List<CheckedInAttendee> attendees(Long eventId, String email) {
        Event event = event(eventId);
        requireOwner(event, email);
        return checkInRepository.findAllByEventId(eventId).stream()
                .map(checkIn -> new CheckedInAttendee(checkIn.getUser().getName(), checkIn.getUser().getEmail(),
                        checkIn.getCheckedInAt()))
                .toList();
    }

    public CheckInSummary checkInAttendee(Long eventId, String attendeeEmail, String ownerEmail) {
        Event event = event(eventId);
        requireOwner(event, ownerEmail);
        User attendee = userRepository.findByEmailIgnoreCase(attendeeEmail)
                .orElseThrow(() -> new IllegalArgumentException("Attendee account not found."));
        checkInRepository.findByEventIdAndUserEmailIgnoreCase(eventId, attendeeEmail)
                .orElseGet(() -> checkInRepository.save(new EventCheckIn(event, attendee)));
        return summary(eventId, ownerEmail);
    }

    private void requireOwner(Event event, String email) {
        if (event.getOwner() == null || !event.getOwner().getEmail().equalsIgnoreCase(email)) {
            throw new IllegalArgumentException("Only the event owner can manage check-ins.");
        }
    }

    private Event event(Long eventId) {
        return eventRepository.findById(eventId)
                .orElseThrow(() -> new EventService.EventNotFoundException(eventId));
    }

    public record CheckInSummary(Long eventId, boolean owner, boolean currentUserCheckedIn, long checkedIn) {}
    public record CheckedInAttendee(String name, String email, java.time.Instant checkedInAt) {}
}

package com.event.management.event_management_system.service;

import com.event.management.event_management_system.entity.Event;
import com.event.management.event_management_system.entity.EventRsvp;
import com.event.management.event_management_system.entity.User;
import com.event.management.event_management_system.repository.EventRepository;
import com.event.management.event_management_system.repository.EventRsvpRepository;
import com.event.management.event_management_system.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class EventRsvpService {
    private final EventRepository eventRepository;
    private final EventRsvpRepository rsvpRepository;
    private final UserRepository userRepository;

    public EventRsvpService(EventRepository eventRepository, EventRsvpRepository rsvpRepository, UserRepository userRepository) {
        this.eventRepository = eventRepository;
        this.rsvpRepository = rsvpRepository;
        this.userRepository = userRepository;
    }

    public RsvpSummary summary(Long eventId, String email) {
        Event event = event(eventId);
        EventRsvp current = rsvpRepository.findByEventIdAndUserEmailIgnoreCase(eventId, email).orElse(null);
        return new RsvpSummary(event.getId(), event.getOwner() != null
                && event.getOwner().getEmail().equalsIgnoreCase(email),
                rsvpRepository.countByEventIdAndStatus(eventId, EventRsvp.Status.ATTENDING),
                rsvpRepository.countByEventIdAndStatus(eventId, EventRsvp.Status.DECLINED),
                current == null ? null : current.getStatus());
    }

    public RsvpSummary respond(Long eventId, EventRsvp.Status status, String email) {
        Event event = event(eventId);
        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new IllegalArgumentException("Authenticated user not found."));
        EventRsvp rsvp = rsvpRepository.findByEventIdAndUserEmailIgnoreCase(eventId, email)
                .orElseGet(() -> new EventRsvp(event, user, status));
        rsvp.setStatus(status);
        rsvpRepository.save(rsvp);
        return summary(eventId, email);
    }

    public void removeResponse(Long eventId, String email) {
        rsvpRepository.findByEventIdAndUserEmailIgnoreCase(eventId, email).ifPresent(rsvpRepository::delete);
    }

    public List<Attendee> attendees(Long eventId, String email) {
        Event event = event(eventId);
        if (event.getOwner() == null || !event.getOwner().getEmail().equalsIgnoreCase(email)) {
            throw new IllegalArgumentException("Only the event owner can view attendees.");
        }
        return rsvpRepository.findAllByEventId(eventId).stream()
                .map(rsvp -> new Attendee(rsvp.getUser().getName(), rsvp.getUser().getEmail(), rsvp.getStatus()))
                .toList();
    }

    private Event event(Long eventId) {
        return eventRepository.findById(eventId)
                .orElseThrow(() -> new EventService.EventNotFoundException(eventId));
    }

    public record RsvpSummary(Long eventId, boolean owner, long attending, long declined, EventRsvp.Status currentUserStatus) {}
    public record Attendee(String name, String email, EventRsvp.Status status) {}
}

package com.event.management.event_management_system.service;

import com.event.management.event_management_system.entity.Event;
import com.event.management.event_management_system.entity.EventRegistration;
import com.event.management.event_management_system.entity.User;
import com.event.management.event_management_system.repository.EventRegistrationRepository;
import com.event.management.event_management_system.repository.EventRepository;
import com.event.management.event_management_system.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
public class EventRegistrationService {
    private final EventRepository eventRepository;
    private final EventRegistrationRepository registrationRepository;
    private final UserRepository userRepository;

    public EventRegistrationService(EventRepository eventRepository, EventRegistrationRepository registrationRepository,
                                    UserRepository userRepository) {
        this.eventRepository = eventRepository;
        this.registrationRepository = registrationRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public RegistrationResult register(Long eventId, String email) {
        Event event = event(eventId);
        User attendee = user(email);
        EventRegistration existing = registrationRepository.findByEventIdAndAttendeeEmailIgnoreCase(eventId, email).orElse(null);
        if (existing != null && existing.getStatus() == EventRegistration.Status.CONFIRMED) {
            return result(event, existing);
        }
        long confirmed = registrationRepository.countByEventIdAndStatus(eventId, EventRegistration.Status.CONFIRMED);
        if (confirmed >= event.getCapacity()) {
            throw new IllegalArgumentException("This event is sold out.");
        }
        EventRegistration registration = existing == null
                ? new EventRegistration(event, attendee, price(event).signum() == 0
                ? EventRegistration.Status.CONFIRMED : EventRegistration.Status.PENDING_PAYMENT)
                : existing;
        if (price(event).signum() == 0) registration.setStatus(EventRegistration.Status.CONFIRMED);
        registrationRepository.save(registration);
        return result(event, registration);
    }

    public List<Registration> registrations(Long eventId, String ownerEmail) {
        Event event = event(eventId);
        if (event.getOwner() == null || !event.getOwner().getEmail().equalsIgnoreCase(ownerEmail)) {
            throw new IllegalArgumentException("Only the event owner can view registrations.");
        }
        return registrationRepository.findAllByEventId(eventId).stream()
                .map(registration -> new Registration(registration.getAttendee().getName(), registration.getAttendee().getEmail(),
                        registration.getStatus(), registration.getRazorpayPaymentId()))
                .toList();
    }

    private RegistrationResult result(Event event, EventRegistration registration) {
        long confirmed = registrationRepository.countByEventIdAndStatus(event.getId(), EventRegistration.Status.CONFIRMED);
        return new RegistrationResult(event.getId(), registration.getStatus(), price(event), event.getCapacity(), confirmed);
    }

    private BigDecimal price(Event event) { return event.getTicketPrice() == null ? BigDecimal.ZERO : event.getTicketPrice(); }
    private Event event(Long id) { return eventRepository.findById(id).orElseThrow(() -> new EventService.EventNotFoundException(id)); }
    private User user(String email) { return userRepository.findByEmailIgnoreCase(email).orElseThrow(() -> new IllegalArgumentException("Authenticated user not found.")); }

    public record RegistrationResult(Long eventId, EventRegistration.Status status, BigDecimal ticketPrice, Integer capacity, long registered) {}
    public record Registration(String name, String email, EventRegistration.Status status, String paymentId) {}
}

package com.event.management.event_management_system.service;

import com.event.management.event_management_system.entity.Event;
import com.event.management.event_management_system.entity.User;
import com.event.management.event_management_system.repository.EventRepository;
import com.event.management.event_management_system.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class EventService {

    private final EventRepository eventRepository;
    private final UserRepository userRepository;

    public EventService(EventRepository eventRepository, UserRepository userRepository) {
        this.eventRepository = eventRepository;
        this.userRepository = userRepository;
    }

    public Event createEvent(Event event, String email) {
        event.setOwner(owner(email));
        return eventRepository.save(event);
    }

    public List<Event> getAllEvents(String email) {
        return eventRepository.findAllByOwnerEmailIgnoreCase(email);
    }

    public List<Event> getAllPublicEvents() {
        return eventRepository.findAll();
    }

    public Event getEventById(Long id, String email) {
        return eventRepository.findByIdAndOwnerEmailIgnoreCase(id, email)
                .orElseThrow(() -> new EventNotFoundException(id));
    }

    public Event getEventForViewing(Long id) {
        return eventRepository.findById(id)
                .orElseThrow(() -> new EventNotFoundException(id));
    }

    public Event updateEvent(Long id, Event event, String email) {
        Event existingEvent = getEventById(id, email);
        existingEvent.setName(event.getName());
        existingEvent.setDescription(event.getDescription());
        existingEvent.setDate(event.getDate());
        existingEvent.setTime(event.getTime());
        existingEvent.setLocation(event.getLocation());
        return eventRepository.save(existingEvent);
    }

    public void deleteEvent(Long id, String email) {
        if (!eventRepository.existsByIdAndOwnerEmailIgnoreCase(id, email)) {
            throw new EventNotFoundException(id);
        }
        eventRepository.deleteById(id);
    }

    private User owner(String email) {
        return userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new IllegalArgumentException("Authenticated user not found."));
    }

    public static class EventNotFoundException extends RuntimeException {
        public EventNotFoundException(Long id) {
            super("Event not found: " + id);
        }
    }
}

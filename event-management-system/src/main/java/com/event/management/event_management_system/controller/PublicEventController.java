package com.event.management.event_management_system.controller;

import com.event.management.event_management_system.entity.Event;
import com.event.management.event_management_system.service.EventService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/public/events")
public class PublicEventController {
    private final EventService eventService;

    public PublicEventController(EventService eventService) {
        this.eventService = eventService;
    }

    @GetMapping
    public List<PublicEvent> getPublicEvents() {
        return eventService.getAllPublicEvents().stream().map(PublicEvent::from).toList();
    }

    @GetMapping("/{id}")
    public PublicEvent getPublicEvent(@PathVariable Long id) {
        return PublicEvent.from(eventService.getEventForViewing(id));
    }

    public record PublicEvent(Long id, String name, String description, String date, String time, String location) {
        static PublicEvent from(Event event) {
            return new PublicEvent(event.getId(), event.getName(), event.getDescription(), event.getDate(),
                    event.getTime(), event.getLocation());
        }
    }
}

package com.event.management.event_management_system.controller;

import com.event.management.event_management_system.entity.Event;
import com.event.management.event_management_system.service.EventService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.List;

@RestController
@RequestMapping("/api/events")
public class EventController {

    private final EventService eventService;

    public EventController(EventService eventService) {
        this.eventService = eventService;
    }

    @PostMapping
    public ResponseEntity<Event> createEvent(@Valid @RequestBody Event event, @AuthenticationPrincipal UserDetails user) {
        return ResponseEntity.status(HttpStatus.CREATED).body(eventService.createEvent(event, user.getUsername()));
    }

    @GetMapping
    public List<Event> getAllEvents(@AuthenticationPrincipal UserDetails user) {
        return eventService.getAllEvents(user.getUsername());
    }

    @GetMapping("/{id}")
    public Event getEventById(@PathVariable Long id, @AuthenticationPrincipal UserDetails user) {
        return eventService.getEventById(id, user.getUsername());
    }

    @PutMapping("/{id}")
    public Event updateEvent(@PathVariable Long id, @Valid @RequestBody Event event, @AuthenticationPrincipal UserDetails user) {
        return eventService.updateEvent(id, event, user.getUsername());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteEvent(@PathVariable Long id, @AuthenticationPrincipal UserDetails user) {
        eventService.deleteEvent(id, user.getUsername());
        return ResponseEntity.noContent().build();
    }
}

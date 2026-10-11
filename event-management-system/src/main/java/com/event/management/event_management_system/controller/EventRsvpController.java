package com.event.management.event_management_system.controller;

import com.event.management.event_management_system.entity.EventRsvp;
import com.event.management.event_management_system.service.EventRsvpService;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/events/{eventId}/rsvp")
public class EventRsvpController {
    private final EventRsvpService rsvpService;

    public EventRsvpController(EventRsvpService rsvpService) {
        this.rsvpService = rsvpService;
    }

    @GetMapping
    public EventRsvpService.RsvpSummary summary(@PathVariable Long eventId, @AuthenticationPrincipal UserDetails user) {
        return rsvpService.summary(eventId, user.getUsername());
    }

    @PutMapping
    public EventRsvpService.RsvpSummary respond(@PathVariable Long eventId, @RequestBody RsvpRequest request,
                                                 @AuthenticationPrincipal UserDetails user) {
        return rsvpService.respond(eventId, request.status(), user.getUsername());
    }

    @DeleteMapping
    public void remove(@PathVariable Long eventId, @AuthenticationPrincipal UserDetails user) {
        rsvpService.removeResponse(eventId, user.getUsername());
    }

    @GetMapping("/attendees")
    public List<EventRsvpService.Attendee> attendees(@PathVariable Long eventId, @AuthenticationPrincipal UserDetails user) {
        return rsvpService.attendees(eventId, user.getUsername());
    }

    public record RsvpRequest(EventRsvp.Status status) {}
}

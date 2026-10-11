package com.event.management.event_management_system.controller;

import com.event.management.event_management_system.service.EventCheckInService;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/events/{eventId}/check-in")
public class EventCheckInController {
    private final EventCheckInService checkInService;

    public EventCheckInController(EventCheckInService checkInService) {
        this.checkInService = checkInService;
    }

    @GetMapping
    public EventCheckInService.CheckInSummary summary(@PathVariable Long eventId,
                                                       @AuthenticationPrincipal UserDetails user) {
        return checkInService.summary(eventId, user.getUsername());
    }

    @PostMapping
    public EventCheckInService.CheckInSummary selfCheckIn(@PathVariable Long eventId,
                                                           @AuthenticationPrincipal UserDetails user) {
        return checkInService.selfCheckIn(eventId, user.getUsername());
    }

    @GetMapping("/attendees")
    public List<EventCheckInService.CheckedInAttendee> attendees(@PathVariable Long eventId,
                                                                  @AuthenticationPrincipal UserDetails user) {
        return checkInService.attendees(eventId, user.getUsername());
    }

    @PostMapping("/attendees")
    public EventCheckInService.CheckInSummary checkInAttendee(@PathVariable Long eventId,
                                                               @RequestBody CheckInRequest request,
                                                               @AuthenticationPrincipal UserDetails user) {
        return checkInService.checkInAttendee(eventId, request.email(), user.getUsername());
    }

    @PostMapping("/ticket")
    public EventCheckInService.CheckInSummary checkInTicket(@PathVariable Long eventId,
                                                             @RequestBody TicketRequest request,
                                                             @AuthenticationPrincipal UserDetails user) {
        return checkInService.checkInTicket(eventId, request.registrationId(), user.getUsername());
    }

    public record CheckInRequest(String email) {}
    public record TicketRequest(Long registrationId) {}
}

package com.event.management.event_management_system.controller;

import com.event.management.event_management_system.service.EventRegistrationService;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import java.util.List;

@RestController
@RequestMapping("/api/events/{eventId}/registrations")
public class EventRegistrationController {
    private final EventRegistrationService registrationService;

    public EventRegistrationController(EventRegistrationService registrationService) {
        this.registrationService = registrationService;
    }

    @PostMapping
    public EventRegistrationService.RegistrationResult register(@PathVariable Long eventId,
                                                                  @AuthenticationPrincipal UserDetails user) {
        return registrationService.register(eventId, user.getUsername());
    }

    @PostMapping("/payment-order")
    public EventRegistrationService.PaymentOrder paymentOrder(@PathVariable Long eventId,
                                                                @AuthenticationPrincipal UserDetails user) {
        return registrationService.createPaymentOrder(eventId, user.getUsername());
    }

    @PostMapping("/verify-payment")
    public EventRegistrationService.RegistrationResult verifyPayment(@PathVariable Long eventId,
                                                                       @RequestBody EventRegistrationService.PaymentVerification verification,
                                                                       @AuthenticationPrincipal UserDetails user) {
        return registrationService.verifyPayment(eventId, user.getUsername(), verification);
    }

    @GetMapping
    public List<EventRegistrationService.Registration> registrations(@PathVariable Long eventId,
                                                                       @AuthenticationPrincipal UserDetails user) {
        return registrationService.registrations(eventId, user.getUsername());
    }

    @GetMapping("/analytics")
    public EventRegistrationService.Analytics analytics(@PathVariable Long eventId,
                                                         @AuthenticationPrincipal UserDetails user) {
        return registrationService.analytics(eventId, user.getUsername());
    }

    @GetMapping("/export")
    public ResponseEntity<String> export(@PathVariable Long eventId,
                                         @AuthenticationPrincipal UserDetails user) {
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=event-" + eventId + "-registrations.csv")
                .contentType(MediaType.parseMediaType("text/csv"))
                .body(registrationService.exportCsv(eventId, user.getUsername()));
    }

}

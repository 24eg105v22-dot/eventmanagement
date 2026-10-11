package com.event.management.event_management_system.controller;

import com.event.management.event_management_system.service.EventRegistrationService;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
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
}

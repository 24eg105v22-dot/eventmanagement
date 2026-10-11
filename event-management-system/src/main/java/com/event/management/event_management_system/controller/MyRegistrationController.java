package com.event.management.event_management_system.controller;

import com.event.management.event_management_system.service.EventRegistrationService;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/registrations")
public class MyRegistrationController {
    private final EventRegistrationService registrationService;

    public MyRegistrationController(EventRegistrationService registrationService) {
        this.registrationService = registrationService;
    }

    @GetMapping("/me")
    public List<EventRegistrationService.MyRegistration> myRegistrations(
            @AuthenticationPrincipal UserDetails user) {
        return registrationService.myRegistrations(user.getUsername());
    }
}

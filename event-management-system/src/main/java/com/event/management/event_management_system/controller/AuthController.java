package com.event.management.event_management_system.controller;

import com.event.management.event_management_system.entity.User;
import com.event.management.event_management_system.service.AuthService;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final AuthService authService;

    public AuthController(AuthService authService) { this.authService = authService; }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@RequestBody RegisterRequest request) {
        User user = authService.register(request.name(), request.email(), request.password());
        return ResponseEntity.status(HttpStatus.CREATED).body(new AuthResponse(authService.tokenFor(user), user.getName(), user.getEmail()));
    }

    @PostMapping("/login")
    public AuthResponse login(@RequestBody LoginRequest request) {
        User user = authService.authenticate(request.email(), request.password());
        return new AuthResponse(authService.tokenFor(user), user.getName(), user.getEmail());
    }

    @GetMapping("/health")
    public Map<String, String> health() {
        return Map.of("status", "ok");
    }

    public record RegisterRequest(@NotBlank String name, @Email @NotBlank String email, @Size(min = 8) String password) {}
    public record LoginRequest(@Email @NotBlank String email, @NotBlank String password) {}
    public record AuthResponse(String token, String name, String email) {}
}

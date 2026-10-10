package com.event.management.event_management_system.controller;

import com.event.management.event_management_system.entity.User;
import com.event.management.event_management_system.service.AuthService;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "http://localhost:5173")
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

    public record RegisterRequest(@NotBlank String name, @Email @NotBlank String email, @Size(min = 8) String password) {}
    public record LoginRequest(@Email @NotBlank String email, @NotBlank String password) {}
    public record AuthResponse(String token, String name, String email) {}
}

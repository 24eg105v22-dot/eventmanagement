package com.event.management.event_management_system.service;

import com.event.management.event_management_system.entity.User;
import com.event.management.event_management_system.repository.UserRepository;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;

@Service
public class AuthService implements UserDetailsService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final SecretKey signingKey;
    private final long expirationMs;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder,
                       @Value("${app.jwt.secret}") String secret,
                       @Value("${app.jwt.expiration-ms:86400000}") long expirationMs) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.signingKey = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.expirationMs = expirationMs;
    }

    public User register(String name, String email, String password) {
        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw new IllegalArgumentException("An account with that email already exists.");
        }
        return userRepository.save(new User(name.trim(), email.trim().toLowerCase(), passwordEncoder.encode(password)));
    }

    public User authenticate(String email, String password) {
        User user = userRepository.findByEmailIgnoreCase(email)
                .filter(candidate -> passwordEncoder.matches(password, candidate.getPassword()))
                .orElseThrow(() -> new IllegalArgumentException("Invalid email or password."));
        return user;
    }

    public String tokenFor(User user) {
        Instant now = Instant.now();
        return Jwts.builder().subject(user.getEmail()).issuedAt(Date.from(now))
                .expiration(Date.from(now.plusMillis(expirationMs))).signWith(signingKey).compact();
    }

    public String emailFromToken(String token) {
        return Jwts.parser().verifyWith(signingKey).build().parseSignedClaims(token).getPayload().getSubject();
    }

    @Override
    public org.springframework.security.core.userdetails.UserDetails loadUserByUsername(String email) {
        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found."));
        return org.springframework.security.core.userdetails.User.withUsername(user.getEmail())
                .password(user.getPassword()).roles("USER").build();
    }
}

package com.event.management.event_management_system.service;

import com.event.management.event_management_system.entity.Event;
import com.event.management.event_management_system.entity.EventRegistration;
import com.event.management.event_management_system.entity.User;
import com.event.management.event_management_system.repository.EventRegistrationRepository;
import com.event.management.event_management_system.repository.EventRepository;
import com.event.management.event_management_system.repository.UserRepository;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import java.math.BigDecimal;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.List;

@Service
public class EventRegistrationService {
    private final EventRepository eventRepository;
    private final EventRegistrationRepository registrationRepository;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;
    private final String razorpayKeyId;
    private final String razorpayKeySecret;

    public EventRegistrationService(EventRepository eventRepository, EventRegistrationRepository registrationRepository,
                                    UserRepository userRepository, ObjectMapper objectMapper,
                                    @Value("${app.razorpay-key-id:}") String razorpayKeyId,
                                    @Value("${app.razorpay-key-secret:}") String razorpayKeySecret) {
        this.eventRepository = eventRepository;
        this.registrationRepository = registrationRepository;
        this.userRepository = userRepository;
        this.objectMapper = objectMapper;
        this.razorpayKeyId = razorpayKeyId;
        this.razorpayKeySecret = razorpayKeySecret;
    }

    @Transactional
    public PaymentOrder createPaymentOrder(Long eventId, String email) {
        Event event = event(eventId);
        if (price(event).signum() == 0) throw new IllegalArgumentException("This event has free registration.");
        if (razorpayKeyId.isBlank() || razorpayKeySecret.isBlank()) {
            throw new IllegalArgumentException("Online payments are not configured yet. Please contact the event organizer.");
        }
        RegistrationResult registration = register(eventId, email);
        EventRegistration saved = registrationRepository.findByEventIdAndAttendeeEmailIgnoreCase(eventId, email).orElseThrow();
        if (saved.getRazorpayOrderId() != null) return new PaymentOrder(saved.getRazorpayOrderId(), razorpayKeyId,
                price(event).movePointRight(2).longValueExact(), "INR");
        try {
            String credentials = Base64.getEncoder().encodeToString((razorpayKeyId + ":" + razorpayKeySecret)
                    .getBytes(StandardCharsets.UTF_8));
            String payload = objectMapper.writeValueAsString(java.util.Map.of(
                    "amount", price(event).movePointRight(2).longValueExact(), "currency", "INR",
                    "receipt", "event-" + eventId + "-registration-" + saved.getId()));
            HttpRequest request = HttpRequest.newBuilder(URI.create("https://api.razorpay.com/v1/orders"))
                    .header(HttpHeaders.AUTHORIZATION, "Basic " + credentials)
                    .header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                    .POST(HttpRequest.BodyPublishers.ofString(payload)).build();
            JsonNode order = objectMapper.readTree(HttpClient.newHttpClient().send(request, HttpResponse.BodyHandlers.ofString()).body());
            String orderId = order.path("id").asText();
            if (orderId.isBlank()) throw new IllegalArgumentException("Razorpay did not return an order.");
            saved.setRazorpayOrderId(orderId);
            registrationRepository.save(saved);
            return new PaymentOrder(orderId, razorpayKeyId, price(event).movePointRight(2).longValueExact(), "INR");
        } catch (Exception ex) {
            throw new IllegalStateException("Unable to create the Razorpay order.", ex);
        }
    }

    @Transactional
    public RegistrationResult verifyPayment(Long eventId, String email, PaymentVerification verification) {
        EventRegistration registration = registrationRepository.findByEventIdAndAttendeeEmailIgnoreCase(eventId, email)
                .orElseThrow(() -> new IllegalArgumentException("Registration was not found."));
        if (registration.getRazorpayOrderId() == null || !registration.getRazorpayOrderId().equals(verification.razorpayOrderId())) {
            throw new IllegalArgumentException("The payment order does not match this registration.");
        }
        try {
            var mac = javax.crypto.Mac.getInstance("HmacSHA256");
            mac.init(new javax.crypto.spec.SecretKeySpec(razorpayKeySecret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            String expected = java.util.HexFormat.of().formatHex(mac.doFinal(
                    (verification.razorpayOrderId() + "|" + verification.razorpayPaymentId()).getBytes(StandardCharsets.UTF_8)));
            if (!java.security.MessageDigest.isEqual(expected.getBytes(StandardCharsets.UTF_8),
                    verification.razorpaySignature().getBytes(StandardCharsets.UTF_8))) {
                throw new IllegalArgumentException("Payment verification failed.");
            }
            registration.setRazorpayPaymentId(verification.razorpayPaymentId());
            registration.setStatus(EventRegistration.Status.CONFIRMED);
            registrationRepository.save(registration);
            return result(event(eventId), registration);
        } catch (IllegalArgumentException ex) {
            throw ex;
        } catch (Exception ex) {
            throw new IllegalStateException("Unable to verify the payment.", ex);
        }
    }

    @Transactional
    public RegistrationResult register(Long eventId, String email) {
        Event event = event(eventId);
        User attendee = user(email);
        EventRegistration existing = registrationRepository.findByEventIdAndAttendeeEmailIgnoreCase(eventId, email).orElse(null);
        if (existing != null && existing.getStatus() == EventRegistration.Status.CONFIRMED) {
            return result(event, existing);
        }
        long confirmed = registrationRepository.countByEventIdAndStatus(eventId, EventRegistration.Status.CONFIRMED);
        if (confirmed >= event.getCapacity()) {
            throw new IllegalArgumentException("This event is sold out.");
        }
        EventRegistration registration = existing == null
                ? new EventRegistration(event, attendee, price(event).signum() == 0
                ? EventRegistration.Status.CONFIRMED : EventRegistration.Status.PENDING_PAYMENT)
                : existing;
        if (price(event).signum() == 0) registration.setStatus(EventRegistration.Status.CONFIRMED);
        registrationRepository.save(registration);
        return result(event, registration);
    }

    public List<Registration> registrations(Long eventId, String ownerEmail) {
        Event event = event(eventId);
        if (event.getOwner() == null || !event.getOwner().getEmail().equalsIgnoreCase(ownerEmail)) {
            throw new IllegalArgumentException("Only the event owner can view registrations.");
        }
        return registrationRepository.findAllByEventId(eventId).stream()
                .map(registration -> new Registration(registration.getAttendee().getName(), registration.getAttendee().getEmail(),
                        registration.getStatus(), registration.getRazorpayPaymentId()))
                .toList();
    }

    public List<MyRegistration> myRegistrations(String email) {
        return registrationRepository.findAllByAttendeeEmailIgnoreCaseOrderByCreatedAtDesc(email).stream()
                .map(registration -> new MyRegistration(
                        registration.getId(),
                        registration.getEvent().getId(),
                        registration.getEvent().getName(),
                        registration.getEvent().getDescription(),
                        registration.getEvent().getDate(),
                        registration.getEvent().getTime(),
                        registration.getEvent().getLocation(),
                        registration.getEvent().getTicketPrice(),
                        registration.getStatus(),
                        registration.getRazorpayPaymentId(),
                        registration.getCreatedAt()))
                .toList();
    }

    private RegistrationResult result(Event event, EventRegistration registration) {
        long confirmed = registrationRepository.countByEventIdAndStatus(event.getId(), EventRegistration.Status.CONFIRMED);
        return new RegistrationResult(event.getId(), registration.getStatus(), price(event), event.getCapacity(), confirmed);
    }

    private BigDecimal price(Event event) { return event.getTicketPrice() == null ? BigDecimal.ZERO : event.getTicketPrice(); }
    private Event event(Long id) { return eventRepository.findById(id).orElseThrow(() -> new EventService.EventNotFoundException(id)); }
    private User user(String email) { return userRepository.findByEmailIgnoreCase(email).orElseThrow(() -> new IllegalArgumentException("Authenticated user not found.")); }

    public record RegistrationResult(Long eventId, EventRegistration.Status status, BigDecimal ticketPrice, Integer capacity, long registered) {}
    public record Registration(String name, String email, EventRegistration.Status status, String paymentId) {}
    public record MyRegistration(Long registrationId, Long eventId, String eventName, String description,
                                 String date, String time, String location, BigDecimal ticketPrice,
                                 EventRegistration.Status status, String paymentId, java.time.Instant createdAt) {}
    public record PaymentOrder(String orderId, String keyId, long amount, String currency) {}
    public record PaymentVerification(String razorpayOrderId, String razorpayPaymentId, String razorpaySignature) {}
}

package com.twojlogin.lms.controller;

import com.twojlogin.lms.dto.TutoringAdminUpdateRequest;
import com.twojlogin.lms.dto.TutoringAvailabilityDto;
import com.twojlogin.lms.dto.TutoringBlockedSlotDto;
import com.twojlogin.lms.dto.TutoringBookRequest;
import com.twojlogin.lms.dto.TutoringBookingDto;
import com.twojlogin.lms.entity.*;
import com.twojlogin.lms.repository.TutoringAvailabilityRepository;
import com.twojlogin.lms.repository.TutoringBookingRepository;
import com.twojlogin.lms.repository.UserRepository;
import com.twojlogin.lms.service.EmailService;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/tutoring")
public class TutoringController {

    private static final int PRICE_PER_HOUR = 80;

    private final TutoringAvailabilityRepository availabilityRepository;
    private final TutoringBookingRepository bookingRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;

    public TutoringController(
            TutoringAvailabilityRepository availabilityRepository,
            TutoringBookingRepository bookingRepository,
            UserRepository userRepository, EmailService emailService
    ) {
        this.availabilityRepository = availabilityRepository;
        this.bookingRepository = bookingRepository;
        this.userRepository = userRepository;
        this.emailService = emailService;
    }

    @GetMapping("/available")
    public List<TutoringAvailabilityDto> available() {
        return availabilityRepository.findByAvailableTrueOrderByStartTimeAsc().stream()
                .map(TutoringAvailabilityDto::from)
                .toList();
    }

    @GetMapping("/all")
    @PreAuthorize("hasRole('ADMIN')")
    public List<TutoringBookingDto> getAll() {
        return bookingRepository.findAllByOrderByStartTimeAsc().stream()
                .map(TutoringBookingDto::from)
                .toList();
    }

    @GetMapping("/my")
    public List<TutoringBookingDto> getMyBookings(Authentication authentication) {
        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow();

        return bookingRepository.findByStudentOrderByStartTimeDesc(user).stream()
                .map(TutoringBookingDto::from)
                .toList();
    }

    @PostMapping("/book")
    public TutoringBookingDto book(
            @RequestBody TutoringBookRequest request
    ) {
        if (request.getStartTime() == null || request.getEndTime() == null) {
            throw new RuntimeException("Wybierz datę i godzinę korepetycji");
        }

        if (!request.getEndTime().isAfter(request.getStartTime())) {
            throw new RuntimeException("Godzina zakończenia musi być późniejsza niż rozpoczęcia");
        }

        long minutes = Duration.between(request.getStartTime(), request.getEndTime()).toMinutes();

        if (minutes < 60) {
            throw new RuntimeException("Minimalna długość rezerwacji to 1 godzina");
        }

        if (minutes % 60 != 0) {
            throw new RuntimeException("Rezerwacja musi być pełną liczbą godzin");
        }

        int hours = (int) (minutes / 60);

        boolean fitsAvailability = availabilityRepository
                .findByAvailableTrueOrderByStartTimeAsc()
                .stream()
                .anyMatch(a ->
                        !request.getStartTime().isBefore(a.getStartTime())
                                && !request.getEndTime().isAfter(a.getEndTime())
                );

        if (!fitsAvailability) {
            throw new RuntimeException("Wybrany termin nie mieści się w dostępnych godzinach");
        }

        boolean conflict = bookingRepository.existsActiveConflict(
                request.getStartTime(),
                request.getEndTime(),
                LocalDateTime.now()
        );
        if (conflict) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Ten termin jest aktualnie zajęty lub oczekuje na płatność"
            );
        }

        TutoringBooking booking = new TutoringBooking();

        booking.setStartTime(request.getStartTime());
        booking.setEndTime(request.getEndTime());
        booking.setTopic(request.getTopic());

        booking.setGuestName(request.getName());
        booking.setGuestEmail(request.getEmail());
        booking.setGuestPhone(request.getPhone());

        booking.setHours(hours);
        booking.setPrice(hours * PRICE_PER_HOUR);

        booking.setStatus(TutoringStatus.PENDING_PAYMENT);
        booking.setCreatedAt(LocalDateTime.now());
        booking.setPaymentDeadline(LocalDateTime.now().plusMinutes(10));

        TutoringBooking saved = bookingRepository.save(booking);

        emailService.sendTutoringPaymentEmail(saved);

        return TutoringBookingDto.from(saved);
    }

    @PutMapping("/admin/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public TutoringBookingDto adminUpdate(
            @PathVariable Long id,
            @RequestBody TutoringAdminUpdateRequest request
    ) {
        TutoringBooking booking = bookingRepository.findById(id)
                .orElseThrow();

        if (request.getStatus() != null) {
            booking.setStatus(request.getStatus());
        }

        booking.setAdminComment(request.getAdminComment());
        booking.setMeetingLink(request.getMeetingLink());

        return TutoringBookingDto.from(bookingRepository.save(booking));
    }
    @GetMapping("/blocked")
    public List<TutoringBlockedSlotDto> blocked() {
        return bookingRepository.findActiveBlockedBookings(LocalDateTime.now()).stream()
                .map(TutoringBlockedSlotDto::from)
                .toList();
    }
}

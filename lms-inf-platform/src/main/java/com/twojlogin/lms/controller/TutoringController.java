package com.twojlogin.lms.controller;

import com.twojlogin.lms.dto.TutoringAdminUpdateRequest;
import com.twojlogin.lms.dto.TutoringBookRequest;
import com.twojlogin.lms.entity.*;
import com.twojlogin.lms.repository.TutoringAvailabilityRepository;
import com.twojlogin.lms.repository.TutoringBookingRepository;
import com.twojlogin.lms.repository.UserRepository;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

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

    public TutoringController(
            TutoringAvailabilityRepository availabilityRepository,
            TutoringBookingRepository bookingRepository,
            UserRepository userRepository
    ) {
        this.availabilityRepository = availabilityRepository;
        this.bookingRepository = bookingRepository;
        this.userRepository = userRepository;
    }

    @GetMapping("/available")
    public List<TutoringAvailability> available() {
        return availabilityRepository.findByAvailableTrueOrderByStartTimeAsc();
    }

    @GetMapping("/all")
    @PreAuthorize("hasRole('ADMIN')")
    public List<TutoringBooking> getAll() {
        return bookingRepository.findAllByOrderByStartTimeAsc();
    }

    @GetMapping("/my")
    public List<TutoringBooking> getMyBookings(Authentication authentication) {
        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow();

        return bookingRepository.findByStudentOrderByStartTimeDesc(user);
    }

    @PostMapping("/book")
    public TutoringBooking book(
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

        boolean paidConflict = bookingRepository
                .existsByStatusAndStartTimeLessThanAndEndTimeGreaterThan(
                        TutoringStatus.PAID,
                        request.getEndTime(),
                        request.getStartTime()
                );

        if (paidConflict) {
            throw new RuntimeException("Ten termin jest już zajęty");
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

        return bookingRepository.save(booking);
    }

    @PutMapping("/admin/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public TutoringBooking adminUpdate(
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

        return bookingRepository.save(booking);
    }
}
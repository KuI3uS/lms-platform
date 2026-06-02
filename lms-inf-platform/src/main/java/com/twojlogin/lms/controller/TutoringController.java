package com.twojlogin.lms.controller;

import com.twojlogin.lms.dto.TutoringAdminUpdateRequest;
import com.twojlogin.lms.dto.TutoringBookRequest;
import com.twojlogin.lms.entity.TutoringAvailability;
import com.twojlogin.lms.entity.TutoringBooking;
import com.twojlogin.lms.entity.TutoringStatus;
import com.twojlogin.lms.entity.User;
import com.twojlogin.lms.repository.TutoringAvailabilityRepository;
import com.twojlogin.lms.repository.TutoringBookingRepository;
import com.twojlogin.lms.repository.UserRepository;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/tutoring")
public class TutoringController {

    private final TutoringAvailabilityRepository availabilityRepository;

    private final TutoringBookingRepository bookingRepository;
    private final UserRepository userRepository;

    public TutoringController(
            TutoringAvailabilityRepository availabilityRepository, TutoringBookingRepository bookingRepository,
            UserRepository userRepository
    ) {
        this.availabilityRepository = availabilityRepository;
        this.bookingRepository = bookingRepository;
        this.userRepository = userRepository;
    }

    @GetMapping("/all")
    public List<TutoringBooking> getAll() {
        return bookingRepository.findAllByOrderByStartTimeAsc();
    }

    @GetMapping("/my")
    public List<TutoringBooking> getMyBookings(
            org.springframework.security.core.Authentication authentication
    ) {
        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow();

        return bookingRepository.findByStudentOrderByStartTimeDesc(user);
    }

    @PostMapping("/book")
    public TutoringBooking book(
            @RequestBody TutoringBookRequest request,
            org.springframework.security.core.Authentication authentication
    ) {
        if (request.getAvailabilityId() == null) {
            throw new RuntimeException("Wybierz termin korepetycji");
        }

        TutoringAvailability availability = availabilityRepository.findById(request.getAvailabilityId())
                .orElseThrow(() -> new RuntimeException("Termin nie istnieje"));

        if (!availability.isAvailable()) {
            throw new RuntimeException("Ten termin jest już zajęty");
        }

        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow();

        TutoringBooking booking = new TutoringBooking();
        booking.setStartTime(availability.getStartTime());
        booking.setEndTime(availability.getEndTime());
        booking.setTopic(request.getTopic());
        booking.setStudentMessage(request.getStudentMessage());
        booking.setStudent(user);
        booking.setStatus(TutoringStatus.RESERVED);
        booking.setCreatedAt(LocalDateTime.now());

        availability.setAvailable(false);
        availabilityRepository.save(availability);

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
    @GetMapping("/available")

    public List<TutoringAvailability> available() {
        return availabilityRepository
                .findByAvailableTrueOrderByStartTimeAsc();
    }
}
package com.twojlogin.lms.controller;

import com.twojlogin.lms.dto.AvailabilityRequest;
import com.twojlogin.lms.dto.TutoringAvailabilityDto;
import com.twojlogin.lms.dto.TutoringBookingDto;
import com.twojlogin.lms.entity.TutoringAvailability;
import com.twojlogin.lms.entity.TutoringBooking;
import com.twojlogin.lms.entity.TutoringStatus;
import com.twojlogin.lms.repository.TutoringAvailabilityRepository;
import com.twojlogin.lms.repository.TutoringBookingRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/admin/tutoring")
@PreAuthorize("hasRole('ADMIN')")
public class TutoringAdminController {

    private final TutoringAvailabilityRepository availabilityRepository;
    private final TutoringBookingRepository bookingRepository;

    public TutoringAdminController(TutoringAvailabilityRepository availabilityRepository, TutoringBookingRepository bookingRepository) {
        this.availabilityRepository = availabilityRepository;
        this.bookingRepository = bookingRepository;
    }

    @PostMapping("/availability")
    public TutoringAvailabilityDto create(
            @RequestBody AvailabilityRequest request
    ) {

        TutoringAvailability availability =
                new TutoringAvailability();

        availability.setStartTime(request.getStartTime());
        availability.setEndTime(request.getEndTime());

        return TutoringAvailabilityDto.from(availabilityRepository.save(availability));
    }
    @GetMapping("/availability")
    public List<TutoringAvailabilityDto> all() {
        return availabilityRepository
                .findByAvailableTrueOrderByStartTimeAsc().stream()
                .map(TutoringAvailabilityDto::from)
                .toList();
    }
    @DeleteMapping("/availability/{id}")
    public void delete(@PathVariable Long id) {
        availabilityRepository.deleteById(id);
    }

    @GetMapping("/bookings")
    public List<TutoringBookingDto> bookings() {
        return bookingRepository.findAllByOrderByStartTimeAsc().stream()
                .map(TutoringBookingDto::from)
                .toList();
    }

    @DeleteMapping("/bookings/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteBooking(@PathVariable Long id) {
        TutoringBooking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Nie znaleziono tej rezerwacji."
                ));

        if (booking.getStatus() != TutoringStatus.CANCELLED) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Najpierw anuluj rezerwację, a dopiero potem usuń ją z historii."
            );
        }

        bookingRepository.delete(booking);
    }
}

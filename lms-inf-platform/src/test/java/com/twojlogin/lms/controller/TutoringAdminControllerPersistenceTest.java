package com.twojlogin.lms.controller;

import com.twojlogin.lms.entity.TutoringBooking;
import com.twojlogin.lms.entity.TutoringStatus;
import com.twojlogin.lms.repository.TutoringAvailabilityRepository;
import com.twojlogin.lms.repository.TutoringBookingRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

@DataJpaTest
class TutoringAdminControllerPersistenceTest {

    @Autowired
    private TutoringAvailabilityRepository availabilityRepository;

    @Autowired
    private TutoringBookingRepository bookingRepository;

    @Test
    void permanentlyDeletesCancelledBooking() {
        TutoringBooking booking = saveBooking(TutoringStatus.CANCELLED);

        createController().deleteBooking(booking.getId());
        bookingRepository.flush();

        assertFalse(bookingRepository.existsById(booking.getId()));
    }

    @Test
    void requiresCancellingBookingBeforePermanentDeletion() {
        TutoringBooking booking = saveBooking(TutoringStatus.PAID);

        ResponseStatusException exception = assertThrows(
                ResponseStatusException.class,
                () -> createController().deleteBooking(booking.getId())
        );

        assertEquals(
                HttpStatus.CONFLICT.value(),
                exception.getStatusCode().value()
        );
        assertTrue(bookingRepository.existsById(booking.getId()));
    }

    private TutoringBooking saveBooking(TutoringStatus status) {
        TutoringBooking booking = new TutoringBooking();
        booking.setGuestName("Uczeń testowy");
        booking.setGuestEmail("student@example.com");
        booking.setTopic("Java");
        booking.setStartTime(LocalDateTime.of(2026, 8, 3, 16, 0));
        booking.setEndTime(LocalDateTime.of(2026, 8, 3, 17, 0));
        booking.setHours(1);
        booking.setPrice(80);
        booking.setStatus(status);
        booking.setCreatedAt(LocalDateTime.now());
        return bookingRepository.saveAndFlush(booking);
    }

    private TutoringAdminController createController() {
        return new TutoringAdminController(
                availabilityRepository,
                bookingRepository
        );
    }
}

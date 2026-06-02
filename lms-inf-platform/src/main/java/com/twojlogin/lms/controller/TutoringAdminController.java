package com.twojlogin.lms.controller;

import com.twojlogin.lms.dto.AvailabilityRequest;
import com.twojlogin.lms.entity.TutoringAvailability;
import com.twojlogin.lms.repository.TutoringAvailabilityRepository;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/tutoring")
@PreAuthorize("hasRole('ADMIN')")
public class TutoringAdminController {

    private final TutoringAvailabilityRepository availabilityRepository;

    public TutoringAdminController(TutoringAvailabilityRepository availabilityRepository) {
        this.availabilityRepository = availabilityRepository;
    }

    @PostMapping("/availability")
    public TutoringAvailability create(
            @RequestBody AvailabilityRequest request
    ) {

        TutoringAvailability availability =
                new TutoringAvailability();

        availability.setStartTime(request.getStartTime());
        availability.setEndTime(request.getEndTime());

        return availabilityRepository.save(availability);
    }
    @GetMapping("/availability")
    public List<TutoringAvailability> all() {
        return availabilityRepository
                .findByAvailableTrueOrderByStartTimeAsc();
    }
    @DeleteMapping("/availability/{id}")
    public void delete(@PathVariable Long id) {
        availabilityRepository.deleteById(id);
    }
}

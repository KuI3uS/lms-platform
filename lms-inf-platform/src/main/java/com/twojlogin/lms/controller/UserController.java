package com.twojlogin.lms.controller;

import com.twojlogin.lms.entity.Role;
import com.twojlogin.lms.entity.Submission;
import com.twojlogin.lms.repository.SubmissionRepository;
import com.twojlogin.lms.repository.UserRepository;
import jakarta.transaction.Transactional;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import com.twojlogin.lms.entity.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
public class UserController {

    private final UserRepository userRepository;
    private final SubmissionRepository submissionRepository;

    public UserController(UserRepository userRepository,
                          SubmissionRepository submissionRepository) {
        this.userRepository = userRepository;
        this.submissionRepository = submissionRepository;
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/users")
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/users/{id}/role")
    public User changeRole(@PathVariable Long id, @RequestParam String role) {
        User user = userRepository.findById(id)
                .orElseThrow();

        user.setRole(Role.valueOf(role));
        return userRepository.save(user);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/users/{id}")
    @Transactional
    public void deleteUser(@PathVariable Long id) {
        submissionRepository.deleteByUserId(id);
        userRepository.deleteById(id);
    }

    @GetMapping("/class/{id}/users")
    public List<User> getUsersByClass(@PathVariable Long id) {
        return userRepository.findBySchoolClassId(id);
    }

    @GetMapping("/me")
    public UserDetails me() {
        return (UserDetails) SecurityContextHolder
                .getContext()
                .getAuthentication()
                .getPrincipal();
    }

    @GetMapping("/my-results")
    public List<Submission> myResults() {

        UserDetails userDetails = (UserDetails) SecurityContextHolder
                .getContext()
                .getAuthentication()
                .getPrincipal();

        User user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow();

        return submissionRepository.findByUserId(user.getId());
    }
}

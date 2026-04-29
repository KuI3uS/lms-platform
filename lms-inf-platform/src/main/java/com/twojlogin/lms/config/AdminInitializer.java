package com.twojlogin.lms.config;

import com.twojlogin.lms.entity.Role;
import com.twojlogin.lms.entity.User;
import com.twojlogin.lms.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class AdminInitializer {

    @Bean
    CommandLineRunner initAdmin(UserRepository userRepository,
                                PasswordEncoder passwordEncoder) {
        return args -> {

            String email = "kuba.marcinkowski83721@gmail.com";

            if (userRepository.findByEmail(email).isEmpty()) {

                User admin = new User();
                admin.setEmail(email);
                admin.setPassword(passwordEncoder.encode("admin123"));
                admin.setFirstName("Jakub");
                admin.setLastName("Admin");
                admin.setRole(Role.ADMIN);

                userRepository.save(admin);

                System.out.println("ADMIN CREATED");
            }
        };
    }
}
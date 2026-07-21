package com.twojlogin.lms.dto;

import com.twojlogin.lms.entity.Role;
import com.twojlogin.lms.entity.User;

public record AuthenticatedUserDto(
        Long id,
        String email,
        String firstName,
        String lastName,
        Role role
) {
    public static AuthenticatedUserDto from(User user) {
        return new AuthenticatedUserDto(
                user.getId(),
                user.getEmail(),
                user.getFirstName(),
                user.getLastName(),
                user.getRole()
        );
    }
}

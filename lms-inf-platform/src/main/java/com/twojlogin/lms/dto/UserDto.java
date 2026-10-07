package com.twojlogin.lms.dto;

import com.twojlogin.lms.entity.Role;
import com.twojlogin.lms.entity.SchoolClass;
import com.twojlogin.lms.entity.User;

public record UserDto(
        Long id,
        String email,
        String firstName,
        String lastName,
        Role role,
        boolean enabled,
        SchoolClassDto schoolClass
) {
    public static UserDto from(User user) {
        return new UserDto(
                user.getId(),
                user.getEmail(),
                user.getFirstName(),
                user.getLastName(),
                user.getRole(),
                user.isEnabled(),
                SchoolClassDto.from(user.getSchoolClass())
        );
    }

    public record SchoolClassDto(Long id, String name) {
        public static SchoolClassDto from(SchoolClass schoolClass) {
            return schoolClass == null
                    ? null
                    : new SchoolClassDto(schoolClass.getId(), schoolClass.getName());
        }
    }
}

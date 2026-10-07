package com.twojlogin.lms.dto;

public record AuthSessionDto(
        AuthenticatedUserDto user,
        String csrfToken
) {
}

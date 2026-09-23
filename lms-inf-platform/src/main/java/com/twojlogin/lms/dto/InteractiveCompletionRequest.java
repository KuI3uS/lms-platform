package com.twojlogin.lms.dto;

public record InteractiveCompletionRequest(
        Integer completedItems,
        Integer score
) {}

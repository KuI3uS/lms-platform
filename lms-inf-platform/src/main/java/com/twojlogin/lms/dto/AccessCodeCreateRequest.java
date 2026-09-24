package com.twojlogin.lms.dto;

import com.twojlogin.lms.entity.AccessCodeType;

public record AccessCodeCreateRequest(Long courseId, AccessCodeType accessType) { }

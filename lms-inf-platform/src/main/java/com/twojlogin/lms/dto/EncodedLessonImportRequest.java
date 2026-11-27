package com.twojlogin.lms.dto;

/** A UTF-8 authoring document, not executable SQL or HTML. */
public record EncodedLessonImportRequest(String encoding, String payload) {}

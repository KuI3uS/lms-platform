package com.twojlogin.lms.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.dao.DataIntegrityViolationException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDateTime;
import java.util.UUID;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log =
            LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(UserAlreadyExistsException.class)
    public ResponseEntity<ErrorResponse> handleUserExists(UserAlreadyExistsException ex) {
        ErrorResponse error = new ErrorResponse(
                LocalDateTime.now(),
                HttpStatus.BAD_REQUEST.value(),
                ex.getMessage()
        );
        return new ResponseEntity<>(error, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<ErrorResponse> handleResponseStatus(ResponseStatusException ex) {
        HttpStatus status = HttpStatus.resolve(ex.getStatusCode().value());
        HttpStatus resolvedStatus = status == null
                ? HttpStatus.INTERNAL_SERVER_ERROR
                : status;
        ErrorResponse error = new ErrorResponse(
                LocalDateTime.now(),
                resolvedStatus.value(),
                ex.getReason() == null ? resolvedStatus.getReasonPhrase() : ex.getReason()
        );
        return new ResponseEntity<>(error, resolvedStatus);
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ErrorResponse> handleDataIntegrity(
            DataIntegrityViolationException ex
    ) {
        String errorId = shortErrorId();
        log.error("Database write failed, errorId={}", errorId, ex);

        ErrorResponse error = new ErrorResponse(
                LocalDateTime.now(),
                HttpStatus.CONFLICT.value(),
                "Nie udało się zapisać danych. Kod błędu: " + errorId
        );
        return new ResponseEntity<>(error, HttpStatus.CONFLICT);
    }

    private String shortErrorId() {
        return UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }
}

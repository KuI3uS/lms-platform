package com.twojlogin.lms.util;

import com.twojlogin.lms.dto.EncodedLessonImportRequest;
import com.twojlogin.lms.dto.StageLessonBlockImportRequest;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import tools.jackson.core.JacksonException;
import tools.jackson.databind.json.JsonMapper;

import java.nio.ByteBuffer;
import java.nio.charset.CharacterCodingException;
import java.nio.charset.CodingErrorAction;
import java.nio.charset.StandardCharsets;
import java.util.Base64;

public final class LessonImportPayload {
    public static final int MAX_DOCUMENT_BYTES = 3 * 1024 * 1024;
    private static final int MAX_ENCODED_CHARACTERS = 4 * ((MAX_DOCUMENT_BYTES + 2) / 3);
    private static final JsonMapper JSON = JsonMapper.builder().build();

    private LessonImportPayload() {}

    public static StageLessonBlockImportRequest decode(EncodedLessonImportRequest request) {
        if (request == null || !"base64-utf8".equals(request.encoding())
                || request.payload() == null || request.payload().isBlank()) {
            throw invalid();
        }
        if (request.payload().length() > MAX_ENCODED_CHARACTERS) throw tooLarge();
        try {
            byte[] bytes = Base64.getDecoder().decode(request.payload());
            if (bytes.length > MAX_DOCUMENT_BYTES) throw tooLarge();
            String document = StandardCharsets.UTF_8.newDecoder()
                    .onMalformedInput(CodingErrorAction.REPORT)
                    .onUnmappableCharacter(CodingErrorAction.REPORT)
                    .decode(ByteBuffer.wrap(bytes)).toString();
            StageLessonBlockImportRequest result = JSON.readValue(document, StageLessonBlockImportRequest.class);
            if (result == null) throw invalid();
            return result;
        } catch (IllegalArgumentException | CharacterCodingException | JacksonException exception) {
            throw invalid();
        }
    }

    private static ResponseStatusException invalid() {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST,
                "Nieprawidłowy format przesyłanej paczki. Odśwież stronę i spróbuj ponownie.");
    }

    private static ResponseStatusException tooLarge() {
        return new ResponseStatusException(HttpStatus.PAYLOAD_TOO_LARGE,
                "Paczka przekracza 3 MB. Podziel materiał na mniejsze paczki kompletnych lekcji.");
    }
}

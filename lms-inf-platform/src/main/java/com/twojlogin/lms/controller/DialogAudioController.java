package com.twojlogin.lms.controller;

import com.twojlogin.lms.config.VoiceGender;
import com.twojlogin.lms.entity.BlockType;
import com.twojlogin.lms.entity.LessonBlock;
import com.twojlogin.lms.entity.User;
import com.twojlogin.lms.repository.LessonBlockRepository;
import com.twojlogin.lms.service.CourseAccessService;
import com.twojlogin.lms.service.DialogAudioService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import tools.jackson.databind.json.JsonMapper;

@RestController
@RequestMapping("/api/lesson-blocks")
public class DialogAudioController {

    private static final ObjectMapper OBJECT_MAPPER = JsonMapper.builder().build();

    private final LessonBlockRepository blockRepository;
    private final CourseAccessService accessService;
    private final DialogAudioService audioService;

    public DialogAudioController(
            LessonBlockRepository blockRepository,
            CourseAccessService accessService,
            DialogAudioService audioService
    ) {
        this.blockRepository = blockRepository;
        this.accessService = accessService;
        this.audioService = audioService;
    }

    @GetMapping("/{blockId}/dialog-audio/{turnIndex}")
    public ResponseEntity<byte[]> getDialogAudio(
            @PathVariable Long blockId,
            @PathVariable int turnIndex,
            Authentication authentication
    ) {
        LessonBlock block = blockRepository.findById(blockId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        User user = accessService.currentUser(authentication);
        accessService.requireLessonAccess(user, block.getLesson());
        if (!accessService.isAdmin(user) && Boolean.FALSE.equals(block.getPublished())) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        }
        if (block.getType() != BlockType.DIALOG) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Ten blok nie jest dialogiem");
        }

        DialogLine line = line(block.getContent(), turnIndex);
        DialogAudioService.AudioResult result = audioService.getOrCreate(
                line.text(),
                block.getLanguage(),
                line.gender()
        );
        return audioResponse(result);
    }

    @GetMapping("/{blockId}/vocabulary-audio/{itemIndex}")
    public ResponseEntity<byte[]> getVocabularyAudio(
            @PathVariable Long blockId,
            @PathVariable int itemIndex,
            Authentication authentication
    ) {
        LessonBlock block = blockRepository.findById(blockId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        User user = accessService.currentUser(authentication);
        accessService.requireLessonAccess(user, block.getLesson());
        if (!accessService.isAdmin(user) && Boolean.FALSE.equals(block.getPublished())) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        }
        if (block.getType() != BlockType.VOCABULARY) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Ten blok nie jest treningiem słówek");
        }

        String term = vocabularyTerm(block.getContent(), itemIndex);
        DialogAudioService.AudioResult result = audioService.getOrCreate(
                term,
                block.getLanguage(),
                VoiceGender.FEMALE
        );
        return audioResponse(result);
    }

    private ResponseEntity<byte[]> audioResponse(DialogAudioService.AudioResult result) {
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(result.contentType()))
                // Adres nie zawiera treści wypowiedzi. Przeglądarka musi więc
                // sprawdzić backend po edycji dialogu; właściwy cache znajduje się w bazie.
                .header(HttpHeaders.CACHE_CONTROL, "private, no-cache")
                .eTag('"' + result.etag() + '"')
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline")
                .header("X-EduHub-Audio-Cache", result.cached() ? "HIT" : "MISS")
                .body(result.bytes());
    }

    private String vocabularyTerm(String content, int itemIndex) {
        try {
            JsonNode items = OBJECT_MAPPER.readTree(content).path("items");
            if (!items.isArray() || itemIndex < 0 || itemIndex >= items.size()) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Słówko nie istnieje");
            }
            String term = items.get(itemIndex).path("term").asText("").trim();
            if (term.isBlank()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Słówko nie ma treści");
            }
            return term;
        } catch (ResponseStatusException exception) {
            throw exception;
        } catch (RuntimeException exception) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Trening słówek ma nieprawidłowy format",
                    exception
            );
        }
    }

    private DialogLine line(String content, int turnIndex) {
        try {
            JsonNode root = OBJECT_MAPPER.readTree(content);
            JsonNode turns = root.path("turns");
            JsonNode characters = root.path("characters");
            if (!turns.isArray() || turnIndex < 0 || turnIndex >= turns.size()) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Wypowiedź nie istnieje");
            }
            JsonNode turn = turns.get(turnIndex);
            String speakerId = turn.path("speakerId").asText("");
            JsonNode character = null;
            int characterIndex = 0;
            if (characters.isArray()) {
                for (int index = 0; index < characters.size(); index++) {
                    if (speakerId.equals(characters.get(index).path("id").asText(""))) {
                        character = characters.get(index);
                        characterIndex = index;
                        break;
                    }
                }
            }
            VoiceGender gender = gender(character, characterIndex);
            return new DialogLine(turn.path("text").asText(""), gender);
        } catch (ResponseStatusException exception) {
            throw exception;
        } catch (RuntimeException exception) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Dialog ma nieprawidłowy format",
                    exception
            );
        }
    }

    private VoiceGender gender(JsonNode character, int index) {
        if (character != null) {
            String configured = character.path("voiceGender").asText("");
            if ("female".equalsIgnoreCase(configured)) return VoiceGender.FEMALE;
            if ("male".equalsIgnoreCase(configured)) return VoiceGender.MALE;
            String name = character.path("name").asText("");
            String avatar = character.path("avatar").asText("");
            if (avatar.contains("👩") || name.matches("(?i)mia|mija|emma|sophie|olivia")) {
                return VoiceGender.FEMALE;
            }
            if (avatar.contains("👨") || name.matches("(?i)alex|leo|daniel|adam")) {
                return VoiceGender.MALE;
            }
        }
        return index == 1 ? VoiceGender.MALE : VoiceGender.FEMALE;
    }

    private record DialogLine(String text, VoiceGender gender) {}
}

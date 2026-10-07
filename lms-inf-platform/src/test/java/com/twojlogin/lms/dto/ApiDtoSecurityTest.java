package com.twojlogin.lms.dto;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.twojlogin.lms.entity.Answer;
import com.twojlogin.lms.entity.LessonSubmission;
import com.twojlogin.lms.entity.LessonSubmissionAnswer;
import com.twojlogin.lms.entity.Question;
import com.twojlogin.lms.entity.Role;
import com.twojlogin.lms.entity.TutoringBooking;
import com.twojlogin.lms.entity.User;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class ApiDtoSecurityTest {

    private final ObjectMapper objectMapper = new ObjectMapper().findAndRegisterModules();

    @Test
    void userDtoNeverContainsCredentialsOrVerificationTokens() throws Exception {
        User user = new User();
        user.setId(1L);
        user.setEmail("student@example.com");
        user.setPassword("secret-hash");
        user.setVerificationToken("verification-secret");
        user.setRole(Role.STUDENT);

        String json = objectMapper.writeValueAsString(UserDto.from(user));

        assertTrue(json.contains("student@example.com"));
        assertFalse(json.contains("password"));
        assertFalse(json.contains("secret-hash"));
        assertFalse(json.contains("verification"));
    }

    @Test
    void studentQuestionDtoDoesNotRevealCorrectAnswers() throws Exception {
        Answer answer = new Answer();
        answer.setContent("Ukryta poprawna odpowiedź");
        answer.setCorrect(true);

        Question question = new Question();
        question.setContent("Pytanie");
        question.setAnswers(List.of(answer));

        String json = objectMapper.writeValueAsString(QuestionDto.from(question));

        assertTrue(json.contains("Ukryta poprawna odpowiedź"));
        assertFalse(json.contains("correct"));
    }

    @Test
    void studentSubmissionDoesNotRevealExpectedAnswer() throws Exception {
        LessonSubmissionAnswer answer = new LessonSubmissionAnswer();
        answer.setInstruction("Odpowiedź ucznia");
        answer.setExpectedAnswer("Tajne rozwiązanie wzorcowe");
        answer.setCorrect(false);

        LessonSubmission submission = new LessonSubmission();
        submission.setAnswers(List.of(answer));

        String studentJson = objectMapper.writeValueAsString(
                LessonSubmissionDto.forStudent(submission)
        );
        String adminJson = objectMapper.writeValueAsString(
                LessonSubmissionDto.forAdmin(submission)
        );

        assertTrue(studentJson.contains("Odpowiedź ucznia"));
        assertFalse(studentJson.contains("expectedAnswer"));
        assertFalse(studentJson.contains("Tajne rozwiązanie wzorcowe"));
        assertTrue(adminJson.contains("Tajne rozwiązanie wzorcowe"));
    }

    @Test
    void publicBlockedSlotDoesNotContainGuestData() throws Exception {
        TutoringBooking booking = new TutoringBooking();
        booking.setGuestEmail("private@example.com");
        booking.setGuestPhone("123456789");
        String json = objectMapper.writeValueAsString(TutoringBlockedSlotDto.from(booking));

        assertTrue(json.contains("startTime"));
        assertTrue(json.contains("endTime"));
        assertFalse(json.contains("private@example.com"));
        assertFalse(json.contains("123456789"));
    }
}

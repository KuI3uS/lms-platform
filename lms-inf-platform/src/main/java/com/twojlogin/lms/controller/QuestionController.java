package com.twojlogin.lms.controller;

import com.twojlogin.lms.dto.CreateQuestionRequest;
import com.twojlogin.lms.dto.QuestionDto;
import com.twojlogin.lms.entity.Answer;
import com.twojlogin.lms.entity.CourseModule;
import com.twojlogin.lms.entity.Question;
import com.twojlogin.lms.repository.CourseModuleRepository;
import com.twojlogin.lms.repository.QuestionRepository;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import org.springframework.security.core.Authentication;
import com.twojlogin.lms.service.CourseAccessService;

@RestController
@RequestMapping("/api/questions")
public class QuestionController {

    private final QuestionRepository questionRepository;
    private final CourseModuleRepository moduleRepository;
    private final CourseAccessService accessService;

    public QuestionController(QuestionRepository questionRepository,
                              CourseModuleRepository moduleRepository,
                              CourseAccessService accessService) {
        this.questionRepository = questionRepository;
        this.moduleRepository = moduleRepository;
        this.accessService = accessService;
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/module/{moduleId}")
    public QuestionDto create(@PathVariable Long moduleId,
                           @RequestBody CreateQuestionRequest request) {

        CourseModule module = moduleRepository.findById(moduleId)
                .orElseThrow(() -> new RuntimeException("Module not found"));

        Question question = new Question();
        question.setContent(request.content);
        question.setModule(module);

        List<Answer> answers = request.answers.stream().map(a -> {
            Answer answer = new Answer();
            answer.setContent(a.content);
            answer.setCorrect(a.correct);
            answer.setQuestion(question);
            return answer;
        }).toList();

        question.setAnswers(answers);

        return QuestionDto.from(questionRepository.save(question));
    }

    @GetMapping("/module/{moduleId}")
    public List<QuestionDto> getByModule(
            @PathVariable Long moduleId,
            Authentication authentication
    ) {
        accessService.requireModuleAccess(moduleId, authentication);
        return questionRepository.findByModuleId(moduleId).stream()
                .map(QuestionDto::from)
                .toList();
    }
    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        questionRepository.deleteById(id);
    }
}

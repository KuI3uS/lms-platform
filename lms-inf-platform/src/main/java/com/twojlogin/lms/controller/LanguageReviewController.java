package com.twojlogin.lms.controller;

import com.twojlogin.lms.dto.LanguageReviewDto;
import com.twojlogin.lms.dto.LanguageReviewRequest;
import com.twojlogin.lms.entity.LessonBlock;
import com.twojlogin.lms.entity.User;
import com.twojlogin.lms.repository.LessonBlockRepository;
import com.twojlogin.lms.service.CourseAccessService;
import com.twojlogin.lms.service.LanguageReviewService;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/language-reviews")
public class LanguageReviewController {

    private final LanguageReviewService reviewService;
    private final LessonBlockRepository blockRepository;
    private final CourseAccessService accessService;

    public LanguageReviewController(
            LanguageReviewService reviewService,
            LessonBlockRepository blockRepository,
            CourseAccessService accessService
    ) {
        this.reviewService = reviewService;
        this.blockRepository = blockRepository;
        this.accessService = accessService;
    }

    @GetMapping("/due")
    public List<LanguageReviewDto> due(Authentication authentication) {
        return reviewService.due(accessService.currentUser(authentication));
    }

    @GetMapping("/count")
    public Map<String, Long> dueCount(Authentication authentication) {
        return Map.of(
                "count",
                reviewService.dueCount(accessService.currentUser(authentication))
        );
    }

    @PostMapping("/{blockId}")
    public LanguageReviewDto record(
            @PathVariable Long blockId,
            @RequestBody LanguageReviewRequest request,
            Authentication authentication
    ) {
        LessonBlock block = blockRepository.findById(blockId).orElseThrow();
        User user = accessService.currentUser(authentication);
        accessService.requireLessonAccess(user, block.getLesson());
        return reviewService.record(
                user,
                block,
                request == null || request.score() == null ? 0 : request.score()
        );
    }
}

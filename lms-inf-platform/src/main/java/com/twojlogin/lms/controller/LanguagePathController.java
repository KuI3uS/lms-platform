package com.twojlogin.lms.controller;

import com.twojlogin.lms.dto.LanguagePathDto;
import com.twojlogin.lms.entity.Course;
import com.twojlogin.lms.entity.User;
import com.twojlogin.lms.service.CourseAccessService;
import com.twojlogin.lms.service.LanguageProgressService;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/language-paths")
public class LanguagePathController {

    private final CourseAccessService accessService;
    private final LanguageProgressService progressService;

    public LanguagePathController(
            CourseAccessService accessService,
            LanguageProgressService progressService
    ) {
        this.accessService = accessService;
        this.progressService = progressService;
    }

    @GetMapping("/course/{courseId}")
    public LanguagePathDto get(
            @PathVariable Long courseId,
            Authentication authentication
    ) {
        User user = accessService.currentUser(authentication);
        Course course = accessService.requireCourseAccess(courseId, authentication);
        if (!progressService.isLanguageCourse(course)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Ten kurs nie jest ścieżką językową"
            );
        }
        return progressService.describe(user, course, accessService.isAdmin(user));
    }
}

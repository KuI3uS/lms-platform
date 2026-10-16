package com.twojlogin.lms.service;

import com.twojlogin.lms.repository.CourseRepository;
import com.twojlogin.lms.repository.LessonRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.ZoneOffset;

/** One-time, owner-requested repair of Java imports whose blocks are already published. */
@Service
public class JavaCoursePublicationRepair {
    private static final Logger log = LoggerFactory.getLogger(JavaCoursePublicationRepair.class);
    private final CourseRepository courses;
    private final LessonRepository lessons;

    public JavaCoursePublicationRepair(CourseRepository courses, LessonRepository lessons) {
        this.courses = courses;
        this.lessons = lessons;
    }

    @Transactional
    public int repairOnce() {
        var offers = courses.findPublishedJavaBackendCourses();
        if (offers.isEmpty()) return 0;
        var course = courses.findByIdForImport(offers.get(0).getId()).orElseThrow();
        if (!course.isPublished() || course.getImportPublicationRepairedAt() != null) return 0;

        int repaired = lessons.publishImportedLessonsWithPublishedBlocks(course.getId());
        course.setImportPublicationRepairedAt(LocalDateTime.now(ZoneOffset.UTC));
        courses.saveAndFlush(course);
        log.info("Repaired publication of {} imported Java lessons in course {}", repaired, course.getId());
        return repaired;
    }
}

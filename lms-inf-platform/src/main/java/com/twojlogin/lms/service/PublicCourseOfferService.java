package com.twojlogin.lms.service;

import com.twojlogin.lms.dto.PublicCourseOfferDto;
import com.twojlogin.lms.entity.Course;
import com.twojlogin.lms.repository.CourseModuleRepository;
import com.twojlogin.lms.repository.CourseRepository;
import com.twojlogin.lms.repository.LessonRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.stream.IntStream;

@Service
public class PublicCourseOfferService {
    private final CourseRepository courses;
    private final CourseModuleRepository modules;
    private final LessonRepository lessons;

    public PublicCourseOfferService(CourseRepository courses, CourseModuleRepository modules, LessonRepository lessons) {
        this.courses = courses;
        this.modules = modules;
        this.lessons = lessons;
    }

    @Transactional(readOnly = true)
    public PublicCourseOfferDto javaBackendOffer() {
        Course course = courses.findPublishedJavaBackendCourses().stream()
                .filter(Course::isPublished)
                .findFirst()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Oferta kursu nie jest obecnie dostępna."));
        var stages = modules.findByCourseIdOrderByIdAsc(course.getId());
        var outline = IntStream.range(0, Math.min(stages.size(), 12))
                .mapToObj(index -> new PublicCourseOfferDto.OutlineItem(index + 1, stages.get(index).getName()))
                .toList();
        return new PublicCourseOfferDto(
                course.getId(),
                course.getTitle() == null || course.getTitle().isBlank() ? course.getName() : course.getTitle(),
                course.getDescription(),
                course.getBillingMode().name(),
                course.getPrice(),
                course.getMonthlyPrice(),
                stages.size(),
                lessons.countByModuleCourseId(course.getId()),
                lessons.countPublishedWithMaterialsByCourseId(course.getId()),
                outline
        );
    }
}

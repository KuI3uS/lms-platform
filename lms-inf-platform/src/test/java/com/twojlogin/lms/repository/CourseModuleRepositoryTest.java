package com.twojlogin.lms.repository;

import com.twojlogin.lms.entity.Course;
import com.twojlogin.lms.entity.CourseModule;
import com.twojlogin.lms.entity.Lesson;
import com.twojlogin.lms.entity.LessonProgress;
import com.twojlogin.lms.entity.Role;
import com.twojlogin.lms.entity.User;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;

import static org.junit.jupiter.api.Assertions.assertEquals;

@DataJpaTest
class CourseModuleRepositoryTest {

    @Autowired
    private CourseRepository courseRepository;

    @Autowired
    private CourseModuleRepository moduleRepository;

    @Autowired
    private LessonRepository lessonRepository;

    @Autowired
    private LessonProgressRepository progressRepository;

    @Autowired
    private UserRepository userRepository;

    @Test
    void countsOnlyNonEmptyModulesWhoseEveryLessonIsCompletedByUser() {
        Course course = new Course();
        course.setName("Java");
        course = courseRepository.save(course);

        CourseModule completedModule = module(course, "Podstawy");
        CourseModule incompleteModule = module(course, "Zmienne");
        module(course, "Pusty moduł");

        Lesson first = lesson(completedModule, "Wprowadzenie", 1);
        Lesson second = lesson(completedModule, "Algorytm", 2);
        Lesson incomplete = lesson(incompleteModule, "Typy danych", 1);

        User student = userRepository.save(user("student@example.com"));
        User anotherStudent = userRepository.save(user("other@example.com"));

        complete(student, first);
        complete(student, second);
        complete(anotherStudent, incomplete);

        assertEquals(
                1,
                moduleRepository.countCompletedModulesByUserId(student.getId())
        );
    }

    private CourseModule module(Course course, String name) {
        CourseModule module = new CourseModule();
        module.setCourse(course);
        module.setName(name);
        return moduleRepository.save(module);
    }

    private Lesson lesson(CourseModule module, String title, int orderIndex) {
        Lesson lesson = new Lesson();
        lesson.setModule(module);
        lesson.setTitle(title);
        lesson.setOrderIndex(orderIndex);
        lesson.setPublished(true);
        return lessonRepository.save(lesson);
    }

    private User user(String email) {
        User user = new User();
        user.setEmail(email);
        user.setPassword("test-password");
        user.setRole(Role.STUDENT);
        user.setEnabled(true);
        return user;
    }

    private void complete(User user, Lesson lesson) {
        LessonProgress progress = new LessonProgress();
        progress.setUser(user);
        progress.setLesson(lesson);
        progress.setCompleted(true);
        progressRepository.save(progress);
    }
}

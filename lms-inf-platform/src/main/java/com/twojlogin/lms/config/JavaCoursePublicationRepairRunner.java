package com.twojlogin.lms.config;

import com.twojlogin.lms.service.JavaCoursePublicationRepair;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

@Component
@Order(Ordered.LOWEST_PRECEDENCE)
public class JavaCoursePublicationRepairRunner implements ApplicationRunner {
    private final JavaCoursePublicationRepair repair;

    public JavaCoursePublicationRepairRunner(JavaCoursePublicationRepair repair) {
        this.repair = repair;
    }

    @Override
    public void run(ApplicationArguments args) {
        repair.repairOnce();
    }
}

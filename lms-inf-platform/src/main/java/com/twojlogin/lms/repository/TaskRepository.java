package com.twojlogin.lms.repository;

import com.twojlogin.lms.entity.Task;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TaskRepository extends JpaRepository<Task, Long> {

    List<Task> findByModuleId(Long moduleId);


}

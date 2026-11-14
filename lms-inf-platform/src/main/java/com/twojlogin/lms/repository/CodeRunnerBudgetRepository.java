package com.twojlogin.lms.repository;

import com.twojlogin.lms.entity.CodeRunnerBudget;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface CodeRunnerBudgetRepository extends JpaRepository<CodeRunnerBudget, String> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select budget from CodeRunnerBudget budget where budget.id = :id")
    Optional<CodeRunnerBudget> findForUpdate(@Param("id") String id);
}

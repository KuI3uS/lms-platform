package com.twojlogin.lms.service;

import com.twojlogin.lms.entity.CodeRunnerBudget;
import com.twojlogin.lms.repository.CodeRunnerBudgetRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.support.TransactionTemplate;

import java.time.Clock;
import java.time.YearMonth;

@Service
public class CodeRunnerBudgetService {
    private final CodeRunnerBudgetRepository repository;
    private final TransactionTemplate transaction;
    private final int limit;
    private final Clock clock;

    @Autowired
    public CodeRunnerBudgetService(CodeRunnerBudgetRepository repository,
                                   PlatformTransactionManager manager,
                                   @Value("${code.runner.render.monthly-launch-limit:1000}") int limit) {
        this(repository, manager, limit, Clock.systemUTC());
    }

    CodeRunnerBudgetService(CodeRunnerBudgetRepository repository, PlatformTransactionManager manager,
                            int limit, Clock clock) {
        this.repository = repository;
        this.transaction = new TransactionTemplate(manager);
        // Commit before calling Render. An outer task transaction rollback must NOT
        // refund an already billable launch. The row lock is never held during HTTP.
        this.transaction.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);
        this.limit = Math.max(0, Math.min(1000, limit));
        this.clock = clock;
    }

    public boolean reserveLaunch() {
        try {
            return reserve();
        } catch (DataIntegrityViolationException firstInsertRace) {
            // Two app instances can initialize the row simultaneously. Retry in a
            // NEW transaction, after the failed insert transaction has rolled back.
            return reserve();
        }
    }

    private boolean reserve() {
        return Boolean.TRUE.equals(transaction.execute(status -> {
            CodeRunnerBudget budget = repository.findForUpdate("render-java")
                    .orElseGet(() -> repository.saveAndFlush(new CodeRunnerBudget("render-java")));
            String month = YearMonth.now(clock).toString();
            if (!month.equals(budget.getMonth())) budget.reset(month);
            if (budget.getLaunches() >= limit) return false;
            budget.reserve();
            repository.saveAndFlush(budget);
            return true;
        }));
    }
}

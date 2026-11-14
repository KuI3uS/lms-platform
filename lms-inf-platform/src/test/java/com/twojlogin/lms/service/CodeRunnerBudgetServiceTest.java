package com.twojlogin.lms.service;

import com.twojlogin.lms.entity.CodeRunnerBudget;
import com.twojlogin.lms.repository.CodeRunnerBudgetRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.concurrent.Executors;
import java.util.stream.IntStream;

import static org.junit.jupiter.api.Assertions.*;

@DataJpaTest
@Transactional(propagation = Propagation.NOT_SUPPORTED)
class CodeRunnerBudgetServiceTest {
    @Autowired CodeRunnerBudgetRepository repository;
    @Autowired PlatformTransactionManager transactions;
    private static final Clock NOVEMBER = Clock.fixed(Instant.parse("2026-11-14T12:00:00Z"), ZoneOffset.UTC);

    @BeforeEach void reset() { repository.deleteAll(); }

    @Test
    void quotaPersistsAcrossServiceRestartsAndOnlyResetsInNextUtcMonth() {
        var first = service(2, NOVEMBER);
        assertTrue(first.reserveLaunch());
        assertTrue(service(2, NOVEMBER).reserveLaunch());
        assertFalse(service(2, NOVEMBER).reserveLaunch());
        var december = service(2, Clock.fixed(Instant.parse("2026-12-01T00:00:00Z"), ZoneOffset.UTC));
        assertTrue(december.reserveLaunch());
        assertEquals(1, repository.findById("render-java").orElseThrow().getLaunches());
    }

    @Test
    void concurrentInstancesCannotOverrunTheMonthlyLimit() throws Exception {
        // Initialize row, as production does on the first launch.
        assertTrue(service(3, NOVEMBER).reserveLaunch());
        var pool = Executors.newFixedThreadPool(4);
        try {
            var requests = IntStream.range(0, 10).<java.util.concurrent.Callable<Boolean>>mapToObj(
                    index -> () -> service(3, NOVEMBER).reserveLaunch()).toList();
            long granted = 0;
            for (var result : pool.invokeAll(requests)) if (result.get()) granted++;
            assertEquals(2, granted);
            assertEquals(3, repository.findById("render-java").orElseThrow().getLaunches());
        } finally { pool.shutdownNow(); }
    }

    @Test
    void environmentVariableCannotRaiseHardCostCeilingAbove1000() {
        CodeRunnerBudget budget = new CodeRunnerBudget("render-java");
        budget.reset("2026-11");
        for (int index = 0; index < 1000; index++) budget.reserve();
        repository.saveAndFlush(budget);
        assertFalse(service(50_000, NOVEMBER).reserveLaunch());
        assertFalse(service(0, NOVEMBER).reserveLaunch());
    }

    private CodeRunnerBudgetService service(int limit, Clock clock) {
        return new CodeRunnerBudgetService(repository, transactions, limit, clock);
    }
}

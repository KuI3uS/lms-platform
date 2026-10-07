package com.twojlogin.lms.service;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class LearningLeagueTest {

    @Test
    void startsWithCopperAndMovesThroughEveryConfiguredLeague() {
        assertEquals(LearningLeague.COPPER, LearningLeague.forLevel(1));
        assertEquals("Miedź", LearningLeague.forLevel(1).displayName());
        assertEquals(LearningLeague.COPPER, LearningLeague.forLevel(4));
        assertEquals(LearningLeague.SILVER, LearningLeague.forLevel(5));
        assertEquals(LearningLeague.GOLD, LearningLeague.forLevel(10));
        assertEquals(LearningLeague.PLATINUM, LearningLeague.forLevel(15));
        assertEquals(LearningLeague.CRYSTAL, LearningLeague.forLevel(25));
        assertEquals(LearningLeague.DIAMOND, LearningLeague.forLevel(40));
        assertEquals(LearningLeague.PRISM, LearningLeague.forLevel(60));
    }
}

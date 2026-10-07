package com.twojlogin.lms.service;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class LearningLeagueTest {

    @Test
    void startsWithCopperAndMovesThroughEveryConfiguredLeague() {
        assertEquals(LearningLeague.COPPER, LearningLeague.forLevel(1));
        assertEquals("Miedź", LearningLeague.forLevel(1).displayName());
        assertEquals(LearningLeague.COPPER, LearningLeague.forLevel(10));
        assertEquals(LearningLeague.SILVER, LearningLeague.forLevel(11));
        assertEquals(LearningLeague.GOLD, LearningLeague.forLevel(21));
        assertEquals(LearningLeague.PLATINUM, LearningLeague.forLevel(31));
        assertEquals(LearningLeague.CRYSTAL, LearningLeague.forLevel(41));
        assertEquals(LearningLeague.DIAMOND, LearningLeague.forLevel(51));
        assertEquals(LearningLeague.PRISM, LearningLeague.forLevel(61));
        assertEquals(LearningLeague.LEGENDARY_ONE, LearningLeague.forLevel(71));
        assertEquals(LearningLeague.LEGENDARY_ONE, LearningLeague.forLevel(90));
        assertEquals(LearningLeague.LEGENDARY_TWO, LearningLeague.forLevel(91));
        assertEquals(LearningLeague.LEGENDARY_TWO, LearningLeague.forLevel(110));
        assertEquals(LearningLeague.MYTHIC, LearningLeague.forLevel(111));
    }
}

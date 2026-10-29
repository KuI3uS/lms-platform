package com.twojlogin.lms.service;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class LearningLeagueTest {

    @Test
    void startsWithCopperAndMovesThroughEveryConfiguredLeague() {
        assertEquals(LearningLeague.COPPER, LearningLeague.forLevel(1));
        assertEquals("Miedź", LearningLeague.forLevel(1).displayName());
        assertEquals(LearningLeague.COPPER, LearningLeague.forLevel(7));
        assertEquals(LearningLeague.COPPER, LearningLeague.forLevel(10));
        assertEquals(LearningLeague.SILVER, LearningLeague.forLevel(11));
        assertEquals(LearningLeague.GOLD, LearningLeague.forLevel(21));
        assertEquals(LearningLeague.PLATINUM, LearningLeague.forLevel(31));
        assertEquals(LearningLeague.CRYSTAL, LearningLeague.forLevel(41));
        assertEquals(LearningLeague.DIAMOND, LearningLeague.forLevel(51));
        assertEquals(LearningLeague.PRISM, LearningLeague.forLevel(61));
        assertEquals(LearningLeague.LEGENDARY_ONE, LearningLeague.forLevel(71));
        assertEquals(LearningLeague.LEGENDARY_ONE, LearningLeague.forLevel(80));
        assertEquals(LearningLeague.LEGENDARY_TWO, LearningLeague.forLevel(81));
        assertEquals(LearningLeague.LEGENDARY_TWO, LearningLeague.forLevel(90));
        assertEquals(LearningLeague.MYTHIC, LearningLeague.forLevel(91));
        assertEquals(LearningLeague.MYTHIC, LearningLeague.forLevel(Integer.MAX_VALUE));
    }

    @Test
    void everyLeagueStartsAfterTenLevelsAndReportsTheNextBoundary() {
        LearningLeague[] leagues = LearningLeague.values();
        for (int index = 0; index < leagues.length; index++) {
            int start = index * 10 + 1;
            assertEquals(start, leagues[index].minimumLevel());
            assertEquals(leagues[index], LearningLeague.forLevel(start));
            assertEquals(leagues[index], LearningLeague.forLevel(start + 9));
            assertEquals(index == leagues.length - 1 ? null : Integer.valueOf(start + 10), leagues[index].nextLevel());
        }
    }

    @Test
    void leagueAchievementTargetsMatchTheLeagueTheyUnlock() {
        assertEquals(LearningLeague.PRISM.minimumLevel(), com.twojlogin.lms.entity.AchievementType.PRISM_LEAGUE.target());
        assertEquals(LearningLeague.MYTHIC.minimumLevel(), com.twojlogin.lms.entity.AchievementType.MYTHIC_LEAGUE.target());
    }
}

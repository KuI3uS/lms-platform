package com.twojlogin.lms.service;

import com.twojlogin.lms.dto.RewardCenterDto;
import com.twojlogin.lms.entity.GamificationProfile;
import com.twojlogin.lms.entity.User;
import com.twojlogin.lms.repository.AvatarItemOwnershipRepository;
import com.twojlogin.lms.repository.GamificationProfileRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.Authentication;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class RewardCenterServiceTest {

    private RewardCenterService service;
    private Authentication authentication;
    private GamificationProfile profile;

    @BeforeEach
    void setUp() {
        CourseAccessService accessService = mock(CourseAccessService.class);
        GamificationService gamificationService = mock(GamificationService.class);
        GamificationProfileRepository profileRepository =
                mock(GamificationProfileRepository.class);
        AvatarItemOwnershipRepository ownershipRepository =
                mock(AvatarItemOwnershipRepository.class);
        authentication = mock(Authentication.class);

        User user = new User();
        user.setId(7L);
        profile = new GamificationProfile();
        profile.setUser(user);
        profile.setLevel(5);
        profile.setGemBalance(3_000);
        profile.setTotalGemsEarned(3_000);
        profile.setGemEconomyInitialized(true);

        when(accessService.currentUser(authentication)).thenReturn(user);
        when(gamificationService.profileForUpdate(user)).thenReturn(profile);
        when(profileRepository.save(any(GamificationProfile.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        when(ownershipRepository.findByUserId(user.getId())).thenReturn(List.of());

        service = new RewardCenterService(
                accessService,
                gamificationService,
                profileRepository,
                ownershipRepository
        );
    }

    @Test
    void buysFivePercentVoucherWithGems() {
        RewardCenterDto result = service.purchase("DISCOUNT_5", authentication);

        assertEquals(500, result.gemBalance());
        assertEquals(1, result.vouchers().discount5());
        assertEquals(3_000, result.totalGemsEarned());
    }
}

package com.twojlogin.lms.service;

import com.twojlogin.lms.dto.RewardCenterDto;
import com.twojlogin.lms.entity.GamificationProfile;
import com.twojlogin.lms.entity.RewardItemType;
import com.twojlogin.lms.entity.User;
import com.twojlogin.lms.repository.GamificationProfileRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Clock;
import java.time.Instant;
import java.util.Arrays;

@Service
public class RewardCenterService {

    private final CourseAccessService accessService;
    private final GamificationService gamificationService;
    private final GamificationProfileRepository profileRepository;
    private final Clock clock = Clock.systemUTC();

    public RewardCenterService(
            CourseAccessService accessService,
            GamificationService gamificationService,
            GamificationProfileRepository profileRepository
    ) {
        this.accessService = accessService;
        this.gamificationService = gamificationService;
        this.profileRepository = profileRepository;
    }

    @Transactional
    public RewardCenterDto get(Authentication authentication) {
        User user = accessService.currentUser(authentication);
        return toDto(gamificationService.profileForUpdate(user));
    }

    @Transactional
    public RewardCenterDto purchase(String itemCode, Authentication authentication) {
        User user = accessService.currentUser(authentication);
        GamificationProfile profile = gamificationService.profileForUpdate(user);
        RewardShopItem item = requireItem(itemCode);

        if (profile.getLevel() < item.requiredLevel()) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Ta nagroda odblokuje się na poziomie " + item.requiredLevel()
            );
        }
        if (profile.getGemBalance() < item.cost()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Masz za mało klejnotów");
        }

        profile.setGemBalance(profile.getGemBalance() - item.cost());
        switch (item.type()) {
            case DISCOUNT -> addVoucher(profile, item.discountPercent());
            case BOOSTER -> activateBoost(profile, item);
        }
        profileRepository.save(profile);
        return toDto(profile);
    }

    private RewardCenterDto toDto(GamificationProfile profile) {
        LearningLeague league = LearningLeague.forLevel(profile.getLevel());
        var catalog = Arrays.stream(RewardShopItem.values())
                .map(item -> new RewardCenterDto.RewardItemDto(
                        item.name(),
                        item.type(),
                        item.title(),
                        item.description(),
                        item.cost(),
                        item.requiredLevel(),
                        item.discountPercent(),
                        item.boostPercent(),
                        item.boostHours(),
                        item.visualStyle(),
                        quantity(profile, item),
                        profile.getLevel() >= item.requiredLevel()
                ))
                .toList();

        return new RewardCenterDto(
                profile.getGemBalance(),
                profile.getTotalGemsEarned(),
                GamificationService.GEMS_PER_COMPLETED_LESSON,
                profile.getLevel(),
                new RewardCenterDto.LeagueDto(league.displayName(), league.color()),
                league.nextLevel(),
                (profile.getLevel() / GamificationService.GEM_LEVEL_INTERVAL + 1)
                        * GamificationService.GEM_LEVEL_INTERVAL,
                GamificationService.GEMS_PER_LEVEL_MILESTONE,
                profile.getXpBoostPercent(),
                profile.getXpBoostExpiresAt(),
                new RewardCenterDto.VoucherWalletDto(
                        profile.getVoucher5Count(),
                        profile.getVoucher10Count(),
                        profile.getVoucher20Count()
                ),
                catalog
        );
    }

    private void activateBoost(GamificationProfile profile, RewardShopItem item) {
        Instant now = clock.instant();
        Instant currentExpiry = profile.getXpBoostExpiresAt();
        if (currentExpiry != null
                && currentExpiry.isAfter(now)
                && profile.getXpBoostPercent() > item.boostPercent()) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Masz już aktywny silniejszy booster"
            );
        }
        Instant start = currentExpiry != null
                && currentExpiry.isAfter(now)
                && profile.getXpBoostPercent() == item.boostPercent()
                ? currentExpiry
                : now;
        profile.setXpBoostPercent(item.boostPercent());
        profile.setXpBoostExpiresAt(start.plusSeconds(item.boostHours() * 3600L));
    }

    private void addVoucher(GamificationProfile profile, int percent) {
        switch (percent) {
            case 5 -> profile.setVoucher5Count(profile.getVoucher5Count() + 1);
            case 10 -> profile.setVoucher10Count(profile.getVoucher10Count() + 1);
            case 20 -> profile.setVoucher20Count(profile.getVoucher20Count() + 1);
            default -> throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Nieprawidłowy kupon");
        }
    }

    private int quantity(GamificationProfile profile, RewardShopItem item) {
        if (item.type() != RewardItemType.DISCOUNT) return 0;
        return switch (item.discountPercent()) {
            case 5 -> profile.getVoucher5Count();
            case 10 -> profile.getVoucher10Count();
            case 20 -> profile.getVoucher20Count();
            default -> 0;
        };
    }

    private RewardShopItem requireItem(String code) {
        RewardShopItem item = RewardShopItem.fromCode(code);
        if (item == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Nie znaleziono nagrody");
        }
        return item;
    }
}

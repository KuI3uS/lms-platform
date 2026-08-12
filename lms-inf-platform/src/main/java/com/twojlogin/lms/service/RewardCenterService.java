package com.twojlogin.lms.service;

import com.twojlogin.lms.dto.RewardCenterDto;
import com.twojlogin.lms.entity.AvatarItemOwnership;
import com.twojlogin.lms.entity.GamificationProfile;
import com.twojlogin.lms.entity.RewardItemType;
import com.twojlogin.lms.entity.User;
import com.twojlogin.lms.repository.AvatarItemOwnershipRepository;
import com.twojlogin.lms.repository.GamificationProfileRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Clock;
import java.time.Instant;
import java.util.Arrays;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class RewardCenterService {

    private static final Set<String> DEFAULT_AVATAR_ITEMS = Set.of(
            "OUTFIT_CORE",
            "ACCESSORY_NONE",
            "AURA_NONE"
    );

    private final CourseAccessService accessService;
    private final GamificationService gamificationService;
    private final GamificationProfileRepository profileRepository;
    private final AvatarItemOwnershipRepository ownershipRepository;
    private final Clock clock = Clock.systemUTC();

    public RewardCenterService(
            CourseAccessService accessService,
            GamificationService gamificationService,
            GamificationProfileRepository profileRepository,
            AvatarItemOwnershipRepository ownershipRepository
    ) {
        this.accessService = accessService;
        this.gamificationService = gamificationService;
        this.profileRepository = profileRepository;
        this.ownershipRepository = ownershipRepository;
    }

    @Transactional
    public RewardCenterDto get(Authentication authentication) {
        User user = accessService.currentUser(authentication);
        GamificationProfile profile = gamificationService.profileForUpdate(user);
        return toDto(profile);
    }

    @Transactional
    public RewardCenterDto purchase(String itemCode, Authentication authentication) {
        User user = accessService.currentUser(authentication);
        GamificationProfile profile = gamificationService.profileForUpdate(user);
        RewardShopItem item = requireItem(itemCode);

        if (profile.getLevel() < item.requiredLevel()) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Ten przedmiot odblokuje się na poziomie " + item.requiredLevel()
            );
        }
        if (profile.getGemBalance() < item.cost()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Masz za mało klejnotów");
        }
        if (isCosmetic(item)
                && ownershipRepository.existsByUserIdAndItemCode(user.getId(), item.name())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Ten przedmiot już należy do Ciebie");
        }

        profile.setGemBalance(profile.getGemBalance() - item.cost());
        switch (item.type()) {
            case DISCOUNT -> addVoucher(profile, item.discountPercent());
            case BOOSTER -> activateBoost(profile, item);
            case OUTFIT, ACCESSORY, AURA -> saveOwnership(user, item);
        }
        profileRepository.save(profile);
        return toDto(profile);
    }

    @Transactional
    public RewardCenterDto equip(String itemCode, Authentication authentication) {
        User user = accessService.currentUser(authentication);
        GamificationProfile profile = gamificationService.profileForUpdate(user);

        if (DEFAULT_AVATAR_ITEMS.contains(itemCode)) {
            equipDefault(profile, itemCode);
        } else {
            RewardShopItem item = requireItem(itemCode);
            if (!isCosmetic(item)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tego przedmiotu nie można założyć");
            }
            if (!ownershipRepository.existsByUserIdAndItemCode(user.getId(), item.name())) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Najpierw kup ten przedmiot");
            }
            equip(profile, item);
        }

        profileRepository.save(profile);
        return toDto(profile);
    }

    private RewardCenterDto toDto(GamificationProfile profile) {
        Set<String> ownedCodes = ownershipRepository.findByUserId(profile.getUser().getId())
                .stream()
                .map(AvatarItemOwnership::getItemCode)
                .collect(Collectors.toSet());
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
                        isCosmetic(item) && ownedCodes.contains(item.name()),
                        isEquipped(profile, item),
                        quantity(profile, item),
                        profile.getLevel() >= item.requiredLevel()
                ))
                .toList();

        return new RewardCenterDto(
                profile.getGemBalance(),
                profile.getTotalGemsEarned(),
                GamificationService.GEMS_PER_COMPLETED_LESSON,
                profile.getLevel(),
                new RewardCenterDto.LeagueDto(
                        league.displayName(),
                        league.color(),
                        league.symbol()
                ),
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
                new RewardCenterDto.AvatarDto(
                        profile.getEquippedOutfit(),
                        profile.getEquippedAccessory(),
                        profile.getEquippedAura(),
                        glowLevel(profile.getLevel())
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

    private void saveOwnership(User user, RewardShopItem item) {
        AvatarItemOwnership ownership = new AvatarItemOwnership();
        ownership.setUser(user);
        ownership.setItemCode(item.name());
        ownership.setPurchasedAt(clock.instant());
        ownershipRepository.save(ownership);
    }

    private void equip(GamificationProfile profile, RewardShopItem item) {
        switch (item.type()) {
            case OUTFIT -> profile.setEquippedOutfit(item.name());
            case ACCESSORY -> profile.setEquippedAccessory(item.name());
            case AURA -> profile.setEquippedAura(item.name());
            default -> throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tego przedmiotu nie można założyć");
        }
    }

    private void equipDefault(GamificationProfile profile, String itemCode) {
        if (itemCode.startsWith("OUTFIT_")) profile.setEquippedOutfit(itemCode);
        else if (itemCode.startsWith("ACCESSORY_")) profile.setEquippedAccessory(itemCode);
        else if (itemCode.startsWith("AURA_")) profile.setEquippedAura(itemCode);
    }

    private boolean isCosmetic(RewardShopItem item) {
        return item.type() == RewardItemType.OUTFIT
                || item.type() == RewardItemType.ACCESSORY
                || item.type() == RewardItemType.AURA;
    }

    private boolean isEquipped(GamificationProfile profile, RewardShopItem item) {
        return switch (item.type()) {
            case OUTFIT -> item.name().equals(profile.getEquippedOutfit());
            case ACCESSORY -> item.name().equals(profile.getEquippedAccessory());
            case AURA -> item.name().equals(profile.getEquippedAura());
            default -> false;
        };
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

    private int glowLevel(int level) {
        if (level >= 60) return 6;
        if (level >= 40) return 5;
        if (level >= 25) return 4;
        if (level >= 15) return 3;
        if (level >= 10) return 2;
        if (level >= 5) return 1;
        return 0;
    }

    private RewardShopItem requireItem(String code) {
        RewardShopItem item = RewardShopItem.fromCode(code);
        if (item == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Nie znaleziono nagrody");
        }
        return item;
    }
}

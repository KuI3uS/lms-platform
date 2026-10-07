package com.twojlogin.lms.service;

import com.twojlogin.lms.entity.RewardItemType;

import java.util.Arrays;

public enum RewardShopItem {
    DISCOUNT_5(
            RewardItemType.DISCOUNT,
            "Kupon Start 5%",
            "Obniża cenę jednego kursu o 5%.",
            2_500,
            1,
            5,
            0,
            0,
            "cyan"
    ),
    DISCOUNT_10(
            RewardItemType.DISCOUNT,
            "Kupon Progres 10%",
            "Obniża cenę jednego kursu o 10%.",
            5_000,
            5,
            10,
            0,
            0,
            "violet"
    ),
    DISCOUNT_20(
            RewardItemType.DISCOUNT,
            "Kupon Mistrzowski 20%",
            "Najrzadszy kupon: 20% mniej za jeden kurs.",
            10_000,
            15,
            20,
            0,
            0,
            "amber"
    ),
    BOOST_FOCUS(
            RewardItemType.BOOSTER,
            "Tryb skupienia",
            "+50% XP przez 7 dni aktywnej nauki.",
            1_500,
            5,
            0,
            50,
            168,
            "blue"
    ),
    BOOST_REACTOR(
            RewardItemType.BOOSTER,
            "Reaktor wiedzy",
            "+100% XP przez 24 godziny.",
            1_200,
            10,
            0,
            100,
            24,
            "fuchsia"
    );

    private final RewardItemType type;
    private final String title;
    private final String description;
    private final int cost;
    private final int requiredLevel;
    private final int discountPercent;
    private final int boostPercent;
    private final int boostHours;
    private final String visualStyle;

    RewardShopItem(
            RewardItemType type,
            String title,
            String description,
            int cost,
            int requiredLevel,
            int discountPercent,
            int boostPercent,
            int boostHours,
            String visualStyle
    ) {
        this.type = type;
        this.title = title;
        this.description = description;
        this.cost = cost;
        this.requiredLevel = requiredLevel;
        this.discountPercent = discountPercent;
        this.boostPercent = boostPercent;
        this.boostHours = boostHours;
        this.visualStyle = visualStyle;
    }

    public RewardItemType type() { return type; }
    public String title() { return title; }
    public String description() { return description; }
    public int cost() { return cost; }
    public int requiredLevel() { return requiredLevel; }
    public int discountPercent() { return discountPercent; }
    public int boostPercent() { return boostPercent; }
    public int boostHours() { return boostHours; }
    public String visualStyle() { return visualStyle; }

    public static RewardShopItem fromCode(String code) {
        return Arrays.stream(values())
                .filter(item -> item.name().equalsIgnoreCase(code))
                .findFirst()
                .orElse(null);
    }
}

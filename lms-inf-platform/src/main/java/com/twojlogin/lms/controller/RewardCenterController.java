package com.twojlogin.lms.controller;

import com.twojlogin.lms.dto.RewardCenterDto;
import com.twojlogin.lms.service.RewardCenterService;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/rewards")
public class RewardCenterController {

    private final RewardCenterService rewardCenterService;

    public RewardCenterController(RewardCenterService rewardCenterService) {
        this.rewardCenterService = rewardCenterService;
    }

    @GetMapping
    public RewardCenterDto get(Authentication authentication) {
        return rewardCenterService.get(authentication);
    }

    @PostMapping("/purchase/{itemCode}")
    public RewardCenterDto purchase(
            @PathVariable String itemCode,
            Authentication authentication
    ) {
        return rewardCenterService.purchase(itemCode, authentication);
    }

    @PostMapping("/equip/{itemCode}")
    public RewardCenterDto equip(
            @PathVariable String itemCode,
            Authentication authentication
    ) {
        return rewardCenterService.equip(itemCode, authentication);
    }
}

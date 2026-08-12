package com.twojlogin.lms.entity;

import jakarta.persistence.*;

import java.time.Instant;

@Entity
@Table(
        name = "avatar_item_ownerships",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_avatar_item_user_code",
                columnNames = {"user_id", "item_code"}
        )
)
public class AvatarItemOwnership {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "item_code", nullable = false, length = 60)
    private String itemCode;

    @Column(nullable = false)
    private Instant purchasedAt;

    public Long getId() {
        return id;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public String getItemCode() {
        return itemCode;
    }

    public void setItemCode(String itemCode) {
        this.itemCode = itemCode;
    }

    public Instant getPurchasedAt() {
        return purchasedAt;
    }

    public void setPurchasedAt(Instant purchasedAt) {
        this.purchasedAt = purchasedAt;
    }
}

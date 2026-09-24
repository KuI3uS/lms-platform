package com.twojlogin.lms.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

import java.time.LocalDateTime;

@Entity
@Table(name = "course_access_codes", indexes = {
        @Index(name = "idx_access_code_course", columnList = "course_id"),
        @Index(name = "idx_access_code_expires", columnList = "expires_at")
})
public class CourseAccessCode {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 64)
    private String codeHash;

    @Column(nullable = false, length = 16)
    private String codePreview;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "course_id", nullable = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    private Course course;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32, columnDefinition = "varchar(32)")
    private AccessCodeType accessType;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime expiresAt;

    private LocalDateTime redeemedAt;
    private LocalDateTime revokedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "redeemed_by_id")
    @OnDelete(action = OnDeleteAction.SET_NULL)
    private User redeemedBy;

    public Long getId() { return id; }
    public String getCodeHash() { return codeHash; }
    public void setCodeHash(String codeHash) { this.codeHash = codeHash; }
    public String getCodePreview() { return codePreview; }
    public void setCodePreview(String codePreview) { this.codePreview = codePreview; }
    public Course getCourse() { return course; }
    public void setCourse(Course course) { this.course = course; }
    public AccessCodeType getAccessType() { return accessType; }
    public void setAccessType(AccessCodeType accessType) { this.accessType = accessType; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getExpiresAt() { return expiresAt; }
    public void setExpiresAt(LocalDateTime expiresAt) { this.expiresAt = expiresAt; }
    public LocalDateTime getRedeemedAt() { return redeemedAt; }
    public void setRedeemedAt(LocalDateTime redeemedAt) { this.redeemedAt = redeemedAt; }
    public LocalDateTime getRevokedAt() { return revokedAt; }
    public void setRevokedAt(LocalDateTime revokedAt) { this.revokedAt = revokedAt; }
    public User getRedeemedBy() { return redeemedBy; }
    public void setRedeemedBy(User redeemedBy) { this.redeemedBy = redeemedBy; }
}

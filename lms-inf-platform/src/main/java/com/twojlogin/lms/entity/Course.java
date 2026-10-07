package com.twojlogin.lms.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;

import java.math.BigDecimal;
import java.util.List;

@Entity

public class Course {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String name;

    private String title;
    @Column(length = 5000)
    private String description;
    private BigDecimal price;
    private BigDecimal monthlyPrice;
    @Enumerated(EnumType.STRING)
    private CourseBillingMode billingMode;
    private boolean published;
    private String thumbnailUrl;
    private String level;
    private String category = "PROGRAMMING";
    private String courseLanguage;
    private String cefrLevel;
    private String cefrEndLevel;
    @Column(length = 1000)
    private String paymentUrl;
    @Column(length = 1000)
    private String monthlyPaymentUrl;

    @OneToMany(mappedBy = "course", cascade = CascadeType.ALL)
    @JsonIgnore
    private List<CourseModule> modules;


    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public List<CourseModule> getModules() {
        return modules;
    }

    public void setModules(List<CourseModule> modules) {
        this.modules = modules;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public BigDecimal getPrice() {
        return price;
    }

    public void setPrice(BigDecimal price) {
        this.price = price;
    }

    public BigDecimal getMonthlyPrice() {
        return monthlyPrice;
    }

    public void setMonthlyPrice(BigDecimal monthlyPrice) {
        this.monthlyPrice = monthlyPrice;
    }

    public CourseBillingMode getBillingMode() {
        if (billingMode != null) return billingMode;
        return price == null || price.signum() <= 0
                ? CourseBillingMode.FREE
                : CourseBillingMode.ONE_TIME;
    }

    public void setBillingMode(CourseBillingMode billingMode) {
        this.billingMode = billingMode;
    }

    public boolean isPublished() {
        return published;
    }

    public void setPublished(boolean published) {
        this.published = published;
    }

    public String getThumbnailUrl() {
        return thumbnailUrl;
    }

    public void setThumbnailUrl(String thumbnailUrl) {
        this.thumbnailUrl = thumbnailUrl;
    }

    public String getLevel() {
        return level;
    }

    public void setLevel(String level) {
        this.level = level;
    }

    public String getCategory() {
        return category == null ? "PROGRAMMING" : category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getCourseLanguage() {
        return courseLanguage;
    }

    public void setCourseLanguage(String courseLanguage) {
        this.courseLanguage = courseLanguage;
    }

    public String getCefrLevel() {
        return cefrLevel;
    }

    public void setCefrLevel(String cefrLevel) {
        this.cefrLevel = cefrLevel;
    }

    public String getCefrEndLevel() {
        return cefrEndLevel == null ? cefrLevel : cefrEndLevel;
    }

    public void setCefrEndLevel(String cefrEndLevel) {
        this.cefrEndLevel = cefrEndLevel;
    }

    public String getPaymentUrl() {
        return paymentUrl;
    }

    public void setPaymentUrl(String paymentUrl) {
        this.paymentUrl = paymentUrl;
    }

    public String getMonthlyPaymentUrl() {
        return monthlyPaymentUrl;
    }

    public void setMonthlyPaymentUrl(String monthlyPaymentUrl) {
        this.monthlyPaymentUrl = monthlyPaymentUrl;
    }
}

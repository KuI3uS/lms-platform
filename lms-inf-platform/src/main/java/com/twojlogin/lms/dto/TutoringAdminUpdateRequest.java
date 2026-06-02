package com.twojlogin.lms.dto;

import com.twojlogin.lms.entity.TutoringStatus;

public class TutoringAdminUpdateRequest {

    private TutoringStatus status;
    private String adminComment;
    private String meetingLink;

    public TutoringStatus getStatus() {
        return status;
    }

    public void setStatus(TutoringStatus status) {
        this.status = status;
    }

    public String getAdminComment() {
        return adminComment;
    }

    public void setAdminComment(String adminComment) {
        this.adminComment = adminComment;
    }

    public String getMeetingLink() {
        return meetingLink;
    }

    public void setMeetingLink(String meetingLink) {
        this.meetingLink = meetingLink;
    }
}
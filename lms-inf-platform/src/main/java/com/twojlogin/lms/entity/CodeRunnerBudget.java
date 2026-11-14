package com.twojlogin.lms.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.Column;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/** A durable, shared launch counter; restarting or scaling the app cannot reset it. */
@Entity
@Table(name = "code_runner_budget")
public class CodeRunnerBudget {
    @Id
    private String id;
    @Column(name = "period_month")
    private String month;
    private int launches;

    protected CodeRunnerBudget() { }

    public CodeRunnerBudget(String id) { this.id = id; }
    public String getMonth() { return month; }
    public int getLaunches() { return launches; }
    public void reset(String month) { this.month = month; this.launches = 0; }
    public void reserve() { this.launches++; }
}

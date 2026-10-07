package com.twojlogin.lms.entity;

public enum BlockType {

    /*
     * Wartości historyczne. Mogą nadal występować w produkcyjnej bazie,
     * dlatego nie wolno ich usuwać z enuma używanego przez Hibernate.
     */
    THEORY,

    CONTENT,

    TEXT,

    TIP,

    INFO,

    WARNING,

    SUMMARY,

    IMAGE,

    VIDEO,

    PDF,

    DOWNLOAD,

    EXAMPLE,

    TASK,

    QUIZ,

    QUOTE,

    DIVIDER;

    public BlockType normalized() {
        return this == THEORY || this == CONTENT ? TEXT : this;
    }
}

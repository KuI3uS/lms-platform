package com.twojlogin.lms.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.DatabaseMetaData;
import java.sql.ResultSet;
import java.sql.Statement;
import java.util.Locale;

@Component
public class LegacySchemaCompatibility implements ApplicationRunner {

    private static final Logger log =
            LoggerFactory.getLogger(LegacySchemaCompatibility.class);

    private final DataSource dataSource;

    public LegacySchemaCompatibility(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    @Override
    public void run(ApplicationArguments args) throws Exception {
        try (Connection connection = dataSource.getConnection()) {
            String databaseName = connection.getMetaData()
                    .getDatabaseProductName()
                    .toLowerCase(Locale.ROOT);

            if (!databaseName.contains("mysql")) {
                return;
            }

            try (Statement statement = connection.createStatement()) {
                String lessonBlockType = findColumnType(
                        connection,
                        "lesson_block",
                        "type"
                );
                if (isEnum(lessonBlockType)) {
                    statement.execute(
                            "ALTER TABLE lesson_block " +
                                    "MODIFY COLUMN type VARCHAR(32) NULL"
                    );
                    log.info("Converted legacy lesson_block.type ENUM to VARCHAR(32)");
                }

                if (lessonBlockType != null) {
                    int migratedRows = statement.executeUpdate(
                            "UPDATE lesson_block SET type = 'TEXT' " +
                                    "WHERE type IN ('THEORY', 'CONTENT')"
                    );
                    if (migratedRows > 0) {
                        log.info(
                                "Normalized {} historical lesson block types to TEXT",
                                migratedRows
                        );
                    }
                }

                String achievementType = findColumnType(
                        connection,
                        "user_achievements",
                        "type"
                );
                if (isEnum(achievementType)) {
                    statement.execute(
                            "ALTER TABLE user_achievements " +
                                    "MODIFY COLUMN type VARCHAR(64) NOT NULL"
                    );
                    log.info("Converted legacy user_achievements.type ENUM to VARCHAR(64)");
                }
            }
        }
    }

    private boolean isEnum(String columnType) {
        return columnType != null
                && columnType.toUpperCase(Locale.ROOT).contains("ENUM");
    }

    private String findColumnType(
            Connection connection,
            String table,
            String column
    ) throws Exception {
        DatabaseMetaData metadata = connection.getMetaData();

        try (ResultSet columns = metadata.getColumns(
                connection.getCatalog(),
                null,
                table,
                column
        )) {
            return columns.next() ? columns.getString("TYPE_NAME") : null;
        }
    }
}

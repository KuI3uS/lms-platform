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

            String columnType = findLessonBlockTypeColumn(connection);

            if (columnType == null) {
                return;
            }

            try (Statement statement = connection.createStatement()) {
                if (columnType.toUpperCase(Locale.ROOT).contains("ENUM")) {
                    statement.execute(
                            "ALTER TABLE lesson_block " +
                                    "MODIFY COLUMN type VARCHAR(32) NULL"
                    );
                    log.info("Converted legacy lesson_block.type ENUM to VARCHAR(32)");
                }

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
        }
    }

    private String findLessonBlockTypeColumn(Connection connection) throws Exception {
        DatabaseMetaData metadata = connection.getMetaData();

        try (ResultSet columns = metadata.getColumns(
                connection.getCatalog(),
                null,
                "lesson_block",
                "type"
        )) {
            return columns.next() ? columns.getString("TYPE_NAME") : null;
        }
    }
}

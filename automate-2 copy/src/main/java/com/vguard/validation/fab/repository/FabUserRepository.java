package com.vguard.validation.fab.repository;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Repository
@Slf4j
public class FabUserRepository {
    private final JdbcTemplate jdbc;

    public FabUserRepository(@Qualifier("userJdbcTemplate") JdbcTemplate userJdbcTemplate) {
        this.jdbc = userJdbcTemplate;
    }

    public List<Map<String, Object>> findAll() {
        try {
            String sql = "SELECT email_id1, first_name, last_name, status_id FROM users ORDER BY email_id1";
            log.info("Executing user query: {}", sql);
            List<Map<String, Object>> result = jdbc.queryForList(sql);
            log.info("Found {} users", result.size());
            return result;
        } catch (Exception e) {
            log.error("Error querying users, returning empty list", e);
            return new ArrayList<>();
        }
    }

    public int countByEmail(String email) {
        try {
            String sql = "SELECT COUNT(*) FROM users " +
                    "WHERE LOWER(TRIM(REPLACE(REPLACE(email_id1,'[',''),']',''))) = LOWER(TRIM(?))";
            Integer count = jdbc.queryForObject(sql, Integer.class, email);
            return count == null ? 0 : count;
        } catch (Exception e) {
            log.error("Error counting users by email: {}", email, e);
            return 0;
        }
    }
}

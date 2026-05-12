package com.vguard.validation.controller;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
@Slf4j
public class UserLookupController {
    private final JdbcTemplate jdbc;

    public UserLookupController(@Qualifier("userJdbcTemplate") JdbcTemplate userJdbcTemplate) {
        this.jdbc = userJdbcTemplate;
    }

    @GetMapping("/by-email")
    public ResponseEntity<Map<String, Object>> byEmail(@RequestParam("email") String email) {
        String safeEmail = email == null ? "" : email.trim();
        if (safeEmail.isEmpty()) {
            Map<String, Object> body = new HashMap<>();
            body.put("loginName", null);
            return ResponseEntity.ok(body);
        }
        List<String> rows = jdbc.query(
                """
                SELECT CAST(id AS CHAR)
                FROM users
                WHERE LOWER(TRIM(REPLACE(REPLACE(email_id1,'[',''),']',''))) = LOWER(TRIM(?))
                LIMIT 1
                """,
                (rs, i) -> rs.getString(1),
                safeEmail
        );
        String loginName = rows.isEmpty() ? null : rows.get(0);
        Map<String, Object> body = new HashMap<>();
        body.put("loginName", loginName);
        return ResponseEntity.ok(body);
    }

    @GetMapping("/full-name")
    public ResponseEntity<Map<String, Object>> fullName(@RequestParam("email") String email) {
        String safeEmail = email == null ? "" : email.trim();
        if (safeEmail.isEmpty()) {
            Map<String, Object> body = new HashMap<>();
            body.put("fullName", null);
            return ResponseEntity.ok(body);
        }
        List<String> rows = jdbc.query(
                """
                SELECT CONCAT(COALESCE(first_name,''), ' ', COALESCE(last_name,''))
                FROM users
                WHERE LOWER(TRIM(REPLACE(REPLACE(email_id1,'[',''),']',''))) = LOWER(TRIM(?))
                LIMIT 1
                """,
                (rs, i) -> rs.getString(1),
                safeEmail
        );
        String fullName = rows.isEmpty() ? null : (rows.get(0) == null ? null : rows.get(0).trim());
        Map<String, Object> body = new HashMap<>();
        body.put("fullName", fullName);
        return ResponseEntity.ok(body);
    }
}

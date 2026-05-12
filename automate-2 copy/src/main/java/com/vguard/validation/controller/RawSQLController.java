package com.vguard.validation.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/test")
@RequiredArgsConstructor
@Slf4j
public class RawSQLController {

    @Qualifier("userJdbcTemplate")
    private final JdbcTemplate jdbcTemplate;

    @PostMapping("/raw-insert")
    public String testRawInsert() {
        try {
            // Try using raw SQL execution
            String sql = "INSERT INTO app_vg_fap_task_assignee_map " +
                "(plant_code, department, initiator_login_name, reviewer1_list, reviewer2_list, " +
                "approver_list, management_approver_list, cbs_team, total_value_lower_limit, " +
                "total_value_upper_limit, status_id, created_by, created_date) " +
                "VALUES ('TEST021', 'TEST_DEPT', 'test_user', 'reviewer1@test.com', " +
                "'reviewer2@test.com', 'approver@test.com', NULL, 'cbs@test.com', " +
                "'0', 400000, 1, 2, NOW())";
            
            int result = jdbcTemplate.update(sql);
            return "Success: " + result + " rows affected";
        } catch (Exception e) {
            log.error("Raw SQL insert error", e);
            return "Error: " + e.getMessage();
        }
    }
}

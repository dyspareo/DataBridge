package com.vguard.validation.controller;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/test")
@Slf4j
public class TestController {

    @Qualifier("userJdbcTemplate")
    private final JdbcTemplate jdbcTemplate;

    public TestController(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @GetMapping("/hello")
    public String hello() {
        return "Hello, the application is running!";
    }

    @PostMapping("/simple-fap-insert")
    public String testSimpleFAPInsert() {
        try {
            String sql = "INSERT INTO app_vg_fap_task_assignee_map " +
                "(plant_code, department, initiator_login_name, reviewer1_list, " +
                "reviewer2_list, approver_list, management_approver_list, cbs_team, " +
                "total_value_lower_limit, total_value_upper_limit, status_id, " +
                "created_by, created_date) " +
                "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
            
            int result = jdbcTemplate.update(sql,
                "TEST019", "TEST_DEPT", "test_user", "reviewer1@test.com", 
                "reviewer2@test.com", "approver@test.com", null, "cbs@test.com",
                "0", 400000, 1, 2, java.time.LocalDateTime.now()
            );
            
            return "Success: " + result + " rows affected";
        } catch (Exception e) {
            return "Error: " + e.getMessage();
        }
    }
}

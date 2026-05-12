package com.vguard.validation.fap.service;

import com.vguard.validation.fap.dto.FapTaskAssigneeRequest;
import com.vguard.validation.fap.dto.FapTaskAssigneeResponse;
import com.vguard.validation.fap.dto.FapTaskAssigneeInsertResponse;
import com.vguard.validation.fap.dto.FapHierarchyInsertRequest;
import com.vguard.validation.fap.dto.FapHierarchyInsertResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class FapTaskAssigneeService {

    @Qualifier("userJdbcTemplate")
    private final JdbcTemplate jdbcTemplate;

    public List<FapTaskAssigneeResponse> getAllRecords() {
        try {
            // Use a simple SQL that works without truncation
            String sql = "SELECT id, plant_code, department, initiator_login_name, " +
                         "reviewer1_list, reviewer2_list, approver_list, management_approver_list, " +
                         "cbs_team, total_value_lower_limit, total_value_upper_limit, " +
                         "app_id, wkf_process_def_id, status_id, created_by, created_date, " +
                         "updated_by, updated_date FROM app_vg_fap_task_assignee_map " +
                         "ORDER BY id DESC LIMIT 100";

            return jdbcTemplate.query(sql, (rs, rowNum) -> mapRowToResponse(rs));
        } catch (Exception e) {
            log.error("Error fetching FAP task assignee records", e);
            return new ArrayList<>();
        }
    }

    public List<FapTaskAssigneeResponse> getRecordsByPlantAndDepartment(String plantCode, String department) {
        try {
            String sql = "SELECT id, plant_code, department, initiator_login_name, reviewer1_list, " +
                         "reviewer2_list, approver_list, management_approver_list, cbs_team, " +
                         "total_value_lower_limit, total_value_upper_limit, app_id, " +
                         "wkf_process_def_id, status_id, created_by, created_date, " +
                         "updated_by, updated_date FROM app_vg_fap_task_assignee_map " +
                         "WHERE plant_code = ? AND department = ? " +
                         "ORDER BY id DESC LIMIT 50";

            return jdbcTemplate.query(sql, (rs, rowNum) -> mapRowToResponse(rs), 
                                     plantCode, department);
        } catch (Exception e) {
            log.error("Error fetching FAP task assignee records for plant: {}, department: {}", plantCode, department, e);
            return new ArrayList<>();
        }
    }

    public FapTaskAssigneeInsertResponse insertRecord(FapTaskAssigneeRequest request) {
        try {
            String sql = "INSERT INTO app_vg_fap_task_assignee_map " +
                "(plant_code, department, initiator_login_name, reviewer1_list, " +
                "reviewer2_list, approver_list, management_approver_list, cbs_team, " +
                "total_value_lower_limit, total_value_upper_limit, status_id, " +
                "created_by, created_date) " +
                "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

            LocalDateTime now = LocalDateTime.now();
            
            int result = jdbcTemplate.update(sql,
                request.getPlant_code(),
                request.getDepartment(),
                request.getInitiator_login_name(),
                request.getReviewer1_list(),
                request.getReviewer2_list(),
                request.getApprover_list(),
                request.getManagement_approver_list(),
                request.getCbs_team(),
                request.getTotal_value_lower_limit(),
                request.getTotal_value_upper_limit(),
                request.getStatus_id(),
                2, // created_by
                now
            );

            if (result > 0) {
                // Get the inserted ID
                Integer insertedId = jdbcTemplate.queryForObject("SELECT LAST_INSERT_ID()", Integer.class);
                log.info("Successfully inserted FAP task assignee record with ID: {}", insertedId);
                return FapTaskAssigneeInsertResponse.builder()
                    .success(true)
                    .message("Record inserted successfully")
                    .insertedId(insertedId)
                    .build();
            } else {
                return FapTaskAssigneeInsertResponse.builder()
                    .success(false)
                    .message("No rows were inserted")
                    .build();
            }
        } catch (Exception e) {
            log.error("Error inserting FAP task assignee record", e);
            return FapTaskAssigneeInsertResponse.builder()
                .success(false)
                .message("Error: " + e.getMessage())
                .build();
        }
    }

    public FapTaskAssigneeInsertResponse insertRecordWithSubqueries(FapHierarchyInsertRequest request, int tier) {
        try {
            LocalDateTime now = LocalDateTime.now();
            String sql;
            
            switch (tier) {
                case 1: // Row 1: 0 to 400,000
                    sql = "INSERT INTO app_vg_fap_task_assignee_map (" +
                        "plant_code, department, initiator_login_name, reviewer1_list, " +
                        "reviewer2_list, approver_list, management_approver_list, cbs_team, " +
                        "total_value_lower_limit, total_value_upper_limit, status_id, " +
                        "created_by, created_date" +
                        ") VALUES (?, ?, ?, " +
                        "(SELECT id FROM vguarddev_smartdocso_20201109134921303_1000000001911.users WHERE email_id1 = ? LIMIT 1), " +
                        "(SELECT id FROM vguarddev_smartdocso_20201109134921303_1000000001911.users WHERE email_id1 = ? LIMIT 1), " +
                        "(SELECT id FROM vguarddev_smartdocso_20201109134921303_1000000001911.users WHERE email_id1 = ? LIMIT 1), " +
                        "NULL, " +
                        "CONCAT_WS(',', " +
                        "(SELECT id FROM vguarddev_smartdocso_20201109134921303_1000000001911.users WHERE email_id1 = ? LIMIT 1), " +
                        "(SELECT id FROM vguarddev_smartdocso_20201109134921303_1000000001911.users WHERE email_id1 = ? LIMIT 1), " +
                        "(SELECT id FROM vguarddev_smartdocso_20201109134921303_1000000001911.users WHERE email_id1 = ? LIMIT 1)" +
                        "), " +
                        "'0', 400000, ?, 2, ?)";
                    break;
                    
                case 2: // Row 2: 400,000 to 10,000,000
                    sql = "INSERT INTO app_vg_fap_task_assignee_map (" +
                        "plant_code, department, initiator_login_name, reviewer1_list, " +
                        "reviewer2_list, approver_list, management_approver_list, cbs_team, " +
                        "total_value_lower_limit, total_value_upper_limit, status_id, " +
                        "created_by, created_date" +
                        ") VALUES (?, ?, ?, " +
                        "(SELECT id FROM vguarddev_smartdocso_20201109134921303_1000000001911.users WHERE email_id1 = ? LIMIT 1), " +
                        "(SELECT id FROM vguarddev_smartdocso_20201109134921303_1000000001911.users WHERE email_id1 = ? LIMIT 1), " +
                        "(SELECT id FROM vguarddev_smartdocso_20201109134921303_1000000001911.users WHERE email_id1 = ? LIMIT 1), " +
                        "NULL, " +
                        "CONCAT_WS(',', " +
                        "(SELECT id FROM vguarddev_smartdocso_20201109134921303_1000000001911.users WHERE email_id1 = ? LIMIT 1), " +
                        "(SELECT id FROM vguarddev_smartdocso_20201109134921303_1000000001911.users WHERE email_id1 = ? LIMIT 1), " +
                        "(SELECT id FROM vguarddev_smartdocso_20201109134921303_1000000001911.users WHERE email_id1 = ? LIMIT 1)" +
                        "), " +
                        "'400000', 10000000, ?, 2, ?)";
                    break;
                    
                case 3: // Row 3: 10,000,000 to NULL (with management approver)
                    sql = "INSERT INTO app_vg_fap_task_assignee_map (" +
                        "plant_code, department, initiator_login_name, reviewer1_list, " +
                        "reviewer2_list, approver_list, management_approver_list, cbs_team, " +
                        "total_value_lower_limit, total_value_upper_limit, status_id, " +
                        "created_by, created_date" +
                        ") VALUES (?, ?, ?, " +
                        "(SELECT id FROM vguarddev_smartdocso_20201109134921303_1000000001911.users WHERE email_id1 = ? LIMIT 1), " +
                        "(SELECT id FROM vguarddev_smartdocso_20201109134921303_1000000001911.users WHERE email_id1 = ? LIMIT 1), " +
                        "(SELECT id FROM vguarddev_smartdocso_20201109134921303_1000000001911.users WHERE email_id1 = ? LIMIT 1), " +
                        "(SELECT id FROM vguarddev_smartdocso_20201109134921303_1000000001911.users WHERE email_id1 = ? LIMIT 1), " +
                        "CONCAT_WS(',', " +
                        "(SELECT id FROM vguarddev_smartdocso_20201109134921303_1000000001911.users WHERE email_id1 = ? LIMIT 1), " +
                        "(SELECT id FROM vguarddev_smartdocso_20201109134921303_1000000001911.users WHERE email_id1 = ? LIMIT 1), " +
                        "(SELECT id FROM vguarddev_smartdocso_20201109134921303_1000000001911.users WHERE email_id1 = ? LIMIT 1)" +
                        "), " +
                        "'10000000', NULL, ?, 2, ?)";
                    break;
                    
                default:
                    throw new IllegalArgumentException("Invalid tier: " + tier);
            }
            
            int result;
            if (tier == 3) {
                result = jdbcTemplate.update(sql,
                    request.getPlant_code(),
                    request.getDepartment(),
                    request.getInitiator_login_name(),
                    request.getReviewer1_list(),
                    request.getReviewer2_list(),
                    request.getApprover_list(),
                    request.getManagement_approver_list(), // Management approver only for tier 3
                    request.getCbs_member1_email(),
                    request.getCbs_member2_email(),
                    request.getCbs_member3_email(),
                    request.getStatus_id(),
                    now
                );
            } else {
                result = jdbcTemplate.update(sql,
                    request.getPlant_code(),
                    request.getDepartment(),
                    request.getInitiator_login_name(),
                    request.getReviewer1_list(),
                    request.getReviewer2_list(),
                    request.getApprover_list(),
                    request.getCbs_member1_email(),
                    request.getCbs_member2_email(),
                    request.getCbs_member3_email(),
                    request.getStatus_id(),
                    now
                );
            }

            if (result > 0) {
                Integer insertedId = jdbcTemplate.queryForObject("SELECT LAST_INSERT_ID()", Integer.class);
                log.info("Successfully inserted FAP task assignee record (tier {}) with ID: {}", tier, insertedId);
                return FapTaskAssigneeInsertResponse.builder()
                    .success(true)
                    .message("Record inserted successfully")
                    .insertedId(insertedId)
                    .build();
            } else {
                return FapTaskAssigneeInsertResponse.builder()
                    .success(false)
                    .message("No rows were inserted")
                    .build();
            }
        } catch (Exception e) {
            log.error("Error inserting FAP task assignee record (tier {})", tier, e);
            return FapTaskAssigneeInsertResponse.builder()
                .success(false)
                .message("Error: " + e.getMessage())
                .build();
        }
    }

    private FapTaskAssigneeResponse mapRowToResponse(java.sql.ResultSet rs) throws java.sql.SQLException {
        return FapTaskAssigneeResponse.builder()
            .id(rs.getInt("id"))
            .plant_code(rs.getString("plant_code"))
            .department(rs.getString("department"))
            .initiator_login_name(rs.getString("initiator_login_name"))
            .reviewer1_list(rs.getString("reviewer1_list"))
            .reviewer2_list(rs.getString("reviewer2_list"))
            .approver_list(rs.getString("approver_list"))
            .management_approver_list(rs.getString("management_approver_list"))
            .cbs_team(rs.getString("cbs_team"))
            .total_value_lower_limit(rs.getString("total_value_lower_limit"))
            .total_value_upper_limit(rs.getObject("total_value_upper_limit", Double.class))
            .app_id(rs.getObject("app_id", Integer.class))
            .wkf_process_def_id(rs.getObject("wkf_process_def_id", Integer.class))
            .status_id(rs.getObject("status_id", Integer.class))
            .created_by(rs.getObject("created_by", Integer.class))
            .created_date(rs.getTimestamp("created_date") != null ? 
                rs.getTimestamp("created_date").toLocalDateTime() : null)
            .updated_by(rs.getObject("updated_by", Integer.class))
            .updated_date(rs.getTimestamp("updated_date") != null ? 
                rs.getTimestamp("updated_date").toLocalDateTime() : null)
            .build();
    }

    public FapHierarchyInsertResponse insertHierarchy(FapHierarchyInsertRequest request) {
        List<Integer> insertedIds = new ArrayList<>();
        
        try {
            // Insert all 3 rows in parallel using subqueries
            java.util.concurrent.CompletableFuture<FapTaskAssigneeInsertResponse> tier1 = 
                java.util.concurrent.CompletableFuture.supplyAsync(() -> insertRecordWithSubqueries(request, 1));
            
            java.util.concurrent.CompletableFuture<FapTaskAssigneeInsertResponse> tier2 = 
                java.util.concurrent.CompletableFuture.supplyAsync(() -> insertRecordWithSubqueries(request, 2));
            
            java.util.concurrent.CompletableFuture<FapTaskAssigneeInsertResponse> tier3 = 
                java.util.concurrent.CompletableFuture.supplyAsync(() -> insertRecordWithSubqueries(request, 3));
            
            // Wait for all to complete
            java.util.concurrent.CompletableFuture<Void> allFutures = 
                java.util.concurrent.CompletableFuture.allOf(tier1, tier2, tier3);
            
            allFutures.join();
            
            // Collect results
            FapTaskAssigneeInsertResponse result1 = tier1.join();
            FapTaskAssigneeInsertResponse result2 = tier2.join();
            FapTaskAssigneeInsertResponse result3 = tier3.join();
            
            // Check if all succeeded
            if (result1.isSuccess() && result2.isSuccess() && result3.isSuccess()) {
                if (result1.getInsertedId() != null) insertedIds.add(result1.getInsertedId());
                if (result2.getInsertedId() != null) insertedIds.add(result2.getInsertedId());
                if (result3.getInsertedId() != null) insertedIds.add(result3.getInsertedId());
                
                log.info("Successfully inserted FAP hierarchy with {} rows", insertedIds.size());
                return FapHierarchyInsertResponse.builder()
                    .success(true)
                    .message("Hierarchy inserted successfully")
                    .insertedIds(insertedIds)
                    .totalInserted(insertedIds.size())
                    .build();
            } else {
                // Collect partial successes
                if (result1.isSuccess() && result1.getInsertedId() != null) insertedIds.add(result1.getInsertedId());
                if (result2.isSuccess() && result2.getInsertedId() != null) insertedIds.add(result2.getInsertedId());
                if (result3.isSuccess() && result3.getInsertedId() != null) insertedIds.add(result3.getInsertedId());
                
                List<String> errors = new ArrayList<>();
                if (!result1.isSuccess()) errors.add("Tier 1: " + result1.getMessage());
                if (!result2.isSuccess()) errors.add("Tier 2: " + result2.getMessage());
                if (!result3.isSuccess()) errors.add("Tier 3: " + result3.getMessage());
                
                return FapHierarchyInsertResponse.builder()
                    .success(false)
                    .message("Partial failure: " + String.join("; ", errors))
                    .insertedIds(insertedIds)
                    .totalInserted(insertedIds.size())
                    .build();
            }
                
        } catch (Exception e) {
            log.error("Error inserting FAP hierarchy", e);
            return FapHierarchyInsertResponse.builder()
                .success(false)
                .message("Error: " + e.getMessage())
                .insertedIds(insertedIds)
                .totalInserted(insertedIds.size())
                .build();
        }
    }
}

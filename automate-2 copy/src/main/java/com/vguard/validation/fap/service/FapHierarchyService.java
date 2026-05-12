package com.vguard.validation.fap.service;

import com.vguard.validation.fap.dto.FapHierarchyInsertRequest;
import com.vguard.validation.fap.dto.FapHierarchyInsertResponse;
import com.vguard.validation.fap.dto.FapTaskAssigneeInsertResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class FapHierarchyService {

    @Qualifier("userJdbcTemplate")
    private final JdbcTemplate jdbcTemplate;

    public FapHierarchyInsertResponse insertHierarchy(FapHierarchyInsertRequest request) {
        List<Integer> insertedIds = new ArrayList<>();
        
        try {
            // Step 1: Resolve all user IDs first
            Map<String, Integer> userIds = resolveUserIds(request);
            
            // Step 2: Insert all 3 rows in parallel using resolved IDs
            java.util.concurrent.CompletableFuture<FapTaskAssigneeInsertResponse> tier1 = 
                java.util.concurrent.CompletableFuture.supplyAsync(() -> insertTier1(request, userIds));
            
            java.util.concurrent.CompletableFuture<FapTaskAssigneeInsertResponse> tier2 = 
                java.util.concurrent.CompletableFuture.supplyAsync(() -> insertTier2(request, userIds));
            
            java.util.concurrent.CompletableFuture<FapTaskAssigneeInsertResponse> tier3 = 
                java.util.concurrent.CompletableFuture.supplyAsync(() -> insertTier3(request, userIds));
            
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

    private Map<String, Integer> resolveUserIds(FapHierarchyInsertRequest request) {
        Map<String, Integer> userIds = new HashMap<>();
        
        try {
            // Resolve all user emails to IDs
            String sql = "SELECT id FROM vguarddev_smartdocso_20201109134921303_1000000001911.users WHERE email_id1 = ? LIMIT 1";
            
            userIds.put("reviewer1", jdbcTemplate.queryForObject(sql, Integer.class, request.getReviewer1_list()));
            userIds.put("reviewer2", jdbcTemplate.queryForObject(sql, Integer.class, request.getReviewer2_list()));
            userIds.put("approver", jdbcTemplate.queryForObject(sql, Integer.class, request.getApprover_list()));
            userIds.put("cbs1", jdbcTemplate.queryForObject(sql, Integer.class, request.getCbs_member1_email()));
            userIds.put("cbs2", jdbcTemplate.queryForObject(sql, Integer.class, request.getCbs_member2_email()));
            userIds.put("cbs3", jdbcTemplate.queryForObject(sql, Integer.class, request.getCbs_member3_email()));
            
            if (request.getManagement_approver_list() != null) {
                userIds.put("management", jdbcTemplate.queryForObject(sql, Integer.class, request.getManagement_approver_list()));
            }
            
            log.info("Resolved user IDs: {}", userIds);
            
        } catch (Exception e) {
            log.error("Error resolving user IDs", e);
            throw new RuntimeException("Failed to resolve user IDs: " + e.getMessage(), e);
        }
        
        return userIds;
    }

    private FapTaskAssigneeInsertResponse insertTier1(FapHierarchyInsertRequest request, Map<String, Integer> userIds) {
        try {
            String sql = "INSERT INTO app_vg_fap_task_assignee_map " +
                "(plant_code, department, initiator_login_name, reviewer1_list, reviewer2_list, approver_list, " +
                "management_approver_list, cbs_team, total_value_lower_limit, total_value_upper_limit, status_id, " +
                "created_by, created_date) " +
                "VALUES (?, ?, ?, ?, ?, ?, NULL, ?, '0', 400000, ?, 2, ?)";
            
            String cbsTeam = userIds.get("cbs1") + "," + userIds.get("cbs2") + "," + userIds.get("cbs3");
            
            int result = jdbcTemplate.update(sql,
                request.getPlant_code(),
                request.getDepartment(),
                request.getInitiator_login_name(),
                userIds.get("reviewer1"),
                userIds.get("reviewer2"),
                userIds.get("approver"),
                cbsTeam,
                request.getStatus_id(),
                LocalDateTime.now()
            );

            if (result > 0) {
                Integer insertedId = jdbcTemplate.queryForObject("SELECT LAST_INSERT_ID()", Integer.class);
                return FapTaskAssigneeInsertResponse.builder()
                    .success(true)
                    .message("Tier 1 inserted successfully")
                    .insertedId(insertedId)
                    .build();
            } else {
                return FapTaskAssigneeInsertResponse.builder()
                    .success(false)
                    .message("No rows were inserted for Tier 1")
                    .build();
            }
        } catch (Exception e) {
            return FapTaskAssigneeInsertResponse.builder()
                .success(false)
                .message("Tier 1 error: " + e.getMessage())
                .build();
        }
    }

    private FapTaskAssigneeInsertResponse insertTier2(FapHierarchyInsertRequest request, Map<String, Integer> userIds) {
        try {
            String sql = "INSERT INTO app_vg_fap_task_assignee_map " +
                "(plant_code, department, initiator_login_name, reviewer1_list, reviewer2_list, approver_list, " +
                "management_approver_list, cbs_team, total_value_lower_limit, total_value_upper_limit, status_id, " +
                "created_by, created_date) " +
                "VALUES (?, ?, ?, ?, ?, ?, NULL, ?, '400000', 10000000, ?, 2, ?)";
            
            String cbsTeam = userIds.get("cbs1") + "," + userIds.get("cbs2") + "," + userIds.get("cbs3");
            
            int result = jdbcTemplate.update(sql,
                request.getPlant_code(),
                request.getDepartment(),
                request.getInitiator_login_name(),
                userIds.get("reviewer1"),
                userIds.get("reviewer2"),
                userIds.get("approver"),
                cbsTeam,
                request.getStatus_id(),
                LocalDateTime.now()
            );

            if (result > 0) {
                Integer insertedId = jdbcTemplate.queryForObject("SELECT LAST_INSERT_ID()", Integer.class);
                return FapTaskAssigneeInsertResponse.builder()
                    .success(true)
                    .message("Tier 2 inserted successfully")
                    .insertedId(insertedId)
                    .build();
            } else {
                return FapTaskAssigneeInsertResponse.builder()
                    .success(false)
                    .message("No rows were inserted for Tier 2")
                    .build();
            }
        } catch (Exception e) {
            return FapTaskAssigneeInsertResponse.builder()
                .success(false)
                .message("Tier 2 error: " + e.getMessage())
                .build();
        }
    }

    private FapTaskAssigneeInsertResponse insertTier3(FapHierarchyInsertRequest request, Map<String, Integer> userIds) {
        try {
            String sql = "INSERT INTO app_vg_fap_task_assignee_map " +
                "(plant_code, department, initiator_login_name, reviewer1_list, reviewer2_list, approver_list, " +
                "management_approver_list, cbs_team, total_value_lower_limit, total_value_upper_limit, status_id, " +
                "created_by, created_date) " +
                "VALUES (?, ?, ?, ?, ?, ?, ?, ?, '10000000', NULL, ?, 2, ?)";
            
            String cbsTeam = userIds.get("cbs1") + "," + userIds.get("cbs2") + "," + userIds.get("cbs3");
            Integer managementId = userIds.get("management");
            
            int result = jdbcTemplate.update(sql,
                request.getPlant_code(),
                request.getDepartment(),
                request.getInitiator_login_name(),
                userIds.get("reviewer1"),
                userIds.get("reviewer2"),
                userIds.get("approver"),
                managementId,
                cbsTeam,
                request.getStatus_id(),
                LocalDateTime.now()
            );

            if (result > 0) {
                Integer insertedId = jdbcTemplate.queryForObject("SELECT LAST_INSERT_ID()", Integer.class);
                return FapTaskAssigneeInsertResponse.builder()
                    .success(true)
                    .message("Tier 3 inserted successfully")
                    .insertedId(insertedId)
                    .build();
            } else {
                return FapTaskAssigneeInsertResponse.builder()
                    .success(false)
                    .message("No rows were inserted for Tier 3")
                    .build();
            }
        } catch (Exception e) {
            return FapTaskAssigneeInsertResponse.builder()
                .success(false)
                .message("Tier 3 error: " + e.getMessage())
                .build();
        }
    }
}

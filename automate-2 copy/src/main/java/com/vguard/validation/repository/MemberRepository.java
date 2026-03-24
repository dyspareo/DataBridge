package com.vguard.validation.repository;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.sql.PreparedStatement;
import java.sql.Statement;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Repository
public class MemberRepository {
    private static final Logger log = LoggerFactory.getLogger(MemberRepository.class);
    private final JdbcTemplate jdbc;

    private String normalizeRoleKey(String role) {
        if (role == null) return "";
        return role.trim().toLowerCase().replaceAll("[^a-z0-9]", "");
    }

    public MemberRepository(@Qualifier("userJdbcTemplate") JdbcTemplate userJdbcTemplate) {
        this.jdbc = userJdbcTemplate;
    }

    public long insertMember(int ormInstanceId, long userId, int userType) {
        String sql = "INSERT INTO vguarddev_smartdocso_20201109134921303_1000000001911.orm_member (orm_master_id, orm_instance_id, user_id, user_type, status_id, created_by, created_date) VALUES (4, ?, ?, ?, 1, 2, NOW())";
        KeyHolder kh = new GeneratedKeyHolder();
        jdbc.update(con -> {
            PreparedStatement ps = con.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS);
            ps.setInt(1, ormInstanceId);
            ps.setLong(2, userId);
            ps.setInt(3, userType);
            return ps;
        }, kh);
        Number key = kh.getKey();
        return key == null ? 0L : key.longValue();
    }

    public List<Map<String, Object>> fetchRoles(String appName, String processName) {
        if (appName == null || appName.trim().isEmpty()) {
            // Default behavior if no appName provided
            String sql = "SELECT id, `key` FROM vguarddev_smartdocso_20201109134921303_1000000001911.role ORDER BY `key`";
            return jdbc.queryForList(sql);
        } else if (processName == null || processName.trim().isEmpty()) {
            // Filtered roles based on app_name only
            String sql = "SELECT r.id, r.`key` " +
                        "FROM vguarddev_smartdocso_20201109134921303_1000000001911.role r " +
                        "WHERE r.name IN (" +
                        "    SELECT DISTINCT role_name " +
                        "    FROM sd_apps_db.app_process_role_map " +
                        "    WHERE app_name = ?" +
                        ") ORDER BY r.`key`";
            return jdbc.queryForList(sql, appName);
        } else {
            // Filtered roles based on both app_name and process_name
            String sql = "SELECT r.id, r.`key` " +
                        "FROM vguarddev_smartdocso_20201109134921303_1000000001911.role r " +
                        "WHERE r.name IN (" +
                        "    SELECT DISTINCT role_name " +
                        "    FROM sd_apps_db.app_process_role_map " +
                        "    WHERE app_name = ? AND process_name = ?" +
                        ") ORDER BY r.`key`";
            return jdbc.queryForList(sql, appName, processName);
        }
    }

    public List<Map<String, Object>> fetchProcesses() {
        String sql = "SELECT DISTINCT process_name FROM sd_apps_db.app_process_role_map ORDER BY process_name";
        return jdbc.queryForList(sql);
    }

    public List<Map<String, Object>> fetchInstances() {
        String sql = "SELECT id, name FROM vguarddev_smartdocso_20201109134921303_1000000001911.orm_instance ORDER BY name";
        return jdbc.queryForList(sql);
    }

    public List<Map<String, Object>> fetchProcessesByAppName(String appName) {
        String sql = "SELECT DISTINCT process_name FROM sd_apps_db.app_process_role_map WHERE app_name = ? ORDER BY process_name";
        return jdbc.queryForList(sql, appName);
    }

    public Map<String, Object> checkUserRoleAssignment(String email, String expectedRole) {
        Map<String, Object> result = new HashMap<>();
        
        try {
            // First, get user ID from email
            String getUserSql = "SELECT id FROM vguarddev_smartdocso_20201109134921303_1000000001911.users WHERE email_id1 = ?";
            Long userId;
            try {
                userId = jdbc.queryForObject(getUserSql, Long.class, email);
            } catch (Exception e) {
                result.put("success", false);
                result.put("message", "User not found");
                return result;
            }
            
            // Get all assigned roles for the user in FA instance using the specified SQL logic
            String getUserRolesSql = "SELECT r.`key` AS role_key, r.name AS role_name " +
                                   "FROM role r " +
                                   "WHERE r.id IN (" +
                                   "    SELECT user_type " +
                                   "    FROM orm_member " +
                                   "    WHERE user_id = ? " +
                                   "    AND orm_instance_id IN (" +
                                   "        SELECT id " +
                                   "        FROM orm_instance " +
                                   "        WHERE name IN ('FA','FAB')" +
                                   "    )" +
                                   ")";
            
            List<Map<String, Object>> assignedRoleRows = jdbc.queryForList(getUserRolesSql, userId);
            
            String normalizedExpected = expectedRole == null ? "" : expectedRole.trim();
            String normalizedExpectedKey = normalizeRoleKey(normalizedExpected);
            boolean assigned = false;
            List<String> assignedRoles = new java.util.ArrayList<>();
            if (!normalizedExpectedKey.isEmpty()) {
                for (Map<String, Object> row : assignedRoleRows) {
                    String roleKeyRaw = row.get("role_key") == null ? "" : String.valueOf(row.get("role_key"));
                    String roleNameRaw = row.get("role_name") == null ? "" : String.valueOf(row.get("role_name"));
                    if (!roleKeyRaw.isBlank()) assignedRoles.add(roleKeyRaw);
                    String normalizedRoleKey = normalizeRoleKey(roleKeyRaw);
                    String normalizedRoleName = normalizeRoleKey(roleNameRaw);
                    if (normalizedRoleKey.equals(normalizedExpectedKey) || normalizedRoleName.equals(normalizedExpectedKey)) {
                        assigned = true;
                    }
                }
            } else {
                for (Map<String, Object> row : assignedRoleRows) {
                    String roleKeyRaw = row.get("role_key") == null ? "" : String.valueOf(row.get("role_key"));
                    if (!roleKeyRaw.isBlank()) assignedRoles.add(roleKeyRaw);
                }
            }

            log.debug("Role check -> ExpectedRaw: '{}' | ExpectedKey: '{}' | AssignedRoles: {} | Match: {}",
                    normalizedExpected, normalizedExpectedKey, assignedRoles, assigned);

            if (assigned) {
                result.put("success", true);
                result.put("message", "Role is assigned");
                result.put("userFound", true);
                result.put("roleAssigned", true);
                result.put("assignedRoles", assignedRoles);
            } else {
                result.put("success", true);
                result.put("message", "Role not assigned");
                result.put("userFound", true);
                result.put("roleAssigned", false);
                result.put("assignedRoles", assignedRoles);
            }
            
        } catch (Exception e) {
            result.put("success", false);
            result.put("message", "Error checking role assignment: " + e.getMessage());
        }
        
        return result;
    }
}

package com.vguard.validation.fac.service;

import com.vguard.validation.fac.dto.FacHierarchyInsertRequest;
import com.vguard.validation.fac.dto.FacHierarchyInsertResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.stereotype.Service;

import java.sql.Statement;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class FacHierarchyService {

    @Qualifier("userJdbcTemplate")
    private final JdbcTemplate jdbcTemplate;

    public FacHierarchyInsertResponse insertHierarchy(FacHierarchyInsertRequest request) {
        try {
            validateRequest(request);

            String lcmUser = resolveUserValue(request.getLcm_user(), "LM user");
            String cbsUser1 = resolveUserValue(request.getCbs_user1(), "CBS user 1");
            String cbsUser2 = resolveUserValue(request.getCbs_user2(), "CBS user 2");
            int statusId = request.getStatus_id() == null ? 1 : request.getStatus_id();

            String plantCode = clean(request.getPlant_code());
            String deptCode = cleanDeptCode(request.getDept_code());

            String plantName = clean(request.getPlant_name());
            String deptName = clean(request.getDept_name());
            if (plantName.isEmpty() || deptName.isEmpty()) {
                Map<String, Object> resolved = resolvePlantAndDeptNames(plantCode, request.getDept_code());
                if (plantName.isEmpty()) {
                    Object pn = resolved.get("plantName");
                    plantName = pn == null ? "" : String.valueOf(pn);
                }
                if (deptName.isEmpty()) {
                    Object dn = resolved.get("deptName");
                    deptName = dn == null ? "" : String.valueOf(dn);
                }
            }

            final String plantNameFinal = plantName;
            final String deptNameFinal = deptName;

            String sql = "INSERT INTO sd_apps_db.app_fa_cap_user_map " +
                    "(plant_code, plant_name, dept_code, dept_name, lcm_user, cbs_user1, cbs_user2, status_id) " +
                    "VALUES (?, ?, ?, ?, ?, ?, ?, ?)";

            GeneratedKeyHolder keyHolder = new GeneratedKeyHolder();
            int updated = jdbcTemplate.update(connection -> {
                var ps = connection.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS);
                int i = 1;
                ps.setString(i++, plantCode);
                ps.setString(i++, plantNameFinal);
                ps.setString(i++, deptCode);
                ps.setString(i++, deptNameFinal);
                ps.setString(i++, lcmUser);
                ps.setString(i++, cbsUser1);
                ps.setString(i++, cbsUser2);
                ps.setInt(i, statusId);
                return ps;
            }, keyHolder);

            if (updated <= 0) {
                return FacHierarchyInsertResponse.builder()
                        .success(false)
                        .message("No rows inserted")
                        .build();
            }

            Number key = keyHolder.getKey();
            return FacHierarchyInsertResponse.builder()
                    .success(true)
                    .message("FAC hierarchy inserted successfully")
                    .insertedId(key == null ? null : key.longValue())
                    .build();
        } catch (Exception e) {
            log.error("Error inserting FAC hierarchy", e);
            return FacHierarchyInsertResponse.builder()
                    .success(false)
                    .message("Error: " + e.getMessage())
                    .build();
        }
    }

    public List<Map<String, Object>> checkHierarchyActive(String plantCode, String deptCode, String lcmUserOrEmail) {
        String plant = clean(plantCode);
        String dept = cleanDeptCode(deptCode);

        String sqlBase = "SELECT * FROM sd_apps_db.app_fa_cap_user_map " +
                "WHERE plant_code = ? AND dept_code = ? AND status_id = 1";

        String cleanedLcm = clean(lcmUserOrEmail);
        if (!cleanedLcm.isEmpty()) {
            String lcmUser = resolveUserValue(cleanedLcm, "LM user");
            String sql = sqlBase + " AND lcm_user = ? ORDER BY id DESC";
            return jdbcTemplate.queryForList(sql, plant, dept, lcmUser);
        }

        String sql = sqlBase + " ORDER BY id DESC";
        return jdbcTemplate.queryForList(sql, plant, dept);
    }

    public Map<String, Object> resolvePlantAndDeptNames(String plantCode, String deptCode) {
        Map<String, Object> out = new HashMap<>();
        String plant = clean(plantCode);
        String deptRaw = clean(deptCode);

        String plantName = "";
        String deptName = "";

        if (!plant.isEmpty()) {
            try {
                plantName = jdbcTemplate.queryForObject(
                        "SELECT plant_name FROM sd_apps_db.app_vg_plant_master WHERE plant_code = ? LIMIT 1",
                        String.class,
                        plant
                );
            } catch (Exception ignored) {
                plantName = "";
            }
        }

        if (!deptRaw.isEmpty()) {
            String[] deptCandidates = new String[]{deptRaw, deptRaw.replaceFirst("^[dD]", "")};
            for (String candidate : deptCandidates) {
                if (candidate == null || candidate.isBlank()) continue;
                try {
                    deptName = jdbcTemplate.queryForObject(
                            "SELECT Dept_Name " +
                                    "FROM sd_apps_db.app_vg_department_master " +
                                    "WHERE UPPER(TRIM(Dept_Short_Name)) = UPPER(TRIM(?)) " +
                                    "  AND Status_id = 1 " +
                                    "ORDER BY updated_date DESC " +
                                    "LIMIT 1",
                            String.class,
                            candidate
                    );
                    if (deptName != null && !deptName.isBlank()) break;
                } catch (Exception ignored) {
                    // try next candidate
                }
            }
            if (deptName == null) deptName = "";
        }

        out.put("plantName", plantName == null ? "" : plantName);
        out.put("deptName", deptName == null ? "" : deptName);
        return out;
    }

    private void validateRequest(FacHierarchyInsertRequest request) {
        if (request == null) throw new IllegalArgumentException("Request body is required");
        require(request.getPlant_code(), "Plant code");
        require(request.getDept_code(), "Department code");
        require(request.getLcm_user(), "LM user");
        require(request.getCbs_user1(), "CBS user 1");
        require(request.getCbs_user2(), "CBS user 2");
    }

    private void require(String value, String label) {
        if (clean(value).isEmpty()) {
            throw new IllegalArgumentException(label + " is required");
        }
    }

    private String resolveUserValue(String value, String label) {
        String cleaned = clean(value);
        if (cleaned.matches("\\d+")) return cleaned;

        try {
            Long userId = jdbcTemplate.queryForObject(
                    "SELECT id FROM users " +
                            "WHERE LOWER(TRIM(REPLACE(REPLACE(email_id1,'[',''),']',''))) = LOWER(TRIM(?)) " +
                            "LIMIT 1",
                    Long.class,
                    cleaned
            );
            if (userId != null) return String.valueOf(userId);
        } catch (EmptyResultDataAccessException ignored) {
            // handled below with a clear validation message
        }
        throw new IllegalArgumentException(label + " not found in users table: " + cleaned);
    }

    private String clean(String value) {
        if (value == null) return "";
        String cleaned = value.trim();
        return "nan".equalsIgnoreCase(cleaned) ? "" : cleaned;
    }

    private String cleanDeptCode(String deptCode) {
        String cleaned = clean(deptCode);
        if (!cleaned.isEmpty() && (cleaned.charAt(0) == 'D' || cleaned.charAt(0) == 'd')) {
            return cleaned.substring(1);
        }
        return cleaned;
    }
}

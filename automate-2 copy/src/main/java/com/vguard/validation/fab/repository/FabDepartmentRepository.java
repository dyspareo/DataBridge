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
public class FabDepartmentRepository {
    private final JdbcTemplate jdbc;

    public FabDepartmentRepository(@Qualifier("userJdbcTemplate") JdbcTemplate userJdbcTemplate) {
        this.jdbc = userJdbcTemplate;
    }

    public List<Map<String, Object>> findAll() {
        try {
            String sql = "SELECT wbs_department_code, department_name, status_id FROM sd_apps_db.app_vg_wbs_department_master ORDER BY wbs_department_code";
            log.info("Executing department query: {}", sql);
            List<Map<String, Object>> result = jdbc.queryForList(sql);
            log.info("Found {} departments", result.size());
            return result;
        } catch (Exception e) {
            log.error("Error querying departments, returning empty list", e);
            return new ArrayList<>();
        }
    }

    public List<Map<String, Object>> findAllFromDepartmentMaster() {
        try {
            String sql = """
                    SELECT CAST(Dept_Code AS CHAR) AS wbs_department_code, Dept_Name AS department_name, Status_id AS status_id
                    FROM sd_apps_db.app_vg_department_master
                    ORDER BY Dept_Code
                    """;
            List<Map<String, Object>> result = jdbc.queryForList(sql);
            log.info("Found {} departments from app_vg_department_master", result.size());
            return result;
        } catch (Exception e) {
            log.error("Error querying app_vg_department_master, returning empty list", e);
            return new ArrayList<>();
        }
    }

    public List<Map<String, Object>> findByPlantCode(String plantCode) {
        try {
            String sql = """
                    SELECT CAST(Dept_Code AS CHAR) AS wbs_department_code, Dept_Name AS department_name, Status_id AS status_id
                    FROM sd_apps_db.app_vg_department_master
                    WHERE UPPER(TRIM(CAST(plant_code AS CHAR))) = UPPER(TRIM(?))
                    ORDER BY Dept_Code
                    """;
            List<Map<String, Object>> result = jdbc.queryForList(sql, plantCode);
            log.info("Found {} departments for plant {}", result.size(), plantCode);
            return result;
        } catch (Exception e) {
            log.error("Error querying departments for plant {}, returning empty list", plantCode, e);
            return new ArrayList<>();
        }
    }

    public int countByCode(String code) {
        String sql = "SELECT COUNT(*) FROM sd_apps_db.app_vg_wbs_department_master WHERE UPPER(TRIM(wbs_department_code)) = UPPER(TRIM(?))";
        Integer count = jdbc.queryForObject(sql, Integer.class, code);
        return count == null ? 0 : count;
    }

    public boolean existsByWbsDepartmentCode(String code) {
        try {
            String sql = """
                    SELECT COUNT(*)
                    FROM sd_apps_db.app_vg_wbs_department_master
                    WHERE UPPER(TRIM(CAST(wbs_department_code AS CHAR))) = UPPER(TRIM(?))
                      AND CAST(id AS SIGNED) > 0
                    """;
            Integer count = jdbc.queryForObject(sql, Integer.class, code);
            return count != null && count > 0;
        } catch (Exception e) {
            log.error("Error checking wbs department code existence for code {}", code, e);
            return false;
        }
    }

    public int insert(String code, String name, Integer statusId) {
        String sql = "INSERT INTO sd_apps_db.app_vg_wbs_department_master (wbs_department_code, department_name, status_id) VALUES (?, ?, ?)";
        return jdbc.update(sql, code, name, statusId == null ? 1 : statusId);
    }
}

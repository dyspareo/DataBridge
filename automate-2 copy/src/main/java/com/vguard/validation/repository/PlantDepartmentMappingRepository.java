package com.vguard.validation.repository;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Map;

@Repository
@Slf4j
public class PlantDepartmentMappingRepository {
    private final JdbcTemplate jdbc;

    public PlantDepartmentMappingRepository(@Qualifier("userJdbcTemplate") JdbcTemplate userJdbcTemplate) {
        this.jdbc = userJdbcTemplate;
    }

    public List<Map<String, Object>> findByPlantAndDepartment(String plantCode, String departmentCodeOrName) {
        String safePlantCode = plantCode == null ? "" : plantCode.trim();
        String deptCode = normalizeDepartmentCode(departmentCodeOrName);
        if (safePlantCode.isEmpty() || deptCode.isEmpty()) return List.of();

        String sql = """
                SELECT *
                FROM sd_apps_db.app_vg_plant_department_map
                WHERE plant_code = ? AND Dept_Code = ?
                ORDER BY created_date DESC
                """;
        return jdbc.queryForList(sql, safePlantCode, deptCode);
    }

    public int insertMapping(String plantCode, String departmentCodeOrName) {
        String safePlantCode = plantCode == null ? "" : plantCode.trim();
        String deptCode = normalizeDepartmentCode(departmentCodeOrName);
        Integer deptId = resolveDepartmentId(departmentCodeOrName);
        if (safePlantCode.isEmpty() || deptCode.isEmpty() || deptId == null) return 0;

        String sql = """
                INSERT INTO sd_apps_db.app_vg_plant_department_map 
                  (plant_code, dept_code, Status_id, app_id, wkf_process_def_id, 
                   created_date, created_by, dept_id)
                SELECT 
                  ?, 
                  ?, 
                  1,
                  acam.app_id,
                  wpd.id,
                  NOW(),
                  2,
                  ?
                FROM vguarddev_smartdocso_20201109134921303_1000000001911.app_company_application_map acam
                JOIN vguarddev_smartdocso_20201109134921303_1000000001911.wkf_process_definition wpd 
                  ON wpd.name = 'FA Procurement V2'
                WHERE acam.name = 'FA'
                LIMIT 1
                """;
        return jdbc.update(sql, safePlantCode, deptCode, deptId);
    }

    public Integer resolveDepartmentId(String departmentCodeOrName) {
        String raw = departmentCodeOrName == null ? "" : departmentCodeOrName.trim();
        if (raw.isEmpty()) return null;

        String cleanedCode = normalizeDepartmentCode(raw);
        String sql = """
                SELECT id
                FROM sd_apps_db.app_vg_department_master
                WHERE UPPER(TRIM(Dept_Name)) = UPPER(TRIM(?))
                   OR UPPER(TRIM(CAST(Dept_Code AS CHAR))) = UPPER(TRIM(?))
                LIMIT 1
                """;
        List<Integer> ids = jdbc.query(sql, (rs, i) -> rs.getInt(1), raw, cleanedCode);
        return ids.isEmpty() ? null : ids.get(0);
    }

    private String normalizeDepartmentCode(String value) {
        String raw = value == null ? "" : value.trim();
        if (raw.isEmpty()) return "";
        if (raw.length() > 1 && (raw.startsWith("D") || raw.startsWith("d"))) {
            return raw.substring(1);
        }
        return raw;
    }
}

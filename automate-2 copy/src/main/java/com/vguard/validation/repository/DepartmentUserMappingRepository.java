package com.vguard.validation.repository;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.stereotype.Repository;

import java.sql.Statement;
import java.util.List;
import java.util.Map;

@Repository
@Slf4j
public class DepartmentUserMappingRepository {
    private final JdbcTemplate jdbc;

    public DepartmentUserMappingRepository(@Qualifier("userJdbcTemplate") JdbcTemplate userJdbcTemplate) {
        this.jdbc = userJdbcTemplate;
    }

    public List<Map<String, Object>> findByDepartmentAndEmail(String departmentCodeOrName, String email) {
        Integer departmentId = resolveDepartmentId(departmentCodeOrName);
        Long userId = resolveUserIdByEmail(email);
        if (departmentId == null || userId == null) {
            return List.of();
        }

        String sql = """
                SELECT department_id, user_id, status_id, created_date, created_by, updated_date, updated_by
                FROM sd_apps_db.app_vg_department_user_map
                WHERE department_id = ? AND user_id = ?
                ORDER BY created_date DESC
                """;
        return jdbc.queryForList(sql, departmentId, userId);
    }

    public int insertMapping(String departmentCodeOrName, String email) {
        Integer departmentId = resolveDepartmentId(departmentCodeOrName);
        Long userId = resolveUserIdByEmail(email);
        if (departmentId == null || userId == null) {
            return 0;
        }

        String sql = """
                INSERT INTO sd_apps_db.app_vg_department_user_map
                (
                    department_id,
                    user_login_name,
                    app_id,
                    user_id,
                    wkf_process_def_id,
                    status_id,
                    created_by,
                    created_date
                )
                VALUES
                (
                    ?,
                    (SELECT login_name FROM users WHERE email_id1 = ?),
                    (SELECT app_id FROM app_company_application_map WHERE short_name = 'FA'),
                    (SELECT id FROM users WHERE email_id1 = ?),
                    (SELECT id FROM wkf_process_definition WHERE name = 'FA Procurement V2'),
                    1,
                    2,
                    NOW()
                )
                """;
        return jdbc.update(sql, departmentId, email, email);
    }

    public Integer resolveDepartmentId(String departmentCodeOrName) {
        String raw = departmentCodeOrName == null ? "" : departmentCodeOrName.trim();
        if (raw.isEmpty()) return null;

        String cleanedCode = raw;
        if (cleanedCode.length() > 1 && (cleanedCode.startsWith("D") || cleanedCode.startsWith("d"))) {
            cleanedCode = cleanedCode.substring(1);
        }

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

    public Long resolveUserIdByEmail(String email) {
        String safeEmail = email == null ? "" : email.trim();
        if (safeEmail.isEmpty()) return null;

        String sql = """
                SELECT id
                FROM users
                WHERE LOWER(TRIM(REPLACE(REPLACE(email_id1,'[',''),']',''))) = LOWER(TRIM(?))
                LIMIT 1
                """;
        List<Long> ids = jdbc.query(sql, (rs, i) -> rs.getLong(1), safeEmail);
        return ids.isEmpty() ? null : ids.get(0);
    }
}

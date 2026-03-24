package com.vguard.validation.repository;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Map;

@Repository
public class HierarchyRepository {
    private final JdbcTemplate jdbc;

    public HierarchyRepository(@Qualifier("userJdbcTemplate") JdbcTemplate userJdbcTemplate) {
        this.jdbc = userJdbcTemplate;
    }

    public List<Map<String, Object>> check(String plantCode, String deptCode, String email) {
        String sql = "SELECT * FROM sd_apps_db.app_vg_fa_recipient WHERE plant_code = ? AND dept_code = ? AND poc_email = ?";
        // Remove 'D' or 'd' prefix from deptCode if present
        String cleanDeptCode = deptCode != null && (deptCode.startsWith("D") || deptCode.startsWith("d")) ? deptCode.substring(1) : deptCode;
        return jdbc.queryForList(sql, plantCode, cleanDeptCode, email);
    }

    public List<Map<String, Object>> getAll() {
        String sql = "SELECT * FROM sd_apps_db.app_vg_fa_recipient ORDER BY created_date DESC";
        return jdbc.queryForList(sql);
    }

    public long insertRecipient(
            String plantName,
            String plantCode,
            String deptName,
            String deptCode,
            String pocLoginName,
            String pocEmpCode,
            String pocEmail,
            String approverLoginName,
            String approverEmpCode,
            String approverEmail,
            String cbs1LoginName,
            String cbs1EmpCode,
            String cbs1Email,
            String cbs2LoginName,
            String cbs2EmpCode,
            String cbs2Email
    ) {
        String sql = "INSERT INTO sd_apps_db.app_vg_fa_recipient ("
                + "plant_name, plant_code, dept_name, dept_code, "
                + "poc_login_name, poc_emp_code, poc_email, "
                + "approver_login_name, approver_emp_code, approver_email, "
                + "cbs1_login_name, cbs1_emp_code, cbs1_email, "
                + "cbs2_login_name, cbs2_emp_code, cbs2_email, "
                + "status_id, created_by, created_date"
                + ") VALUES ("
                + "?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 2, NOW())";
        var kh = new org.springframework.jdbc.support.GeneratedKeyHolder();
        jdbc.update(con -> {
            var ps = con.prepareStatement(sql, java.sql.Statement.RETURN_GENERATED_KEYS);
            int i = 1;
            ps.setString(i++, plantName);
            ps.setString(i++, plantCode);
            ps.setString(i++, deptName);
            ps.setString(i++, deptCode);
            ps.setString(i++, pocLoginName);
            ps.setString(i++, pocEmpCode);
            ps.setString(i++, pocEmail);
            ps.setString(i++, approverLoginName);
            ps.setString(i++, approverEmpCode);
            ps.setString(i++, approverEmail);
            ps.setString(i++, cbs1LoginName);
            ps.setString(i++, cbs1EmpCode);
            ps.setString(i++, cbs1Email);
            ps.setString(i++, cbs2LoginName);
            ps.setString(i++, cbs2EmpCode);
            ps.setString(i++, cbs2Email);
            return ps;
        }, kh);
        Number key = kh.getKey();
        return key == null ? 0L : key.longValue();
    }

    // Lookups for names
    public String findPlantNameByCode(int plantCode) {
        try {
            return jdbc.queryForObject(
                    "SELECT plant_name FROM sd_apps_db.app_vg_plant_master WHERE plant_code = ?",
                    new Object[]{plantCode},
                    String.class
            );
        } catch (EmptyResultDataAccessException ex) {
            return null;
        }
    }

    public String findDepartmentNameByCode(int deptCode) {
        try {
            return jdbc.queryForObject(
                    "SELECT Dept_Name FROM sd_apps_db.app_vg_department_master WHERE Dept_Code = ?",
                    new Object[]{deptCode},
                    String.class
            );
        } catch (EmptyResultDataAccessException ex) {
            return null;
        }
    }

    public String findLoginNameByEmail(String email) {
        try {
            return jdbc.queryForObject(
                    "SELECT login_name FROM users WHERE email_id1 = ?",
                    new Object[]{email},
                    String.class
            );
        } catch (EmptyResultDataAccessException ex) {
            return null;
        }
    }
}

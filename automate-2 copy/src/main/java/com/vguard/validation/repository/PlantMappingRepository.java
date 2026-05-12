package com.vguard.validation.repository;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Map;

@Repository
@Slf4j
public class PlantMappingRepository {
    private final JdbcTemplate jdbc;

    public PlantMappingRepository(@Qualifier("userJdbcTemplate") JdbcTemplate userJdbcTemplate) {
        this.jdbc = userJdbcTemplate;
    }

    public List<Map<String, Object>> findByEmail(String email) {
        String sql = """
            SELECT
                pm.plant_code,
                m.user_login_name,
                oi.name AS orm_instance_name,
                wp.name AS process_definition_name,
                m.status_id,
                m.created_date,
                m.created_by
            FROM sd_apps_db.app_vg_plant_user_map m
            LEFT JOIN sd_apps_db.app_vg_plant_master pm
                  ON pm.id = m.plant_id
            LEFT JOIN vguarddev_smartdocso_20201109134921303_1000000001911.orm_instance oi
                  ON oi.id = m.app_id
            LEFT JOIN vguarddev_smartdocso_20201109134921303_1000000001911.wkf_process_definition wp
                  ON wp.id = m.wkf_process_def_id
            WHERE m.user_login_name = ?
        """;
        return jdbc.queryForList(sql, email);
    }

    public Long resolvePlantIdByCode(String plantCode) {
        String sql = "SELECT id FROM sd_apps_db.app_vg_plant_master WHERE plant_code = ? LIMIT 1";
        List<Long> ids = jdbc.query(sql, (rs, i) -> rs.getLong(1), plantCode);
        return ids.isEmpty() ? null : ids.get(0);
    }

    public long insertMapping(long plantId, String userLoginName) {
        String sql = "INSERT INTO sd_apps_db.app_vg_plant_user_map (plant_id, user_login_name, app_id, wkf_process_def_id, status_id, created_by, created_date) VALUES (?, ?, 3, 7, 1, 2, NOW())";
        var kh = new org.springframework.jdbc.support.GeneratedKeyHolder();
        jdbc.update(con -> {
            var ps = con.prepareStatement(sql, java.sql.Statement.RETURN_GENERATED_KEYS);
            ps.setLong(1, plantId);
            ps.setString(2, userLoginName);
            return ps;
        }, kh);
        Number key = kh.getKey();
        return key == null ? 0L : key.longValue();
    }
}

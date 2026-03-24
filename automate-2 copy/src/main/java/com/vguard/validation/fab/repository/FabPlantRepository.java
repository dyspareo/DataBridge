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
public class FabPlantRepository {
    private final JdbcTemplate jdbc;

    public FabPlantRepository(@Qualifier("userJdbcTemplate") JdbcTemplate userJdbcTemplate) {
        this.jdbc = userJdbcTemplate;
    }

    public List<Map<String, Object>> findAll() {
        try {
            String sql = "SELECT plant_code, plant_name, status_id FROM sd_apps_db.app_vg_plant_master ORDER BY plant_code";
            log.info("Executing plant query: {}", sql);
            List<Map<String, Object>> result = jdbc.queryForList(sql);
            log.info("Found {} plants", result.size());
            return result;
        } catch (Exception e) {
            log.error("Error querying plants, returning empty list", e);
            return new ArrayList<>();
        }
    }

    public boolean existsByCode(String code) {
        try {
            String sql = """
                    SELECT COUNT(*)
                    FROM sd_apps_db.app_vg_plant_master
                    WHERE plant_code = ?
                    """;
            Integer count = jdbc.queryForObject(sql, Integer.class, code == null ? null : code.trim());
            return count != null && count > 0;
        } catch (Exception ex) {
            log.error("Error checking plant code existence for code {}", code, ex);
            return false;
        }
    }
}

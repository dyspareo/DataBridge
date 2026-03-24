package com.vguard.validation.fab.service;

import com.vguard.validation.fab.dto.FabHierarchyCheckResponse;
import com.vguard.validation.fab.entity.FabTaskAssignmentMap;
import com.vguard.validation.fab.repository.FabHierarchyRepository;
import jakarta.validation.ValidationException;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional
public class FabHierarchyService {
    private final FabHierarchyRepository fabHierarchyRepository;
    @Qualifier("userJdbcTemplate")
    private final JdbcTemplate jdbcTemplate;

    @Transactional(readOnly = true)
    public FabHierarchyCheckResponse checkHierarchy(String plantCode, String departmentCode) {
        return fabHierarchyRepository.findByPlantCodeAndDepartmentCode(safe(plantCode), safe(departmentCode))
                .map(FabHierarchyCheckResponse::found)
                .orElseGet(() -> FabHierarchyCheckResponse.notFound(safe(plantCode), safe(departmentCode)));
    }

    public FabTaskAssignmentMap insertRecipient(FabTaskAssignmentMap request) {
        String plantCode = safe(request.getPlantCode());
        String departmentCode = safe(request.getDepartmentCode());
        if (plantCode.isEmpty() || departmentCode.isEmpty()) {
            throw new ValidationException("plantCode and departmentCode are required");
        }

        request.setPlantCode(plantCode);
        request.setDepartmentCode(departmentCode);
        request.setStatusId(1);
        request.setCreatedDate(LocalDateTime.now());
        if (request.getCreatedBy() == null) request.setCreatedBy(2);
        return fabHierarchyRepository.save(request);
    }

    @Transactional(readOnly = true)
    public List<FabTaskAssignmentMap> getByPlant(String plantCode) {
        return fabHierarchyRepository.findByPlantCode(safe(plantCode));
    }

    @Transactional(readOnly = true)
    public List<FabTaskAssignmentMap> getByDepartment(String departmentCode) {
        return fabHierarchyRepository.findByDepartmentCode(safe(departmentCode));
    }

    @Transactional(readOnly = true)
    public Integer findDeptIdByDepartmentCode(String departmentCode) {
        String code = safe(departmentCode);
        if (code.isEmpty()) return null;
        String sql = """
                SELECT id
                FROM sd_apps_db.app_vg_wbs_department_master
                WHERE UPPER(TRIM(wbs_department_code)) = UPPER(TRIM(?))
                LIMIT 1
                """;
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(sql, code);
        if (rows.isEmpty()) return null;
        Object raw = rows.get(0).get("id");
        if (raw == null) return null;
        if (raw instanceof Number n) return n.intValue();
        try {
            return Integer.parseInt(String.valueOf(raw));
        } catch (Exception ignored) {
            return null;
        }
    }

    private String safe(String value) {
        return value == null ? "" : value.trim();
    }
}

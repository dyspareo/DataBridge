package com.vguard.validation.fap.service;

import com.vguard.validation.fap.dto.FapCheckRequest;
import com.vguard.validation.fap.dto.FapCheckResponse;
import com.vguard.validation.fap.dto.FapEmailEntryRequest;
import com.vguard.validation.fap.dto.FapEmailValidationResult;
import com.vguard.validation.fap.dto.FapValidationRowRequest;
import com.vguard.validation.fap.dto.FapValidationRowResponse;
import com.vguard.validation.repository.DepartmentRepository;
import com.vguard.validation.repository.PlantRepository;
import com.vguard.validation.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class FapValidationService {
    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[A-Z0-9._%+-]+@[A-Z0-9.-]+\\.[A-Z]{2,}$", Pattern.CASE_INSENSITIVE);

    private final UserRepository userRepository;
    private final PlantRepository plantRepository;
    private final DepartmentRepository departmentRepository;

    @Qualifier("userJdbcTemplate")
    private final JdbcTemplate jdbcTemplate;

    public List<FapValidationRowResponse> validateRows(List<FapValidationRowRequest> rows) {
        Map<String, Integer> duplicateCounts = new HashMap<>();
        if (rows != null) {
            for (FapValidationRowRequest row : rows) {
                String key = buildDuplicateKey(row);
                if (!key.isBlank()) {
                    duplicateCounts.merge(key, 1, Integer::sum);
                }
            }
        }

        return rows == null ? List.of() : rows.stream()
                .map(row -> validateRow(row, duplicateCounts.getOrDefault(buildDuplicateKey(row), 0) > 1))
                .toList();
    }

    public FapCheckResponse runCheck(String checkType, FapCheckRequest request) {
        String normalizedType = safe(checkType).toLowerCase();
        return switch (normalizedType) {
            case "plant-user" -> executePlantUserCheck(request);
            case "department-user" -> executeDepartmentUserCheck(request);
            case "plant-department" -> executePlantDepartmentCheck(request);
            default -> FapCheckResponse.builder()
                    .checkType(normalizedType)
                    .status("Not Existing")
                    .message("Unsupported check type")
                    .count(0)
                    .satisfied(false)
                    .build();
        };
    }

    private FapValidationRowResponse validateRow(FapValidationRowRequest row, boolean duplicate) {
        FapValidationRowResponse response = new FapValidationRowResponse();
        response.setRowNumber(row == null ? null : row.getRowNumber());
        response.setUserEmail(safe(row == null ? null : row.getUserEmail()));
        response.setPlantCode(safe(row == null ? null : row.getPlantCode()));
        response.setDepartmentCode(safe(row == null ? null : row.getDepartmentCode()));
        response.setEmailValidations(buildEmailValidations(row == null ? null : row.getEmailEntries(), duplicate));

        if ((response.getUserEmail().isBlank()) && response.getEmailValidations() != null && !response.getEmailValidations().isEmpty()) {
            response.setUserEmail(safe(response.getEmailValidations().get(0).getEmail()));
        }

        if (duplicate) {
            response.setDuplicate(true);
            response.setUserStatus("Duplicate");
            response.setPlantStatus("Duplicate");
            response.setDepartmentStatus("Duplicate");
            response.setUserMessage("Duplicate entry in Excel");
            response.setPlantMessage("Duplicate entry in Excel");
            response.setDepartmentMessage("Duplicate entry in Excel");
            response.setOverallStatus("Duplicate");
            return response;
        }

        applyUserValidation(response);
        applyPlantValidation(response);
        applyDepartmentValidation(response);

        boolean allEmailsExisting = response.getEmailValidations() != null
                && !response.getEmailValidations().isEmpty()
                && response.getEmailValidations().stream().allMatch(item -> "Existing".equals(item.getStatus()));
        boolean allExisting = "Existing".equals(response.getUserStatus())
                && "Existing".equals(response.getPlantStatus())
                && "Existing".equals(response.getDepartmentStatus())
                && allEmailsExisting;
        response.setOverallStatus(allExisting ? "Existing" : "Not Existing");
        return response;
    }

    private void applyUserValidation(FapValidationRowResponse response) {
        List<FapEmailValidationResult> emailValidations = response.getEmailValidations();
        if (emailValidations == null || emailValidations.isEmpty()) {
            response.setUserStatus("Not Existing");
            response.setUserMessage("User not found");
            return;
        }

        boolean allExisting = emailValidations.stream().allMatch(item -> "Existing".equals(item.getStatus()));
        response.setUserStatus(allExisting ? "Existing" : "Not Existing");
        response.setUserMessage(allExisting ? "Record found" : "User not found");
    }

    private void applyPlantValidation(FapValidationRowResponse response) {
        String plantCode = safe(response.getPlantCode());
        if (plantCode.isBlank()) {
            response.setPlantStatus("Not Existing");
            response.setPlantMessage("Plant not found");
            return;
        }
        int count = plantRepository.countInMasterByCodeOrPlantCode(plantCode);
        response.setPlantStatus(count > 0 ? "Existing" : "Not Existing");
        response.setPlantMessage(count > 0 ? "Record found" : "Plant not found");
    }

    private void applyDepartmentValidation(FapValidationRowResponse response) {
        String departmentCode = safe(response.getDepartmentCode());
        if (departmentCode.isBlank()) {
            response.setDepartmentStatus("Not Existing");
            response.setDepartmentMessage("Department not found");
            return;
        }
        int count = departmentRepository.countInMasterByDepartmentName(departmentCode);
        response.setDepartmentStatus(count > 0 ? "Existing" : "Not Existing");
        response.setDepartmentMessage(count > 0 ? "Record found" : "Department not found");
    }

    private FapCheckResponse executePlantUserCheck(FapCheckRequest request) {
        String sql = """
                SELECT COUNT(*)
                FROM sd_apps_db.app_vg_plant_user_map
                WHERE plant_id = (
                    SELECT id
                    FROM sd_apps_db.app_vg_plant_master
                    WHERE code = ? OR plant_code = ?
                    LIMIT 1
                )
                AND user_login_name = (
                    SELECT login_name FROM users
                    WHERE LOWER(TRIM(REPLACE(REPLACE(email_id1,'[',''),']',''))) = LOWER(TRIM(?))
                )
                """;
        return executeCountCheck("plant-user", sql, safe(request.getPlantCode()), safe(request.getPlantCode()), safe(request.getUserEmail()));
    }

    private FapCheckResponse executeDepartmentUserCheck(FapCheckRequest request) {
        String sql = """
                SELECT COUNT(*)
                FROM sd_apps_db.app_vg_department_user_map
                WHERE department_id = (
                    SELECT id FROM sd_apps_db.app_vg_department_master WHERE Dept_Name = ?
                )
                AND user_id = (
                    SELECT id FROM users
                    WHERE LOWER(TRIM(REPLACE(REPLACE(email_id1,'[',''),']',''))) = LOWER(TRIM(?))
                )
                """;
        return executeCountCheck("department-user", sql, safe(request.getDepartmentCode()), safe(request.getUserEmail()));
    }

    private FapCheckResponse executePlantDepartmentCheck(FapCheckRequest request) {
        String sql = """
                SELECT COUNT(*)
                FROM sd_apps_db.app_vg_plant_department_map
                WHERE plant_code = (
                    SELECT plant_code
                    FROM sd_apps_db.app_vg_plant_master
                    WHERE code = ? OR plant_code = ?
                    LIMIT 1
                )
                AND Dept_Code = (
                    SELECT Dept_Code
                    FROM sd_apps_db.app_vg_department_master
                    WHERE Dept_Name = ?
                    LIMIT 1
                )
                """;
        return executeCountCheck("plant-department", sql, safe(request.getPlantCode()), safe(request.getPlantCode()), safe(request.getDepartmentCode()));
    }

    private FapCheckResponse executeCountCheck(String checkType, String sql, String first, String second) {
        if (first.isBlank() || second.isBlank()) {
            return FapCheckResponse.builder()
                    .checkType(checkType)
                    .status("Not Existing")
                    .message("Missing check parameters")
                    .count(0)
                    .satisfied(false)
                    .build();
        }

        Integer count = jdbcTemplate.queryForObject(sql, Integer.class, first, second);
        int safeCount = count == null ? 0 : count;
        boolean satisfied = safeCount > 1;
        return FapCheckResponse.builder()
                .checkType(checkType)
                .status(satisfied ? "Existing" : "Not Existing")
                .message(satisfied ? "Record found" : "Record not found")
                .count(safeCount)
                .satisfied(satisfied)
                .build();
    }

    private FapCheckResponse executeCountCheck(String checkType, String sql, String first, String second, String third) {
        if (first.isBlank() || second.isBlank() || third.isBlank()) {
            return FapCheckResponse.builder()
                    .checkType(checkType)
                    .status("Not Existing")
                    .message("Missing check parameters")
                    .count(0)
                    .satisfied(false)
                    .build();
        }

        Integer count = jdbcTemplate.queryForObject(sql, Integer.class, first, second, third);
        int safeCount = count == null ? 0 : count;
        boolean satisfied = safeCount > 1;
        return FapCheckResponse.builder()
                .checkType(checkType)
                .status(satisfied ? "Existing" : "Not Existing")
                .message(satisfied ? "Record found" : "Record not found")
                .count(safeCount)
                .satisfied(satisfied)
                .build();
    }

    private String buildDuplicateKey(FapValidationRowRequest row) {
        if (row == null) return "";
        String plant = safe(row.getPlantCode()).toLowerCase();
        String department = safe(row.getDepartmentCode()).toLowerCase();
        String emails = buildEmailKey(row.getEmailEntries());
        if (emails.isBlank() && plant.isBlank() && department.isBlank()) return "";
        return emails + "|" + plant + "|" + department;
    }

    private List<FapEmailValidationResult> buildEmailValidations(List<FapEmailEntryRequest> emailEntries, boolean duplicate) {
        List<FapEmailValidationResult> items = new ArrayList<>();
        if (emailEntries == null) return items;

        for (FapEmailEntryRequest emailEntry : emailEntries) {
            FapEmailValidationResult item = new FapEmailValidationResult();
            item.setFieldName(safe(emailEntry == null ? null : emailEntry.getFieldName()));
            item.setEmail(safe(emailEntry == null ? null : emailEntry.getEmail()));

            if (duplicate) {
                item.setStatus("Duplicate");
                item.setMessage("Duplicate entry in Excel");
                items.add(item);
                continue;
            }

            String email = safe(item.getEmail());
            if (email.isBlank()) {
                item.setStatus("Not Existing");
                item.setMessage("User not found");
            } else if (!EMAIL_PATTERN.matcher(email).matches()) {
                item.setStatus("Not Existing");
                item.setMessage("Invalid email format");
            } else {
                int count = userRepository.countByEmail(email);
                item.setStatus(count > 0 ? "Existing" : "Not Existing");
                item.setMessage(count > 0 ? "Record found" : "User not found");
            }

            items.add(item);
        }

        return items;
    }

    private String buildEmailKey(List<FapEmailEntryRequest> emailEntries) {
        if (emailEntries == null || emailEntries.isEmpty()) return "";
        return emailEntries.stream()
                .map(item -> safe(item == null ? null : item.getEmail()).toLowerCase())
                .reduce((a, b) -> a + "," + b)
                .orElse("");
    }

    private String safe(String value) {
        return value == null ? "" : value.trim();
    }
}

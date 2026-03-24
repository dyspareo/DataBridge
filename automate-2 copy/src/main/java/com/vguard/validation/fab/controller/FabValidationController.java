package com.vguard.validation.fab.controller;

import com.vguard.validation.fab.dto.ExcelRowDTO;
import com.vguard.validation.fab.dto.ValidationResultDTO;
import com.vguard.validation.fab.repository.FabDepartmentRepository;
import com.vguard.validation.fab.service.FabValidationService;
import com.vguard.validation.model.DepartmentInsertRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/fab")
public class FabValidationController {

    private final FabValidationService fabValidationService;
    private final FabDepartmentRepository fabDepartmentRepository;

    @PostMapping("/validate")
    @Transactional(propagation = Propagation.NOT_SUPPORTED)
    public ResponseEntity<?> validateFAB(@RequestBody List<ExcelRowDTO> excelRows) {
        log.info("Starting FAB validation for {} rows", excelRows.size());
        
        try {
            if (excelRows.isEmpty()) {
                log.warn("No rows provided for validation");
                return ResponseEntity.ok(List.of());
            }

            List<ValidationResultDTO> validationResults = fabValidationService.validate(excelRows);
            log.info("FAB validation completed. Total rows processed: {}", validationResults.size());

            return ResponseEntity.ok(validationResults);

        } catch (Exception e) {
            log.error("Error during FAB validation: {}", e.getMessage(), e);
            Map<String, Object> body = new HashMap<>();
            body.put("success", false);
            body.put("message", "Failed to validate FAB data: " + e.getMessage());
            return ResponseEntity.badRequest().body(body);
        }
    }

    @PostMapping("/department")
    public ResponseEntity<Map<String, Object>> insertFabDepartment(@RequestBody DepartmentInsertRequest req) {
        Map<String, Object> body = new HashMap<>();
        String code = req.getDeptCode() == null ? "" : req.getDeptCode().trim();
        String name = req.getDeptName() == null ? "" : req.getDeptName().trim();

        if (code.isEmpty() || name.isEmpty()) {
            body.put("success", false);
            body.put("message", "departmentCode and departmentName are required");
            return ResponseEntity.badRequest().body(body);
        }

        if (fabDepartmentRepository.countByCode(code) > 0) {
            body.put("success", false);
            body.put("message", "Department already exists");
            return ResponseEntity.ok(body);
        }

        int rows = fabDepartmentRepository.insert(code, name, req.getStatusId());
        body.put("success", rows > 0);
        body.put("message", rows > 0 ? "Department inserted" : "Insert failed");
        return ResponseEntity.ok(body);
    }
}

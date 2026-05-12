package com.vguard.validation.fab.controller;

import com.vguard.validation.fab.dto.FabHierarchyCheckResponse;
import com.vguard.validation.fab.entity.FabTaskAssignmentMap;
import com.vguard.validation.fab.service.FabHierarchyService;
import jakarta.validation.ValidationException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.List;

@RestController
@RequiredArgsConstructor
@Slf4j
@RequestMapping("/api/fab/hierarchy")
public class FabHierarchyController {
    private final FabHierarchyService fabHierarchyService;

    @GetMapping("/count-test")
    public ResponseEntity<String> countTest() {
        try {
            long count = fabHierarchyService.count();
            log.info("Count test result: {}", count);
            return ResponseEntity.ok("Count: " + count);
        } catch (Exception e) {
            log.error("Error in count test", e);
            return ResponseEntity.status(500).body("Error: " + e.getMessage());
        }
    }

    @GetMapping("/entity-test")
    public ResponseEntity<FabTaskAssignmentMap> entityTest(
            @RequestParam(required = false, defaultValue = "2222") String plantCode,
            @RequestParam(required = false, defaultValue = "SANJ") String departmentCode) {
        try {
            // Input validation
            if (plantCode == null || plantCode.trim().isEmpty()) {
                return ResponseEntity.badRequest().build();
            }
            if (departmentCode == null || departmentCode.trim().isEmpty()) {
                return ResponseEntity.badRequest().build();
            }
            
            var result = fabHierarchyService.findByPlantCodeAndDepartmentCode(plantCode.trim(), departmentCode.trim());
            log.info("Entity test result for plantCode: {}, departmentCode: {} -> {}", 
                    plantCode, departmentCode, result.isPresent() ? "FOUND" : "NOT_FOUND");
            if (result.isPresent()) {
                return ResponseEntity.ok(result.get());
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            log.error("Error in entity test for plantCode: {}, departmentCode: {}", plantCode, departmentCode, e);
            throw e;
        }
    }

    @GetMapping("/simple-test")
    public ResponseEntity<Map<String, Object>> simpleTest() {
        Map<String, Object> response = new HashMap<>();
        response.put("found", true);
        response.put("message", "Test message");
        response.put("plantCode", "2222");
        response.put("departmentCode", "SANJ");
        return ResponseEntity.ok(response);
    }

    @GetMapping("/test")
    public ResponseEntity<String> test() {
        log.info("Test endpoint called");
        return ResponseEntity.ok("Test works!");
    }

    @GetMapping("/check")
    public ResponseEntity<FabHierarchyCheckResponse> check(
            @RequestParam String plantCode,
            @RequestParam String departmentCode
    ) {
        log.info("Checking hierarchy for plantCode: {}, departmentCode: {}", plantCode, departmentCode);
        
        // Input validation
        if (plantCode == null || plantCode.trim().isEmpty()) {
            return ResponseEntity.badRequest().build();
        }
        if (departmentCode == null || departmentCode.trim().isEmpty()) {
            return ResponseEntity.badRequest().build();
        }
        
        try {
            FabHierarchyCheckResponse response = fabHierarchyService.checkHierarchy(plantCode.trim(), departmentCode.trim());
            log.info("Hierarchy check result: {}", response);
            return ResponseEntity.ok(response);
        } catch (Throwable e) {
            log.error("Error checking hierarchy for plantCode: {}, departmentCode: {}", plantCode, departmentCode, e);
            String safePlant = plantCode == null ? "" : plantCode.trim();
            String safeDept = departmentCode == null ? "" : departmentCode.trim();
            return ResponseEntity.ok(FabHierarchyCheckResponse.error(
                    safePlant,
                    safeDept,
                    summarizeHierarchyCheckFailure(e)
            ));
        }
    }

    @PostMapping("/recipient/insert")
    public ResponseEntity<FabTaskAssignmentMap> insert(@RequestBody FabTaskAssignmentMap request) {
        return ResponseEntity.ok(fabHierarchyService.insertRecipient(request));
    }

    @GetMapping("/plant/{code}")
    public ResponseEntity<List<FabTaskAssignmentMap>> getByPlant(@PathVariable("code") String code) {
        // Input validation
        if (code == null || code.trim().isEmpty()) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(fabHierarchyService.getByPlant(code.trim()));
    }

    @GetMapping("/department/{code}")
    public ResponseEntity<List<FabTaskAssignmentMap>> getByDepartment(@PathVariable("code") String code) {
        // Input validation
        if (code == null || code.trim().isEmpty()) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(fabHierarchyService.getByDepartment(code.trim()));
    }

    @GetMapping("/department-id")
    public ResponseEntity<Map<String, Object>> getDepartmentId(@RequestParam("departmentCode") String departmentCode) {
        // Input validation
        if (departmentCode == null || departmentCode.trim().isEmpty()) {
            return ResponseEntity.badRequest().build();
        }
        
        try {
            Integer deptId = fabHierarchyService.findDeptIdByDepartmentCode(departmentCode.trim());
            Map<String, Object> body = new HashMap<>();
            body.put("deptId", deptId);
            body.put("departmentCode", departmentCode.trim());
            return ResponseEntity.ok(body);
        } catch (Exception e) {
            log.error("Error finding department ID for departmentCode: {}", departmentCode, e);
            Map<String, Object> errorBody = new HashMap<>();
            errorBody.put("deptId", null);
            errorBody.put("error", "Failed to find department: " + e.getMessage());
            return ResponseEntity.status(500).body(errorBody);
        }
    }

    @ExceptionHandler(ValidationException.class)
    public ResponseEntity<Map<String, Object>> handleValidation(ValidationException ex) {
        return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", ex.getMessage()
        ));
    }

    private static String summarizeHierarchyCheckFailure(Throwable error) {
        Throwable root = error;
        int guard = 0;
        while (root.getCause() != null && root.getCause() != root && guard++ < 12) {
            root = root.getCause();
        }

        String rootMessage = root.getMessage();
        if (rootMessage == null) rootMessage = "";
        rootMessage = rootMessage.trim();

        String type = root.getClass().getSimpleName();
        if (type.toLowerCase().contains("communications") || rootMessage.toLowerCase().contains("communications link failure")) {
            return "Database connection failed (communications link failure). Check DB host/VPN and datasource settings.";
        }
        if (rootMessage.toLowerCase().contains("connection timed out") || rootMessage.toLowerCase().contains("connect timed out")) {
            return "Database connection timed out. Check DB host/VPN and datasource settings.";
        }
        if (rootMessage.toLowerCase().contains("doesn't exist") || rootMessage.toLowerCase().contains("does not exist")) {
            return "FAB hierarchy table is missing or misconfigured in the database: " + rootMessage;
        }

        if (!rootMessage.isBlank()) {
            return "Failed to check FAB hierarchy (" + type + "): " + rootMessage;
        }
        return "Failed to check FAB hierarchy (" + type + ").";
    }
}

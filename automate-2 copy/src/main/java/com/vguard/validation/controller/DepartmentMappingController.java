package com.vguard.validation.controller;

import com.vguard.validation.repository.DepartmentUserMappingRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/department")
public class DepartmentMappingController {
    private static final Logger log = LoggerFactory.getLogger(DepartmentMappingController.class);
    private final DepartmentUserMappingRepository repo;

    public DepartmentMappingController(DepartmentUserMappingRepository repo) {
        this.repo = repo;
    }

    @GetMapping("/mapping")
    public ResponseEntity<?> mapping(@RequestParam("departmentCode") String departmentCode,
                                     @RequestParam("email") String email) {
        List<Map<String, Object>> rows = repo.findByDepartmentAndEmail(departmentCode, email);
        Map<String, Object> body = new HashMap<>();
        body.put("results", rows);
        return ResponseEntity.ok(body);
    }

    @PostMapping("/mapping/insert")
    public ResponseEntity<?> insert(@RequestBody Map<String, Object> payload) {
        try {
            String departmentCode = String.valueOf(payload.get("departmentCode"));
            String userEmail = String.valueOf(payload.get("userEmail"));
            if (departmentCode == null || departmentCode.isBlank() || userEmail == null || userEmail.isBlank()) {
                return ResponseEntity.badRequest().body(Map.of("success", false, "error", "missing_fields"));
            }

            Integer departmentId = repo.resolveDepartmentId(departmentCode);
            if (departmentId == null) {
                return ResponseEntity.ok(Map.of("success", false, "error", "department_not_found"));
            }

            Long userId = repo.resolveUserIdByEmail(userEmail);
            if (userId == null) {
                return ResponseEntity.ok(Map.of("success", false, "error", "user_not_found"));
            }

            int rows = repo.insertMapping(departmentCode, userEmail);
            return ResponseEntity.ok(Map.of("success", rows > 0));
        } catch (Exception e) {
            log.error("Department mapping insert failed for payload={}", payload, e);
            return ResponseEntity.ok(Map.of(
                    "success", false,
                    "error", e.getClass().getSimpleName(),
                    "message", e.getMessage() == null ? "Insert failed" : e.getMessage()
            ));
        }
    }
}

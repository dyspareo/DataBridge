package com.vguard.validation.controller;

import lombok.extern.slf4j.Slf4j;
import com.vguard.validation.repository.PlantDepartmentMappingRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/plant-department")
@Slf4j
public class PlantDepartmentMappingController {
    private static final Logger log = LoggerFactory.getLogger(PlantDepartmentMappingController.class);
    private final PlantDepartmentMappingRepository repo;

    public PlantDepartmentMappingController(PlantDepartmentMappingRepository repo) {
        this.repo = repo;
    }

    @GetMapping("/mapping")
    public ResponseEntity<?> mapping(@RequestParam("plantCode") String plantCode,
                                     @RequestParam("departmentCode") String departmentCode) {
        List<Map<String, Object>> rows = repo.findByPlantAndDepartment(plantCode, departmentCode);
        Map<String, Object> body = new HashMap<>();
        body.put("results", rows);
        return ResponseEntity.ok(body);
    }

    @PostMapping("/mapping/insert")
    public ResponseEntity<?> insert(@RequestBody Map<String, Object> payload) {
        try {
            String plantCode = payload.get("plantCode") == null ? null : String.valueOf(payload.get("plantCode")).trim();
            String departmentCode = payload.get("departmentCode") == null ? null : String.valueOf(payload.get("departmentCode")).trim();
            if (plantCode == null || plantCode.isBlank() || departmentCode == null || departmentCode.isBlank()) {
                return ResponseEntity.badRequest().body(Map.of("success", false, "error", "missing_fields"));
            }

            Integer deptId = repo.resolveDepartmentId(departmentCode);
            if (deptId == null) {
                return ResponseEntity.ok(Map.of("success", false, "error", "department_not_found"));
            }

            int rows = repo.insertMapping(plantCode, departmentCode);
            return ResponseEntity.ok(Map.of("success", rows > 0));
        } catch (Exception e) {
            log.error("Plant-department mapping insert failed for payload={}", payload, e);
            return ResponseEntity.ok(Map.of(
                    "success", false,
                    "error", e.getClass().getSimpleName(),
                    "message", e.getMessage() == null ? "Insert failed" : e.getMessage()
            ));
        }
    }
}

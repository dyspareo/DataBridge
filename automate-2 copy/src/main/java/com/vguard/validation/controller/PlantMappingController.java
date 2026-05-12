package com.vguard.validation.controller;

import lombok.extern.slf4j.Slf4j;
import com.vguard.validation.repository.PlantMappingRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/plant")
@Slf4j
public class PlantMappingController {
    private final PlantMappingRepository repo;

    public PlantMappingController(PlantMappingRepository repo) {
        this.repo = repo;
    }

    @GetMapping("/mapping")
    public ResponseEntity<?> mapping(@RequestParam("email") String email) {
        List<Map<String, Object>> rows = repo.findByEmail(email);
        Map<String, Object> body = new HashMap<>();
        body.put("results", rows);
        return ResponseEntity.ok(body);
    }

    @PostMapping("/mapping/insert")
    public ResponseEntity<?> insert(@RequestBody Map<String, Object> payload) {
        try {
            String plantCode = String.valueOf(payload.get("plantCode"));
            String userLoginName = String.valueOf(payload.get("userLoginName"));
            if (plantCode == null || plantCode.isBlank() || userLoginName == null || userLoginName.isBlank()) {
                return ResponseEntity.badRequest().body(Map.of("success", false, "error", "missing_fields"));
            }
            Long plantId = repo.resolvePlantIdByCode(plantCode);
            if (plantId == null) {
                return ResponseEntity.ok(Map.of("success", false, "error", "plant_not_found"));
            }
            long id = repo.insertMapping(plantId, userLoginName);
            return ResponseEntity.ok(Map.of("success", id > 0, "id", id));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", "invalid_payload"));
        }
    }
}

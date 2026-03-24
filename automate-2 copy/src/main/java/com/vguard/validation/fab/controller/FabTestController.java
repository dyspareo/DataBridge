package com.vguard.validation.fab.controller;

import com.vguard.validation.fab.repository.FabDepartmentRepository;
import com.vguard.validation.fab.repository.FabPlantRepository;
import com.vguard.validation.fab.repository.FabUserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/fab/test")
@Slf4j
@RequiredArgsConstructor
public class FabTestController {

    private final FabPlantRepository plantRepository;
    private final FabDepartmentRepository departmentRepository;
    private final FabUserRepository userRepository;

    @GetMapping("/status")
    public ResponseEntity<String> status() {
        return ResponseEntity.ok("FAB Test Controller is working");
    }
    
    @GetMapping("/plants")
    public ResponseEntity<String> testPlants() {
        try {
            long count = plantRepository.findAll().size();
            return ResponseEntity.ok("Found " + count + " plants in database");
        } catch (Exception e) {
            log.error("Database test failed", e);
            return ResponseEntity.status(500).body("Database test failed: " + e.getMessage());
        }
    }
    
    @GetMapping("/departments")
    public ResponseEntity<String> testDepartments() {
        try {
            long count = departmentRepository.findAll().size();
            return ResponseEntity.ok("Found " + count + " departments in database");
        } catch (Exception e) {
            log.error("Department test failed", e);
            return ResponseEntity.status(500).body("Department test failed: " + e.getMessage());
        }
    }
    
    @GetMapping("/users")
    public ResponseEntity<String> testUsers() {
        try {
            long count = userRepository.findAll().size();
            return ResponseEntity.ok("Found " + count + " users in database");
        } catch (Exception e) {
            log.error("User test failed", e);
            return ResponseEntity.status(500).body("User test failed: " + e.getMessage());
        }
    }
    
    @GetMapping("/validate-simple")
    public ResponseEntity<String> validateSimple() {
        try {
            // Test with minimal data
            return ResponseEntity.ok("Validation endpoint is accessible");
        } catch (Exception e) {
            log.error("Validation test failed", e);
            return ResponseEntity.status(500).body("Validation test failed: " + e.getMessage());
        }
    }
}

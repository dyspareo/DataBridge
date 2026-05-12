package com.vguard.validation.fap.controller;

import com.vguard.validation.fap.dto.FapTaskAssigneeRequest;
import com.vguard.validation.fap.dto.FapTaskAssigneeResponse;
import com.vguard.validation.fap.dto.FapTaskAssigneeInsertResponse;
import com.vguard.validation.fap.dto.FapHierarchyInsertRequest;
import com.vguard.validation.fap.dto.FapHierarchyInsertResponse;
import com.vguard.validation.fap.service.FapTaskAssigneeService;
import com.vguard.validation.fap.service.FapHierarchyService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@Slf4j
@RequestMapping("/api/fap-task-assignee")
public class FapTaskAssigneeController {

    private final FapTaskAssigneeService service;
    private final FapHierarchyService hierarchyService;

    @GetMapping
    public ResponseEntity<List<FapTaskAssigneeResponse>> getAllRecords() {
        try {
            List<FapTaskAssigneeResponse> records = service.getAllRecords();
            return ResponseEntity.ok(records);
        } catch (Exception e) {
            log.error("Error fetching FAP task assignee records", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/search")
    public ResponseEntity<List<FapTaskAssigneeResponse>> getRecordsByPlantAndDepartment(
            @RequestParam String plantCode,
            @RequestParam String department) {
        try {
            // Input validation
            if (plantCode == null || plantCode.trim().isEmpty()) {
                return ResponseEntity.badRequest().build();
            }
            if (department == null || department.trim().isEmpty()) {
                return ResponseEntity.badRequest().build();
            }
            
            List<FapTaskAssigneeResponse> records = service.getRecordsByPlantAndDepartment(plantCode.trim(), department.trim());
            return ResponseEntity.ok(records);
        } catch (Exception e) {
            log.error("Error fetching FAP task assignee records for plant: {}, department: {}", plantCode, department, e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @PostMapping
    public ResponseEntity<FapTaskAssigneeInsertResponse> insertRecord(@RequestBody FapTaskAssigneeRequest request) {
        try {
            // Input validation
            if (request == null) {
                return ResponseEntity.badRequest().build();
            }
            
            log.info("Inserting FAP task assignee record: {}", request);
            FapTaskAssigneeInsertResponse response = service.insertRecord(request);
            
            if (response.isSuccess()) {
                return ResponseEntity.ok(response);
            } else {
                return ResponseEntity.badRequest().body(response);
            }
        } catch (Exception e) {
            log.error("Error inserting FAP task assignee record", e);
            FapTaskAssigneeInsertResponse errorResponse = FapTaskAssigneeInsertResponse.builder()
                .success(false)
                .message("Internal server error: " + e.getMessage())
                .build();
            return ResponseEntity.internalServerError().body(errorResponse);
        }
    }

    @PostMapping("/hierarchy")
    public ResponseEntity<FapHierarchyInsertResponse> insertHierarchy(@RequestBody FapHierarchyInsertRequest request) {
        try {
            // Input validation
            if (request == null) {
                return ResponseEntity.badRequest().build();
            }
            
            log.info("Inserting FAP hierarchy: {}", request);
            FapHierarchyInsertResponse response = hierarchyService.insertHierarchy(request);
            
            if (response.isSuccess()) {
                return ResponseEntity.ok(response);
            } else {
                return ResponseEntity.badRequest().body(response);
            }
        } catch (Exception e) {
            log.error("Error inserting FAP hierarchy", e);
            FapHierarchyInsertResponse errorResponse = FapHierarchyInsertResponse.builder()
                .success(false)
                .message("Internal server error: " + e.getMessage())
                .build();
            return ResponseEntity.internalServerError().body(errorResponse);
        }
    }
}

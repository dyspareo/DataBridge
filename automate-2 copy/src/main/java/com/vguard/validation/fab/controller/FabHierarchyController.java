package com.vguard.validation.fab.controller;

import com.vguard.validation.fab.dto.FabHierarchyCheckResponse;
import com.vguard.validation.fab.entity.FabTaskAssignmentMap;
import com.vguard.validation.fab.service.FabHierarchyService;
import jakarta.validation.ValidationException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/fab/hierarchy")
public class FabHierarchyController {
    private final FabHierarchyService fabHierarchyService;

    @GetMapping("/check")
    public ResponseEntity<FabHierarchyCheckResponse> check(
            @RequestParam String plantCode,
            @RequestParam String departmentCode
    ) {
        return ResponseEntity.ok(fabHierarchyService.checkHierarchy(plantCode, departmentCode));
    }

    @PostMapping("/recipient/insert")
    public ResponseEntity<FabTaskAssignmentMap> insert(@RequestBody FabTaskAssignmentMap request) {
        return ResponseEntity.ok(fabHierarchyService.insertRecipient(request));
    }

    @GetMapping("/plant/{code}")
    public ResponseEntity<List<FabTaskAssignmentMap>> getByPlant(@PathVariable("code") String code) {
        return ResponseEntity.ok(fabHierarchyService.getByPlant(code));
    }

    @GetMapping("/department/{code}")
    public ResponseEntity<List<FabTaskAssignmentMap>> getByDepartment(@PathVariable("code") String code) {
        return ResponseEntity.ok(fabHierarchyService.getByDepartment(code));
    }

    @GetMapping("/department-id")
    public ResponseEntity<Map<String, Object>> getDepartmentId(@RequestParam("departmentCode") String departmentCode) {
        Integer deptId = fabHierarchyService.findDeptIdByDepartmentCode(departmentCode);
        Map<String, Object> body = new HashMap<>();
        body.put("deptId", deptId);
        return ResponseEntity.ok(body);
    }

    @ExceptionHandler(ValidationException.class)
    public ResponseEntity<Map<String, Object>> handleValidation(ValidationException ex) {
        return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", ex.getMessage()
        ));
    }
}

package com.vguard.validation.fab.controller;

import lombok.extern.slf4j.Slf4j;
import com.vguard.validation.fab.entity.WbsDepartmentMaster;
import com.vguard.validation.fab.service.WbsDepartmentService;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.ValidationException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/fab/department")
@Slf4j
public class FabDepartmentController {
    private final WbsDepartmentService service;

    @PostMapping("/insert")
    public ResponseEntity<?> insert(@RequestBody WbsDepartmentMaster request, HttpSession session) {
        Integer userId = null;
        Object attr = session == null ? null : session.getAttribute("userId");
        if (attr instanceof Number n) userId = n.intValue();
        WbsDepartmentMaster saved = service.insertDepartment(request, userId);
        return ResponseEntity.ok(saved);
    }

    @GetMapping("/all")
    public ResponseEntity<List<WbsDepartmentMaster>> all() {
        return ResponseEntity.ok(service.getAllActive());
    }

    @GetMapping("/code/{code}")
    public ResponseEntity<?> byCode(@PathVariable("code") String code) {
        WbsDepartmentMaster found = service.getByCode(code);
        if (found == null) return ResponseEntity.status(404).body(Map.of("message", "Department not found"));
        return ResponseEntity.ok(found);
    }

    @ExceptionHandler(ValidationException.class)
    public ResponseEntity<Map<String, Object>> handleValidation(ValidationException ex) {
        return ResponseEntity.badRequest().body(Map.of("message", ex.getMessage()));
    }
}

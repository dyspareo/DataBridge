package com.vguard.validation.controller;

import lombok.extern.slf4j.Slf4j;
import com.vguard.validation.repository.HierarchyRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/hierarchy")
@Slf4j
public class HierarchyController {
    private final HierarchyRepository repo;

    public HierarchyController(HierarchyRepository repo) {
        this.repo = repo;
    }

    @GetMapping("/check")
    public ResponseEntity<?> check(
            @RequestParam("plantCode") String plantCode,
            @RequestParam("deptCode") String deptCode,
            @RequestParam("email") String email
    ) {
        List<Map<String, Object>> rows = repo.check(plantCode, deptCode, email);
        Map<String, Object> body = new HashMap<>();
        body.put("results", rows);
        return ResponseEntity.ok(body);
    }

    @GetMapping("/user/login-name")
    public ResponseEntity<?> getLoginNameByEmail(@RequestParam("email") String email) {
        Map<String, Object> body = new HashMap<>();
        body.put("email", email);
        try {
            String loginName = repo.findLoginNameByEmail(email);
            body.put("login_name", loginName);
            body.put("success", loginName != null);
        } catch (Exception ex) {
            body.put("login_name", null);
            body.put("success", false);
        }
        return ResponseEntity.ok(body);
    }

    @GetMapping("/user/id")
    public ResponseEntity<?> getUserIdByEmail(@RequestParam("email") String email) {
        Map<String, Object> body = new HashMap<>();
        body.put("email", email);
        try {
            Long id = repo.findUserIdByEmail(email);
            body.put("id", id);
            body.put("success", id != null);
        } catch (Exception ex) {
            body.put("id", null);
            body.put("success", false);
        }
        return ResponseEntity.ok(body);
    }

    @GetMapping("/all")
    public ResponseEntity<?> getAll() {
        List<Map<String, Object>> rows = repo.getAll();
        Map<String, Object> body = new HashMap<>();
        body.put("results", rows);
        return ResponseEntity.ok(body);
    }

    // Lookups moved under hierarchy namespace
    @GetMapping("/plant/{plantCode}")
    public ResponseEntity<?> getPlantName(@PathVariable("plantCode") String plantCodeRaw) {
        Map<String, Object> body = new HashMap<>();
        body.put("plant_code", plantCodeRaw);
        try {
            int plantCode = Integer.parseInt(plantCodeRaw.trim());
            String name = repo.findPlantNameByCode(plantCode);
            body.put("plant_name", name);
            body.put("success", name != null);
        } catch (Exception ex) {
            body.put("plant_name", null);
            body.put("success", false);
        }
        return ResponseEntity.ok(body);
    }

    @GetMapping("/department/{deptCode}")
    public ResponseEntity<?> getDepartmentName(@PathVariable("deptCode") String deptCodeRaw) {
        Map<String, Object> body = new HashMap<>();
        body.put("dept_code", deptCodeRaw);
        try {
            String cleaned = deptCodeRaw == null ? "" : deptCodeRaw.trim();
            if (!cleaned.isEmpty() && (cleaned.charAt(0) == 'D' || cleaned.charAt(0) == 'd')) {
                cleaned = cleaned.substring(1);
            }
            int deptCode = Integer.parseInt(cleaned);
            String name = repo.findDepartmentNameByCode(deptCode);
            body.put("department_name", name);
            body.put("success", name != null);
        } catch (Exception ex) {
            body.put("department_name", null);
            body.put("success", false);
        }
        return ResponseEntity.ok(body);
    }

    @PostMapping("/recipient/insert")
    public ResponseEntity<?> insertRecipient(@RequestBody Map<String, Object> p) {
        String plantName = String.valueOf(p.getOrDefault("plant_name", ""));
        String plantCode = String.valueOf(p.getOrDefault("plant_code", ""));
        String deptName = String.valueOf(p.getOrDefault("dept_name", ""));
        String deptCode = String.valueOf(p.getOrDefault("dept_code", ""));
        String pocLoginName = String.valueOf(p.getOrDefault("poc_login_name", ""));
        String pocEmpCode = String.valueOf(p.getOrDefault("poc_emp_code", ""));
        String pocEmail = String.valueOf(p.getOrDefault("poc_email", ""));
        String approverLoginName = String.valueOf(p.getOrDefault("approver_login_name", ""));
        String approverEmpCode = String.valueOf(p.getOrDefault("approver_emp_code", ""));
        String approverEmail = String.valueOf(p.getOrDefault("approver_email", ""));
        String cbs1LoginName = String.valueOf(p.getOrDefault("cbs1_login_name", ""));
        String cbs1EmpCode = String.valueOf(p.getOrDefault("cbs1_emp_code", ""));
        String cbs1Email = String.valueOf(p.getOrDefault("cbs1_email", ""));
        String cbs2LoginName = String.valueOf(p.getOrDefault("cbs2_login_name", ""));
        String cbs2EmpCode = String.valueOf(p.getOrDefault("cbs2_emp_code", ""));
        String cbs2Email = String.valueOf(p.getOrDefault("cbs2_email", ""));

        long id = repo.insertRecipient(
                plantName, plantCode, deptName, deptCode,
                pocLoginName, pocEmpCode, pocEmail,
                approverLoginName, approverEmpCode, approverEmail,
                cbs1LoginName, cbs1EmpCode, cbs1Email,
                cbs2LoginName, cbs2EmpCode, cbs2Email
        );
        return ResponseEntity.ok(Map.of("success", id > 0, "id", id));
    }
}

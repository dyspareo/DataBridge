package com.vguard.validation.controller;

import lombok.extern.slf4j.Slf4j;
import com.vguard.validation.repository.MemberRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/member")
@Slf4j
public class MemberController {
    private final MemberRepository repo;

    public MemberController(MemberRepository repo) {
        this.repo = repo;
    }

    @GetMapping("/roles")
    public ResponseEntity<?> roles(@RequestParam(required = false) String appName, @RequestParam(required = false) String processName) {
        List<Map<String, Object>> rows = repo.fetchRoles(appName, processName);
        Map<String, Object> body = new HashMap<>();
        body.put("results", rows);
        return ResponseEntity.ok(body);
    }

    @GetMapping("/instances")
    public ResponseEntity<?> instances() {
        List<Map<String, Object>> rows = repo.fetchInstances();
        Map<String, Object> body = new HashMap<>();
        body.put("results", rows);
        return ResponseEntity.ok(body);
    }

    @GetMapping("/processes")
    public ResponseEntity<?> processes() {
        List<Map<String, Object>> rows = repo.fetchProcesses();
        Map<String, Object> body = new HashMap<>();
        body.put("results", rows);
        return ResponseEntity.ok(body);
    }

    @GetMapping("/processes-by-app")
    public ResponseEntity<?> processesByApp(@RequestParam String appName) {
        List<Map<String, Object>> rows = repo.fetchProcessesByAppName(appName);
        Map<String, Object> body = new HashMap<>();
        body.put("results", rows);
        return ResponseEntity.ok(body);
    }

    @GetMapping("/check-user-role")
    public ResponseEntity<?> checkUserRole(@RequestParam String email, @RequestParam String expectedRole) {
        try {
            Map<String, Object> result = repo.checkUserRoleAssignment(email, expectedRole);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Error checking user role: " + e.getMessage()));
        }
    }

    @PostMapping("/insert")
    public ResponseEntity<?> insert(@RequestBody Map<String, Object> payload) {
        try {
            Object instObj = payload.get("ormInstanceId");
            Object userObj = payload.get("userId");
            Object typeObj = payload.get("userType");
            int ormInstanceId = Integer.parseInt(String.valueOf(instObj));
            long userId = Long.parseLong(String.valueOf(userObj));
            int userType = Integer.parseInt(String.valueOf(typeObj));
            long newId = repo.insertMember(ormInstanceId, userId, userType);
            Map<String, Object> body = new HashMap<>();
            body.put("success", newId > 0);
            body.put("id", newId);
            return ResponseEntity.ok(body);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", "invalid_payload"));
        }
    }
}

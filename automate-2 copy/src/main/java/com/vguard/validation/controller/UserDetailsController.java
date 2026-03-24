package com.vguard.validation.controller;

import com.vguard.validation.dto.UserDetailRow;
import com.vguard.validation.repository.UserDetailsRepository;
import com.vguard.validation.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/user")
public class UserDetailsController {

    private static final Logger log = LoggerFactory.getLogger(UserDetailsController.class);

    private final UserDetailsRepository detailsRepo;
    private final UserRepository userRepo;

    public UserDetailsController(UserDetailsRepository detailsRepo, UserRepository userRepo) {
        this.detailsRepo = detailsRepo;
        this.userRepo = userRepo;
    }

    @GetMapping("/details")
    public ResponseEntity<?> details(@RequestParam("userId") String userId) {
        try {
            String raw = userId == null ? "" : userId;
            String noWs = raw.replaceAll("[\\s\\r\\n\\t]", "");
            // Correct normalization for lookup: remove brackets only, do NOT replace '[' with '@'
            String clean = noWs.replace("[", "").replace("]", "");
            // Display normalization for messages: if bracketed and no '@', render as name@domain.com for clarity
            String display = (noWs.contains("@") ? noWs : noWs.replace('[', '@').replace("]", ""));
            log.info("GET /api/user/details userIdParam='{}' cleaned='{}'", raw, clean);

            // Branch: numeric uses numeric-only query; otherwise use email/uid combined query
            List<UserDetailRow> rows;
            if (clean.matches("^[0-9]+$")) {
                Long uidOpt = null;
                try { uidOpt = Long.parseLong(clean); } catch (NumberFormatException ignore) {}
                try {
                    rows = detailsRepo.findByUserIdLong(uidOpt);
                } catch (Exception ex) {
                    log.error("Membership fetch failed for uid={}", uidOpt, ex);
                    Map<String, Object> body = new HashMap<>();
                    body.put("results", List.of());
                    return ResponseEntity.ok(body);
                }
            } else {
                try {
                    rows = detailsRepo.findByEmailOrUid(clean, null);
                } catch (Exception ex) {
                    log.error("Membership fetch failed for email identifier='{}'", clean, ex);
                    Map<String, Object> body = new HashMap<>();
                    body.put("results", List.of());
                    return ResponseEntity.ok(body);
                }
            }
            Map<String, Object> body = new HashMap<>();
            body.put("results", rows);
            log.info("Returned {} rows for identifier='{}'", rows.size(), clean);
            return ResponseEntity.ok(body);
        } catch (Exception e) {
            log.error("GET /api/user/details failed for userId={}", userId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "internal_server_error"));
        }
    }

    @GetMapping("/get-username")
    public ResponseEntity<?> getUsername(@RequestParam("email") String email) {
        try {
            if (email == null || email.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Email parameter is required"));
            }
            
            String cleanEmail = email.trim();
            log.info("GET /api/user/get-username email='{}'", cleanEmail);
            
            String username = userRepo.findUsernameByEmail(cleanEmail);
            
            if (username != null) {
                Map<String, Object> body = new HashMap<>();
                body.put("success", true);
                body.put("username", username);
                return ResponseEntity.ok(body);
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            log.error("GET /api/user/get-username failed for email={}", email, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "internal_server_error"));
        }
    }

    @GetMapping("/get-userid")
    public ResponseEntity<?> getUserId(@RequestParam("username") String username) {
        try {
            if (username == null || username.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Username parameter is required"));
            }
            
            String cleanUsername = username.trim();
            log.info("GET /api/user/get-userid username='{}'", cleanUsername);
            
            Long userId = userRepo.findUserIdByUsername(cleanUsername);
            
            if (userId != null) {
                Map<String, Object> body = new HashMap<>();
                body.put("success", true);
                body.put("userId", userId);
                return ResponseEntity.ok(body);
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            log.error("GET /api/user/get-userid failed for username={}", username, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "internal_server_error"));
        }
    }
}

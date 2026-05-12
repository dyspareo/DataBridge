package com.vguard.validation.controller;

import lombok.extern.slf4j.Slf4j;
import com.vguard.validation.model.DepartmentInsertRequest;
import com.vguard.validation.model.PlantInsertRequest;
import com.vguard.validation.model.UserResponse;
import com.vguard.validation.model.ValidationRequest;
import com.vguard.validation.model.ValidationResponse;
import com.vguard.validation.repository.DepartmentRepository;
import com.vguard.validation.repository.PlantRepository;
import com.vguard.validation.repository.UserRepository;
import com.vguard.validation.service.ValidationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
@Slf4j
public class ValidationController {

    private final ValidationService validationService;
    private final PlantRepository plantRepository;
    private final DepartmentRepository departmentRepository;
    private final UserRepository userRepository;

    @Autowired
    public ValidationController(ValidationService validationService,
                                PlantRepository plantRepository,
                                DepartmentRepository departmentRepository,
                                UserRepository userRepository) {
        this.validationService = validationService;
        this.plantRepository = plantRepository;
        this.departmentRepository = departmentRepository;
        this.userRepository = userRepository;
    }

    @PostMapping("/validate")
    public ResponseEntity<ValidationResponse> validateCodes(@RequestBody ValidationRequest request) {
        ValidationResponse response = validationService.validateAsync(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/validate/batch")
    public ResponseEntity<java.util.List<ValidationResponse>> validateBatch(@RequestBody java.util.List<ValidationRequest> requests) {
        java.util.List<ValidationResponse> out = new java.util.ArrayList<>();
        if (requests != null) {
            for (ValidationRequest r : requests) {
                out.add(validationService.validateAsync(r));
            }
        }
        return ResponseEntity.ok(out);
    }

    @GetMapping("/health")
    public ResponseEntity<String> healthCheck() {
        return ResponseEntity.ok("Service running");
    }

    @PostMapping("/validate/emails")
    public ResponseEntity<Map<String, Object>> validateEmails(@RequestBody Map<String, java.util.List<String>> body) {
        java.util.List<String> emails = body == null ? java.util.Collections.emptyList() : body.getOrDefault("emails", java.util.Collections.emptyList());
        java.util.List<Map<String, Object>> results = new java.util.ArrayList<>();
        if (emails != null) {
            for (String e : emails) {
                Map<String, Object> item = new java.util.HashMap<>();
                item.put("email", e);
                Long id = userRepository.findIdByEmail(e).orElse(null);
                if (id != null) item.put("userId", id);
                results.add(item);
            }
        }
        Map<String, Object> out = new java.util.HashMap<>();
        out.put("results", results);
        return ResponseEntity.ok(out);
    }

    @PostMapping("/plant")
    public ResponseEntity<Map<String, Object>> insertPlant(@RequestBody PlantInsertRequest req) {
        Map<String, Object> body = new HashMap<>();
        String plantCode = req.getPlantCode() == null ? "" : req.getPlantCode().trim();
        String code = req.getCode() == null ? "" : req.getCode().trim();
        String plantName = req.getPlantName() == null ? "" : req.getPlantName().trim();
        if (plantCode.isEmpty() || plantName.isEmpty()) {
            body.put("success", false);
            body.put("message", "plantCode and plantName are required");
            return ResponseEntity.badRequest().body(body);
        }
        String effectiveCode = code.isEmpty() ? plantCode : code;
        if (plantRepository.countInMasterByCodeOrPlantCode(effectiveCode) > 0) {
            body.put("success", false);
            body.put("message", "Plant already exists");
            return ResponseEntity.ok(body);
        }
        int rows = plantRepository.insertMaster(
                effectiveCode,
                nullToEmpty(req.getPurchaseOrg()),
                nullToEmpty(req.getCompanyCodeId()),
                nullToEmpty(req.getCompanyCode()),
                plantCode,
                plantName,
                nullToEmpty(req.getPlantShortName()),
                nullToEmpty(req.getBranchCode()),
                nullToEmpty(req.getSapValue()),
                req.getStatusId(),
                req.getCreatedBy(),
                nullIfBlank(req.getCreatedDate()),
                nullIfBlank(req.getUpdatedDate()),
                req.getUpdatedBy()
        );
        body.put("success", rows > 0);
        body.put("message", rows > 0 ? "Plant inserted" : "Insert failed");
        return ResponseEntity.ok(body);
    }

    @PostMapping("/department")
    public ResponseEntity<Map<String, Object>> insertDepartment(@RequestBody DepartmentInsertRequest req) {
        Map<String, Object> body = new HashMap<>();
        String code = req.getDeptCode() == null ? "" : req.getDeptCode().trim();
        String name = req.getDeptName() == null ? "" : req.getDeptName().trim();
        if (code.isEmpty() || name.isEmpty()) {
            body.put("success", false);
            body.put("message", "departmentCode and departmentName are required");
            return ResponseEntity.badRequest().body(body);
        }
        if (departmentRepository.countInMasterByDepartmentCode(code) > 0) {
            body.put("success", false);
            body.put("message", "Department already exists");
            return ResponseEntity.ok(body);
        }
        int rows = departmentRepository.insertMaster(
                code,
                name,
                nullToEmpty(req.getDeptShortName()),
                nullToEmpty(req.getDeptSapValue()),
                req.getStatusId(),
                nullIfBlank(req.getCreatedDate()),
                req.getCreatedBy(),
                nullIfBlank(req.getUpdatedDate()),
                req.getUpdatedBy()
        );
        body.put("success", rows > 0);
        body.put("message", rows > 0 ? "Department inserted" : "Insert failed");
        return ResponseEntity.ok(body);
    }

    private String nullToEmpty(String v) { return v == null ? "" : v; }
    private String nullIfBlank(String v) {
        if (v == null) return null;
        String t = v.trim();
        return t.isEmpty() ? null : t;
    }
    
    @GetMapping("/user/{email}")
    public ResponseEntity<UserResponse> checkUserByEmail(@PathVariable String email) {
        return userRepository.findByEmail(email)
                .map(user -> ResponseEntity.ok(
                    UserResponse.found(
                        user.getLogin_name(),
                        user.getFirst_name(),
                        user.getLast_name(),
                        user.getEmail_id1(),
                        user.getStatus_id()
                    )
                ))
                .orElse(ResponseEntity.ok(UserResponse.notFound()));
    }

    @GetMapping("/user-exists")
    public ResponseEntity<Map<String, Object>> userExists(@RequestParam("email") String email) {
        Map<String, Object> body = new HashMap<>();
        String safeEmail = email == null ? "" : email.trim();
        int count = safeEmail.isEmpty() ? 0 : userRepository.countByEmail(safeEmail);
        body.put("email", safeEmail);
        body.put("count", count);
        body.put("present", count > 0);
        return ResponseEntity.ok(body);
    }
}

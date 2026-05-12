package com.vguard.validation.fap.controller;

import lombok.extern.slf4j.Slf4j;
import com.vguard.validation.fap.dto.FapCheckRequest;
import com.vguard.validation.fap.dto.FapCheckResponse;
import com.vguard.validation.fap.dto.FapValidationRowRequest;
import com.vguard.validation.fap.dto.FapValidationRowResponse;
import com.vguard.validation.fap.service.FapValidationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/fap")
@Slf4j
public class FapValidationController {
    private final FapValidationService service;

    @PostMapping("/validate")
    public ResponseEntity<List<FapValidationRowResponse>> validate(@RequestBody List<FapValidationRowRequest> rows) {
        // Input validation
        if (rows == null) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(service.validateRows(rows));
    }

    @PostMapping("/checks/{checkType}")
    public ResponseEntity<FapCheckResponse> runCheck(
            @PathVariable("checkType") String checkType,
            @RequestBody FapCheckRequest request
    ) {
        // Input validation
        if (checkType == null || checkType.trim().isEmpty()) {
            return ResponseEntity.badRequest().build();
        }
        if (request == null) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(service.runCheck(checkType.trim(), request));
    }
}

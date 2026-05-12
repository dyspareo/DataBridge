package com.vguard.validation.fac.controller;

import com.vguard.validation.fac.dto.FacHierarchyInsertRequest;
import com.vguard.validation.fac.dto.FacHierarchyInsertResponse;
import com.vguard.validation.fac.service.FacHierarchyService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/fac")
@Slf4j
public class FacHierarchyController {
    private final FacHierarchyService service;

    @PostMapping("/hierarchy")
    public ResponseEntity<FacHierarchyInsertResponse> insert(@RequestBody FacHierarchyInsertRequest request) {
        log.info("Inserting FAC hierarchy: {}", request);
        FacHierarchyInsertResponse response = service.insertHierarchy(request);
        return response.isSuccess()
                ? ResponseEntity.ok(response)
                : ResponseEntity.badRequest().body(response);
    }

    @GetMapping("/hierarchy/check")
    public ResponseEntity<Map<String, Object>> check(
            @RequestParam("plantCode") String plantCode,
            @RequestParam("deptCode") String deptCode,
            @RequestParam(value = "lcmUser", required = false) String lcmUser
    ) {
        Map<String, Object> body = new HashMap<>();
        body.put("results", service.checkHierarchyActive(plantCode, deptCode, lcmUser));
        return ResponseEntity.ok(body);
    }

    @GetMapping("/master/names")
    public ResponseEntity<Map<String, Object>> resolveNames(
            @RequestParam("plantCode") String plantCode,
            @RequestParam("deptCode") String deptCode
    ) {
        Map<String, Object> body = new HashMap<>();
        body.put("plantCode", plantCode);
        body.put("deptCode", deptCode);
        body.putAll(service.resolvePlantAndDeptNames(plantCode, deptCode));
        return ResponseEntity.ok(body);
    }
}

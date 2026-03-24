package com.vguard.validation.fab.controller;

import com.vguard.validation.fab.dto.ExcelRowDTO;
import com.vguard.validation.fab.dto.ValidationResultDTO;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/fab/simple")
@Slf4j
public class FabSimpleController {

    @PostMapping("/validate")
    public ResponseEntity<List<ValidationResultDTO>> validateSimple(@RequestBody List<ExcelRowDTO> excelRows) {
        log.info("Simple FAB validation for {} rows", excelRows.size());
        
        List<ValidationResultDTO> results = new ArrayList<>();
        
        for (ExcelRowDTO row : excelRows) {
            List<String> errors = new ArrayList<>();
            
            // Simple validation without database
            if (row.getPlantCode() == null || row.getPlantCode().isEmpty()) {
                errors.add("Plant Code is missing");
            }
            
            if (row.getDepartmentCode() == null || row.getDepartmentCode().isEmpty()) {
                errors.add("Department Code is missing");
            }
            
            String status = errors.isEmpty() ? "VALID" : "INVALID";
            results.add(new ValidationResultDTO(row.getRowNumber(), status, errors, new ArrayList<>()));
        }
        
        return ResponseEntity.ok(results);
    }
}

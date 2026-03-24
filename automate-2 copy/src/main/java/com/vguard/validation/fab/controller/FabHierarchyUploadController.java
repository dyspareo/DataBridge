package com.vguard.validation.fab.controller;

import com.vguard.validation.fab.dto.ExcelRowDTO;
import com.vguard.validation.fab.dto.ValidationResultDTO;
import com.vguard.validation.fab.service.ExcelParserService;
import com.vguard.validation.fab.service.FabValidationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/fab/hierarchy")
public class FabHierarchyUploadController {

    private final ExcelParserService excelParserService;
    private final FabValidationService fabValidationService;

    @PostMapping("/upload")
    public ResponseEntity<List<ValidationResultDTO>> uploadHierarchy(@RequestParam("file") MultipartFile file) {
        log.info("Starting FAB hierarchy upload process for file: {}", file.getOriginalFilename());

        // Validate file
        if (file.isEmpty()) {
            throw new IllegalArgumentException("File is empty");
        }

        String filename = file.getOriginalFilename();
        if (filename == null || !filename.toLowerCase().endsWith(".xlsx")) {
            throw new IllegalArgumentException("Only .xlsx files are supported");
        }

        try {
            // Parse Excel file
            List<ExcelRowDTO> excelRows = excelParserService.parse(file);
            log.info("Successfully parsed {} rows from Excel file", excelRows.size());

            if (excelRows.isEmpty()) {
                throw new IllegalArgumentException("Excel file has no data rows");
            }

            // Validate rows
            List<ValidationResultDTO> validationResults = fabValidationService.validate(excelRows);
            log.info("Validation completed. Total rows processed: {}", validationResults.size());

            return ResponseEntity.ok(validationResults);

        } catch (Exception e) {
            log.error("Error processing FAB hierarchy upload: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to process file: " + e.getMessage(), e);
        }
    }
}

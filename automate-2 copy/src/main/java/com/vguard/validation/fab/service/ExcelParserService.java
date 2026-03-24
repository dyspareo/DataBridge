package com.vguard.validation.fab.service;

import com.vguard.validation.fab.dto.ExcelRowDTO;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
public class ExcelParserService {

    public List<ExcelRowDTO> parse(MultipartFile file) throws IOException {
        List<ExcelRowDTO> rows = new ArrayList<>();
        
        try (Workbook workbook = WorkbookFactory.create(file.getInputStream())) {
            Sheet sheet = workbook.getSheetAt(0); // Get first sheet
            
            DataFormatter dataFormatter = new DataFormatter();
            
            // Skip header row (row 0), start from row 1
            for (int rowIndex = 1; rowIndex <= sheet.getLastRowNum(); rowIndex++) {
                Row row = sheet.getRow(rowIndex);
                
                // Skip empty rows
                if (row == null) {
                    continue;
                }
                
                try {
                    ExcelRowDTO excelRow = parseRow(row, rowIndex + 1, dataFormatter);
                    rows.add(excelRow);
                } catch (Exception e) {
                    log.warn("Error parsing row {}: {}", rowIndex + 1, e.getMessage());
                    // Continue with next row instead of failing completely
                }
            }
        }
        
        log.info("Successfully parsed {} rows from Excel file", rows.size());
        return rows;
    }
    
    private ExcelRowDTO parseRow(Row row, int rowNumber, DataFormatter dataFormatter) {
        // Read all cells safely
        String plantCode = getCellStringValue(row, 0, dataFormatter);
        String departmentCode = getCellStringValue(row, 1, dataFormatter);
        String initiator = getCellStringValue(row, 2, dataFormatter);
        String reviewer = getCellStringValue(row, 3, dataFormatter);
        String cbsGaRaw = getCellStringValue(row, 4, dataFormatter);
        String businessPartner1 = getCellStringValue(row, 5, dataFormatter);
        String businessPartner2 = getCellStringValue(row, 6, dataFormatter);
        String approverDoA1 = getCellStringValue(row, 7, dataFormatter);
        String approverDoA2 = getCellStringValue(row, 8, dataFormatter);
        
        // Split CBS GA emails by comma
        List<String> cbsGaEmails = Arrays.stream(cbsGaRaw.split(","))
                .map(String::trim)
                .filter(email -> !email.isEmpty())
                .collect(Collectors.toList());
        
        return new ExcelRowDTO(
                rowNumber,
                plantCode,
                departmentCode,
                initiator,
                reviewer,
                cbsGaEmails,
                businessPartner1,
                businessPartner2,
                approverDoA1,
                approverDoA2
        );
    }
    
    private String getCellStringValue(Row row, int cellIndex, DataFormatter dataFormatter) {
        Cell cell = row.getCell(cellIndex);
        if (cell == null) {
            return "";
        }
        
        try {
            return dataFormatter.formatCellValue(cell).trim();
        } catch (Exception e) {
            log.warn("Error reading cell at row {}, column {}: {}", 
                    row.getRowNum() + 1, cellIndex + 1, e.getMessage());
            return "";
        }
    }
}

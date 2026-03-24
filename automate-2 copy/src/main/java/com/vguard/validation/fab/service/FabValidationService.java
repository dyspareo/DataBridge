package com.vguard.validation.fab.service;

import com.vguard.validation.fab.dto.ExcelRowDTO;
import com.vguard.validation.fab.dto.ValidationResultDTO;
import com.vguard.validation.fab.repository.FabDepartmentRepository;
import com.vguard.validation.fab.repository.FabPlantRepository;
import com.vguard.validation.fab.repository.FabUserRepository;
import com.vguard.validation.fab.util.EmailValidator;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class FabValidationService {

    private final FabPlantRepository plantRepository;
    private final FabDepartmentRepository departmentRepository;
    private final FabUserRepository userRepository;

    public List<ValidationResultDTO> validate(List<ExcelRowDTO> excelRows) {
        log.info("Starting FAB validation for {} rows", excelRows.size());
        
        // STEP 2: VALIDATE EACH ROW
        List<ValidationResultDTO> results = new ArrayList<>();
        
        for (ExcelRowDTO row : excelRows) {
            ValidationResultDTO result = validateRow(row);
            results.add(result);
        }
        
        log.info("FAB validation completed. Valid rows: {}, Invalid rows: {}", 
                results.stream().mapToInt(r -> r.getStatus().equals("VALID") ? 1 : 0).sum(),
                results.stream().mapToInt(r -> r.getStatus().equals("INVALID") ? 1 : 0).sum());
        
        return results;
    }
    
    private ValidationResultDTO validateRow(ExcelRowDTO row) {
        
        List<String> errors = new ArrayList<>();
        
        // Add null safety checks
        if (row == null) {
            return new ValidationResultDTO(0, "INVALID", List.of("Row data is null"), new ArrayList<>());
        }
        
        String plantCode = row.getPlantCode() != null ? row.getPlantCode().toUpperCase().trim() : "";
        String departmentCode = row.getDepartmentCode() != null ? row.getDepartmentCode().toUpperCase().trim() : "";
        
        // [A] PLANT VALIDATION
        if (plantCode.isEmpty()) {
            errors.add("Plant Code is missing");
        } else if (!plantRepository.existsByCode(plantCode)) {
            errors.add("Plant code '" + plantCode + "' does not exist");
        }
        
        // [B] DEPARTMENT VALIDATION
        if (departmentCode.isEmpty()) {
            errors.add("Department Code is missing");
        } else if (!departmentRepository.existsByWbsDepartmentCode(departmentCode)) {
            errors.add("Department code '" + departmentCode + "' does not exist");
        }
        
        // [C] USER VALIDATION - Add null safety
        validateSingleEmail(row.getInitiator(), "Initiator", errors);
        validateSingleEmail(row.getReviewer(), "Reviewer", errors);
        validateSingleEmail(row.getBusinessPartner1(), "RCM/FCC-Business Partner 1", errors);
        validateSingleEmail(row.getBusinessPartner2(), "Business Partner 2", errors);
        validateSingleEmail(row.getApproverDoA1(), "Approver as per DoA 1", errors);
        validateSingleEmail(row.getApproverDoA2(), "Approver as per DoA 2", errors);
        
        // [D] CBS GA MULTI-EMAIL VALIDATION - Add null safety
        List<String> cbsEmails = row.getCbsGaEmails();
        if (cbsEmails == null || cbsEmails.isEmpty()) {
            errors.add("CBS GA email is missing");
        } else {
            for (int i = 0; i < cbsEmails.size(); i++) {
                String email = cbsEmails.get(i);
                validateSingleEmail(email, "CBS GA " + (i + 1), errors);
            }
        }
        
        // [E] BUILD RESULT
        String status = errors.isEmpty() ? "VALID" : "INVALID";
        return new ValidationResultDTO(row.getRowNumber(), status, errors, new ArrayList<>());
    }
    
    private void validateSingleEmail(String email, String fieldName, List<String> errors) {
        if (email == null || email.isEmpty()) {
            errors.add(fieldName + " email is missing");
        } else if (!EmailValidator.isValid(email)) {
            errors.add("Invalid email format for " + fieldName + ": " + email);
        } else if (userRepository.countByEmail(email.trim()) <= 0) {
            errors.add("User " + email + " not found");
        }
    }

}

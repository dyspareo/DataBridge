package com.vguard.validation.service;

import com.vguard.validation.model.*;
import com.vguard.validation.repository.DepartmentRepository;
import com.vguard.validation.repository.PlantRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataAccessException;
import org.springframework.stereotype.Service;

import java.util.concurrent.CompletableFuture;

@Service
public class ValidationService {

    @Autowired
    private PlantRepository plantRepo;
    
    @Autowired
    private DepartmentRepository deptRepo;

    public ValidationResponse validateAsync(ValidationRequest request) {
        CompletableFuture<ValidationResult> plantFuture =
                CompletableFuture.supplyAsync(() -> validatePlant(request.getPlantCode()));
        CompletableFuture<ValidationResult> deptFuture =
                CompletableFuture.supplyAsync(() -> validateDepartment(request.getDepartmentCode()));

        CompletableFuture.allOf(plantFuture, deptFuture).join();

        ValidationResponse response = new ValidationResponse();
        try {
            ValidationResult plant = plantFuture.get();
            ValidationResult dept = deptFuture.get();

            response.setPlantCode(plant.getCode());
            response.setPlantStatus(plant.getStatus());
            response.setPlantMessage(plant.getMessage());

            response.setDepartmentCode(dept.getCode());
            response.setDepartmentStatus(dept.getStatus());
            response.setDepartmentMessage(dept.getMessage());
        } catch (Exception e) {
            response.setPlantStatus("Error");
            response.setDepartmentStatus("Error");
            response.setPlantMessage(e.getMessage());
        }
        return response;
    }

    private ValidationResult validatePlant(String code) {
        if (code == null || code.isBlank())
            return new ValidationResult("Not Existing", "Empty Plant Code", null);
        try {
            int count = plantRepo.countInMasterByPlantCode(code);
            if (count > 0)
                return new ValidationResult("Existing", "-", code);
            return new ValidationResult("Not Existing", "Plant not found", code);
        } catch (DataAccessException ex) {
            return new ValidationResult("Error", "DB error while checking plant: " + ex.getMostSpecificCause().getMessage(), code);
        }
    }

    private ValidationResult validateDepartment(String code) {
        if (code == null || code.isBlank())
            return new ValidationResult("Not Existing", "Empty Department Code", null);
        String normalized = code.trim();
        if (!normalized.toUpperCase().startsWith("D")) {
            normalized = "D" + normalized;
        }
        try {
            int count = deptRepo.countInMasterByDepartmentCode(normalized);
            if (count > 0)
                return new ValidationResult("Existing", "-", normalized);
            return new ValidationResult("Not Existing", "Department not found", normalized);
        } catch (DataAccessException ex) {
            return new ValidationResult("Error", "DB error while checking department: " + ex.getMostSpecificCause().getMessage(), normalized);
        }
    }
}

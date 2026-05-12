package com.vguard.validation.service;

import lombok.extern.slf4j.Slf4j;
import com.vguard.validation.model.ValidationRequest;
import com.vguard.validation.model.ValidationResponse;
import com.vguard.validation.repository.PlantRepository;
import com.vguard.validation.repository.DepartmentRepository;
import com.vguard.validation.repository.UserRepository;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class ValidationService {

    private final PlantRepository plantRepository;
    private final DepartmentRepository departmentRepository;
    private final UserRepository userRepository;

    public ValidationService(PlantRepository plantRepository, 
                           DepartmentRepository departmentRepository,
                           UserRepository userRepository) {
        this.plantRepository = plantRepository;
        this.departmentRepository = departmentRepository;
        this.userRepository = userRepository;
    }

    public ValidationResponse validateAsync(ValidationRequest request) {
        ValidationResponse response = new ValidationResponse();
        
        // Set request codes
        response.setPlantCode(request.getPlantCode());
        response.setDepartmentCode(request.getDepartmentCode());
        
        // Validate plant code
        if (request.getPlantCode() != null && !request.getPlantCode().trim().isEmpty()) {
            int plantCount = plantRepository.countInMasterByCodeOrPlantCode(request.getPlantCode());
            response.setPlantStatus(plantCount > 0 ? "Existing" : "Not Existing");
            response.setPlantMessage(plantCount > 0 ? "Record found" : "Plant not found");
        } else {
            response.setPlantStatus("Not Existing");
            response.setPlantMessage("Plant code required");
        }
        
        // Validate department code
        if (request.getDepartmentCode() != null && !request.getDepartmentCode().trim().isEmpty()) {
            // Add 'D' prefix if not already present for validation
            String deptCode = request.getDepartmentCode().trim();
            if (!deptCode.toUpperCase().startsWith("D")) {
                deptCode = 'D' + deptCode;
            }
            int deptCount = departmentRepository.countInMasterByDepartmentCode(deptCode);
            response.setDepartmentStatus(deptCount > 0 ? "Existing" : "Not Existing");
            response.setDepartmentMessage(deptCount > 0 ? "Record found" : "Department not found");
        } else {
            response.setDepartmentStatus("Not Existing");
            response.setDepartmentMessage("Department code required");
        }
        
        return response;
    }
}

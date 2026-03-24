package com.vguard.validation.fab;

import com.vguard.validation.fab.dto.ExcelRowDTO;
import com.vguard.validation.fab.dto.ValidationResultDTO;
import com.vguard.validation.fab.entity.FabDepartmentMaster;
import com.vguard.validation.fab.entity.FabPlantMaster;
import com.vguard.validation.fab.entity.UserMaster;
import com.vguard.validation.fab.repository.FabDepartmentMasterRepository;
import com.vguard.validation.fab.repository.FabPlantMasterRepository;
import com.vguard.validation.fab.repository.UserMasterRepository;
import com.vguard.validation.fab.service.FabValidationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class FabValidationServiceTest {

    @Mock
    private FabPlantMasterRepository plantRepository;

    @Mock
    private FabDepartmentMasterRepository departmentRepository;

    @Mock
    private UserMasterRepository userRepository;

    @InjectMocks
    private FabValidationService validationService;

    private List<FabPlantMaster> mockPlants;
    private List<FabDepartmentMaster> mockDepartments;
    private List<UserMaster> mockUsers;

    @BeforeEach
    void setUp() {
        // Setup mock plants
        mockPlants = Arrays.asList(
            new FabPlantMaster(1L, "2031", "Plant 2031", 1),
            new FabPlantMaster(2L, "2032", "Plant 2032", 1),
            new FabPlantMaster(3L, "2033", "Plant 2033", 0) // inactive
        );

        // Setup mock departments
        mockDepartments = Arrays.asList(
            new FabDepartmentMaster(1L, "CIVIL &MEP", "Civil & MEP", 1),
            new FabDepartmentMaster(2L, "ELECTRICAL", "Electrical", 1),
            new FabDepartmentMaster(3L, "MECHANICAL", "Mechanical", 1)
        );

        // Setup mock users
        mockUsers = Arrays.asList(
            new UserMaster(1L, "john.doe@company.com", "John", "Doe", 1),
            new UserMaster(2L, "jane.smith@company.com", "Jane", "Smith", 1),
            new UserMaster(3L, "inactive@company.com", "Inactive", "User", 0)
        );

        when(plantRepository.findAll()).thenReturn(mockPlants);
        when(departmentRepository.findAll()).thenReturn(mockDepartments);
        when(userRepository.findAll()).thenReturn(mockUsers);
    }

    @Test
    void testValidRow() {
        ExcelRowDTO validRow = new ExcelRowDTO(
            2,
            "2031",
            "CIVIL &MEP",
            "john.doe@company.com",
            "jane.smith@company.com",
            Arrays.asList("john.doe@company.com", "jane.smith@company.com"),
            "john.doe@company.com",
            "jane.smith@company.com",
            "john.doe@company.com",
            "jane.smith@company.com"
        );

        List<ValidationResultDTO> results = validationService.validate(Arrays.asList(validRow));

        assertEquals(1, results.size());
        ValidationResultDTO result = results.get(0);
        assertEquals("VALID", result.getStatus());
        assertTrue(result.getErrors().isEmpty());
        assertTrue(result.getWarnings().isEmpty());
    }

    @Test
    void testInvalidPlant() {
        ExcelRowDTO invalidRow = new ExcelRowDTO(
            2,
            "9999", // Non-existent plant
            "CIVIL &MEP",
            "john.doe@company.com",
            "jane.smith@company.com",
            Arrays.asList("john.doe@company.com"),
            "john.doe@company.com",
            "jane.smith@company.com",
            "john.doe@company.com",
            "jane.smith@company.com"
        );

        List<ValidationResultDTO> results = validationService.validate(Arrays.asList(invalidRow));

        assertEquals(1, results.size());
        ValidationResultDTO result = results.get(0);
        assertEquals("INVALID", result.getStatus());
        assertTrue(result.getErrors().contains("Plant code '9999' does not exist"));
    }

    @Test
    void testInactivePlant() {
        ExcelRowDTO inactivePlantRow = new ExcelRowDTO(
            2,
            "2033", // Inactive plant
            "CIVIL &MEP",
            "john.doe@company.com",
            "jane.smith@company.com",
            Arrays.asList("john.doe@company.com"),
            "john.doe@company.com",
            "jane.smith@company.com",
            "john.doe@company.com",
            "jane.smith@company.com"
        );

        List<ValidationResultDTO> results = validationService.validate(Arrays.asList(inactivePlantRow));

        assertEquals(1, results.size());
        ValidationResultDTO result = results.get(0);
        assertEquals("INVALID", result.getStatus());
        assertTrue(result.getErrors().contains("Plant '2033' is inactive"));
    }

    @Test
    void testDepartmentNotBelongingToPlant() {
        ExcelRowDTO invalidDeptRow = new ExcelRowDTO(
            2,
            "2031",
            "MECHANICAL", // Department belongs to plant 2032, not 2031
            "john.doe@company.com",
            "jane.smith@company.com",
            Arrays.asList("john.doe@company.com"),
            "john.doe@company.com",
            "jane.smith@company.com",
            "john.doe@company.com",
            "jane.smith@company.com"
        );

        List<ValidationResultDTO> results = validationService.validate(Arrays.asList(invalidDeptRow));

        assertEquals(1, results.size());
        ValidationResultDTO result = results.get(0);
        assertEquals("INVALID", result.getStatus());
        assertTrue(result.getErrors().contains("Department 'MECHANICAL' does not belong to Plant '2031'"));
    }

    @Test
    void testInvalidEmail() {
        ExcelRowDTO invalidEmailRow = new ExcelRowDTO(
            2,
            "2031",
            "CIVIL &MEP",
            "invalid-email", // Invalid format
            "jane.smith@company.com",
            Arrays.asList("john.doe@company.com"),
            "john.doe@company.com",
            "jane.smith@company.com",
            "john.doe@company.com",
            "jane.smith@company.com"
        );

        List<ValidationResultDTO> results = validationService.validate(Arrays.asList(invalidEmailRow));

        assertEquals(1, results.size());
        ValidationResultDTO result = results.get(0);
        assertEquals("INVALID", result.getStatus());
        assertTrue(result.getErrors().contains("Invalid email format for Initiator: invalid-email"));
    }

    @Test
    void testUserNotFound() {
        ExcelRowDTO userNotFoundRow = new ExcelRowDTO(
            2,
            "2031",
            "CIVIL &MEP",
            "nonexistent@company.com", // Not in USER_MASTER
            "jane.smith@company.com",
            Arrays.asList("john.doe@company.com"),
            "john.doe@company.com",
            "jane.smith@company.com",
            "john.doe@company.com",
            "jane.smith@company.com"
        );

        List<ValidationResultDTO> results = validationService.validate(Arrays.asList(userNotFoundRow));

        assertEquals(1, results.size());
        ValidationResultDTO result = results.get(0);
        assertEquals("INVALID", result.getStatus());
        assertTrue(result.getErrors().contains("Initiator user 'nonexistent@company.com' not found in system"));
    }

    @Test
    void testInactiveUser() {
        ExcelRowDTO inactiveUserRow = new ExcelRowDTO(
            2,
            "2031",
            "CIVIL &MEP",
            "inactive@company.com", // Inactive user
            "jane.smith@company.com",
            Arrays.asList("john.doe@company.com"),
            "john.doe@company.com",
            "jane.smith@company.com",
            "john.doe@company.com",
            "jane.smith@company.com"
        );

        List<ValidationResultDTO> results = validationService.validate(Arrays.asList(inactiveUserRow));

        assertEquals(1, results.size());
        ValidationResultDTO result = results.get(0);
        assertEquals("INVALID", result.getStatus());
        assertTrue(result.getErrors().contains("Initiator user 'inactive@company.com' is inactive"));
    }

    @Test
    void testDuplicatePlantDepartment() {
        ExcelRowDTO row1 = new ExcelRowDTO(
            2,
            "2031",
            "CIVIL &MEP",
            "john.doe@company.com",
            "jane.smith@company.com",
            Arrays.asList("john.doe@company.com"),
            "john.doe@company.com",
            "jane.smith@company.com",
            "john.doe@company.com",
            "jane.smith@company.com"
        );

        ExcelRowDTO row2 = new ExcelRowDTO(
            3,
            "2031",
            "CIVIL &MEP", // Same plant+department as row1
            "john.doe@company.com",
            "jane.smith@company.com",
            Arrays.asList("john.doe@company.com"),
            "john.doe@company.com",
            "jane.smith@company.com",
            "john.doe@company.com",
            "jane.smith@company.com"
        );

        List<ValidationResultDTO> results = validationService.validate(Arrays.asList(row1, row2));

        assertEquals(2, results.size());
        
        // First row should be valid
        ValidationResultDTO result1 = results.get(0);
        assertEquals("VALID", result1.getStatus());
        assertTrue(result1.getWarnings().isEmpty());
        
        // Second row should have warning but still be valid
        ValidationResultDTO result2 = results.get(1);
        assertEquals("VALID", result2.getStatus()); // Warnings don't make it invalid
        assertTrue(result2.getWarnings().contains("Duplicate entry for Plant '2031' and Department 'CIVIL &MEP' in this upload"));
    }

    @Test
    void testMultipleCbsGaEmails() {
        ExcelRowDTO multiEmailRow = new ExcelRowDTO(
            2,
            "2031",
            "CIVIL &MEP",
            "john.doe@company.com",
            "jane.smith@company.com",
            Arrays.asList("john.doe@company.com", "jane.smith@company.com", "nonexistent@company.com"),
            "john.doe@company.com",
            "jane.smith@company.com",
            "john.doe@company.com",
            "jane.smith@company.com"
        );

        List<ValidationResultDTO> results = validationService.validate(Arrays.asList(multiEmailRow));

        assertEquals(1, results.size());
        ValidationResultDTO result = results.get(0);
        assertEquals("INVALID", result.getStatus());
        assertTrue(result.getErrors().contains("CBS GA 3 user 'nonexistent@company.com' not found in system"));
    }
}

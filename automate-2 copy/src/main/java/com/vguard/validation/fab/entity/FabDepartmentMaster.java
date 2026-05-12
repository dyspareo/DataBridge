package com.vguard.validation.fab.entity;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class FabDepartmentMaster {
    private Long id;
    
    private String departmentCode;
    
    private String departmentName;
    
    private Integer statusId;
    
    // Helper method to check if department is active (status_id = 1)
    public Boolean getIsActive() {
        return statusId != null && statusId == 1;
    }
}

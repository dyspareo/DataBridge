package com.vguard.validation.fab.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "app_vg_wbs_department_master", schema = "sd_apps_db")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class FabDepartmentMaster {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "wbs_department_code")
    private String departmentCode;
    
    @Column(name = "department_name")
    private String departmentName;
    
    @Column(name = "status_id")
    private Integer statusId;
    
    // Helper method to check if department is active (status_id = 1)
    public Boolean getIsActive() {
        return statusId != null && statusId == 1;
    }
}

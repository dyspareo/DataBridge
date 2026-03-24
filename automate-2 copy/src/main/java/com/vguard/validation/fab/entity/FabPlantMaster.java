package com.vguard.validation.fab.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "app_vg_plant_master", schema = "sd_apps_db")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class FabPlantMaster {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "plant_code")
    private String plantCode;
    
    @Column(name = "plant_name")
    private String plantName;
    
    @Column(name = "status_id")
    private Integer statusId;
    
    // Helper method to check if plant is active (status_id = 1)
    public Boolean getIsActive() {
        return statusId != null && statusId == 1;
    }
}

package com.vguard.validation.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

// Hibernate specific annotations
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;


@Entity
@Table(name = "plant")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PlantEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "plant_code", unique = true, nullable = false, length = 50)
    private String plantCode;
    
    @Column(name = "plant_name", nullable = false, length = 100)
    private String plantName;
    
    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
    
    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public PlantEntity(String plantCode, String plantName) {
        this.plantCode = plantCode;
        this.plantName = plantName;
    }
}

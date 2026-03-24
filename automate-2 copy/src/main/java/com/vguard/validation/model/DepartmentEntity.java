package com.vguard.validation.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

// Hibernate specific annotations
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

// Lombok annotations
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "department")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class DepartmentEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "dept_code", nullable = false, unique = true, length = 50)
    private String deptCode;
    
    @Column(name = "dept_name", nullable = false, length = 100)
    private String deptName;
    
    @Column(name = "plant_code", length = 50, insertable = true, updatable = true)
    private String plantCode;
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public DepartmentEntity(String deptCode, String deptName) {
        this.deptCode = deptCode;
        this.deptName = deptName;
    }
}

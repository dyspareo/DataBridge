package com.vguard.validation.fab.entity;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "app_vg_wbs_department_master", catalog = "sd_apps_db")
public class WbsDepartmentMaster {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @JsonProperty("department_name")
    @Column(name = "department_name")
    private String departmentName;

    @JsonProperty("wbs_department_code")
    @Column(name = "wbs_department_code")
    private String wbsDepartmentCode;

    @JsonProperty("status_id")
    @Column(name = "status_id")
    private Integer statusId;

    @JsonProperty("created_date")
    @Column(name = "created_date")
    private LocalDateTime createdDate;

    @JsonProperty("created_by")
    @Column(name = "created_by")
    private Integer createdBy;

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }

    public String getDepartmentName() { return departmentName; }
    public void setDepartmentName(String departmentName) { this.departmentName = departmentName; }

    public String getWbsDepartmentCode() { return wbsDepartmentCode; }
    public void setWbsDepartmentCode(String wbsDepartmentCode) { this.wbsDepartmentCode = wbsDepartmentCode; }

    public Integer getStatusId() { return statusId; }
    public void setStatusId(Integer statusId) { this.statusId = statusId; }

    public LocalDateTime getCreatedDate() { return createdDate; }
    public void setCreatedDate(LocalDateTime createdDate) { this.createdDate = createdDate; }

    public Integer getCreatedBy() { return createdBy; }
    public void setCreatedBy(Integer createdBy) { this.createdBy = createdBy; }
}

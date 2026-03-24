package com.vguard.validation.model;

import lombok.Data;

@Data
public class DepartmentInsertRequest {
    private String deptCode;
    private String deptName;
    private String deptShortName;
    private String deptSapValue;
    private Integer statusId;
    private String createdDate;
    private Integer createdBy;
    private String updatedDate;
    private Integer updatedBy;
}

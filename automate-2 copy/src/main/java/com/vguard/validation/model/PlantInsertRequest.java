package com.vguard.validation.model;

import lombok.Data;

@Data
public class PlantInsertRequest {
    private String code;
    private String purchaseOrg;
    private String companyCodeId;
    private String companyCode;
    private String plantCode;
    private String plantName;
    private String plantShortName;
    private String branchCode;
    private String sapValue;
    private Integer statusId;
    private Integer createdBy;
    private String createdDate; // expected format: yyyy-MM-dd HH:mm:ss
    private String updatedDate; // expected format: yyyy-MM-dd HH:mm:ss
    private Integer updatedBy;
}

package com.vguard.validation.fap.dto;

import lombok.Data;

import java.util.List;

@Data
public class FapValidationRowResponse {
    private Integer rowNumber;
    private String userEmail;
    private String plantCode;
    private String departmentCode;

    private String userStatus;
    private String userMessage;
    private String plantStatus;
    private String plantMessage;
    private String departmentStatus;
    private String departmentMessage;

    private String overallStatus;
    private boolean duplicate;
    private List<FapEmailValidationResult> emailValidations;
}

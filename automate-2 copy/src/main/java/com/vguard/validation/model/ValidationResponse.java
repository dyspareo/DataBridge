package com.vguard.validation.model;

import lombok.Data;

@Data
public class ValidationResponse {
    private String plantCode;
    private String plantStatus;
    private String plantMessage;
    private String departmentCode;
    private String departmentStatus;
    private String departmentMessage;
}

package com.vguard.validation.fap.dto;

import lombok.Data;

@Data
public class FapCheckRequest {
    private String userEmail;
    private String plantCode;
    private String departmentCode;
}

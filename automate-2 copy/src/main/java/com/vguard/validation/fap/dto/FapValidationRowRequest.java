package com.vguard.validation.fap.dto;

import lombok.Data;

import java.util.List;

@Data
public class FapValidationRowRequest {
    private Integer rowNumber;
    private String userEmail;
    private String plantCode;
    private String departmentCode;
    private List<FapEmailEntryRequest> emailEntries;
}

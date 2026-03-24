package com.vguard.validation.fap.dto;

import lombok.Data;

@Data
public class FapEmailValidationResult {
    private String fieldName;
    private String email;
    private String status;
    private String message;
}

package com.vguard.validation.model;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class ValidationResult {
    private String status;
    private String message;
    private String code;
}

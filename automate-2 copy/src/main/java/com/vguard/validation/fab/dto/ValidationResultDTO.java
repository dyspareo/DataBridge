package com.vguard.validation.fab.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ValidationResultDTO {
    private int rowNumber;
    private String status;          // "VALID" or "INVALID"
    private List<String> errors;    // human-readable error messages
    private List<String> warnings;  // e.g., duplicate plant+department combo
}

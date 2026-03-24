package com.vguard.validation.fap.dto;

import lombok.Data;

@Data
public class FapEmailEntryRequest {
    private String fieldName;
    private String email;
}

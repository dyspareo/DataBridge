package com.vguard.validation.fap.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class FapCheckResponse {
    private String checkType;
    private String status;
    private String message;
    private int count;
    private boolean satisfied;
}

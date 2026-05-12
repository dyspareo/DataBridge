package com.vguard.validation.fac.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FacHierarchyInsertResponse {
    private boolean success;
    private String message;
    private Long insertedId;
}

package com.vguard.validation.fap.dto;

import lombok.Data;
import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FapHierarchyInsertResponse {
    private boolean success;
    private String message;
    private List<Integer> insertedIds;
    private int totalInserted;
}

package com.vguard.validation.fap.dto;

import lombok.Data;
import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FapTaskAssigneeInsertResponse {
    private boolean success;
    private String message;
    private Integer insertedId;
}

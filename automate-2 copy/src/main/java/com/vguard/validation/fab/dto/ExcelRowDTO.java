package com.vguard.validation.fab.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ExcelRowDTO {
    private int rowNumber;
    private String plantCode;
    private String departmentCode;
    private String initiator;
    private String reviewer;
    private List<String> cbsGaEmails;      // split by comma from CBS GA cell
    private String businessPartner1;      // RCM/FCC-Business Partner 1
    private String businessPartner2;      // Business Partner 2
    private String approverDoA1;          // Approver as per DoA 1
    private String approverDoA2;          // Approver as per DoA 2
}

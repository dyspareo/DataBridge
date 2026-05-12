package com.vguard.validation.fap.dto;

import lombok.Data;
import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FapHierarchyInsertRequest {
    private String plant_code;
    private String department;
    private String initiator_login_name;
    private String reviewer1_list;        // Email
    private String reviewer2_list;        // Email  
    private String approver_list;         // Email
    private String cbs_team;              // Comma-separated CBS emails
    private String management_approver_list; // Email (for tier 3 only)
    private Integer status_id;
    
    // Additional fields for individual CBS members
    private String cbs_member1_email;
    private String cbs_member2_email;
    private String cbs_member3_email;
}

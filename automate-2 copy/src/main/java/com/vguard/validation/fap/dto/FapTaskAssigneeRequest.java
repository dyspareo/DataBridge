package com.vguard.validation.fap.dto;

import lombok.Data;
import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FapTaskAssigneeRequest {
    private String plant_code;
    private String department;
    private String initiator_login_name;
    private String reviewer1_list;
    private String reviewer2_list;
    private String approver_list;
    private String management_approver_list;
    private String cbs_team;
    private String total_value_lower_limit;
    private Double total_value_upper_limit;
    private Integer status_id;
}

package com.vguard.validation.fap.dto;

import lombok.Data;
import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FapTaskAssigneeResponse {
    private Integer id;
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
    private Integer app_id;
    private Integer wkf_process_def_id;
    private Integer status_id;
    private Integer created_by;
    private LocalDateTime created_date;
    private Integer updated_by;
    private LocalDateTime updated_date;
}

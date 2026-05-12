package com.vguard.validation.fac.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import lombok.Data;

@Data
public class FacHierarchyInsertRequest {
    private String plant_code;
    private String plant_name;
    private String dept_code;
    private String dept_name;

    @JsonAlias({"lm_user", "lcm_email", "lm_email"})
    private String lcm_user;

    @JsonAlias({"cbs1_user", "cbs_user1_email", "cbs1_email"})
    private String cbs_user1;

    @JsonAlias({"cbs2_user", "cbs_user2_email", "cbs2_email"})
    private String cbs_user2;

    private Integer status_id;
}

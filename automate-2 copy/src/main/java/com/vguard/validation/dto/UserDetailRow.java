package com.vguard.validation.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class UserDetailRow {
    private String instanceName;
    private String userId;
    private String loginName; // Added: login_name from users table
    private String userType; // role id
    private String roleName;
    private String roleKey;
    private Integer statusId;
    private String createdBy;
    private String createdDate;
    private String updatedBy;
    private String updatedDate;
    private String email;
}

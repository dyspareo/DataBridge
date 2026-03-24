package com.vguard.validation.model;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class UserResponse {
    private String status;
    private String message;
    private String login_name;
    private String first_name;
    private String last_name;
    private String email_id1;
    private Integer status_id;

    public static UserResponse notFound() {
        return new UserResponse("not_found", "User not found", null, null, null, null, null);
    }

    public static UserResponse found(String loginName, String firstName, String lastName, String email, Integer statusId) {
        return new UserResponse("exists", "User found", loginName, firstName, lastName, email, statusId);
    }
}

package com.vguard.validation.fab.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "app_vg_fab_task_assignment_map", catalog = "sd_apps_db")
@Data
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class FabTaskAssignmentMap {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Integer id;

    @Column(name = "plant_code")
    private String plantCode;

    @Column(name = "dept_id")
    private Integer deptId;

    @Column(name = "department_code")
    private String departmentCode;

    @Column(name = "initiator_id")
    private String initiatorId;

    @Column(name = "initiator_mailid")
    private String initiatorMailid;

    @Column(name = "reviewer_id")
    private String reviewerId;

    @Column(name = "reviewer")
    private String reviewer;

    @Column(name = "reviewer_mailid")
    private String reviewerMailid;

    @Column(name = "cbs_ga_id")
    private String cbsGaId;

    @Column(name = "cbs_ga_mailid")
    private String cbsGaMailid;

    @Column(name = "bussiness_partner1")
    private String businessPartner1;

    @Column(name = "bussiness_partner_1_emailid")
    private String businessPartner1Emailid;

    @Column(name = "level1_approver")
    private String level1Approver;

    @Column(name = "level1_approver_emailid")
    private String level1ApproverEmailid;

    @Column(name = "bussiness_partner2")
    private String businessPartner2;

    @Column(name = "bussiness_partner_2_emailid")
    private String businessPartner2Emailid;

    @Column(name = "level2_approver")
    private String level2Approver;

    @Column(name = "level2_approver_emailid")
    private String level2ApproverEmailid;

    @Column(name = "status_id")
    private Integer statusId;

    @Column(name = "created_by")
    private Integer createdBy;

    @Column(name = "created_date")
    private LocalDateTime createdDate;

    @Column(name = "updated_by")
    private Integer updatedBy;

    @Column(name = "updated_date")
    private LocalDateTime updatedDate;
}

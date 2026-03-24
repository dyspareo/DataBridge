package com.vguard.validation.fab.dto;

import com.vguard.validation.fab.entity.FabTaskAssignmentMap;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class FabHierarchyCheckResponse {
    private boolean found;
    private String message;
    private String plantCode;
    private String departmentCode;

    private String initiatorId;
    private String initiatorMailid;
    private String reviewerId;
    private String reviewer;
    private String reviewerMailid;
    private String cbsGaId;
    private String cbsGaMailid;
    private String bussinessPartner1;
    private String bussinessPartner1Emailid;
    private String level1Approver;
    private String level1ApproverEmailid;
    private String bussinessPartner2;
    private String bussinessPartner2Emailid;
    private String level2Approver;
    private String level2ApproverEmailid;

    public static FabHierarchyCheckResponse found(FabTaskAssignmentMap record) {
        FabHierarchyCheckResponse out = new FabHierarchyCheckResponse();
        out.setFound(true);
        out.setMessage("FAB hierarchy found");
        out.setPlantCode(record.getPlantCode());
        out.setDepartmentCode(record.getDepartmentCode());
        out.setInitiatorId(record.getInitiatorId());
        out.setInitiatorMailid(record.getInitiatorMailid());
        out.setReviewerId(record.getReviewerId());
        out.setReviewer(record.getReviewer());
        out.setReviewerMailid(record.getReviewerMailid());
        out.setCbsGaId(record.getCbsGaId());
        out.setCbsGaMailid(record.getCbsGaMailid());
        out.setBussinessPartner1(record.getBussinessPartner1());
        out.setBussinessPartner1Emailid(record.getBussinessPartner1Emailid());
        out.setLevel1Approver(record.getLevel1Approver());
        out.setLevel1ApproverEmailid(record.getLevel1ApproverEmailid());
        out.setBussinessPartner2(record.getBussinessPartner2());
        out.setBussinessPartner2Emailid(record.getBussinessPartner2Emailid());
        out.setLevel2Approver(record.getLevel2Approver());
        out.setLevel2ApproverEmailid(record.getLevel2ApproverEmailid());
        return out;
    }

    public static FabHierarchyCheckResponse notFound(String plant, String dept) {
        FabHierarchyCheckResponse out = new FabHierarchyCheckResponse();
        out.setFound(false);
        out.setPlantCode(plant);
        out.setDepartmentCode(dept);
        out.setMessage("No FAB hierarchy found for Plant " + plant + ", Dept " + dept);
        return out;
    }
}

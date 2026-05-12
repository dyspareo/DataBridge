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
    private int totalCount;
    
    // List to hold all records
    private java.util.List<FabTaskAssignmentMap> records;
    
    // Alias for frontend compatibility
    public java.util.List<FabTaskAssignmentMap> getResults() {
        return this.records;
    }
    
    // Single record fields (for backward compatibility)
    private String initiatorId;
    private String initiatorMailid;
    private String reviewerId;
    private String reviewer;
    private String reviewerMailid;
    private String cbsGaId;
    private String cbsGaMailid;
    private String businessPartner1;
    private String businessPartner1Emailid;
    private String level1Approver;
    private String level1ApproverEmailid;
    private String businessPartner2;
    private String businessPartner2Emailid;
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
        out.setBusinessPartner1(record.getBusinessPartner1());
        out.setBusinessPartner1Emailid(record.getBusinessPartner1Emailid());
        out.setLevel1Approver(record.getLevel1Approver());
        out.setLevel1ApproverEmailid(record.getLevel1ApproverEmailid());
        out.setBusinessPartner2(record.getBusinessPartner2());
        out.setBusinessPartner2Emailid(record.getBusinessPartner2Emailid());
        out.setLevel2Approver(record.getLevel2Approver());
        out.setLevel2ApproverEmailid(record.getLevel2ApproverEmailid());
        return out;
    }
    
    public static FabHierarchyCheckResponse foundMultiple(java.util.List<FabTaskAssignmentMap> records, String plantCode, String departmentCode) {
        FabHierarchyCheckResponse out = new FabHierarchyCheckResponse();
        out.setFound(true);
        out.setRecords(records);
        out.setTotalCount(records.size());
        out.setPlantCode(plantCode);
        out.setDepartmentCode(departmentCode);
        out.setMessage("Found " + records.size() + " FAB hierarchy records for Plant " + plantCode + ", Dept " + departmentCode);
        
        // Set first record for backward compatibility
        if (!records.isEmpty()) {
            FabTaskAssignmentMap first = records.get(0);
            out.setInitiatorId(first.getInitiatorId());
            out.setInitiatorMailid(first.getInitiatorMailid());
            out.setReviewerId(first.getReviewerId());
            out.setReviewer(first.getReviewer());
            out.setReviewerMailid(first.getReviewerMailid());
            out.setCbsGaId(first.getCbsGaId());
            out.setCbsGaMailid(first.getCbsGaMailid());
            out.setBusinessPartner1(first.getBusinessPartner1());
            out.setBusinessPartner1Emailid(first.getBusinessPartner1Emailid());
            out.setLevel1Approver(first.getLevel1Approver());
            out.setLevel1ApproverEmailid(first.getLevel1ApproverEmailid());
            out.setBusinessPartner2(first.getBusinessPartner2());
            out.setBusinessPartner2Emailid(first.getBusinessPartner2Emailid());
            out.setLevel2Approver(first.getLevel2Approver());
            out.setLevel2ApproverEmailid(first.getLevel2ApproverEmailid());
        }
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

    public static FabHierarchyCheckResponse error(String plant, String dept, String message) {
        FabHierarchyCheckResponse out = new FabHierarchyCheckResponse();
        out.setFound(false);
        out.setPlantCode(plant);
        out.setDepartmentCode(dept);
        out.setMessage(message == null || message.isBlank() ? "Failed to check FAB hierarchy" : message);
        return out;
    }
}

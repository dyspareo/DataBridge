package com.vguard.validation.fab.repository;

import com.vguard.validation.fab.entity.FabTaskAssignmentMap;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FabHierarchyRepository extends JpaRepository<FabTaskAssignmentMap, Integer> {
    Optional<FabTaskAssignmentMap> findByPlantCodeAndDepartmentCode(String plantCode, String departmentCode);
    List<FabTaskAssignmentMap> findAllByPlantCodeAndDepartmentCode(String plantCode, String departmentCode);
    List<FabTaskAssignmentMap> findByPlantCode(String plantCode);
    List<FabTaskAssignmentMap> findByDepartmentCode(String departmentCode);
}

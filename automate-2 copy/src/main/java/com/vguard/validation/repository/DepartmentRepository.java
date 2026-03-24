package com.vguard.validation.repository;

import com.vguard.validation.model.DepartmentEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

public interface DepartmentRepository extends JpaRepository<DepartmentEntity, Long> {
    Optional<DepartmentEntity> findByDeptCode(String deptCode);
    boolean existsByDeptCode(String deptCode);

    @Query(value = "select count(*) from sd_apps_db.app_vg_department_master where Dept_Code = :code", nativeQuery = true)
    int countInMasterByDepartmentCode(@Param("code") String code);

    @Query(value = "select count(*) from sd_apps_db.app_vg_department_master where Dept_Name = :name", nativeQuery = true)
    int countInMasterByDepartmentName(@Param("name") String name);

    @Modifying
    @Transactional
    @Query(value = "insert into sd_apps_db.app_vg_department_master (Dept_Code, Dept_Name, Dept_Short_Name, Dept_SAP_Value, Status_id, created_date, created_by, updated_date, updated_by) " +
            "values (:code, :name, :shortName, :sapValue, :statusId, :createdDate, :createdBy, :updatedDate, :updatedBy)", nativeQuery = true)
    int insertMaster(
            @Param("code") String code,
            @Param("name") String name,
            @Param("shortName") String shortName,
            @Param("sapValue") String sapValue,
            @Param("statusId") Integer statusId,
            @Param("createdDate") String createdDate,
            @Param("createdBy") Integer createdBy,
            @Param("updatedDate") String updatedDate,
            @Param("updatedBy") Integer updatedBy
    );
}

package com.vguard.validation.repository;

import com.vguard.validation.model.PlantEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

public interface PlantRepository extends JpaRepository<PlantEntity, Long> {
    Optional<PlantEntity> findByPlantCode(String plantCode);
    boolean existsByPlantCode(String plantCode);

    @Query(value = "select count(*) from sd_apps_db.app_vg_plant_master where plant_code = :code", nativeQuery = true)
    int countInMasterByPlantCode(@Param("code") String code);

    @Query(value = "select count(*) from sd_apps_db.app_vg_plant_master where code = :code", nativeQuery = true)
    int countInMasterByCode(@Param("code") String code);

    @Query(value = "select count(*) from sd_apps_db.app_vg_plant_master where code = :code or plant_code = :code", nativeQuery = true)
    int countInMasterByCodeOrPlantCode(@Param("code") String code);

    @Modifying
    @Transactional
    @Query(value = "insert into sd_apps_db.app_vg_plant_master (code, purchaseOrg, company_code_id, company_code, plant_code, plant_name, plant_short_name, branch_code, sap_value, status_id, created_by, created_date, updated_date, updated_by) " +
            "values (:code, :purchaseOrg, :companyCodeId, :companyCode, :plantCode, :plantName, :plantShortName, :branchCode, :sapValue, :statusId, :createdBy, :createdDate, :updatedDate, :updatedBy)", nativeQuery = true)
    int insertMaster(
            @Param("code") String code,
            @Param("purchaseOrg") String purchaseOrg,
            @Param("companyCodeId") String companyCodeId,
            @Param("companyCode") String companyCode,
            @Param("plantCode") String plantCode,
            @Param("plantName") String plantName,
            @Param("plantShortName") String plantShortName,
            @Param("branchCode") String branchCode,
            @Param("sapValue") String sapValue,
            @Param("statusId") Integer statusId,
            @Param("createdBy") Integer createdBy,
            @Param("createdDate") String createdDate,
            @Param("updatedDate") String updatedDate,
            @Param("updatedBy") Integer updatedBy
    );
}

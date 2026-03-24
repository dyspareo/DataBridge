package com.vguard.validation.fab.repository;

import com.vguard.validation.fab.entity.FabPlantMaster;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FabPlantMasterRepository extends JpaRepository<FabPlantMaster, Long> {
    List<FabPlantMaster> findAll();
}

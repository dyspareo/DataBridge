package com.vguard.validation.fab.repository;

import com.vguard.validation.fab.entity.FabDepartmentMaster;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FabDepartmentMasterRepository extends JpaRepository<FabDepartmentMaster, Long> {
    List<FabDepartmentMaster> findAll();
}

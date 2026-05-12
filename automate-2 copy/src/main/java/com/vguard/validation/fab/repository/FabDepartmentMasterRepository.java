package com.vguard.validation.fab.repository;

import com.vguard.validation.fab.entity.FabDepartmentMaster;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.repository.NoRepositoryBean;

import java.util.List;

@NoRepositoryBean
public interface FabDepartmentMasterRepository extends JpaRepository<FabDepartmentMaster, Long> {
    List<FabDepartmentMaster> findAll();
}

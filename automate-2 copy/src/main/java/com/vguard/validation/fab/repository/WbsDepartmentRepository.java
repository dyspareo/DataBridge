package com.vguard.validation.fab.repository;

import com.vguard.validation.fab.entity.WbsDepartmentMaster;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WbsDepartmentRepository extends JpaRepository<WbsDepartmentMaster, Integer> {
    Optional<WbsDepartmentMaster> findByWbsDepartmentCode(String code);
    List<WbsDepartmentMaster> findByStatusId(Integer statusId);
}

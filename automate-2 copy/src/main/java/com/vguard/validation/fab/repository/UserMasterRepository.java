package com.vguard.validation.fab.repository;

import com.vguard.validation.fab.entity.UserMaster;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UserMasterRepository extends JpaRepository<UserMaster, Long> {
    List<UserMaster> findAll();
}

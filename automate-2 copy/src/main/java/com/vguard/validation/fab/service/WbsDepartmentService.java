package com.vguard.validation.fab.service;

import lombok.extern.slf4j.Slf4j;
import com.vguard.validation.fab.entity.WbsDepartmentMaster;
import com.vguard.validation.fab.repository.WbsDepartmentRepository;
import jakarta.validation.ValidationException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class WbsDepartmentService {
    private final WbsDepartmentRepository repository;

    public WbsDepartmentMaster insertDepartment(WbsDepartmentMaster request, Integer sessionUserId) {
        String code = request.getWbsDepartmentCode() == null ? "" : request.getWbsDepartmentCode().trim();
        String name = request.getDepartmentName() == null ? "" : request.getDepartmentName().trim();
        if (code.isEmpty() || name.isEmpty()) {
            throw new ValidationException("Department Name and WBS Department Code are required.");
        }

        if (repository.findByWbsDepartmentCode(code).isPresent()) {
            throw new ValidationException("Department code " + code + " already exists");
        }

        request.setWbsDepartmentCode(code); // Keep raw code as-is for FAB (no D prefix)
        request.setDepartmentName(name);
        request.setStatusId(request.getStatusId() == null ? 1 : request.getStatusId());
        request.setCreatedDate(LocalDateTime.now());
        request.setCreatedBy(sessionUserId == null ? 2 : sessionUserId);
        return repository.save(request);
    }

    @Transactional(readOnly = true)
    public List<WbsDepartmentMaster> getAllActive() {
        return repository.findByStatusId(1);
    }

    @Transactional(readOnly = true)
    public WbsDepartmentMaster getByCode(String code) {
        return repository.findByWbsDepartmentCode(code).orElse(null);
    }
}

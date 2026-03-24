// FAB Validation JavaScript Module
(function() {
    'use strict';

    const API_BASE = (typeof window !== 'undefined' && window.API_BASE != null)
        ? String(window.API_BASE)
        : ((location.protocol === 'file:') ? 'http://localhost:8080' : '');

    let fabValidationResults = [];
    
    // Wait for DOM to be ready and main app to load
    function initializeWhenReady() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initializeFABValidation);
        } else {
            // DOM is already ready, but wait a bit for main app to load
            setTimeout(initializeFABValidation, 500);
        }
    }
    
    initializeWhenReady();
    
    function initializeFABValidation() {
        console.log('Initializing FAB validation...');
        console.log('Current module:', window.location.search);
        
        // Add FAB-specific validation button if on FAB module
        if (isFABModule()) {
            console.log('FAB module detected, adding validation button');
            try { window.currentModule = 'FAB'; } catch (_) {}
            addFABValidationButton();
            setupFABEventListeners();
        } else {
            console.log('Not FAB module, skipping FAB validation');
        }
        
        // For testing: add a manual trigger
        window.testFABValidation = function() {
            console.log('Manual FAB validation trigger');
            addFABValidationButton();
            setupFABEventListeners();
        };
    }
    
    function isFABModule() {
        const urlParams = new URLSearchParams(window.location.search);
        const module = urlParams.get('module');
        return module === 'FAB';
    }
    
    function addFABValidationButton() {
        // Find the existing validate bar
        let validateBar = document.querySelector('.validate-bar');
        if (!validateBar) {
            // Create validate bar if it doesn't exist
            validateBar = document.createElement('div');
            validateBar.className = 'validate-bar';
            validateBar.style.cssText = 'margin: 20px 0; text-align: center;';
            
            // Insert after the file info section
            const fileInfo = document.getElementById('fileInfo');
            if (fileInfo) {
                fileInfo.parentNode.insertBefore(validateBar, fileInfo.nextSibling);
            }
        }
        
        // Remove existing FAB button if any
        const existingBtn = document.getElementById('fabValidateBtn');
        if (existingBtn) {
            existingBtn.remove();
        }

        const existingSelect = document.getElementById('fabRowSelector');
        if (existingSelect && existingSelect.parentElement) {
            existingSelect.parentElement.remove();
        }

        // Add FAB row selector (only data rows from Excel row 4 onward)
        const selectorWrap = document.createElement('div');
        selectorWrap.className = 'fab-row-selector-wrap d-none';

        const selectorLabel = document.createElement('label');
        selectorLabel.setAttribute('for', 'fabRowSelector');
        selectorLabel.textContent = 'Select Row';
        selectorLabel.className = 'form-label mb-0 fw-semibold';

        const rowSelector = document.createElement('select');
        rowSelector.id = 'fabRowSelector';
        rowSelector.className = 'form-control';
        rowSelector.innerHTML = '<option value="">Choose row...</option>';

        selectorWrap.appendChild(selectorLabel);
        selectorWrap.appendChild(rowSelector);
        validateBar.appendChild(selectorWrap);
        
        // Add FAB validation button
        const fabValidateBtn = document.createElement('button');
        fabValidateBtn.id = 'fabValidateBtn';
        fabValidateBtn.className = 'btn btn-primary d-none';
        fabValidateBtn.disabled = true;
        fabValidateBtn.innerHTML = '<i class="bi bi-check2-circle"></i> Validate FAB';
        fabValidateBtn.style.cssText = 'margin: 10px;';
        
        validateBar.appendChild(fabValidateBtn);

        rowSelector.addEventListener('change', () => {
            fabValidateBtn.disabled = !rowSelector.value;
        });

        refreshFABRowSelectorOptions();
    }
    
    function setupFABEventListeners() {
        const fabValidateBtn = document.getElementById('fabValidateBtn');
        if (fabValidateBtn) {
            fabValidateBtn.addEventListener('click', function(e) {
                e.preventDefault();
                console.log('FAB Validate button clicked');
                validateFABData();
            });
        }
        
        // Listen for file upload to show/hide validation button
        const fileInput = document.getElementById('fileInput');
        if (fileInput) {
            fileInput.addEventListener('change', handleFABFileUpload);
        }
        
        // Also listen for drag and drop events
        const dropZone = document.getElementById('dropZone');
        if (dropZone) {
            dropZone.addEventListener('drop', function(e) {
                setTimeout(() => {
                    console.log('FAB file dropped, checking for data');
                    handleFABFileUpload();
                }, 500);
            });
        }
    }
    
    function handleFABFileUpload(event) {
        console.log('FAB file upload detected');
        const fabValidateBtn = document.getElementById('fabValidateBtn');
        const file = event ? event.target.files[0] : null;
        
        console.log('File:', file, 'Button:', fabValidateBtn);
        
        if (file && fabValidateBtn) {
            // Show validation button when file is uploaded
            fabValidateBtn.classList.remove('d-none');
            console.log('FAB validation button shown');
        }

        // Main file parser runs asynchronously in app.js; refresh selector with short retries.
        refreshFABRowSelectorOptions();
        setTimeout(refreshFABRowSelectorOptions, 300);
        setTimeout(refreshFABRowSelectorOptions, 900);
        setTimeout(refreshFABRowSelectorOptions, 1500);
    }

    function getAvailableFabRowNumbers(excelData) {
        if (!Array.isArray(excelData) || excelData.length === 0) return [];
        const available = [];
        for (let i = 3; i < excelData.length; i++) { // Excel row 4 onward
            const row = Array.isArray(excelData[i]) ? excelData[i] : [excelData[i]];
            const hasData = row.some(cell => cell !== null && cell !== undefined && String(cell).trim() !== '');
            if (hasData) {
                available.push(i + 1);
            }
        }
        return available;
    }

    function refreshFABRowSelectorOptions() {
        const rowSelector = document.getElementById('fabRowSelector');
        const selectorWrap = rowSelector ? rowSelector.closest('.fab-row-selector-wrap') : null;
        const fabValidateBtn = document.getElementById('fabValidateBtn');
        if (!rowSelector || !fabValidateBtn) return;

        const currentValue = rowSelector.value;
        const availableRows = getAvailableFabRowNumbers(window.parsedData);

        rowSelector.innerHTML = '<option value="">Choose row...</option>';
        availableRows.forEach(rowNo => {
            const opt = document.createElement('option');
            opt.value = String(rowNo);
            opt.textContent = `Row ${rowNo}`;
            rowSelector.appendChild(opt);
        });

        if (availableRows.includes(Number(currentValue))) {
            rowSelector.value = currentValue;
        } else {
            rowSelector.value = '';
        }

        const hasOptions = availableRows.length > 0;
        const requiresRowSelection = availableRows.length > 1;
        if (selectorWrap) selectorWrap.classList.toggle('d-none', !requiresRowSelection);
        fabValidateBtn.classList.toggle('d-none', !hasOptions);
        fabValidateBtn.disabled = requiresRowSelection ? !rowSelector.value : false;
    }
    
    async function validateFABData() {
        console.log('Starting FAB validation...');
        const fabValidateBtn = document.getElementById('fabValidateBtn');
        const rowSelector = document.getElementById('fabRowSelector');
        const originalText = fabValidateBtn.innerHTML;
        
        try {
            const availableRows = getAvailableFabRowNumbers(window.parsedData);
            const requiresRowSelection = availableRows.length > 1;
            const selectedRowNumber = rowSelector ? Number(rowSelector.value) : NaN;
            if (requiresRowSelection && !selectedRowNumber) {
                showError('Please select a row to validate');
                return;
            }

            // Disable button and show loading
            fabValidateBtn.disabled = true;
            fabValidateBtn.innerHTML = '<i class="bi bi-hourglass-split"></i> Validating...';
            
            // Get Excel data from global variable (set by main app.js)
            console.log('Checking parsedData:', window.parsedData);
            
            if (!window.parsedData || window.parsedData.length === 0) {
                console.log('No parsed data found');
                showError('Please upload an Excel file first');
                return;
            }
            
            console.log('Found parsed data:', window.parsedData.length, 'rows');
            
            // Convert Excel data to FAB format
            const fabRows = convertToFABFormat(window.parsedData);
            console.log('Converted to FAB format:', fabRows.length, 'rows');
            const selectedFabRows = requiresRowSelection
                ? fabRows.filter(r => Number(r.rowNumber) === selectedRowNumber)
                : fabRows;
            window._lastFabRows = selectedFabRows;
            
            if (selectedFabRows.length === 0) {
                console.log('No valid FAB data found');
                showError(`No valid data found for selected Row ${selectedRowNumber}`);
                return;
            }
            
            console.log('Sending selected row to backend:', selectedFabRows);
            
            // Send to backend for validation
            const response = await fetch(`${API_BASE}/api/fab/validate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(selectedFabRows)
            });
            
            console.log('Response status:', response.status);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('Backend error:', errorText);
                throw new Error('Validation failed: ' + response.statusText + ' - ' + errorText);
            }
            
            const results = await response.json();
            console.log('Validation results:', results);
            fabValidationResults = results;
            window.fabValidationResults = results;
            
            // Display results
            displayFABValidationResults(results);
            
            // Show success message
            showSuccess('FAB validation completed');
            
        } catch (error) {
            console.error('FAB validation error:', error);
            showError('FAB validation failed: ' + error.message);
        } finally {
            // Restore button
            fabValidateBtn.innerHTML = originalText;
            const availableRows = getAvailableFabRowNumbers(window.parsedData);
            const requiresRowSelection = availableRows.length > 1;
            fabValidateBtn.disabled = requiresRowSelection ? !(rowSelector && rowSelector.value) : false;
        }
    }
    
    function convertToFABFormat(excelData) {
        const fabRows = [];

        const headerInfo = findFabHeaderRow(excelData);
        if (!headerInfo) {
            console.log('FAB header row not detected in sheet');
            return fabRows;
        }

        const { headerRowIndex, headers } = headerInfo;
        window.headers = headers;
        
        // Find column indices (FAB-specific column names)
        const plantIdx = findColumnIndex(headers, ['plant_code', 'plant code', 'plant']);
        const deptIdx = findColumnIndex(headers, ['user department', 'department_code', 'dept code', 'department', 'dept', 'wbs_department_code', 'wbs dept code']);
        let initiatorIdx = findColumnIndex(headers, ['initiator', 'initiator email', 'initiator_mail_id']);
        let reviewerIdx = findColumnIndex(headers, ['reviewer', 'reviewer email', 'reviewer_mail_id']);
        let cbsGaIdx = findColumnIndex(headers, ['cbs_ga', 'cbs ga', 'cbs', 'cbs_mail_id']);
        let bp1Idx = findColumnIndex(headers, ['rcm/fcc-business_partner_1', 'rcm/fcc-business partner 1', 'business_partner_1', 'business partner 1', 'bp1', 'rcm/fcc bp1']);
        let bp2Idx = findColumnIndex(headers, ['business_partner_2', 'business partner 2', 'bp2']);
        let approver1Idx = findColumnIndex(headers, ['approver_as_per_doa_1', 'approver as per doa 1', 'approver1', 'approver_doa_1', 'approver doa 1']);
        let approver2Idx = findColumnIndex(headers, ['approver_as_per_doa_2', 'approver as per doa 2', 'approver2', 'approver_doa_2', 'approver doa 2']);

        // Fallback for the standard FAB template:
        // Role columns are repeated groups with headers: Emp Code, Name, SD User ID, Email ID
        // and do not contain role names like Initiator/Reviewer/etc.
        const emailIdIndices = [];
        for (let i = 0; i < headers.length; i++) {
            const h = headers[i];
            if (h && String(h).trim().toLowerCase() === 'email id') {
                emailIdIndices.push(i);
            }
        }

        const needsFallback = (initiatorIdx === -1 && reviewerIdx === -1 && cbsGaIdx === -1 && bp1Idx === -1 && bp2Idx === -1 && approver1Idx === -1 && approver2Idx === -1);
        if (needsFallback && emailIdIndices.length >= 2) {
            console.log('Using Email ID fallback mapping. Email ID indices:', emailIdIndices);
            initiatorIdx = emailIdIndices[0] ?? -1;
            reviewerIdx = emailIdIndices[1] ?? -1;
            cbsGaIdx = emailIdIndices[2] ?? -1;
            bp1Idx = emailIdIndices[3] ?? -1;
            bp2Idx = emailIdIndices[4] ?? -1;
            approver1Idx = emailIdIndices[5] ?? -1;
            approver2Idx = emailIdIndices[6] ?? -1;
        }
        
        console.log('Column indices found:', {
            plantIdx, deptIdx, initiatorIdx, reviewerIdx, cbsGaIdx, bp1Idx, bp2Idx, approver1Idx, approver2Idx
        });

        window.fabHeaderIndices = {
            plant: plantIdx,
            department: deptIdx,
            initiator: initiatorIdx,
            reviewer: reviewerIdx,
            cbsGa: cbsGaIdx,
            bp1: bp1Idx,
            bp2: bp2Idx,
            approver1: approver1Idx,
            approver2: approver2Idx
        };
        
        // Start from row after detected header row
        for (let i = headerRowIndex + 1; i < excelData.length; i++) {
            const row = excelData[i] || [];
            
            // Skip empty rows
            if (row.every(cell => !cell || String(cell).trim() === '')) {
                continue;
            }
            
            const fabRow = {
                rowNumber: i + 1,
                plantCode: getCellValue(row, plantIdx),
                departmentCode: getCellValue(row, deptIdx),
                initiator: getCellValue(row, initiatorIdx),
                reviewer: getCellValue(row, reviewerIdx),
                cbsGaEmails: parseCBSEmails(getCellValue(row, cbsGaIdx)),
                businessPartner1: getCellValue(row, bp1Idx),
                businessPartner2: getCellValue(row, bp2Idx),
                approverDoA1: getCellValue(row, approver1Idx),
                approverDoA2: getCellValue(row, approver2Idx)
            };

            // normalize to avoid null/undefined in JSON
            fabRow.plantCode = fabRow.plantCode || '';
            fabRow.departmentCode = fabRow.departmentCode || '';
            fabRow.initiator = fabRow.initiator || '';
            fabRow.reviewer = fabRow.reviewer || '';
            fabRow.businessPartner1 = fabRow.businessPartner1 || '';
            fabRow.businessPartner2 = fabRow.businessPartner2 || '';
            fabRow.approverDoA1 = fabRow.approverDoA1 || '';
            fabRow.approverDoA2 = fabRow.approverDoA2 || '';
            fabRow.cbsGaEmails = Array.isArray(fabRow.cbsGaEmails) ? fabRow.cbsGaEmails : [];
            
            fabRows.push(fabRow);
        }
        
        return fabRows;
    }

    function findFabHeaderRow(excelData) {
        if (!Array.isArray(excelData) || excelData.length === 0) return null;

        // Many FAB templates use a grouped header row (e.g. company name / section headers)
        // and a second row with the real field headers (Initiator, Plant Code, etc.).
        // We prefer the row that contains more *field-like* headers.

        const mustHaveAny = ['initiator', 'plant code', 'plant_code', 'department', 'user department', 'reviewer', 'cbs'];
        const sectionWords = ['v-guard', 'industries', 'ltd'];

        let best = null;
        for (let i = 0; i < Math.min(excelData.length, 30); i++) {
            const row = Array.isArray(excelData[i]) ? excelData[i] : [];
            const normalized = row.map(c => (c == null ? '' : String(c).trim().toLowerCase()));

            const nonEmpty = normalized.filter(c => c !== '').length;
            if (nonEmpty < 3) continue;

            // Skip obvious title rows
            const joined = normalized.join(' ');
            if (sectionWords.some(w => joined.includes(w)) && nonEmpty <= 6) {
                continue;
            }

            const hits = mustHaveAny.filter(w => normalized.some(cell => cell.includes(w))).length;

            const hasInitiator = normalized.some(cell => cell.includes('initiator'));
            const hasPlant = normalized.some(cell => cell.includes('plant'));

            // Grouped header rows often contain section labels like "User Department", "Reviewer", "CBS GA"
            // but do NOT contain real field headers like "Initiator" or "Plant Code".
            // Require at least one of these, otherwise penalize heavily.
            const hasRealFieldAnchor = hasInitiator || hasPlant;
            const anchorPenalty = hasRealFieldAnchor ? 0 : 50;

            const score = (hits * 10) + (hasInitiator ? 25 : 0) + (hasPlant ? 15 : 0) + nonEmpty - anchorPenalty;

            if (!best || score > best.score) {
                best = { headerRowIndex: i, headers: row, score, hits, nonEmpty };
            }
        }

        if (best && best.hits >= 2 && best.score > 0) {
            console.log('Detected FAB header row at index:', best.headerRowIndex, 'score:', best.score, 'row:', best.headers);
            return { headerRowIndex: best.headerRowIndex, headers: best.headers };
        }

        return null;
    }
    
    function findColumnIndex(headers, possibleNames) {
        console.log('Looking for columns:', possibleNames, 'in headers:', headers);
        for (const name of possibleNames) {
            const index = headers.findIndex(h => 
                h && String(h).toLowerCase().includes(name.toLowerCase())
            );
            if (index !== -1) {
                console.log('Found column:', name, 'at index:', index);
                return index;
            }
        }
        console.log('Column not found for:', possibleNames);
        return -1;
    }
    
    function getCellValue(row, index) {
        if (index === -1 || !row[index]) return '';
        return String(row[index]).trim();
    }
    
    function parseCBSEmails(cbsGaValue) {
        if (!cbsGaValue) return [];
        
        return cbsGaValue.split(',')
            .map(email => email.trim())
            .filter(email => email.length > 0);
    }
    
    function displayFABValidationResults(results) {
        // Remove existing results if any
        const existingResults = document.getElementById('fabResults');
        if (existingResults) {
            existingResults.remove();
        }

        // Used by the shared ADD ROLE handler (app.js) to determine expected role per email in FAB
        try { window.emailToExpectedRoleMapping = {}; } catch (_) {}

        const lastFabRows = Array.isArray(window._lastFabRows) ? window._lastFabRows : [];
        const headers = Array.isArray(window.headers) ? window.headers : [];
        const idx = (window.fabHeaderIndices && typeof window.fabHeaderIndices === 'object') ? window.fabHeaderIndices : {};

        const getHeaderName = (i, fallback) => {
            if (typeof i === 'number' && i >= 0 && headers[i]) return String(headers[i]).trim();
            return fallback;
        };

        const normalize = (v) => {
            if (v === null || v === undefined) return '';
            if (typeof v === 'number' && isNaN(v)) return '';
            const s = String(v).trim();
            if (!s || s.toLowerCase() === 'nan') return '';
            return s;
        };

        const normalizeRole = (role) => {
            const value = normalize(role);
            if (!value || value === '-') return '';
            return value.toUpperCase();
        };

        const normalizeEmailKey = (email) => {
            const value = normalize(email);
            return value ? value.toLowerCase() : '';
        };

        const rolesMatch = (expectedRole, roleKey) => {
            const normalizedExpected = normalizeRole(expectedRole);
            const normalizedKey = normalizeRole(roleKey);
            return !!normalizedExpected && !!normalizedKey && normalizedExpected === normalizedKey;
        };

        const getExpectedRoleByFieldKey = (fieldKey) => {
            const key = String(fieldKey || '').toLowerCase().trim();
            const mapping = {
                initiator: 'INITIATOR',
                reviewer: 'REVIEWER_DOA',
                cbs: 'CBS_GA_TEAM',
                bp1: 'BUSINESS_PARTNER_1',
                bp2: 'BUSINESS_PARTNER_2',
                approver1: 'LEVEL_1_APPROVER',
                approver2: 'LEVEL_2_APPROVER'
            };
            return mapping[key] || '-';
        };

        const findError = (errors, includesText) => {
            if (!Array.isArray(errors) || !includesText) return '';
            const key = String(includesText).toLowerCase();
            return errors.find(e => e && String(e).toLowerCase().includes(key)) || '';
        };

        const getUserExists = async (email) => {
            const safeEmail = normalize(email);
            if (!safeEmail) return { present: false, count: 0, email: safeEmail };
            try {
                const res = await fetch(`${API_BASE}/api/user-exists?email=${encodeURIComponent(safeEmail)}`);
                if (!res.ok) return { present: false, count: 0, email: safeEmail };
                const data = await res.json().catch(() => null);
                if (!data || typeof data.present !== 'boolean') return { present: false, count: 0, email: safeEmail };
                return data;
            } catch (_) {
                return { present: false, count: 0, email: safeEmail };
            }
        };

        const checkUserRoleAssignment = async (email, expectedRole) => {
            const safeEmail = normalize(email);
            const safeRole = normalizeRole(expectedRole);
            if (!safeEmail || !safeRole) return 'User found';
            console.log(`Role check -> Expected: "${expectedRole}" | Normalized: "${safeRole}" | Match: ${rolesMatch(expectedRole, safeRole)}`);
            try {
                const res = await fetch(`${API_BASE}/api/member/check-user-role?email=${encodeURIComponent(safeEmail)}&expectedRole=${encodeURIComponent(safeRole)}`);
                if (!res.ok) return 'Error checking role';
                const data = await res.json().catch(() => ({}));
                return data && data.message ? data.message : 'Error checking role';
            } catch (_) {
                return 'Error checking role';
            }
        };

        const displayRows = [];
        for (let i = 0; i < results.length; i++) {
            const res = results[i] || {};
            const row = lastFabRows[i] || {};
            const errors = Array.isArray(res.errors) ? res.errors : [];

            const plantField = getHeaderName(idx.plant, 'Plant Code');
            const deptField = getHeaderName(idx.department, 'Department Code');

            const plantErr = findError(errors, 'plant');
            const deptErr = findError(errors, 'department');

            const plantStatus = plantErr ? 'Not Existing' : 'Existing';
            const deptStatus = deptErr ? 'Not Existing' : 'Existing';

            displayRows.push({
                field: plantField,
                type: 'plant',
                name: normalize(row.plantCode) || '-',
                status: plantStatus,
                expectedRole: '-',
                message: plantErr ? plantErr : 'Plant found'
            });
            displayRows.push({
                field: deptField,
                type: 'department',
                name: normalize(row.departmentCode) || '-',
                status: deptStatus,
                expectedRole: '-',
                message: deptErr ? deptErr : 'Department found'
            });

            // Email rows should be shown in this order:
            // 1 Initiator, 2 REVIEWER_DOA, 3/4/5 CBS_GA_TEAM, 6 BP1, 7 BP2, 8 LEVEL_1_APPROVER, 9 LEVEL_2_APPROVER
            const emailFieldsPre = [
                { key: 'initiator', label: 'Initiator', value: row.initiator, headerIdx: idx.initiator },
                { key: 'reviewer', label: 'Reviewer', value: row.reviewer, headerIdx: idx.reviewer }
            ];
            const emailFieldsPost = [
                { key: 'bp1', label: 'RCM/FCC-Business Partner 1', value: row.businessPartner1, headerIdx: idx.bp1 },
                { key: 'bp2', label: 'Business Partner 2', value: row.businessPartner2, headerIdx: idx.bp2 },
                { key: 'approver1', label: 'Approver as per DoA 1', value: row.approverDoA1, headerIdx: idx.approver1 },
                { key: 'approver2', label: 'Approver as per DoA 2', value: row.approverDoA2, headerIdx: idx.approver2 }
            ];

            const pushEmailField = (f) => {
                const fieldName = getHeaderName(f.headerIdx, f.label);
                const emailVal = normalize(f.value);
                const err = findError(errors, f.label) || (emailVal ? findError(errors, emailVal) : '');
                if (!emailVal) {
                    displayRows.push({
                        field: fieldName,
                        type: 'email',
                        name: '-',
                        status: 'NOT FOUND',
                        expectedRole: getExpectedRoleByFieldKey(f.key),
                        message: 'No data provided'
                    });
                    return;
                }
                displayRows.push({
                    field: fieldName,
                    type: 'email',
                    name: emailVal,
                    status: err ? 'Not Existing' : 'Existing',
                    expectedRole: getExpectedRoleByFieldKey(f.key),
                    message: err ? err : 'User found'
                });

                try {
                    if (window.emailToExpectedRoleMapping) {
                        window.emailToExpectedRoleMapping[emailVal] = getExpectedRoleByFieldKey(f.key);
                        const emailKey = normalizeEmailKey(emailVal);
                        if (emailKey) window.emailToExpectedRoleMapping[emailKey] = getExpectedRoleByFieldKey(f.key);
                    }
                } catch (_) {}
            };

            emailFieldsPre.forEach(pushEmailField);

            const cbsField = getHeaderName(idx.cbsGa, 'CBS GA Email');
            const cbsEmails = Array.isArray(row.cbsGaEmails) ? row.cbsGaEmails : [];
            if (!cbsEmails.length) {
                const err = findError(errors, 'CBS GA');
                displayRows.push({
                    field: cbsField,
                    type: 'email',
                    name: '-',
                    status: err ? 'Not Existing' : 'NOT FOUND',
                    expectedRole: getExpectedRoleByFieldKey('cbs'),
                    message: err ? err : 'No data provided'
                });
            } else {
                cbsEmails.forEach((e, ci) => {
                    const emailVal = normalize(e);
                    const label = `CBS GA ${ci + 1}`;
                    const err = (emailVal ? findError(errors, emailVal) : '') || findError(errors, label) || findError(errors, 'CBS GA');
                    displayRows.push({
                        field: cbsEmails.length > 1 ? `${cbsField} (${ci + 1})` : cbsField,
                        type: 'email',
                        name: emailVal || '-',
                        status: !emailVal ? 'NOT FOUND' : (err ? 'Not Existing' : 'Existing'),
                        expectedRole: getExpectedRoleByFieldKey('cbs'),
                        message: !emailVal ? 'No data provided' : (err ? err : 'User found')
                    });

                    try {
                        if (emailVal && window.emailToExpectedRoleMapping) {
                            window.emailToExpectedRoleMapping[emailVal] = getExpectedRoleByFieldKey('cbs');
                            const emailKey = normalizeEmailKey(emailVal);
                            if (emailKey) window.emailToExpectedRoleMapping[emailKey] = getExpectedRoleByFieldKey('cbs');
                        }
                    } catch (_) {}
                });
            }

            emailFieldsPost.forEach(pushEmailField);
        }

        const filteredRows = displayRows.filter(r => {
            if (r.type === 'plant' || r.type === 'department') return true;
            if (r.message === 'No data provided') return false;
            if (r.status === 'NOT FOUND') return false;
            return true;
        });

        const validCount = filteredRows.filter(r => r.status === 'Existing').length;
        const invalidCount = filteredRows.length - validCount;
        
        // Create results section
        const resultsSection = document.createElement('section');
        resultsSection.id = 'fabResults';
        resultsSection.className = 'mt-5';
        resultsSection.innerHTML = `
            <h4>FAB Validation Results</h4>
            <div class="results-summary">
                <div class="summary-item valid">
                    <h4>Existing</h4>
                    <div class="count">${validCount}</div>
                    <div class="subtext">OK</div>
                </div>
                <div class="summary-item invalid">
                    <h4>Not Existing</h4>
                    <div class="count">${invalidCount}</div>
                    <div class="subtext">Failed</div>
                </div>
            </div>
            <div class="table-responsive" style="overflow-x:auto;">
                <table class="table" id="fabResultsTable">
                    <thead>
                        <tr>
                            <th>Form Field</th>
                            <th>Name / Data</th>
                            <th>Status</th>
                            <th>Expected Role</th>
                            <th>Message</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody></tbody>
                </table>
            </div>
        `;
        
        // Add results after validate bar
        const validateBar = document.querySelector('.validate-bar');
        if (validateBar) {
            validateBar.parentNode.insertBefore(resultsSection, validateBar.nextSibling);
        }
        
        // Populate results table
        const tbody = resultsSection.querySelector('tbody');
        tbody.innerHTML = filteredRows.map(r => {
            const statusValue = r.status && String(r.status).trim() !== '' ? String(r.status).trim() : '-';
            const fieldValue = r.field && String(r.field).trim() !== '' ? String(r.field).trim() : '-';
            const nameValue = r.name && String(r.name).trim() !== '' ? String(r.name).trim() : '-';
            const expectedRoleValue = r.expectedRole && String(r.expectedRole).trim() !== '' ? String(r.expectedRole).trim() : '-';
            const messageValue = r.message && String(r.message).trim() !== '' ? String(r.message).trim() : '-';

            const hasCode = nameValue !== '-' && nameValue !== '';
            const showInsert = statusValue === 'Not Existing' && (r.type === 'plant' || r.type === 'department');

            return `
        <tr data-row-type="${r.type || ''}" ${r.type === 'email' && hasCode ? `data-email="${nameValue}"` : ''}>
          <td>${fieldValue}</td>
          <td>${nameValue}</td>
          <td class="${statusValue === 'Existing' ? 'status-valid' : 'status-invalid'}">${statusValue}</td>
          <td style="text-align: center; vertical-align: middle;">${expectedRoleValue}</td>
          <td class="fab-message-cell">${messageValue}</td>
          <td style="display:flex;gap:6px;">
            ${r.type === 'email' && hasCode
                ? `<button class="btn btn-outline-secondary validate-email-btn" data-email="${nameValue}" data-expected-role="${expectedRoleValue}">ADD ROLE</button>`
                : (showInsert ? `<button class="btn btn-success insert-btn" style="background-color:#28a745;border-color:#28a745;color:white;" data-type="${r.type}" data-code="${hasCode ? nameValue : ''}">Insert</button>` : '')}
          </td>
        </tr>
      `;
        }).join('');

        const syncHierarchyCheckButton = () => {
            const existingHBtn = document.getElementById('hierarchyCheckBtn');
            if (existingHBtn) existingHBtn.remove();

            const tableRows = Array.from(resultsSection.querySelectorAll('#fabResultsTable tbody tr'));
            const statuses = tableRows
                .map(tr => {
                    const tds = tr.querySelectorAll('td');
                    return tds && tds[2] ? String(tds[2].textContent || '').trim() : '';
                })
                .filter(Boolean);
            const allStatusExisting = statuses.length > 0 && statuses.every(s => s === 'Existing');
            if (!allStatusExisting) return;

            const plantRow = filteredRows.find(r => r && r.type === 'plant' && r.status === 'Existing');
            const deptRow = filteredRows.find(r => r && r.type === 'department' && r.status === 'Existing');
            const firstFabRow = Array.isArray(lastFabRows) && lastFabRows.length ? lastFabRows[0] : {};
            const initiatorEmail = normalize(firstFabRow.initiator);
            const plantCode = normalize(plantRow && plantRow.name);
            const deptCode = normalize(deptRow && deptRow.name);
            if (!plantCode || !deptCode || !initiatorEmail) return;

            try {
                window._lastPlantCode = plantCode;
                window._lastDeptCode = deptCode;
                window._lastInitiatorEmail = initiatorEmail;
            } catch (_) {}

            const bar = document.querySelector('.validate-bar') || resultsSection;
            if (!bar) return;

            const hbtn = document.createElement('button');
            hbtn.id = 'hierarchyCheckBtn';
            hbtn.className = 'btn btn-outline-secondary';
            hbtn.style.marginLeft = '10px';
            hbtn.textContent = 'Hierarchy Check';
            hbtn.setAttribute('data-plant', plantCode);
            hbtn.setAttribute('data-dept', deptCode);
            hbtn.setAttribute('data-email', initiatorEmail);
            bar.appendChild(hbtn);
        };

        syncHierarchyCheckButton();

        // Validate email existence while displaying (no need to click ADD ROLE)
        // We only update rows that have data-email and are currently marked as Existing.
        // Table columns: 1 Form Field, 2 Name/Data, 3 Status, 4 Expected Role, 5 Message, 6 Action
        try {
            const emailRows = resultsSection.querySelectorAll('tr[data-email]');
            emailRows.forEach(async (tr) => {
                if ((tr.getAttribute('data-row-type') || '').trim() !== 'email') return;
                const email = (tr.getAttribute('data-email') || '').trim();
                if (!email) return;
                const tds = tr.querySelectorAll('td');
                if (!tds || tds.length < 6) return;

                const statusTd = tds[2];
                const expectedRoleTd = tds[3];
                const msgTd = tds[4];
                const currentStatus = (statusTd.textContent || '').trim();
                if (currentStatus !== 'Existing') return;

                const data = await getUserExists(email);
                if (!data || data.present !== true) {
                    statusTd.textContent = 'Not Existing';
                    statusTd.className = 'status-invalid';
                    if (msgTd) msgTd.textContent = 'User not found';
                } else {
                    // keep consistent formatting
                    statusTd.textContent = 'Existing';
                    statusTd.className = 'status-valid';
                    const expectedRole = expectedRoleTd ? String(expectedRoleTd.textContent || '').trim() : '-';
                    const roleMessage = await checkUserRoleAssignment(email, expectedRole);
                    if (msgTd) msgTd.textContent = roleMessage;
                }
                syncHierarchyCheckButton();
            });
        } catch (_) {}
        
        // Disable submit button if there are invalid rows
        const hasInvalidRows = results.some(r => r.status === 'INVALID');
        const submitBtn = document.querySelector('#submitBtn, .submit-btn');
        if (submitBtn) {
            submitBtn.disabled = hasInvalidRows;
            if (hasInvalidRows) {
                submitBtn.title = 'Please fix validation errors before submitting';
            } else {
                submitBtn.title = '';
            }
        }
    }
    
    function showError(message) {
        // Use existing toast or create one
        const toast = document.getElementById('toast');
        if (toast) {
            toast.textContent = message;
            toast.style.background = '#dc3545';
            toast.style.display = 'block';
            setTimeout(() => {
                toast.style.display = 'none';
            }, 5000);
        } else {
            alert(message);
        }
    }
    
    function showSuccess(message) {
        const toast = document.getElementById('toast');
        if (toast) {
            toast.textContent = message;
            toast.style.background = '#198754';
            toast.style.display = 'block';
            setTimeout(() => {
                toast.style.display = 'none';
            }, 3000);
        }
    }
    
    // Expose functions for testing
    window.FABValidation = {
        validateFABData,
        convertToFABFormat,
        displayFABValidationResults
    };
})();

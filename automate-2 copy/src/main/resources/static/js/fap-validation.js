(function () {
    'use strict';

    const API_BASE = (typeof window !== 'undefined' && window.API_BASE != null)
        ? String(window.API_BASE)
        : ((location.protocol === 'file:') ? 'http://localhost:8080' : '');

    let fapAllResults = [];
    let fapSelectedResult = null;
    let fapCheckState = {
        plantUser: false,
        departmentUser: false,
        plantDepartment: false
    };

    initializeWhenReady();

    function initializeWhenReady() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initializeFAPValidation);
        } else {
            setTimeout(initializeFAPValidation, 500);
        }
    }

    function initializeFAPValidation() {
        if (!isFAPModule()) return;
        try { window.currentModule = 'FAP'; } catch (_) {}
        ensureFapTableStyles();
        hideSharedValidateButton();
        addFAPValidationControls();
        setupFAPEventListeners();
    }

    function isFAPModule() {
        const urlParams = new URLSearchParams(window.location.search);
        return (urlParams.get('module') || '').toUpperCase() === 'FAP';
    }

    function hideSharedValidateButton() {
        const validateBtn = document.getElementById('validateBtn');
        if (validateBtn) {
            validateBtn.disabled = true;
            validateBtn.classList.add('d-none');
        }
    }

    function addFAPValidationControls() {
        let validateBar = document.querySelector('.validate-bar');
        if (!validateBar) {
            validateBar = document.createElement('div');
            validateBar.className = 'validate-bar';
            validateBar.style.cssText = 'margin: 20px 0; text-align: center;';
            const fileInfo = document.getElementById('fileInfo');
            if (fileInfo && fileInfo.parentNode) {
                fileInfo.parentNode.insertBefore(validateBar, fileInfo.nextSibling);
            }
        }

        const existingBtn = document.getElementById('fapValidateBtn');
        if (existingBtn) existingBtn.remove();

        const existingSelector = document.getElementById('fapRowSelector');
        if (existingSelector && existingSelector.parentElement) {
            existingSelector.parentElement.remove();
        }

        const selectorWrap = document.createElement('div');
        selectorWrap.className = 'fap-row-selector-wrap d-none';

        const selectorLabel = document.createElement('label');
        selectorLabel.setAttribute('for', 'fapRowSelector');
        selectorLabel.textContent = 'Select Row';
        selectorLabel.className = 'form-label mb-0 fw-semibold';

        const rowSelector = document.createElement('select');
        rowSelector.id = 'fapRowSelector';
        rowSelector.className = 'form-control';
        rowSelector.innerHTML = '<option value="">Choose row...</option>';

        selectorWrap.appendChild(selectorLabel);
        selectorWrap.appendChild(rowSelector);
        validateBar.appendChild(selectorWrap);

        const fapValidateBtn = document.createElement('button');
        fapValidateBtn.id = 'fapValidateBtn';
        fapValidateBtn.className = 'btn btn-primary d-none';
        fapValidateBtn.disabled = true;
        fapValidateBtn.innerHTML = '<i class="bi bi-check2-circle"></i> FAP Validation';
        fapValidateBtn.style.cssText = 'margin: 10px;';

        validateBar.appendChild(fapValidateBtn);

        rowSelector.addEventListener('change', () => {
            fapValidateBtn.disabled = requiresFapRowSelection() ? !rowSelector.value : false;
        });

        refreshFapRowSelectorOptions();
    }

    function setupFAPEventListeners() {
        const fapValidateBtn = document.getElementById('fapValidateBtn');
        if (fapValidateBtn) {
            fapValidateBtn.addEventListener('click', async (event) => {
                event.preventDefault();
                await validateFapData();
            });
        }

        const fileInput = document.getElementById('fileInput');
        if (fileInput) {
            fileInput.addEventListener('change', handleFapFileUpload);
        }

        const dropZone = document.getElementById('dropZone');
        if (dropZone) {
            dropZone.addEventListener('drop', () => {
                setTimeout(handleFapFileUpload, 500);
            });
        }
    }

    function handleFapFileUpload() {
        hideSharedValidateButton();
        refreshFapRowSelectorOptions();
        setTimeout(refreshFapRowSelectorOptions, 300);
        setTimeout(refreshFapRowSelectorOptions, 900);
        setTimeout(refreshFapRowSelectorOptions, 1500);
    }

    function getAvailableFapRows() {
        return convertToFapRows(window.parsedData || []);
    }

    function requiresFapRowSelection() {
        return getAvailableFapRows().length > 1;
    }

    function refreshFapRowSelectorOptions() {
        const rowSelector = document.getElementById('fapRowSelector');
        const selectorWrap = rowSelector ? rowSelector.closest('.fap-row-selector-wrap') : null;
        const fapValidateBtn = document.getElementById('fapValidateBtn');
        if (!rowSelector || !selectorWrap || !fapValidateBtn) return;

        const currentValue = rowSelector.value;
        const rows = getAvailableFapRows();

        rowSelector.innerHTML = '<option value="">Choose row...</option>';
        rows.forEach((row) => {
            const opt = document.createElement('option');
            opt.value = String(row.rowNumber);
            opt.textContent = `Row ${row.rowNumber}`;
            rowSelector.appendChild(opt);
        });

        if (rows.some((row) => String(row.rowNumber) === currentValue)) {
            rowSelector.value = currentValue;
        } else {
            rowSelector.value = '';
        }

        const hasRows = rows.length > 0;
        const showSelector = rows.length > 1;
        selectorWrap.classList.toggle('d-none', !showSelector);
        fapValidateBtn.classList.toggle('d-none', !hasRows);
        fapValidateBtn.disabled = showSelector ? !rowSelector.value : !hasRows;
    }

    async function validateFapData() {
        const fapValidateBtn = document.getElementById('fapValidateBtn');
        const rowSelector = document.getElementById('fapRowSelector');
        if (!fapValidateBtn) return;

        const allRows = getAvailableFapRows();
        if (!allRows.length) {
            showFapError('Please upload an Excel file with User Email, Plant Code, and Department Code.');
            return;
        }

        const selectedRowNumber = rowSelector ? Number(rowSelector.value) : NaN;
        if (requiresFapRowSelection() && !selectedRowNumber) {
            showFapError('Please select a row to validate.');
            return;
        }

        const originalText = fapValidateBtn.innerHTML;
        fapValidateBtn.disabled = true;
        fapValidateBtn.innerHTML = '<i class="bi bi-hourglass-split"></i> Validating...';

        try {
            const response = await fetch(`${API_BASE}/api/fap/validate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(allRows)
            });

            if (!response.ok) {
                const errorText = await response.text().catch(() => '');
                throw new Error(errorText || 'FAP validation failed');
            }

            const results = await response.json();
            fapAllResults = Array.isArray(results) ? results : [];
            fapSelectedResult = requiresFapRowSelection()
                ? fapAllResults.find((row) => Number(row.rowNumber) === selectedRowNumber) || null
                : (fapAllResults[0] || null);

            resetFapCheckState();
            renderFapResults();
            showFapSuccess('FAP validation completed');
        } catch (error) {
            console.error('FAP validation error:', error);
            showFapError(error.message || 'FAP validation failed');
        } finally {
            fapValidateBtn.innerHTML = originalText;
            fapValidateBtn.disabled = requiresFapRowSelection() ? !(rowSelector && rowSelector.value) : false;
        }
    }

    function convertToFapRows(excelData) {
        const rows = [];
        const headerInfo = findFapHeaderRow(excelData);
        if (!headerInfo) return rows;

        const { headerRowIndex, headers } = headerInfo;
        const plantIdx = findColumnIndex(headers, ['plant code', 'plant_code', 'plant code / plant']);
        const departmentIdx = findColumnIndex(headers, ['department code', 'department_code', 'dept code', 'dept_code', 'department', 'dept name', 'department name']);
        const emailIndices = findEmailColumnIndices(headers, [plantIdx, departmentIdx]);

        for (let i = headerRowIndex + 1; i < excelData.length; i++) {
            const row = Array.isArray(excelData[i]) ? excelData[i] : [excelData[i]];
            const emailEntries = emailIndices
                .map((idx) => ({
                    fieldName: normalizeCell(headers[idx]) || `Email Column ${idx + 1}`,
                    email: normalizeCell(row[idx])
                }))
                .filter((entry) => entry.email);
            const userEmail = emailEntries.length ? emailEntries[0].email : '';
            const plantCode = normalizeCell(row[plantIdx]);
            const departmentCode = normalizeCell(row[departmentIdx]);
            if (!emailEntries.length && !plantCode && !departmentCode) continue;

            rows.push({
                rowNumber: i + 1,
                userEmail,
                plantCode,
                departmentCode,
                emailEntries
            });
        }

        return rows;
    }

    function findFapHeaderRow(excelData) {
        if (!Array.isArray(excelData) || !excelData.length) return null;

        let best = null;
        for (let i = 0; i < Math.min(excelData.length, 20); i++) {
            const row = Array.isArray(excelData[i]) ? excelData[i] : [];
            const normalized = row.map((cell) => normalizeCell(cell).toLowerCase());
            const hits = [
                normalized.some((cell) => cell.includes('user email') || cell === 'email' || cell.includes('email id')),
                normalized.some((cell) => cell.includes('plant')),
                normalized.some((cell) => cell.includes('department') || cell.includes('dept'))
            ].filter(Boolean).length;

            if (!best || hits > best.hits) {
                best = { headerRowIndex: i, headers: row, hits };
            }
        }

        return best && best.hits >= 3 ? { headerRowIndex: best.headerRowIndex, headers: best.headers } : null;
    }

    function findColumnIndex(headers, aliases) {
        const normalizedHeaders = Array.isArray(headers) ? headers.map((header) => normalizeCell(header).toLowerCase()) : [];
        for (const alias of aliases) {
            const normalizedAlias = String(alias || '').toLowerCase();
            const index = normalizedHeaders.findIndex((header) => header.includes(normalizedAlias));
            if (index !== -1) return index;
        }
        return -1;
    }

    function findEmailColumnIndices(headers, excludedIndices) {
        const excluded = new Set((excludedIndices || []).filter((idx) => idx >= 0));
        const normalizedHeaders = Array.isArray(headers) ? headers.map((header) => normalizeCell(header).toLowerCase()) : [];
        const indices = [];
        normalizedHeaders.forEach((header, index) => {
            if (excluded.has(index)) return;
            if (header.includes('mail') || header.includes('email')) {
                indices.push(index);
            }
        });
        return indices;
    }

    function normalizeCell(value) {
        if (value === null || value === undefined) return '';
        const stringValue = String(value).trim();
        if (!stringValue || stringValue.toLowerCase() === 'nan') return '';
        return stringValue;
    }

    function renderFapResults() {
        const existingResults = document.getElementById('fapResults');
        if (existingResults) existingResults.remove();

        const existingActions = document.getElementById('fapCheckActions');
        if (existingActions) existingActions.remove();

        removeHierarchyButton();

        if (!fapSelectedResult) {
            showFapError('No FAP row selected for display.');
            return;
        }

        const validCount = fapAllResults.filter((row) => row && row.overallStatus === 'Existing').length;
        const duplicateCount = fapAllResults.filter((row) => row && row.overallStatus === 'Duplicate').length;
        const invalidCount = fapAllResults.length - validCount - duplicateCount;

        const resultsSection = document.createElement('section');
        resultsSection.id = 'fapResults';
        resultsSection.className = 'mt-5';
        resultsSection.innerHTML = `
            <h4>FAP Validation Results</h4>
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
                <div class="summary-item" style="background:#fff8db;color:#8a6d00;">
                    <h4>Duplicate</h4>
                    <div class="count">${duplicateCount}</div>
                    <div class="subtext">Excel</div>
                </div>
            </div>
            <div class="table-responsive" style="overflow-x:auto; overflow-y:hidden; padding-bottom:12px; scrollbar-gutter: stable both-edges;">
                <table class="table fap-results-table" id="fapResultsTable">
                    <colgroup>
                        <col style="width: 18%;">
                        <col style="width: 25%;">
                        <col style="width: 18%;">
                        <col style="width: 24%;">
                        <col style="width: 15%;">
                    </colgroup>
                    <thead>
                        <tr>
                            <th>Form Field</th>
                            <th>Name / Data</th>
                            <th>Status</th>
                            <th>Message</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${buildFapResultRows(fapSelectedResult)}
                    </tbody>
                </table>
            </div>
        `;

        const validateBar = document.querySelector('.validate-bar');
        if (validateBar && validateBar.parentNode) {
            validateBar.parentNode.insertBefore(resultsSection, validateBar.nextSibling);
        }

        if (allFapRowsExisting()) {
            renderFapCheckButtons(resultsSection);
        }
    }

    function buildFapResultRows(result) {
        const rows = [
            {
                field: 'Plant Code',
                value: result.plantCode,
                status: result.plantStatus,
                message: result.plantMessage,
                type: 'plant'
            },
            {
                field: 'Department',
                value: result.departmentCode,
                status: result.departmentStatus,
                message: result.departmentMessage,
                type: 'department'
            }
        ];

        const emailRows = Array.isArray(result.emailValidations) ? result.emailValidations : [];
        emailRows.forEach((item) => {
            rows.unshift({
                field: normalizeCell(item.fieldName) || 'User Email',
                value: item.email,
                status: item.status,
                message: item.message,
                type: 'email'
            });
        });

        return rows.map((row) => {
            const status = normalizeCell(row.status) || '-';
            const cssClass = status === 'Existing'
                ? 'status-valid'
                : (status === 'Duplicate' ? 'status-duplicate' : 'status-invalid');
            const value = normalizeCell(row.value) || '-';
            const showAddRole = row.type === 'email' && value !== '-';
            const showInsert = (row.type === 'plant' || row.type === 'department') && status === 'Not Existing' && value !== '-';
            return `
                <tr data-row-type="${row.type || ''}" ${row.type === 'email' && value !== '-' ? `data-email="${value}"` : ''}>
                    <td class="fap-col-field">${row.field}</td>
                    <td class="fap-col-value">${value}</td>
                    <td class="${cssClass}">${status}</td>
                    <td class="fap-col-message">${normalizeCell(row.message) || '-'}</td>
                    <td class="fap-col-action">
                        ${showAddRole
                            ? `<div class="fap-action-wrap"><button class="btn btn-outline-secondary validate-email-btn" data-email="${value}" data-expected-role="-">ADD ROLE</button></div>`
                            : ''}
                        ${showInsert
                            ? `<div class="fap-action-wrap"><button class="btn btn-success insert-btn" style="background-color:#28a745;border-color:#28a745;color:white;" data-type="${row.type}" data-code="${value}">Insert</button></div>`
                            : ''}
                    </td>
                </tr>
            `;
        }).join('');
    }

    function ensureFapTableStyles() {
        if (document.getElementById('fapValidationStyles')) return;
        const style = document.createElement('style');
        style.id = 'fapValidationStyles';
        style.textContent = `
            #fapResultsTable {
                table-layout: fixed;
                width: 100%;
                min-width: 1100px;
            }
            #fapResultsTable th,
            #fapResultsTable td {
                vertical-align: middle;
                border-right: 1px solid #d6deea;
            }
            #fapResultsTable th:last-child,
            #fapResultsTable td:last-child {
                border-right: none;
            }
            #fapResultsTable .fap-col-field,
            #fapResultsTable .fap-col-value,
            #fapResultsTable .fap-col-message {
                word-break: break-word;
            }
            #fapResultsTable .fap-col-action {
                white-space: nowrap;
                text-align: center;
            }
            #fapResultsTable .fap-action-wrap {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                min-height: 36px;
            }
        `;
        document.head.appendChild(style);
    }

    function renderFapCheckButtons(resultsSection) {
        const actions = document.createElement('div');
        actions.id = 'fapCheckActions';
        actions.className = 'mt-3 d-flex flex-wrap gap-2 align-items-center';
        actions.innerHTML = `
            <button id="fapPlantUserCheckBtn" class="btn btn-outline-secondary">Plant-User Check</button>
            <span id="fapPlantUserCheckMsg" class="small text-muted"></span>
            <button id="fapDepartmentUserCheckBtn" class="btn btn-outline-secondary">Department-User Check</button>
            <span id="fapDepartmentUserCheckMsg" class="small text-muted"></span>
            <button id="fapPlantDepartmentCheckBtn" class="btn btn-outline-secondary">Plant-Department Check</button>
            <span id="fapPlantDepartmentCheckMsg" class="small text-muted"></span>
        `;
        resultsSection.appendChild(actions);

        try {
            window._lastPlantCode = normalizeCell(fapSelectedResult ? fapSelectedResult.plantCode : '');
            window._lastDeptCode = normalizeCell(fapSelectedResult ? fapSelectedResult.departmentCode : '');
            window._lastInitiatorEmail = normalizeCell(fapSelectedResult ? fapSelectedResult.userEmail : '');
        } catch (_) {}

        const bindCheck = (buttonId, messageId, checkType, stateKey) => {
            const button = document.getElementById(buttonId);
            const message = document.getElementById(messageId);
            if (!button || !message) return;

            button.addEventListener('click', async () => {
                button.disabled = true;
                message.textContent = 'Checking...';
                try {
                    const res = await runFapCheck(checkType);
                    if (checkType === 'plant-user' || checkType === 'department-user' || checkType === 'plant-department') {
                        message.textContent = '';
                        message.className = 'small text-muted';
                    } else {
                        message.textContent = `${res.status} (count: ${res.count})`;
                        message.className = res.satisfied ? 'small text-success' : 'small text-danger';
                    }
                    fapCheckState[stateKey] = !!res.satisfied;
                    if (checkType === 'plant-user') {
                        openFapPlantMappingDialog();
                    }
                    if (checkType === 'department-user') {
                        openFapDepartmentMappingDialog();
                    }
                    if (checkType === 'plant-department') {
                        openFapPlantDepartmentMappingDialog();
                    }
                    syncFapHierarchyButton(resultsSection);
                } catch (error) {
                    message.textContent = error.message || 'Check failed';
                    message.className = 'small text-danger';
                    fapCheckState[stateKey] = false;
                    syncFapHierarchyButton(resultsSection);
                } finally {
                    button.disabled = false;
                }
            });
        };

        bindCheck('fapPlantUserCheckBtn', 'fapPlantUserCheckMsg', 'plant-user', 'plantUser');
        bindCheck('fapDepartmentUserCheckBtn', 'fapDepartmentUserCheckMsg', 'department-user', 'departmentUser');
        bindCheck('fapPlantDepartmentCheckBtn', 'fapPlantDepartmentCheckMsg', 'plant-department', 'plantDepartment');
    }

    function openFapPlantMappingDialog() {
        const email = normalizeCell(fapSelectedResult ? fapSelectedResult.userEmail : '');
        const plantCode = normalizeCell(fapSelectedResult ? fapSelectedResult.plantCode : '');
        if (!email) return;

        try {
            window._lastPlantCode = plantCode;
            window._lastInitiatorEmail = email;
        } catch (_) {}

        if (typeof window.showPlantMappingModalForEmail === 'function') {
            window.showPlantMappingModalForEmail(email);
        }
    }

    function openFapDepartmentMappingDialog() {
        const email = normalizeCell(fapSelectedResult ? fapSelectedResult.userEmail : '');
        const departmentCode = normalizeCell(fapSelectedResult ? fapSelectedResult.departmentCode : '');
        if (!email || !departmentCode) return;

        try {
            window._lastDeptCode = departmentCode;
            window._lastInitiatorEmail = email;
        } catch (_) {}

        if (typeof window.showDepartmentMappingModalForUser === 'function') {
            window.showDepartmentMappingModalForUser(departmentCode, email);
        }
    }

    function openFapPlantDepartmentMappingDialog() {
        const plantCode = normalizeCell(fapSelectedResult ? fapSelectedResult.plantCode : '');
        const departmentCode = normalizeCell(fapSelectedResult ? fapSelectedResult.departmentCode : '');
        if (!plantCode || !departmentCode) return;

        try {
            window._lastPlantCode = plantCode;
            window._lastDeptCode = departmentCode;
        } catch (_) {}

        if (typeof window.showPlantDepartmentMappingModal === 'function') {
            window.showPlantDepartmentMappingModal(plantCode, departmentCode);
        }
    }

    async function runFapCheck(checkType) {
        const response = await fetch(`${API_BASE}/api/fap/checks/${encodeURIComponent(checkType)}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userEmail: fapSelectedResult ? fapSelectedResult.userEmail : '',
                plantCode: fapSelectedResult ? fapSelectedResult.plantCode : '',
                departmentCode: fapSelectedResult ? fapSelectedResult.departmentCode : ''
            })
        });

        if (!response.ok) {
            const errorText = await response.text().catch(() => '');
            throw new Error(errorText || 'Check failed');
        }

        return response.json();
    }

    function allFapRowsExisting() {
        return Array.isArray(fapAllResults)
            && fapAllResults.length > 0
            && fapAllResults.every((row) => row && row.overallStatus === 'Existing');
    }

    function syncFapHierarchyButton(resultsSection) {
        removeHierarchyButton();

        if (!fapSelectedResult) return;
        if (!fapCheckState.plantUser || !fapCheckState.departmentUser || !fapCheckState.plantDepartment) return;

        const bar = document.querySelector('.validate-bar') || resultsSection;
        if (!bar) return;

        const hierarchyButton = document.createElement('button');
        hierarchyButton.id = 'hierarchyCheckBtn';
        hierarchyButton.className = 'btn btn-outline-secondary';
        hierarchyButton.style.marginLeft = '10px';
        hierarchyButton.textContent = 'Hierarchy Check';
        hierarchyButton.setAttribute('data-plant', normalizeCell(fapSelectedResult.plantCode));
        hierarchyButton.setAttribute('data-dept', normalizeCell(fapSelectedResult.departmentCode));
        hierarchyButton.setAttribute('data-email', normalizeCell(fapSelectedResult.userEmail));
        bar.appendChild(hierarchyButton);

        try {
            window._lastPlantCode = normalizeCell(fapSelectedResult.plantCode);
            window._lastDeptCode = normalizeCell(fapSelectedResult.departmentCode);
            window._lastInitiatorEmail = normalizeCell(fapSelectedResult.userEmail);
        } catch (_) {}
    }

    function removeHierarchyButton() {
        const existing = document.getElementById('hierarchyCheckBtn');
        if (existing) existing.remove();
    }

    function resetFapCheckState() {
        fapCheckState = {
            plantUser: false,
            departmentUser: false,
            plantDepartment: false
        };
    }

    function showFapSuccess(message) {
        console.log(message);
    }

    function showFapError(message) {
        console.error(message);
    }
})();

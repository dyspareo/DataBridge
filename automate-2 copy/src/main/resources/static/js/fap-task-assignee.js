(function() {
    'use strict';

    const API_BASE = (location.protocol === 'file:') ? 'http://localhost:8080' : '';
    
    let checkResults = {
        check1: false,
        check2: false,
        check3: false
    };

    // Excel data storage
    let excelData = [];
    let currentRowData = null;

    // Initialize page
    document.addEventListener('DOMContentLoaded', function() {
        loadExistingRecords();
        setupEventListeners();
        setupExcelUpload();
        runPreConditionChecks();
    });

    function setupEventListeners() {
        // Form field changes trigger re-checking
        const formFields = ['plant_code', 'department', 'initiator_login_name'];
        formFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) {
                field.addEventListener('change', runPreConditionChecks);
                field.addEventListener('blur', runPreConditionChecks);
            }
        });

        // FAP Hierarchy button click
        const hierarchyBtn = document.getElementById('fapHierarchyBtn');
        if (hierarchyBtn) {
            hierarchyBtn.addEventListener('click', showConfirmDialog);
        }

        // Row selection and populate form events
        const rowSelector = document.getElementById('fapTaskAssigneeRowSelector');
        const populateBtn = document.getElementById('populateFormBtn');
        
        if (rowSelector) {
            rowSelector.addEventListener('change', function() {
                populateBtn.disabled = !this.value;
            });
        }
        
        if (populateBtn) {
            populateBtn.addEventListener('click', populateFormFromSelectedRow);
        }
    }

    function setupExcelUpload() {
        const dropZone = document.getElementById('dropZone');
        const fileInput = document.getElementById('fileInput');
        const loadDataBtn = document.getElementById('loadDataBtn');

        if (dropZone && fileInput) {
            // Click to upload
            dropZone.addEventListener('click', () => fileInput.click());
            
            // Drag and drop
            dropZone.addEventListener('dragover', (e) => {
                e.preventDefault();
                dropZone.classList.add('dragover');
            });
            
            dropZone.addEventListener('dragleave', () => {
                dropZone.classList.remove('dragover');
            });
            
            dropZone.addEventListener('drop', (e) => {
                e.preventDefault();
                dropZone.classList.remove('dragover');
                const files = e.dataTransfer.files;
                if (files.length > 0) {
                    handleFileUpload(files[0]);
                }
            });
            
            // File input change
            fileInput.addEventListener('change', (e) => {
                if (e.target.files.length > 0) {
                    handleFileUpload(e.target.files[0]);
                }
            });
        }

        // Load Data button
        if (loadDataBtn) {
            loadDataBtn.addEventListener('click', loadExcelData);
        }
    }

    function handleFileUpload(file) {
        // Validate file type
        const validTypes = ['.xlsx', '.xls'];
        const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
        
        if (!validTypes.includes(fileExtension)) {
            showErrorToast('Please upload an Excel file (.xlsx or .xls)');
            return;
        }

        // Display file info
        const fileInfo = document.getElementById('fileInfo');
        const fileName = document.getElementById('fileName');
        const fileSize = document.getElementById('fileSize');
        const noData = document.getElementById('noData');
        
        if (fileInfo && fileName && fileSize && noData) {
            fileName.textContent = file.name;
            fileSize.textContent = formatFileSize(file.size);
            fileInfo.classList.remove('d-none');
            noData.classList.add('d-none');
        }

        // Read Excel file
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                processExcelFile(workbook);
            } catch (error) {
                console.error('Error reading Excel file:', error);
                showErrorToast('Failed to read Excel file. Please check the file format.');
            }
        };
        reader.readAsArrayBuffer(file);
    }

    function processExcelFile(workbook) {
        try {
            // Get the first worksheet
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            
            // Convert to JSON
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            
            if (jsonData.length === 0) {
                showErrorToast('Excel file is empty');
                return;
            }

            // Store data and display table
            excelData = jsonData;
            displayExcelTable(jsonData);
            showLoadDataButton();
            
        } catch (error) {
            console.error('Error processing Excel file:', error);
            showErrorToast('Failed to process Excel file');
        }
    }

    function displayExcelTable(data) {
        const dataTable = document.getElementById('dataTable');
        if (!dataTable) return;

        if (data.length === 0) {
            dataTable.innerHTML = '';
            return;
        }

        // Create table HTML
        let tableHTML = '';
        
        // Header row
        if (data.length > 0) {
            const headers = data[0];
            tableHTML += '<thead class="table-light"><tr>';
            headers.forEach(header => {
                tableHTML += `<th>${header || ''}</th>`;
            });
            tableHTML += '</tr></thead>';
        }

        // Data rows (limit to first 50 rows for performance)
        const dataRows = data.slice(1, 51);
        tableHTML += '<tbody>';
        dataRows.forEach((row, index) => {
            tableHTML += '<tr>';
            row.forEach(cell => {
                tableHTML += `<td>${cell !== undefined && cell !== null ? cell : ''}</td>`;
            });
            tableHTML += '</tr>';
        });
        tableHTML += '</tbody>';

        dataTable.innerHTML = tableHTML;
        dataTable.classList.remove('d-none');
    }

    function showLoadDataButton() {
        const loadDataBtn = document.getElementById('loadDataBtn');
        const codeSummary = document.getElementById('codeSummary');
        
        if (loadDataBtn) {
            loadDataBtn.classList.remove('d-none');
            loadDataBtn.disabled = false;
        }
        
        if (codeSummary) {
            const rowCount = excelData.length - 1; // Exclude header
            codeSummary.textContent = `${rowCount} rows loaded`;
            codeSummary.classList.remove('d-none');
        }
    }

    function loadExcelData() {
        if (excelData.length === 0) {
            showErrorToast('No Excel data available');
            return;
        }

        try {
            // Convert to format with row numbers
            const formattedData = excelData.slice(1).map((row, index) => ({
                rowNumber: index + 2, // Excel row numbers start from 2 (after header)
                data: row
            })).filter(row => row.data && row.data.length > 0);

            if (formattedData.length === 0) {
                showErrorToast('No valid data rows found');
                return;
            }

            // Update row selector
            updateRowSelector(formattedData);
            
            // Show row selection card
            const rowSelectionCard = document.getElementById('rowSelectionCard');
            if (rowSelectionCard) {
                rowSelectionCard.classList.remove('d-none');
            }

            showSuccessToast(`Excel data loaded successfully. ${formattedData.length} rows available.`);
            
        } catch (error) {
            console.error('Error loading Excel data:', error);
            showErrorToast('Failed to load Excel data');
        }
    }

    function updateRowSelector(rows) {
        const rowSelector = document.getElementById('fapTaskAssigneeRowSelector');
        if (!rowSelector) return;

        // Clear existing options
        rowSelector.innerHTML = '<option value="">Choose row...</option>';

        // Add row options
        rows.forEach(row => {
            const option = document.createElement('option');
            option.value = row.rowNumber;
            option.textContent = `Row ${row.rowNumber}`;
            rowSelector.appendChild(option);
        });

        // Store formatted data for later use
        window.fapTaskAssigneeRows = rows;
    }

    function populateFormFromSelectedRow() {
        const rowSelector = document.getElementById('fapTaskAssigneeRowSelector');
        if (!rowSelector || !rowSelector.value) {
            showErrorToast('Please select a row first');
            return;
        }

        const selectedRowNumber = parseInt(rowSelector.value);
        const selectedRow = window.fapTaskAssigneeRows.find(row => row.rowNumber === selectedRowNumber);
        
        if (!selectedRow) {
            showErrorToast('Selected row not found');
            return;
        }

        currentRowData = selectedRow.data;
        populateFormFields(currentRowData);
        showSuccessToast('Form populated with selected row data');
    }

    function populateFormFields(rowData) {
        try {
            // Helper function to find data by flexible column matching
            const findValue = (possibleColumns) => {
                const headers = excelData[0] || [];
                for (const colName of possibleColumns) {
                    const index = headers.findIndex(header => 
                        String(header || '').toLowerCase().includes(colName.toLowerCase())
                    );
                    if (index !== -1 && rowData[index] != null && String(rowData[index]).trim() !== '') {
                        return String(rowData[index]).trim();
                    }
                }
                return '';
            };

            // Map Excel columns to form fields
            const fieldMappings = {
                'plant_code': ['plant_code', 'plant code', 'plant', 'plantcode'],
                'department': ['department', 'dept', 'department_code', 'dept code', 'department code'],
                'initiator_login_name': ['initiator_login_name', 'initiator', 'initiator login', 'user', 'email'],
                'reviewer1_list': ['reviewer1_list', 'reviewer1', 'reviewer 1', 'reviewer1 email'],
                'reviewer2_list': ['reviewer2_list', 'reviewer2', 'reviewer 2', 'reviewer2 email'],
                'cbs_team': ['cbs_team', 'cbs', 'cbs team', 'cbs email'],
                'management_approver_list': ['management_approver_list', 'management_approver', 'mgmt approver', 'approver']
            };

            // Populate form fields
            Object.entries(fieldMappings).forEach(([fieldId, possibleColumns]) => {
                const field = document.getElementById(fieldId);
                if (field) {
                    const value = findValue(possibleColumns);
                    if (value) {
                        field.value = value;
                        // Trigger change event to run validation
                        field.dispatchEvent(new Event('change'));
                    }
                }
            });

        } catch (error) {
            console.error('Error populating form fields:', error);
            showErrorToast('Failed to populate form fields');
        }
    }

    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    async function runPreConditionChecks() {
        const formData = getFormData();
        
        try {
            // Run all three checks in parallel
            const [check1, check2, check3] = await Promise.all([
                runCheck('plant-user', formData),
                runCheck('department-user', formData),
                runCheck('plant-department', formData)
            ]);

            checkResults.check1 = check1.count > 0;
            checkResults.check2 = check2.count > 0;
            checkResults.check3 = check3.count > 0;

            updateCheckIndicators();
            updateHierarchyButtonVisibility();
        } catch (error) {
            console.error('Error running pre-condition checks:', error);
            // Reset all checks to false on error
            checkResults = { check1: false, check2: false, check3: false };
            updateCheckIndicators();
            updateHierarchyButtonVisibility();
        }
    }

    async function runCheck(checkType, formData) {
        const response = await fetch(`${API_BASE}/api/fap/checks/${checkType}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                plantCode: formData.plant_code,
                departmentCode: formData.department,
                userEmail: formData.initiator_login_name
            })
        });

        if (!response.ok) {
            throw new Error(`Check ${checkType} failed`);
        }

        return response.json();
    }

    function updateCheckIndicators() {
        ['check1', 'check2', 'check3'].forEach(checkId => {
            const dot = document.getElementById(`${checkId}-dot`);
            if (dot) {
                if (checkResults[checkId]) {
                    dot.classList.add('passed');
                } else {
                    dot.classList.remove('passed');
                }
            }
        });
    }

    function updateHierarchyButtonVisibility() {
        const button = document.getElementById('fapHierarchyBtn');
        if (button) {
            const allChecksPassed = checkResults.check1 && checkResults.check2 && checkResults.check3;
            button.disabled = !allChecksPassed;
        }
    }

    function getFormData() {
        return {
            plant_code: document.getElementById('plant_code')?.value || '',
            department: document.getElementById('department')?.value || '',
            initiator_login_name: document.getElementById('initiator_login_name')?.value || '',
            reviewer1_list: document.getElementById('reviewer1_list')?.value || '',
            reviewer2_list: document.getElementById('reviewer2_list')?.value || '',
            cbs_team: document.getElementById('cbs_team')?.value || '',
            management_approver_list: document.getElementById('management_approver_list')?.value || '',
            status_id: parseInt(document.getElementById('status_id')?.value) || 1
        };
    }

    function showConfirmDialog() {
        const formData = getFormData();
        const rows = buildInsertRows(formData);
        
        const dialogBody = document.getElementById('confirmDialogBody');
        dialogBody.innerHTML = rows.map(row => `
            <tr>
                <td>${row.plant_code}</td>
                <td>${row.department}</td>
                <td>${row.initiator_login_name}</td>
                <td>${row.total_value_lower_limit}</td>
                <td>${row.total_value_upper_limit || 'NULL'}</td>
                <td>${row.management_approver_list || 'NULL'}</td>
                <td>${row.status_id === 1 ? 'Active' : 'Inactive'}</td>
            </tr>
        `).join('');

        document.getElementById('confirmDialog').style.display = 'flex';
    }

    function closeConfirmDialog() {
        document.getElementById('confirmDialog').style.display = 'none';
    }

    function buildInsertRows(formData) {
        const commonFields = {
            plant_code: formData.plant_code,
            department: formData.department,
            initiator_login_name: formData.initiator_login_name,
            reviewer1_list: formData.reviewer1_list,
            reviewer2_list: formData.reviewer2_list,
            cbs_team: formData.cbs_team,
            status_id: formData.status_id
        };

        return [
            {
                ...commonFields,
                total_value_lower_limit: "0",
                total_value_upper_limit: 400000,
                approver_list: null,
                management_approver_list: null
            },
            {
                ...commonFields,
                total_value_lower_limit: "400000",
                total_value_upper_limit: 10000000,
                approver_list: null,
                management_approver_list: null
            },
            {
                ...commonFields,
                total_value_lower_limit: "10000000",
                total_value_upper_limit: null,
                approver_list: null,
                management_approver_list: formData.management_approver_list
            }
        ];
    }

    async function confirmInsert() {
        const button = document.getElementById('fapHierarchyBtn');
        const originalText = button.innerHTML;
        
        // Show loading state
        button.disabled = true;
        button.classList.add('loading');
        button.innerHTML = '<span class="btn-icon">⟳</span> Inserting...';
        
        closeConfirmDialog();

        try {
            const formData = getFormData();
            const rows = buildInsertRows(formData);
            
            // Fire all 3 inserts in parallel and collect inserted IDs
            const insertResults = await Promise.all(rows.map(row => insertFAPAssignee(row)));
            const insertedIds = insertResults
                .filter(result => result.success && result.insertedId)
                .map(result => result.insertedId);
            
            // Show success state
            button.classList.remove('loading');
            button.classList.add('success');
            button.innerHTML = '<span class="btn-icon">✓</span> ✓ Inserted';
            
            // Show success toast
            showSuccessToast(insertedIds.length);
            
            // Refresh table with highlighted new rows
            await loadExistingRecords(insertedIds);
            
            // Reset button after delay
            setTimeout(() => {
                button.classList.remove('success');
                button.innerHTML = originalText;
                updateHierarchyButtonVisibility();
            }, 3000);
            
        } catch (error) {
            console.error('Insert failed:', error);
            
            // Reset button to error state
            button.classList.remove('loading', 'success');
            button.innerHTML = originalText;
            updateHierarchyButtonVisibility();
            
            // Show error toast
            showErrorToast(error.message);
        }
    }

    async function insertFAPAssignee(payload) {
        const response = await fetch(`${API_BASE}/api/fap-task-assignee`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || 'Insert failed');
        }

        return response.json();
    }

    async function loadExistingRecords(highlightNewIds = []) {
        try {
            const response = await fetch(`${API_BASE}/api/fap-task-assignee`);
            if (!response.ok) throw new Error('Failed to load records');
            
            const records = await response.json();
            displayExistingRecords(records, highlightNewIds);
        } catch (error) {
            console.error('Error loading existing records:', error);
            const tbody = document.getElementById('existingRecordsBody');
            tbody.innerHTML = '<tr><td colspan="8" class="text-center text-muted">Failed to load records</td></tr>';
        }
    }

    function displayExistingRecords(records, highlightNewIds = []) {
        const tbody = document.getElementById('existingRecordsBody');
        
        if (!Array.isArray(records) || records.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" class="text-center text-muted">No records found</td></tr>';
            return;
        }

        tbody.innerHTML = records.map(record => {
            const isNewRow = highlightNewIds.includes(record.id);
            const rowClass = isNewRow ? 'new-row' : '';
            
            return `
                <tr class="${rowClass}">
                    <td>${record.id || ''}</td>
                    <td>${record.plant_code || ''}</td>
                    <td>${record.department || ''}</td>
                    <td>${record.initiator_login_name || ''}</td>
                    <td>${record.total_value_lower_limit || ''}</td>
                    <td>${record.total_value_upper_limit || 'NULL'}</td>
                    <td>${record.management_approver_list || 'NULL'}</td>
                    <td>
                        <span class="status-badge ${record.status_id === 1 ? 'active' : 'inactive'}">
                            ${record.status_id === 1 ? 'Active' : 'Inactive'}
                        </span>
                    </td>
                </tr>
            `;
        }).join('');

        // Remove highlight classes after animation completes
        if (highlightNewIds.length > 0) {
            setTimeout(() => {
                const highlightedRows = tbody.querySelectorAll('.new-row');
                highlightedRows.forEach(row => row.classList.remove('new-row'));
            }, 4000); // Remove after animation duration
        }
    }

    function showSuccessToast(insertedCount = 3) {
        const toast = document.getElementById('successToast');
        const toastMessage = document.getElementById('toastMessage');
        toastMessage.textContent = `${insertedCount} row${insertedCount > 1 ? 's' : ''} inserted successfully`;
        
        const bsToast = new bootstrap.Toast(toast, {
            autohide: true,
            delay: 3000
        });
        bsToast.show();
    }

    function showErrorToast(errorMessage = 'Insert failed. Please try again.') {
        const toast = document.getElementById('errorToast');
        const errorToastMessage = document.getElementById('errorMessage');
        errorToastMessage.textContent = errorMessage;
        
        const bsToast = new bootstrap.Toast(toast, {
            autohide: true,
            delay: 5000
        });
        bsToast.show();
    }

    function resetForm() {
        document.getElementById('fapTaskAssigneeForm').reset();
        checkResults = { check1: false, check2: false, check3: false };
        updateCheckIndicators();
        updateHierarchyButtonVisibility();
    }

    // Make functions globally accessible
    window.showConfirmDialog = showConfirmDialog;
    window.closeConfirmDialog = closeConfirmDialog;
    window.confirmInsert = confirmInsert;
    window.resetForm = resetForm;
})();

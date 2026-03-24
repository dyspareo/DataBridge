document.addEventListener('DOMContentLoaded', function() {
    const dropArea = document.getElementById('drop-area');
    const fileInput = document.getElementById('fileInput');
    const preview = document.getElementById('preview');
    const previewHead = document.getElementById('preview-head');
    const previewBody = document.getElementById('preview-body');
    const results = document.getElementById('results');
    const resultsBody = document.getElementById('results-body');
    const validateBtn = document.getElementById('validateBtn');
    const loading = document.getElementById('loading');
    const validCount = document.getElementById('valid-count');
    const invalidCount = document.getElementById('invalid-count');
    const totalCount = document.getElementById('total-count');

    let fileData = null;

    // Prevent default drag behaviors
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, preventDefaults, false);
        document.body.addEventListener(eventName, preventDefaults, false);
    });

    // Highlight drop area when item is dragged over it
    ['dragenter', 'dragover'].forEach(eventName => {
        dropArea.addEventListener(eventName, highlight, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, unhighlight, false);
    });

    // Handle dropped files
    dropArea.addEventListener('drop', handleDrop, false);
    dropArea.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', handleFileSelect, false);

    // Handle validation button click
    validateBtn.addEventListener('click', validateData);

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    function highlight() {
        dropArea.classList.add('border-primary');
        dropArea.style.borderWidth = '3px';
    }

    function unhighlight() {
        dropArea.classList.remove('border-primary');
        dropArea.style.borderWidth = '2px';
    }

    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        handleFiles(files);
    }

    function handleFileSelect(e) {
        const files = e.target.files;
        handleFiles(files);
    }

    function handleFiles(files) {
        if (files.length > 0) {
            const file = files[0];
            const fileType = file.name.split('.').pop().toLowerCase();
            
            if (fileType !== 'xlsx' && fileType !== 'xls') {
                alert('Please upload a valid Excel file (.xlsx or .xls)');
                return;
            }
            
            const reader = new FileReader();
            
            reader.onload = function(e) {
                const data = new Uint8Array(e.target.result);
                processExcelData(data);
            };
            
            reader.readAsArrayBuffer(file);
        }
    }

    function processExcelData(data) {
        try {
            const workbook = XLSX.read(data, { type: 'array' });
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            
            // Convert to JSON
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            
            if (jsonData.length < 2) {
                alert('The Excel file is empty or has no data.');
                return;
            }
            
            // Get headers (first row)
            const headers = jsonData[0];
            
            // Get data (remaining rows)
            const rows = jsonData.slice(1);
            
            // Store the data for validation
            fileData = {
                headers: headers,
                data: rows.map(row => {
                    const obj = {};
                    headers.forEach((header, index) => {
                        obj[header] = row[index] !== undefined ? row[index] : '';
                    });
                    return obj;
                })
            };
            
            // Display preview
            displayPreview(headers, rows);
            
        } catch (error) {
            console.error('Error processing Excel file:', error);
            alert('Error processing Excel file. Please make sure it is a valid Excel file.');
        }
    }

    function displayPreview(headers, rows) {
        // Clear previous preview
        previewHead.innerHTML = '';
        previewBody.innerHTML = '';
        
        // Create header row
        const headerRow = document.createElement('tr');
        headers.forEach(header => {
            const th = document.createElement('th');
            th.textContent = header;
            headerRow.appendChild(th);
        });
        previewHead.appendChild(headerRow);
        
        // Create data rows (limit to 5 for preview)
        const previewRows = rows.slice(0, 5);
        previewRows.forEach(row => {
            const tr = document.createElement('tr');
            headers.forEach(header => {
                const td = document.createElement('td');
                td.textContent = row[headers.indexOf(header)] !== undefined ? row[headers.indexOf(header)] : '';
                tr.appendChild(td);
            });
            previewBody.appendChild(tr);
        });
        
        // Show preview section
        preview.classList.remove('d-none');
        
        // Hide results if any
        results.classList.add('d-none');
    }

    async function validateData() {
        if (!fileData || !fileData.data || fileData.data.length === 0) {
            alert('No data to validate. Please upload a file first.');
            return;
        }
        
        // Show loading overlay
        loading.classList.remove('d-none');
        
        try {
            // Prepare data for validation
            const validationData = fileData.data.map(row => ({
                plantCode: row['Plant Code'] || row['plantCode'] || row['PLANT_CODE'] || '',
                departmentCode: row['Department Code'] || row['departmentCode'] || row['DEPT_CODE'] || ''
            }));
            
            // Send data to backend for validation
            const response = await fetch('/api/validate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(validationData)
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const results = await response.json();
            
            // Display validation results
            displayResults(results);
            
        } catch (error) {
            console.error('Error during validation:', error);
            alert('An error occurred during validation. Please check the console for details.');
        } finally {
            // Hide loading overlay
            loading.classList.add('d-none');
        }
    }

    function displayResults(validationResults) {
        // Clear previous results
        resultsBody.innerHTML = '';
        
        let valid = 0;
        let invalid = 0;
        
        // Populate results table
        validationResults.forEach((result, index) => {
            const tr = document.createElement('tr');
            
            // Row number
            const tdRow = document.createElement('td');
            tdRow.textContent = index + 1;
            tr.appendChild(tdRow);
            
            // Plant Code
            const tdPlant = document.createElement('td');
            tdPlant.textContent = result.plantCode || '';
            tr.appendChild(tdPlant);
            
            // Department Code
            const tdDept = document.createElement('td');
            tdDept.textContent = result.departmentCode || '';
            tr.appendChild(tdDept);
            
            // Status
            const tdStatus = document.createElement('td');
            const statusBadge = document.createElement('span');
            statusBadge.className = `badge ${result.valid ? 'bg-success' : 'bg-danger'}`;
            statusBadge.textContent = result.valid ? 'Existing' : 'Not Existing';
            tdStatus.appendChild(statusBadge);
            tr.appendChild(tdStatus);
            
            // Message
            const tdMessage = document.createElement('td');
            tdMessage.textContent = result.message || '';
            tdMessage.className = result.valid ? 'valid' : 'invalid';
            tr.appendChild(tdMessage);
            
            resultsBody.appendChild(tr);
            
            // Update counters
            if (result.valid) {
                valid++;
            } else {
                invalid++;
            }
        });
        
        // Update counters
        validCount.textContent = valid;
        invalidCount.textContent = invalid;
        totalCount.textContent = validationResults.length;
        
        // Show results section
        results.classList.remove('d-none');
        
        // Scroll to results
        results.scrollIntoView({ behavior: 'smooth' });
    }
});

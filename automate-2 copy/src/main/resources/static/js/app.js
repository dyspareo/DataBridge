// Helper function to close modals and remove modal-open class
function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove('show');
    document.body.classList.remove('modal-open');
    if (modalId === 'hierarchyModal') {
      document.body.classList.remove('hierarchy-modal-open');
    }
    
    // Hide INSERT ROLE tab when user details modal is closed
    if (modalId === 'userDetailsModal') {
      const insertRoleTab = document.getElementById('insertRoleTab');
      if (insertRoleTab) {
        insertRoleTab.style.display = 'none';
        console.log('INSERT ROLE tab hidden');
      }
    }
    
    // Hide modal after transition
    setTimeout(() => {
      modal.style.display = 'none';
    }, 300);
  }
}

// Reset user details modal state for new user
function resetUserDetailsModal() {
  try {
    // Clear any success/error messages in manual tab
    const manualAlert = document.getElementById('manualAlert');
    if (manualAlert) {
      manualAlert.style.display = 'none';
      manualAlert.textContent = '';
      manualAlert.className = 'alert';
    }
    
    // Switch back to ROLES ASSIGNED tab
    const detailsTab = document.querySelector('.user-details-tab[data-tab="details"]');
    const manualTab = document.querySelector('.user-details-tab[data-tab="manual"]');
    const detailsContent = document.getElementById('details-tab');
    const manualContent = document.getElementById('manual-tab');
    
    // Remove active classes from all tabs and contents
    if (manualTab) manualTab.classList.remove('active');
    if (detailsTab) detailsTab.classList.add('active');
    if (manualContent) manualContent.classList.remove('active');
    if (detailsContent) detailsContent.classList.add('active');
    
    // Hide INSERT ROLE tab
    const insertRoleTab = document.getElementById('insertRoleTab');
    if (insertRoleTab) {
      insertRoleTab.style.display = 'none';
    }
    
    // Clear manual form data
    const userName = document.getElementById('userName');
    const userId = document.getElementById('userId');
    const userType = document.getElementById('userType');
    const ormInstanceId = document.getElementById('ormInstanceId');
    const processName = document.getElementById('processName');
    
    if (userName) userName.value = '';
    if (userId) userId.value = '';
    if (userType) userType.selectedIndex = 0; // Reset to "Select"
    if (ormInstanceId) ormInstanceId.selectedIndex = 0; // Reset to "Select"
    if (processName) processName.selectedIndex = 0; // Reset to "Select"
    
    console.log('User details modal reset completed');
  } catch (error) {
    console.error('Error resetting user details modal:', error);
  }
}

// SheetJS ensure loader
function ensureXLSX() {
  return new Promise((resolve, reject) => {
    if (window.XLSX) return resolve(window.XLSX);
    const alt = document.createElement('script');
    alt.src = 'https://unpkg.com/xlsx@0.18.5/dist/xlsx.full.min.js';
    alt.onload = () => (window.XLSX ? resolve(window.XLSX) : reject(new Error('XLSX failed to load')));
    alt.onerror = () => reject(new Error('Failed to load XLSX fallback'));
    document.head.appendChild(alt);
  });

  // Global close handler for plant mapping modal (button with id="closePlantMapping")
  document.addEventListener('click', (e) => {
    const closeBtn = e.target.closest('#closePlantMapping');
    if (closeBtn) {
      closeModal('plantMappingModal');
      return;
    }
    const overlay = e.target.id === 'plantMappingModal';
    if (overlay) {
      closeModal('plantMappingModal');
    }
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const modal = document.getElementById('plantMappingModal');
      if (modal && modal.style.display === 'flex') closeModal('plantMappingModal');
    }
  });

  // Direct event listener for closePlantMapping button
  document.addEventListener('DOMContentLoaded', () => {
    const closeBtn = document.getElementById('closePlantMapping');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        const modal = document.getElementById('plantMappingModal');
        if (modal) modal.style.display = 'none';
      });
    }
  });
}

(function () {
    console.log("JavaScript loaded successfully");
  let parsedData = null;
  let hasHeaders = true;
  let headers = [];
  let headerIndices = { plant: -1, department: -1, emails: [] };
  const API_BASE = (typeof window !== 'undefined' && window.API_BASE != null)
    ? String(window.API_BASE)
    : ((location.protocol === 'file:') ? 'http://localhost:8080' : '');

  function resolveStaticPageUrl(pathOrUrl) {
    const raw = String(pathOrUrl || '').trim();
    if (!raw) return raw;
    // Already absolute (has a URI scheme like http:, https:, file:, about:, etc.)
    if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(raw)) return raw;
    if (location.protocol === 'file:' && API_BASE) {
      return `${API_BASE}/${raw.replace(/^\//, '')}`;
    }
    return raw;
  }

  // Simple network backoff to avoid spamming errors when backend is offline
  let _netBackoffUntil = 0;
  function inBackoff() { return Date.now() < _netBackoffUntil; }
  function setBackoff(ms = 5000) { _netBackoffUntil = Date.now() + ms; }

  // Plant mapping modal helpers (top-level)
  async function showPlantMappingModalForEmail(email) {
    const modal = document.getElementById('plantMappingModal');
    const tbody = document.querySelector('#plantMappingTable tbody');
    const msg = document.getElementById('plantMappingMsg');
    if (!modal || !tbody || !msg) return;
    tbody.innerHTML = '';
    msg.textContent = 'Loading mapping...';
    modal.style.display = 'flex';
    try {
      const q = new URLSearchParams({ email });
      const res = await fetch(`${API_BASE}/api/plant/mapping?${q.toString()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const rows = (json && json.results) || [];
      if (rows.length > 0) {
        msg.textContent = `Found ${rows.length} mapping(s).`;
        rows.forEach(r => {
          const tr = document.createElement('tr');
          const add = (text) => { const td = document.createElement('td'); td.textContent = text == null ? '' : String(text); tr.appendChild(td); };
          add(r.plant_code);
          add(r.user_login_name);
          add(r.orm_instance_name);
          add(r.process_definition_name);
          add(r.statusId ?? r.status_id ?? r.Status_id);
          add(r.created_date);
          add(r.created_by);
          tbody.appendChild(tr);
        });
      } else {
        msg.textContent = 'No existing plant mappings found. You can add a new one below.';
      }

      // Always show the insert button, even when no mappings exist
      const actions = document.getElementById('plantMappingActions');
      if (actions) {
        actions.innerHTML = '';
        // Use the first login if available, otherwise use the email from the function parameter
        const firstLogin = (rows[0]?.user_login_name || email || '');
        // Prefer validated plant code captured during results render
        const prefillPlant = (typeof window !== 'undefined' && window._lastPlantCode) ? String(window._lastPlantCode) : (rows[0]?.plant_code || '');
        const button = document.createElement('button');
        const qs = new URLSearchParams({ plantCode: prefillPlant || '', userLoginName: firstLogin || '' });
        button.className = 'btn btn-success';
        button.style.backgroundColor = '#28a745';
        button.style.borderColor = '#28a745';
        button.style.color = 'white';
        button.textContent = 'Insert';
        // Handle click to open new tab with pre-filled parameters
        button.addEventListener('click', () => {
          if (modal) modal.style.display = 'none';
          window.open(resolveStaticPageUrl(`plant-mapping-insert.html?${qs.toString()}`), '_blank', 'noopener');
        });
        actions.appendChild(button);
      }
    } catch (err) {
      console.error('[PlantMapping] Error:', err);
      msg.textContent = 'Failed to load plant mappings.';
    }
  }

  try {
    window.showPlantMappingModalForEmail = showPlantMappingModalForEmail;
  } catch (_) {}

  async function showDepartmentMappingModalForUser(departmentCode, email) {
    const modal = document.getElementById('departmentMappingModal');
    const tbody = document.querySelector('#departmentMappingTable tbody');
    const msg = document.getElementById('departmentMappingMsg');
    if (!modal || !tbody || !msg) return;
    tbody.innerHTML = '';
    msg.textContent = 'Loading mapping...';
    modal.style.display = 'flex';
    try {
      const q = new URLSearchParams({ departmentCode, email });
      const res = await fetch(`${API_BASE}/api/department/mapping?${q.toString()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const rows = (json && json.results) || [];
      if (rows.length > 0) {
        msg.textContent = `Found ${rows.length} mapping(s).`;
        rows.forEach(r => {
          const tr = document.createElement('tr');
          const add = (text) => { const td = document.createElement('td'); td.textContent = text == null ? '' : String(text); tr.appendChild(td); };
          add(r.department_id);
          add(r.user_id);
          add(r.status_id);
          add(r.created_date);
          add(r.created_by);
          add(r.updated_date);
          add(r.updated_by);
          tbody.appendChild(tr);
        });
      } else {
        msg.textContent = 'No existing department-user mappings found. You can add a new one below.';
      }

      const actions = document.getElementById('departmentMappingActions');
      if (actions) {
        actions.innerHTML = '';
        const button = document.createElement('button');
        const qs = new URLSearchParams({
          departmentCode: departmentCode || '',
          userEmail: email || ''
        });
        button.className = 'btn btn-success';
        button.style.backgroundColor = '#28a745';
        button.style.borderColor = '#28a745';
        button.style.color = 'white';
        button.textContent = 'Insert';
        button.addEventListener('click', () => {
          if (modal) modal.style.display = 'none';
          window.open(resolveStaticPageUrl(`department-mapping-insert.html?${qs.toString()}`), '_blank', 'noopener');
        });
        actions.appendChild(button);
      }
    } catch (err) {
      console.error('[DepartmentMapping] Error:', err);
      msg.textContent = 'Failed to load department-user mappings.';
    }
  }

  try {
    window.showDepartmentMappingModalForUser = showDepartmentMappingModalForUser;
  } catch (_) {}

  async function showPlantDepartmentMappingModal(plantCode, departmentCode) {
    const modal = document.getElementById('plantDepartmentMappingModal');
    const tbody = document.querySelector('#plantDepartmentMappingTable tbody');
    const msg = document.getElementById('plantDepartmentMappingMsg');
    const actions = document.getElementById('plantDepartmentMappingActions');
    if (!modal || !tbody || !msg) return;
    tbody.innerHTML = '';
    msg.textContent = 'Loading mapping...';
    modal.style.display = 'flex';
    if (actions) {
      actions.innerHTML = '';
      const button = document.createElement('button');
      const qs = new URLSearchParams({
        plantCode: plantCode || '',
        departmentCode: departmentCode || ''
      });
      button.className = 'btn btn-success';
      button.style.backgroundColor = '#28a745';
      button.style.borderColor = '#28a745';
      button.style.color = 'white';
      button.textContent = 'Insert';
      button.addEventListener('click', () => {
        if (modal) modal.style.display = 'none';
        window.open(resolveStaticPageUrl(`plant-department-mapping-insert.html?${qs.toString()}`), '_blank', 'noopener');
      });
      actions.appendChild(button);
    }
    try {
      const q = new URLSearchParams({ plantCode, departmentCode });
      const res = await fetch(`${API_BASE}/api/plant-department/mapping?${q.toString()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const rows = (json && json.results) || [];
      if (rows.length > 0) {
        msg.textContent = `Found ${rows.length} mapping(s).`;
        rows.forEach(r => {
          const tr = document.createElement('tr');
          const add = (text) => { const td = document.createElement('td'); td.textContent = text == null ? '' : String(text); tr.appendChild(td); };
          add(r.plant_code);
          add(r.Dept_Code ?? r.dept_code);
          add(r.Status_id ?? r.status_id);
          add(r.app_id);
          add(r.wkf_process_def_id);
          add(r.created_date);
          add(r.created_by);
          add(r.updated_date);
          add(r.updated_by);
          add(r.dept_id);
          tbody.appendChild(tr);
        });
      } else {
        msg.textContent = 'No existing plant-department mappings found. You can add a new one below.';
      }
    } catch (err) {
      console.error('[PlantDepartmentMapping] Error:', err);
      msg.textContent = 'Failed to load plant-department mappings.';
    }
  }

  try {
    window.showPlantDepartmentMappingModal = showPlantDepartmentMappingModal;
  } catch (_) {}

  // Hierarchy modal helpers (top-level)
  async function showHierarchyModal(plantCode, deptCode, email) {
    const openInsertPage = (url) => {
      try {
        // Keep opener reference so hierarchy-insert page can request excel-data-response
        // from the source tab when sessionStorage is unavailable in the new tab.
        window.open(resolveStaticPageUrl(url), '_blank');
      } catch (_) {}
    };

    const modal = document.getElementById('hierarchyModal');
    const tbody = document.querySelector('#hierarchyTable tbody');
    const msg = document.getElementById('hierarchyMsg');
    const currentModule = (new URLSearchParams(window.location.search).get('module') || 'FAT').toUpperCase();
    const isFABModule = currentModule === 'FAB';
    const isFAPModule = currentModule === 'FAP';
    if (!modal || !tbody || !msg) return;
    // Clear table completely - remove all child nodes as extra safeguard
    while (tbody.firstChild) {
      tbody.removeChild(tbody.firstChild);
    }
    tbody.innerHTML = '';
    msg.textContent = 'Loading hierarchy...';
    
    // Show modal with new classes
    modal.style.display = 'flex';
    document.body.classList.add('modal-open');
    document.body.classList.add('hierarchy-modal-open');
    
    // Add show class for transition
    setTimeout(() => {
      modal.classList.add('show');
    }, 10);
    
    try {
      const q = isFABModule
        ? new URLSearchParams({ plantCode, departmentCode: deptCode })
        : new URLSearchParams({ plantCode, deptCode, email });
      const checkUrl = isFABModule
        ? `${API_BASE}/api/fab/hierarchy/check?${q.toString()}`
        : `${API_BASE}/api/hierarchy/check?${q.toString()}`;
      const res = await fetch(checkUrl);
      let json = null;
      try { json = await res.json(); } catch (_) {}
      if (!res.ok) {
        const serverMsg = json && (json.message || json.error || json.details);
        msg.textContent = serverMsg
          ? String(serverMsg)
          : `Failed to load hierarchy (HTTP ${res.status}).`;
        return;
      }
      const rows = isFABModule
        ? ((json && json.found && json.records) ? json.records.map(record => ({
            plant_code: json.plantCode || plantCode,
            department_code: json.departmentCode || deptCode,
            initiator_id: record.initiatorId,
            initiator_mailid: record.initiatorMailid,
            reviewer_id: record.reviewerId,
            reviewer_mailid: record.reviewerMailid,
            cbs_ga_id: record.cbsGaId,
            cbs_ga_mailid: record.cbsGaMailid,
            bussiness_partner1: record.bussinessPartner1,
            bussiness_partner_1_emailid: record.bussinessPartner1Emailid,
            level1_approver: record.level1Approver,
            level1_approver_emailid: record.level1ApproverEmailid,
            bussiness_partner2: record.bussinessPartner2,
            bussiness_partner_2_emailid: record.bussinessPartner2Emailid,
            level2_approver: record.level2Approver,
            level2_approver_emailid: record.level2ApproverEmailid
          })) : [])
        : ((json && json.results) || []);
      if (!rows.length) {
        msg.textContent = isFABModule
          ? ((json && json.message) ? String(json.message) : `No FAB hierarchy found for Plant ${plantCode}, Dept ${deptCode}`)
          : 'No hierarchy found for the provided parameters.';
      } else {
        msg.textContent = isFABModule
          ? (json.message || `Found ${rows.length} FAB hierarchy record(s) for Plant ${plantCode}, Dept ${deptCode}`)
          : `Found ${rows.length} record(s).`;
      }
      
      // Always show the Insert button with prefill parameters
      const insertBtn = document.getElementById('hierarchyInsertBtn');
      if (insertBtn) {
        const normalizeValue = (value) => value == null ? '' : String(value).trim().toLowerCase();
        const matchesCheckedRow = (row) => {
          if (!row) return false;
          const rowPlantCode = normalizeValue(row.plant_code);
          const rowDeptCode = normalizeValue(isFABModule ? row.department_code : row.dept_code);
          const rowEmail = normalizeValue(isFABModule ? row.initiator_mailid : row.poc_email);
          return rowPlantCode === normalizeValue(plantCode)
            && rowDeptCode === normalizeValue(deptCode)
            && rowEmail === normalizeValue(email);
        };

        // Find the current row data to extract all user information
        const currentRow = rows.find(matchesCheckedRow);
        const currentFabRow = isFABModule && Array.isArray(window._lastFabRows)
          ? window._lastFabRows.find((row) => (
              normalizeValue(row && row.plantCode) === normalizeValue(plantCode)
              && normalizeValue(row && row.departmentCode) === normalizeValue(deptCode)
              && normalizeValue(row && row.initiator) === normalizeValue(email)
            ))
          : null;
        
        // Build comprehensive query parameters with all available data
        const qs = new URLSearchParams();
        
        // Basic parameters
        qs.set('plant_code', plantCode || '');
        qs.set('dept_code', deptCode || '');
        qs.set('poc_email', email || '');
        qs.set('module', currentModule);
        
        if (currentRow) {
          console.log('=== HIERARCHY INSERTION DEBUG ===');
          console.log('1. Database Row:', currentRow);
          console.log('2. Available DB Columns:', Object.keys(currentRow));
          
          // === STEP 1: USE DATABASE DATA FIRST ===
          console.log('\n--- Step 1: Using Database Data ---');
          
          // Plant & Department (from database)
          if (currentRow.plant_name) {
            qs.set('plant_name', currentRow.plant_name);
            console.log('✓ DB plant_name:', currentRow.plant_name);
          } else {
            console.log('✗ DB plant_name: NOT FOUND');
          }
          
          if (currentRow.dept_name) {
            qs.set('dept_name', currentRow.dept_name);
            console.log('✓ DB dept_name:', currentRow.dept_name);
          } else {
            console.log('✗ DB dept_name: NOT FOUND');
          }
          
          // POC Details (from database)
          if (currentRow.poc_login_name) {
            qs.set('poc_login_name', currentRow.poc_login_name);
            console.log('✓ DB poc_login_name:', currentRow.poc_login_name);
          } else {
            console.log('✗ DB poc_login_name: NOT FOUND');
          }
          
          if (currentRow.poc_emp_code) {
            qs.set('poc_emp_code', currentRow.poc_emp_code);
            console.log('✓ DB poc_emp_code:', currentRow.poc_emp_code);
          } else {
            console.log('✗ DB poc_emp_code: NOT FOUND');
          }
          
          // Approver Details (from database)
          if (currentRow.approver_login_name) {
            qs.set('approver_login_name', currentRow.approver_login_name);
            console.log('✓ DB approver_login_name:', currentRow.approver_login_name);
          } else {
            console.log('✗ DB approver_login_name: NOT FOUND');
          }
          
          if (currentRow.approver_emp_code) {
            qs.set('approver_emp_code', currentRow.approver_emp_code);
            console.log('✓ DB approver_emp_code:', currentRow.approver_emp_code);
          } else {
            console.log('✗ DB approver_emp_code: NOT FOUND');
          }
          
          if (currentRow.approver_email) {
            qs.set('approver_email', currentRow.approver_email);
            console.log('✓ DB approver_email:', currentRow.approver_email);
          } else {
            console.log('✗ DB approver_email: NOT FOUND');
          }
          
          // CBS1 Details (from database)
          if (currentRow.cbs1_login_name) {
            qs.set('cbs1_login_name', currentRow.cbs1_login_name);
            console.log('✓ DB cbs1_login_name:', currentRow.cbs1_login_name);
          } else {
            console.log('✗ DB cbs1_login_name: NOT FOUND');
          }
          
          if (currentRow.cbs1_emp_code) {
            qs.set('cbs1_emp_code', currentRow.cbs1_emp_code);
            console.log('✓ DB cbs1_emp_code:', currentRow.cbs1_emp_code);
          } else {
            console.log('✗ DB cbs1_emp_code: NOT FOUND');
          }
          
          if (currentRow.cbs1_email) {
            qs.set('cbs1_email', currentRow.cbs1_email);
            console.log('✓ DB cbs1_email:', currentRow.cbs1_email);
          } else {
            console.log('✗ DB cbs1_email: NOT FOUND');
          }
          
          // CBS2 Details (from database)
          if (currentRow.cbs2_login_name) {
            qs.set('cbs2_login_name', currentRow.cbs2_login_name);
            console.log('✓ DB cbs2_login_name:', currentRow.cbs2_login_name);
          } else {
            console.log('✗ DB cbs2_login_name: NOT FOUND');
          }
          
          if (currentRow.cbs2_emp_code) {
            qs.set('cbs2_emp_code', currentRow.cbs2_emp_code);
            console.log('✓ DB cbs2_emp_code:', currentRow.cbs2_emp_code);
          } else {
            console.log('✗ DB cbs2_emp_code: NOT FOUND');
          }
          
          if (currentRow.cbs2_email) {
            qs.set('cbs2_email', currentRow.cbs2_email);
            console.log('✓ DB cbs2_email:', currentRow.cbs2_email);
          } else {
            console.log('✗ DB cbs2_email: NOT FOUND');
          }
          
          // === STEP 2: SUPPLEMENT WITH EXCEL DATA ===
          console.log('\n--- Step 2: Supplementing with Excel Data ---');
          
          try {
            const excelData = JSON.parse(sessionStorage.getItem('excelData')) || [];
            console.log('3. Excel Data Length:', excelData.length);
            
            if (excelData.length > 0) {
              // Find matching row in Excel data
              const excelRow = excelData.find(row => 
                row.plant_code === plantCode && 
                row.dept_code === deptCode && 
                row.poc_email === email
              );
              
              console.log('4. Excel Row Found:', excelRow ? 'YES' : 'NO');
              if (excelRow) {
                console.log('5. Excel Row Data:', excelRow);
                
                // Column Mapping: Excel -> Form Fields
                const columnMappings = [
                  // POC
                  { excel: 'POC EMP Code', form: 'poc_emp_code', description: 'POC Employee Code' },
                  // Approver
                  { excel: 'Approver Email ID', form: 'approver_email', description: 'Approver Email' },
                  { excel: 'Approver Login ID', form: 'approver_login_name', description: 'Approver Login Name' },
                  { excel: 'Approver Name - Functional Head', form: 'approver_login_name', description: 'Approver Name' },
                  { excel: 'Approver EMP Code', form: 'approver_emp_code', description: 'Approver Employee Code' },
                  // CBS1
                  { excel: 'CBS Member1 Email ID', form: 'cbs1_email', description: 'CBS1 Email' },
                  { excel: 'CBS Member1 Login ID', form: 'cbs1_login_name', description: 'CBS1 Login Name' },
                  { excel: 'CBS Member1 Name', form: 'cbs1_login_name', description: 'CBS1 Name' },
                  { excel: 'CBS Member1 EMP Code', form: 'cbs1_emp_code', description: 'CBS1 Employee Code' },
                  // CBS2
                  { excel: 'CBS Member2 Email ID', form: 'cbs2_email', description: 'CBS2 Email' },
                  { excel: 'CBS Member2 Login ID', form: 'cbs2_login_name', description: 'CBS2 Login Name' },
                  { excel: 'CBS Member2 Name', form: 'cbs2_login_name', description: 'CBS2 Name' },
                  { excel: 'CBS Member2 EMP Code', form: 'cbs2_emp_code', description: 'CBS2 Employee Code' },
                  // CBS3 (additional)
                  { excel: 'CBS Member3 Email ID', form: 'cbs3_email', description: 'CBS3 Email' },
                  { excel: 'CBS Member3 Login ID', form: 'cbs3_login_name', description: 'CBS3 Login Name' },
                  { excel: 'CBS Member3 Name', form: 'cbs3_login_name', description: 'CBS3 Name' },
                  { excel: 'CBS Member3 EMP Code', form: 'cbs3_emp_code', description: 'CBS3 Employee Code' }
                ];
                
                // Apply mappings for missing fields
                columnMappings.forEach(mapping => {
                  if (!qs.has(mapping.form) && excelRow[mapping.excel]) {
                    qs.set(mapping.form, excelRow[mapping.excel]);
                    console.log(`✓ Excel ${mapping.description}:`, excelRow[mapping.excel]);
                  } else if (qs.has(mapping.form)) {
                    console.log(`- Excel ${mapping.description}: SKIPPED (already set from DB)`);
                  } else {
                    console.log(`✗ Excel ${mapping.description}: NOT FOUND`);
                  }
                });
                
                // Store the complete Excel row for additional processing
                sessionStorage.setItem('currentHierarchyRow', JSON.stringify(excelRow));
                console.log('✓ Stored complete Excel row in sessionStorage');
              } else {
                console.log('✗ No matching Excel row found for criteria:', { plantCode, deptCode, email });
              }
            } else {
              console.log('✗ No Excel data available in sessionStorage');
            }
          } catch (e) {
            console.error('✗ Error accessing Excel data:', e);
          }
          
          // === STEP 3: FINAL VERIFICATION ===
          console.log('\n--- Step 3: Final Verification ---');
          console.log('6. Final URL Parameters:', qs.toString());
          
          // Check for critical missing fields
          const criticalFields = ['plant_code', 'dept_code', 'poc_email', 'poc_login_name'];
          const missingCritical = criticalFields.filter(field => !qs.has(field));
          
          if (missingCritical.length > 0) {
            console.warn('⚠️ Missing critical fields:', missingCritical);
          } else {
            console.log('✓ All critical fields present');
          }
          
          console.log('=== END HIERARCHY INSERTION DEBUG ===\n');
        }
        const newBtn = insertBtn.cloneNode(true);
        insertBtn.parentNode.replaceChild(newBtn, insertBtn);
        // Ensure it's styled as a proper green button
        newBtn.style.display = 'inline-block';
        newBtn.style.backgroundColor = '#28a745';
        newBtn.style.borderColor = '#28a745';
        newBtn.style.color = 'white';
        newBtn.style.padding = '6px 12px';
        newBtn.style.borderRadius = '4px';
        newBtn.style.cursor = 'pointer';
        if (isFABModule && currentFabRow) {
          try {
            sessionStorage.setItem('currentHierarchyRow', JSON.stringify(currentFabRow));
          } catch (_) {}
        }

        if (isFABModule) {
          newBtn.textContent = 'Insert to FAB';
          newBtn.addEventListener('click', () => {
            const selectedFabRow = currentFabRow || {};
            const cbsGa = Array.isArray(selectedFabRow.cbsGaEmails) ? selectedFabRow.cbsGaEmails.filter(Boolean).join(",") : "";
            const fabQs = new URLSearchParams({
              module: 'FAB',
              plant_code: plantCode || '',
              department_code: selectedFabRow.departmentCode || deptCode || '',
              initiator_id: '',
              initiator_mailid: selectedFabRow.initiator || email || '',
              reviewer_id: '',
              reviewer: '',
              reviewer_mailid: selectedFabRow.reviewer || '',
              cbs_ga_id: '',
              cbs_ga_mailid: cbsGa,
              bussiness_partner1: '',
              bussiness_partner_1_emailid: selectedFabRow.businessPartner1 || '',
              level1_approver: '',
              level1_approver_emailid: selectedFabRow.approverDoA1 || '',
              bussiness_partner2: '',
              bussiness_partner_2_emailid: selectedFabRow.businessPartner2 || '',
              level2_approver: '',
              level2_approver_emailid: selectedFabRow.approverDoA2 || ''
            });
            const url = `hierarchy-insert.html?${fabQs.toString()}`;
            openInsertPage(url);
          });
        } else {
          // FAP Module - Open FAP Hierarchy Addition tab instead of navigating to hierarchy-insert.html
          if (isFAPModule) {
            newBtn.textContent = 'FAP Hierarchy Addition';
            newBtn.addEventListener('click', () => {
              console.log('Opening FAP Hierarchy Addition tab');
              openFAPHierarchyTab(qs, currentRow);
            });
          } else {
            // Non-FAP modules - keep existing behavior
            newBtn.addEventListener('click', () => {
              const url = `hierarchy-insert.html?${qs.toString()}`;
              console.log('Opening URL:', url);
              openInsertPage(url);
            });
          }
        }
      }
      
      // Display ALL columns from the database table dynamically
      if (rows.length > 0) {
        // Update table headers dynamically based on the first row's keys
        const thead = document.querySelector('#hierarchyTable thead tr');
        if (thead) {
          thead.innerHTML = ''; // Clear existing headers
          Object.keys(rows[0]).forEach(key => {
            const th = document.createElement('th');
            th.textContent = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()); // Format column names
            thead.appendChild(th);
          });
        }
      }
      
      rows.forEach(r => {
        const tr = document.createElement('tr');
        const add = (text) => { 
          const td = document.createElement('td'); 
          td.textContent = text == null ? '' : String(text); 
          tr.appendChild(td); 
        };
        
        // Display all columns dynamically in order
        Object.keys(r).forEach(key => {
          add(r[key]);
        });
        
        tbody.appendChild(tr);
      });
    } catch (err) {
      console.error('[Hierarchy] Error:', err);
      msg.textContent = 'Failed to load hierarchy.';
    }
  }

  // User details modal helpers (now in main scope)
  function renderUserDetailsInsertAction(rows, userId) {
    try {
      const actions = document.getElementById('userDetailsActions');
      if (!actions) return;
      actions.innerHTML = '';

      const uid = String((rows?.[0]?.userId ?? rows?.[0]?.user_id ?? userId) || '').trim();
      if (!uid) return;

      const a = document.createElement('button');
      a.className = 'btn btn-success';
      a.style.background = '#28a745'; // green
      a.style.border = '1px solid #28a745';
      a.style.color = '#fff';
      a.textContent = 'Insert';
      a.addEventListener('click', () => {
        // Show the INSERT ROLE tab first
        const insertRoleTab = document.getElementById('insertRoleTab');
        if (insertRoleTab) {
          insertRoleTab.style.display = 'block';
          console.log('INSERT ROLE tab is now visible');
        }

        // Switch to Manual Entry tab
        const manualTab = document.querySelector('.user-details-tab[data-tab="manual"]');
        if (manualTab) {
          manualTab.click();
        }
      });
      actions.appendChild(a);
    } catch (_) {}
  }

  async function showUserDetailsModalForUserId(userId) {
    const modal = document.getElementById('userDetailsModal');
    if (!modal) return;
    const tbody = document.getElementById('userDetailsTbody') || document.querySelector('#userDetailsTable tbody');
    const msg = document.getElementById('userDetailsMsg');
    // remember last userId for optional retry button
    try { window._lastUserId = userId; } catch (_) {}
    if (tbody) tbody.innerHTML = '';
    if (msg) msg.textContent = 'Loading...';
    modal.style.display = 'flex';
    document.body.classList.add('modal-open');
    try {
      console.log('[Validate→Modal] Fetching details for userId:', userId);
      if (inBackoff()) {
        if (msg) msg.textContent = 'Server unreachable. Please retry.';
        return;
      }
      const q = new URLSearchParams({ userId });
      const res = await fetch(`${API_BASE}/api/user/details?${q.toString()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      console.log('[Validate→Modal] Server response:', json);
      const rows = (json && json.results) || [];
      // Always render Insert action when a valid identifier exists,
      // including users with no currently assigned roles.
      renderUserDetailsInsertAction(rows, userId);
      if (!rows.length) {
        if (msg) msg.textContent = 'No roles/memberships found for this user.';
        return;
      }
      if (msg) msg.textContent = `Found ${rows.length} record(s).`;
      
      // Store the current user email for the INSERT ROLE tab
      if (rows.length > 0) {
        window._currentUserEmail = rows[0]?.email || rows[0]?.email_id1 || userId;
        console.log('Stored current user email:', window._currentUserEmail);
        console.log('Full row data:', rows[0]);
        console.log('Login name field:', rows[0]?.loginName, rows[0]?.login_name);
      }
      rows.forEach(r => {
        const tr = document.createElement('tr');
        const add = (text) => {
          const td = document.createElement('td');
          td.textContent = text == null ? '' : String(text);
          tr.appendChild(td);
        };
        // Order: Instance, User ID, User Name, User Type, Role Name, Role Key, Status, Created Date, Updated Date
        console.log('Processing row:', r);
        add(r.instanceName ?? r.instance_name);
        add(r.userId ?? r.user_id);
        add(r.loginName ?? r.login_name ?? 'N/A'); // Added fallback for debugging
        add(r.userType ?? r.user_type);
        add(r.roleName ?? r.role_name);
        add(r.roleKey ?? r.role_key);
        add(r.statusId ?? r.status_id);
        add(r.createdDate ?? r.created_date);
        add(r.updatedDate ?? r.updated_date);
        tbody && tbody.appendChild(tr);
      });

    } catch (err) {
      console.error('[Validate→Modal] Error fetching details:', err);
      setBackoff();
      if (msg) msg.textContent = 'Something went wrong while fetching user details. Please try again.';
    }
  }

  // Optional: Retry button support if present
  document.addEventListener('click', (e) => {
    const retry = e.target.closest('#userDetailsRetry');
    if (!retry) return;
    const id = (typeof window !== 'undefined' && window._lastUserId) ? String(window._lastUserId) : '';
    if (id) {
      showUserDetailsModalForUserId(id);
    } else {
      const msg = document.getElementById('userDetailsMsg');
      if (msg) msg.textContent = 'No previous user to retry.';
    }
  });

  // close modal handler
  document.addEventListener('click', (e) => {
    const c = e.target.closest('#closeUserDetails');
    if (!c) return;
    closeModal('userDetailsModal');
  });

  // Close user details modal via overlay click and ESC
  document.addEventListener('click', (e) => {
    if (e.target && e.target.id === 'userDetailsModal') {
      closeModal('userDetailsModal');
    }
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const modal = document.getElementById('userDetailsModal');
      if (modal && modal.style.display === 'flex') closeModal('userDetailsModal');
    }
  });

  // Close plant mapping modal via overlay click and close button (global listener)
  document.addEventListener('click', (e) => {
    const closeBtn = e.target.closest('#closePlantMapping');
    if (closeBtn) {
      closeModal('plantMappingModal');
      return;
    }
    if (e.target && e.target.id === 'plantMappingModal') {
      closeModal('plantMappingModal');
    }
  });

  document.addEventListener('click', (e) => {
    const closeBtn = e.target.closest('#closeDepartmentMapping');
    if (closeBtn) {
      closeModal('departmentMappingModal');
      return;
    }
    if (e.target && e.target.id === 'departmentMappingModal') {
      closeModal('departmentMappingModal');
    }
  });

  document.addEventListener('click', (e) => {
    const closeBtn = e.target.closest('#closePlantDepartmentMapping');
    if (closeBtn) {
      closeModal('plantDepartmentMappingModal');
      return;
    }
    if (e.target && e.target.id === 'plantDepartmentMappingModal') {
      closeModal('plantDepartmentMappingModal');
    }
  });

  // Global: hierarchy modal close handlers (button, overlay, ESC)
  document.addEventListener('click', (e) => {
    const closeBtn = e.target.closest('#closeHierarchy');
    if (closeBtn) {
      closeModal('hierarchyModal');
      return;
    }
    if (e.target && e.target.id === 'hierarchyModal') {
      closeModal('hierarchyModal');
    }
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const hm = document.getElementById('hierarchyModal');
      if (hm && hm.style.display === 'flex') closeModal('hierarchyModal');
    }
  });

  // Global: handle clicks on a statically present #hierarchyCheckBtn
  document.addEventListener('click', (e) => {
    const h = e.target.closest('#hierarchyCheckBtn');
    if (!h) return;
    // Prefer data-* attributes on the button if provided; fallback to cached values
    const plantCodeAttr = h.getAttribute('data-plant') || '';
    const deptCodeAttr = h.getAttribute('data-dept') || '';
    const emailAttr = h.getAttribute('data-email') || '';
    const plantCode = plantCodeAttr || ((typeof window !== 'undefined' && window._lastPlantCode) ? String(window._lastPlantCode) : '');
    const deptCode = deptCodeAttr || ((typeof window !== 'undefined' && window._lastDeptCode) ? String(window._lastDeptCode) : '');
    const initiatorEmail = emailAttr || ((typeof window !== 'undefined' && window._lastInitiatorEmail) ? String(window._lastInitiatorEmail) : '');
    if (!plantCode || !deptCode || !initiatorEmail) {
      showToast('Hierarchy params missing. Validate file first.', 'error');
      return;
    }
    const currentModule = (new URLSearchParams(window.location.search).get('module') || 'FAT').toUpperCase();
    if (currentModule === 'FAC' || currentModule === 'FAD') {
      const lcmEmail = h.getAttribute('data-lcm-email') || initiatorEmail;
      const cbs1Email = h.getAttribute('data-cbs1-email') || '';
      const cbs2Email = h.getAttribute('data-cbs2-email') || '';
      showFixedAssetHierarchyModal({
        module: currentModule,
        plantCode,
        deptCode,
        lcmEmail,
        cbs1Email,
        cbs2Email
      });
      return;
    }
    showHierarchyModal(plantCode, deptCode, initiatorEmail);
  });

  async function showFixedAssetHierarchyModal({ module = 'FAC', plantCode, deptCode, lcmEmail, cbs1Email, cbs2Email }) {
    const moduleCode = String(module || 'FAC').toUpperCase() === 'FAD' ? 'FAD' : 'FAC';
    const modulePath = moduleCode.toLowerCase();
    const modal = document.getElementById('hierarchyModal');
    const msg = document.getElementById('hierarchyMsg');
    const table = document.getElementById('hierarchyTable');
    const insertBtn = document.getElementById('hierarchyInsertBtn');
    if (!modal || !msg || !table || !insertBtn) return;

    // Update title
    try {
      const title = modal.querySelector('.modal-title');
      if (title) title.textContent = `${moduleCode} Hierarchy Check`;
    } catch (_) {}

    // Configure insert action (opens module-specific insert form page)
    insertBtn.textContent = `Insert ${moduleCode} Hierarchy`;
    insertBtn.onclick = () => {
      const qs = new URLSearchParams();
      qs.set('plant_code', plantCode);
      qs.set('dept_code', deptCode);
      qs.set('lcm_user', lcmEmail || '');
      qs.set('cbs_user1', cbs1Email || '');
      qs.set('cbs_user2', cbs2Email || '');
      qs.set('status_id', '1');
      const url = `${modulePath}/${modulePath}-hierarchy-insert.html?${qs.toString()}`;
      try {
        if (typeof openModal === 'function') {
          openModal(url, `${moduleCode} Hierarchy Insert`);
        } else {
          window.open(resolveStaticPageUrl(url), '_blank', 'noopener');
        }
      } catch (_) {
        window.open(resolveStaticPageUrl(url), '_blank', 'noopener');
      }
    };

    // Reset and show modal
    msg.textContent = `Loading ${moduleCode} hierarchy...`;
    const thead = table.querySelector('thead');
    const tbody = table.querySelector('tbody');
    if (tbody) tbody.innerHTML = '';
    if (thead) {
      thead.innerHTML = `
        <tr>
          <th>id</th>
          <th>plant_code</th>
          <th>plant_name</th>
          <th>dept_code</th>
          <th>dept_name</th>
          <th>lcm_user</th>
          <th>cbs_user1</th>
          <th>cbs_user2</th>
          <th>status_id</th>
        </tr>
      `;
    }
    modal.style.display = 'flex';
    document.body.classList.add('modal-open', 'hierarchy-modal-open');
    // Keep same transition behavior as existing hierarchy modal flow
    setTimeout(() => {
      try { modal.classList.add('show'); } catch (_) {}
    }, 10);
    try {
      table.style.display = '';
      if (tbody) tbody.style.display = '';
    } catch (_) {}

    // Call module-specific check API
    try {
      const q = new URLSearchParams();
      q.set('plantCode', plantCode);
      q.set('deptCode', deptCode);
      if (lcmEmail) q.set('lcmUser', lcmEmail);
      const res = await fetch(`${API_BASE}/api/${modulePath}/hierarchy/check?${q.toString()}`);
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        msg.textContent = (json && (json.message || json.error)) ? String(json.message || json.error) : `${moduleCode} check failed (HTTP ${res.status}).`;
        return;
      }
      const rows = (json && json.results) ? json.results : [];
      if (!Array.isArray(rows) || rows.length === 0) {
        msg.textContent = `No active ${moduleCode} hierarchy found for Plant ${plantCode}, Dept ${deptCode} (LM: ${lcmEmail || '-'})`;
        return;
      }
      msg.textContent = `Found ${rows.length} active ${moduleCode} hierarchy record(s).`;
      if (!tbody) return;
      tbody.innerHTML = '';
      const addCell = (tr, v) => {
        const td = document.createElement('td');
        td.textContent = v == null ? '' : String(v);
        tr.appendChild(td);
      };
      rows.forEach(r => {
        const tr = document.createElement('tr');
        addCell(tr, r.id);
        addCell(tr, r.plant_code ?? r.plantCode);
        addCell(tr, r.plant_name ?? r.plantName);
        addCell(tr, r.dept_code ?? r.deptCode);
        addCell(tr, r.dept_name ?? r.deptName);
        addCell(tr, r.lcm_user ?? r.lcmUser);
        addCell(tr, r.cbs_user1 ?? r.cbsUser1);
        addCell(tr, r.cbs_user2 ?? r.cbsUser2);
        addCell(tr, r.status_id ?? r.statusId);
        tbody.appendChild(tr);
      });
    } catch (e) {
      msg.textContent = `Failed to load ${moduleCode} hierarchy. Check server logs/connection.`;
    }
  }

  // Global: open plant mapping for the first valid email button
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.check-mapping-btn');
    if (!btn) return;
    const email = btn.getAttribute('data-email') || '';
    if (email) showPlantMappingModalForEmail(email);
  });

  // Clicking on green 'Existing' status in an email row opens the details modal
  document.addEventListener('click', async (e) => {
    const td = e.target.closest('td');
    const tr = e.target.closest('tr');
    if (!td || !tr) return;
    // Only for email rows
    const email = tr.getAttribute('data-email');
    if (!email) return;
    // Only when clicking the green status cell
    if (!td.classList.contains('status-valid')) return;
    try {
      const u = await fetch(`${API_BASE}/api/user/${encodeURIComponent(email)}`);
      if (u.ok) {
        const user = await u.json().catch(() => null);
        const login = user && user.login_name ? String(user.login_name).trim() : '';
        if (login) {
          await showUserDetailsModalForUserId(login);
        } else {
          showToast('UserId not found for this email', 'error');
        }
      }
    } catch (_) {
      showToast('Failed to load user details', 'error');
    }
  });

  // Simple toast helper
  function showToast(message, type = 'info', duration = 1200) {
    const el = document.getElementById('toast');
    if (!el) return;
    el.textContent = message;
    el.style.background = type === 'error' ? '#991b1b' : (type === 'success' ? '#065f46' : '#111827');
    el.style.display = 'block';
    el.style.opacity = '1';
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => {
      el.style.transition = 'opacity 300ms ease';
      el.style.opacity = '0';
      setTimeout(() => { el.style.display = 'none'; el.style.transition = ''; }, 320);
    }, duration);
  }

  // Modal elements
  let modalOverlay, modalTitle, modalFrame, modalCloseBtn;

  document.addEventListener('DOMContentLoaded', () => {
    modalOverlay = document.getElementById('modalOverlay');
    modalTitle = document.getElementById('modalTitle');
    modalFrame = document.getElementById('modalFrame');
    modalCloseBtn = document.getElementById('modalClose');
    if (modalCloseBtn && modalOverlay) {
      modalCloseBtn.addEventListener('click', () => closeModal());
    }

    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    console.log("Drop zone element:", dropZone);
    console.log("File input element:", fileInput);
    const fileInfo = document.getElementById('fileInfo');
    const fileName = document.getElementById('fileName');
    const fileSize = document.getElementById('fileSize');
    const noData = document.getElementById('noData');
    const dataTable = document.getElementById('dataTable');
    const spinner = document.getElementById('spinner');
    const validateBtn = document.getElementById('validateBtn');
    const codeSummary = document.getElementById('codeSummary');
    const currentModule = (new URLSearchParams(window.location.search).get('module') || 'FAT').toUpperCase();
    try {
      window.currentModule = ['FAB', 'FAP', 'FAC'].includes(currentModule) ? currentModule : 'FAT';
    } catch (_) {}
    const isFATModule = currentModule === 'FAT';
    const isFAPModule = currentModule === 'FAP';
    let fatRowSelector = null;
    let fatRowSelectorWrap = null;

    function getFatDataRowEntries() {
      if (!parsedData || !Array.isArray(parsedData) || parsedData.length === 0) return [];
      const start = hasHeaders ? 1 : 0;
      const rows = [];
      for (let i = start; i < parsedData.length; i++) {
        const row = Array.isArray(parsedData[i]) ? parsedData[i] : [parsedData[i]];
        const hasData = row.some((cell) => cell !== undefined && cell !== null && String(cell) !== '');
        if (hasData) rows.push({ rowIndex: i, excelRowNumber: i + 1, row });
      }
      return rows;
    }

    function shouldUseFatRowSelector() {
      return isFATModule && getFatDataRowEntries().length > 1;
    }

    function getSelectedFatExcelRowNumber() {
      if (!fatRowSelector) return null;
      const value = Number(fatRowSelector.value);
      return Number.isFinite(value) && value > 0 ? value : null;
    }

    function initFatRowSelector() {
      if (!isFATModule || !validateBtn || !validateBtn.parentElement || document.getElementById('fatRowSelector')) return;

      fatRowSelectorWrap = document.createElement('div');
      fatRowSelectorWrap.className = 'fat-row-selector-wrap d-none';
      fatRowSelectorWrap.style.marginBottom = '10px';

      const label = document.createElement('label');
      label.setAttribute('for', 'fatRowSelector');
      label.textContent = 'Select Row';
      label.className = 'form-label mb-0 fw-semibold';

      fatRowSelector = document.createElement('select');
      fatRowSelector.id = 'fatRowSelector';
      fatRowSelector.className = 'form-control';
      fatRowSelector.innerHTML = '<option value="">Choose row...</option>';
      fatRowSelector.style.maxWidth = '260px';

      fatRowSelector.addEventListener('change', () => updateValidateButton());

      fatRowSelectorWrap.appendChild(label);
      fatRowSelectorWrap.appendChild(fatRowSelector);
      validateBtn.parentElement.insertBefore(fatRowSelectorWrap, validateBtn);
    }

    function refreshFatRowSelectorOptions() {
      if (!isFATModule) return;
      initFatRowSelector();
      if (!fatRowSelector || !fatRowSelectorWrap) return;

      const rows = getFatDataRowEntries();
      const showSelector = rows.length > 1;
      const currentValue = fatRowSelector.value;

      fatRowSelector.innerHTML = '<option value="">Choose row...</option>';
      rows.forEach(({ excelRowNumber }) => {
        const opt = document.createElement('option');
        opt.value = String(excelRowNumber);
        opt.textContent = `Row ${excelRowNumber}`;
        fatRowSelector.appendChild(opt);
      });

      if (rows.some(({ excelRowNumber }) => String(excelRowNumber) === currentValue)) {
        fatRowSelector.value = currentValue;
      } else {
        fatRowSelector.value = '';
      }

      fatRowSelectorWrap.classList.toggle('d-none', !showSelector);
      if (!showSelector) {
        fatRowSelector.value = '';
      }
    }

    // Click to open
    dropZone.addEventListener("click", () => { console.log("Drop zone clicked"); fileInput.click(); });

    document.addEventListener('click', async (e) => {
      const btn = e.target.closest('.validate-email-btn');
      if (!btn) return;
      const emailAttr = (btn.getAttribute('data-email') || '').trim();
      const userIdAttr = (btn.getAttribute('data-userid') || '').trim();
      const expectedRoleAttr = (btn.getAttribute('data-expected-role') || '').trim();
      btn.disabled = true;
      const tr = btn.closest('tr');
      try {
        if (tr && tr.getAttribute('data-row-type') && tr.getAttribute('data-row-type') !== 'email') {
          return;
        }
        // Inline email validity refresh if email is present
        if (emailAttr) {
          try {
            if (expectedRoleAttr) {
              window.emailToExpectedRoleMapping = window.emailToExpectedRoleMapping || {};
              window.emailToExpectedRoleMapping[emailAttr] = expectedRoleAttr;
              const emailKey = normalizeEmailKey(emailAttr);
              if (emailKey) window.emailToExpectedRoleMapping[emailKey] = expectedRoleAttr;
            }
          } catch (_) {}
          const [res] = await checkEmails([emailAttr]);
          if (tr) {
            const tds = tr.querySelectorAll('td');
            const statusTd = tr.querySelector('.status-valid, .status-invalid, td:nth-child(3)') || tds[2];
            const messageTd = tr.querySelector('.fap-col-message') || tds[3];
            if (statusTd) {
              statusTd.textContent = res.status || '-';
              statusTd.classList.remove('status-valid', 'status-invalid');
              statusTd.classList.add(res.status === 'Existing' ? 'status-valid' : 'status-invalid');
            }
            if (messageTd) messageTd.textContent = res.message || 'Not found'; // Show the actual message
          }
          showToast(`${emailAttr}: ${res.status}`, res.status === 'Existing' ? 'success' : (res.status === 'Error' ? 'error' : 'info'));
        }

        // Determine userId for modal fetch
        let userId = '';
        if (userIdAttr && /^\d+$/.test(userIdAttr)) {
          userId = userIdAttr;
        } else if (emailAttr) {
          try {
            if (inBackoff()) throw new Error('Backoff active');
            const res = await fetch(`${API_BASE}/api/validate/emails`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ emails: [emailAttr] })
            });
            const j = await res.json().catch(() => null);
            const arr = j && Array.isArray(j.results) ? j.results : [];
            if (arr && arr.length && arr[0] && arr[0].userId) {
              userId = String(arr[0].userId);
            }
          } catch (err) {
            console.error('[Validate→Modal] /api/validate/emails failed:', err);
            setBackoff();
          }
        }

        const modal = document.getElementById('userDetailsModal');
        const msg = document.getElementById('userDetailsMsg');
        const tbody = document.getElementById('userDetailsTbody') || document.querySelector('#userDetailsTable tbody');
        if (tbody) tbody.innerHTML = '';
        if (modal) modal.style.display = 'flex';
        
        // Reset modal state for new user
        resetUserDetailsModal();
        
        // Store the specific email for this button click
        if (emailAttr) {
          window._currentUserEmail = emailAttr;
          console.log('Stored current user email for ADD ROLE:', emailAttr);
        }

        // If userId not found, fall back to using the email directly (backend accepts either)
        const identifier = userId || emailAttr;
        if (!identifier) {
          if (msg) msg.textContent = 'User not found.';
          return;
        }
        try { window._lastUserId = identifier; } catch (_) {}
        await showUserDetailsModalForUserId(identifier);
      } catch (_) {
        const msg = document.getElementById('userDetailsMsg');
        if (msg) msg.textContent = 'Something went wrong. Please try again.';
        console.error('[Validate→Modal] Unexpected error handling Validate click:', _);
        if (tr) {
          const tds = tr.querySelectorAll('td');
          const statusTd = tds[2];
          const messageTd = tds[3];
          if (statusTd) {
            statusTd.textContent = 'Error';
            statusTd.classList.remove('status-valid');
            statusTd.classList.add('status-invalid');
          }
          if (messageTd) messageTd.textContent = 'Lookup failed';
        }
      } finally {
        btn.disabled = false;
      }
    });

    // Mock rendering helper to test UI without server
    window.mockRenderUserDetails = function(rows) {
      const modal = document.getElementById('userDetailsModal');
      const tbody = document.getElementById('userDetailsTbody');
      const msg = document.getElementById('userDetailsMsg');
      if (!modal || !tbody || !msg) return;
      tbody.innerHTML = '';
      if (!rows || !rows.length) {
        msg.textContent = 'No roles/memberships found for this user.';
        modal.style.display = 'flex';
        document.body.classList.add('modal-open');
        return;
      }
      msg.textContent = `Found ${rows.length} record(s).`;
      rows.forEach(r => {
        const tr = document.createElement('tr');
        const add = (text) => {
          const td = document.createElement('td');
          td.textContent = text == null ? '' : String(text);
          tr.appendChild(td);
        };
        add(r.instance_name);
        add(r.user_id);
        add(r.user_type);
        add(r.role_name);
        add(r.role_key);
        add(r.status_id);
        add(r.created_date);
        add(r.updated_date);
        tbody.appendChild(tr);
      });
      // Insert button for mock as well, under scrollbar
      try {
        const uid = String((rows[0]?.userId ?? rows[0]?.user_id) || '').trim();
        const actions = document.getElementById('userDetailsActions');
        if (actions) actions.innerHTML = '';
        if (uid && actions) {
          const a = document.createElement('button');
          a.className = 'btn btn-success';
          a.style.background = '#28a745';
          a.style.border = '1px solid #28a745';
          a.style.color = '#fff';
          a.textContent = 'Insert';
          a.addEventListener('click', () => {
            // Switch to Manual Entry tab
            const manualTab = document.querySelector('.user-details-tab[data-tab="manual"]');
            if (manualTab) {
              manualTab.click();
            }
          });
          actions.appendChild(a);
        }
      } catch (_) {}
      modal.style.display = 'flex';
      document.body.classList.add('modal-open');
    };

    // Drag & drop
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach((ev) => {
      dropZone.addEventListener(ev, (e) => { e.preventDefault(); e.stopPropagation(); }, false);
    });
    ['dragenter', 'dragover'].forEach((ev) => {
      dropZone.addEventListener(ev, () => dropZone.classList.add('active'));
    });
    ['dragleave', 'drop'].forEach((ev) => {
      dropZone.addEventListener(ev, () => dropZone.classList.remove('active'));
    });
    dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropZone.classList.remove('active');
      const files = e.dataTransfer.files;
      if (files.length > 0) {
        handleFile(files[0]);
        setTimeout(refreshFatRowSelectorOptions, 300);
        setTimeout(refreshFatRowSelectorOptions, 900);
        setTimeout(refreshFatRowSelectorOptions, 1500);
      }
    });

    // File input change
    fileInput.addEventListener('change', (e) => {
      const files = e.target.files;
      if (files.length > 0) {
        handleFile(files[0]);
        setTimeout(refreshFatRowSelectorOptions, 300);
        setTimeout(refreshFatRowSelectorOptions, 900);
        setTimeout(refreshFatRowSelectorOptions, 1500);
      }
    });

    async function handleFile(file) {
      try {
        console.log("Handling file:", file.name);
        
        // Validate file type
        if (!file.name.match(/\.(xlsx|xls)$/i)) {
          showError('Please select an Excel file (.xlsx or .xls)');
          return;
        }

        await ensureXLSX();
        
        // Show file info
        if (fileName) fileName.textContent = file.name;
        if (fileSize) fileSize.textContent = formatFileSize(file.size);
        if (fileInfo) fileInfo.classList.remove('d-none', 'hidden');
        if (noData) noData.style.display = 'none';
        if (dataTable) dataTable.style.display = 'table';
        if (spinner) spinner.style.display = 'block';

        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data);
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
        
        // Also store as object format for hierarchy insert page
        const objectData = XLSX.utils.sheet_to_json(firstSheet);
        sessionStorage.setItem('excelData', JSON.stringify(objectData));
        console.log('Stored Excel data in sessionStorage:', objectData.length, 'rows');

        displayData(jsonData);
        parsedData = jsonData;
        window.parsedData = parsedData;
        refreshFatRowSelectorOptions();
        setTimeout(refreshFatRowSelectorOptions, 300);
        setTimeout(refreshFatRowSelectorOptions, 900);
        setTimeout(refreshFatRowSelectorOptions, 1500);
        updateValidateButton();
        updateSummary();
      } catch (err) {
        console.error('Error:', err);
        showError('Error processing file. Please try again.');
      } finally {
        if (spinner) spinner.style.display = 'none';
      }
    }

    function displayData(data) {
      if (!data || data.length === 0) return showError('No data found in the file.');

      while (
        data.length && (!data[data.length - 1] || (Array.isArray(data[data.length - 1]) && data[data.length - 1].every((c) => c === undefined || String(c).trim() === '')))
      ) {
        data.pop();
      }
      if (data.length === 0) return showError('No data found in the file.');

      const maxCols = data.reduce((m, r) => {
        const len = Array.isArray(r) ? r.length : r ? 1 : 0;
        return Math.max(m, len);
      }, 0);

      const firstRow = Array.isArray(data[0]) ? data[0] : [data[0]];
      const firstRowHasHeaders = firstRow.some((c) => c !== undefined && String(c).trim() !== '');
      hasHeaders = firstRowHasHeaders;

      dataTable.innerHTML = '';
      dataTable.className = 'table';

      const thead = document.createElement('thead');
      const headerRow = document.createElement('tr');
      headers = firstRowHasHeaders ? firstRow : Array.from({ length: maxCols }, (_, i) => `Column ${i + 1}`);
      window.headers = headers;
      for (let i = 0; i < maxCols; i++) {
        const th = document.createElement('th');
        th.textContent = headers[i] !== undefined && headers[i] !== null && String(headers[i]).trim() !== '' ? String(headers[i]) : `Column ${i + 1}`;
        headerRow.appendChild(th);
      }
      thead.appendChild(headerRow);
      dataTable.appendChild(thead);

      const tbody = document.createElement('tbody');
      const startIndex = firstRowHasHeaders ? 1 : 0;
      for (let r = startIndex; r < data.length; r++) {
        const row = Array.isArray(data[r]) ? data[r] : [data[r]];
        const isEmpty = row.every((c) => c === undefined || String(c).trim() === '');
        if (isEmpty) continue;
        const tr = document.createElement('tr');
        for (let c = 0; c < maxCols; c++) {
          const td = document.createElement('td');
          const cell = row[c];
          td.textContent = cell !== undefined && cell !== null ? String(cell) : '';
          tr.appendChild(td);
        }
        tbody.appendChild(tr);
      }
      dataTable.appendChild(tbody);
      noData && (noData.style.display = 'none');

      headerIndices = detectHeaderIndices(headers, maxCols);
      updateValidateButton();
      updateSummary();
    }

    function showError(message) {
      if (!noData) return;
      noData.textContent = message;
      noData.style.display = 'block';
    }

    function formatFileSize(bytes) {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    async function validateData(payload) {
      const res = await fetch(`${API_BASE}/api/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plantCode: payload?.plantCode || '',
          departmentCode: payload?.departmentCode || '',
          roleCode: payload?.roleCode || ''
        })
      });
      if (!res.ok) throw new Error('Validation API failed');
      const base = await res.json();
      const email = (payload?.email || '').trim();
      if (email) {
        try {
          const u = await fetch(`${API_BASE}/api/user/${encodeURIComponent(email)}`);
          let userRes = null;
          if (u.ok) userRes = await u.json();
          const exists = !!(userRes && (userRes.status === 'found' || userRes.status === 'exists'));
          base.email = email;
          base.emailStatus = exists ? 'Existing' : 'Not Existing';
          base.emailMessage = exists ? (userRes.first_name ? `${userRes.first_name} ${userRes.last_name || ''}`.trim() : 'Found') : 'User not found';
        } catch (_) {
          base.email = email;
          base.emailStatus = 'Error';
          base.emailMessage = 'Lookup failed';
        }
      }
      return base;
    }

    async function validateBatch(requests) {
      const res = await fetch(`${API_BASE}/api/validate/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requests)
      });
      if (!res.ok) throw new Error('Batch Validation API failed');
      return res.json();
    }

    async function checkEmails(emails) {
      const list = emails.filter(e => e !== undefined && e !== null).map(e => normalize(e));
      if (list.length === 0) return [];
      const requests = list.map(async e => {
        try {
          console.log('Processing email:', e);
          
          // Check if email is empty after normalization
          if (e === "") {
            return {
              email: e,
              status: 'NOT FOUND',
              message: 'No data provided'
            };
          }
          
          const r = await fetch(`${API_BASE}/api/user/${encodeURIComponent(e)}`);
          if (!r.ok) return { email: e, status: 'Error', message: 'Lookup failed' };
          const u = await r.json().catch(() => null);
          const found = !!(u && (u.status === 'found' || u.status === 'exists'));
          
          let message = found ? (u.first_name ? `${u.first_name} ${u.last_name || ''}`.trim() : (u && u.status ? u.status : 'Found')) : 'User not found';
          console.log('Initial message for', e, ':', message, 'found:', found);
          
          // If user found, we need to determine the expected role and check if it's assigned
          if (found) {
            // Find which header this email belongs to and get expected role
            const expectedRole = getExpectedRoleForEmail(e);
            console.log('Expected role for', e, ':', expectedRole);
            
            // Only perform role check if there's a valid expected role mapping
            if (normalizeRole(expectedRole)) {
              const roleStatus = await checkUserRoleAssignment(e, expectedRole);
              console.log('Role status for', e, ':', roleStatus);
              // Only show role assignment status, remove username
              message = roleStatus;
              console.log('Final message for', e, ':', message);
            } else {
              // No role mapping for this header, just show user found status
              message = u.first_name ? `${u.first_name} ${u.last_name || ''}`.trim() : (u && u.status ? u.status : 'Found');
              console.log('No role mapping for header, showing user status:', message);
            }
          }
          
          return {
            email: e,
            status: found ? 'Existing' : 'Not Existing',
            message: message
          };
        } catch (error) {
          console.error('Error processing email', e, ':', error);
          return { email: e, status: 'Error', message: 'Lookup failed' };
        }
      });
      return Promise.all(requests);
    }

    function pickFirstCodes(selectedExcelRowNumber = null) {
      const { plantCodes, departmentCodes } = collectCodes(selectedExcelRowNumber);
      return {
        plantCode: plantCodes.length ? plantCodes[0] : '',
        departmentCode: departmentCodes.length ? departmentCodes[0] : ''
      };
    }

    // Helper function to get expected role for email based on current Excel data
    function getExpectedRoleForEmail(email) {
      const emailKey = normalizeEmailKey(email);
      // This function needs to access the current Excel data to find which header the email belongs to
      // We'll store the email-to-header mapping globally during processing
      if (window.emailToExpectedRoleMapping) {
        if (window.emailToExpectedRoleMapping[email]) {
          return window.emailToExpectedRoleMapping[email];
        }
        if (emailKey && window.emailToExpectedRoleMapping[emailKey]) {
          return window.emailToExpectedRoleMapping[emailKey];
        }
      }
      if (window.emailToHeaderMapping) {
        if (window.emailToHeaderMapping[email]) {
          return getExpectedRoleByHeader(window.emailToHeaderMapping[email]);
        }
        if (emailKey && window.emailToHeaderMapping[emailKey]) {
          return getExpectedRoleByHeader(window.emailToHeaderMapping[emailKey]);
        }
      }
      return '-';
    }

    // Normalize role labels for safe case-insensitive comparisons.
    function normalizeRole(role) {
      if (role === null || role === undefined) return '';
      const value = String(role).trim();
      if (!value || value.toLowerCase() === 'nan' || value === '-') return '';
      return value.toUpperCase();
    }

    function normalizeEmailKey(email) {
      if (email === null || email === undefined) return '';
      return String(email).trim().toLowerCase();
    }

    function rolesMatch(expectedRole, roleKey) {
      const normalizedExpected = normalizeRole(expectedRole);
      const normalizedKey = normalizeRole(roleKey);
      return !!normalizedExpected && !!normalizedKey && normalizedExpected === normalizedKey;
    }

    // Helper function to check user role assignment
    async function checkUserRoleAssignment(email, expectedRole) {
      const normalizedExpectedRole = normalizeRole(expectedRole);
      console.log('Role check -> Expected:', expectedRole, '| Normalized:', normalizedExpectedRole, '| Match self-check:', rolesMatch(expectedRole, normalizedExpectedRole));
      if (!normalizedExpectedRole) return 'User found';
      try {
        const res = await fetch(`${API_BASE}/api/member/check-user-role?email=${encodeURIComponent(email)}&expectedRole=${encodeURIComponent(normalizedExpectedRole)}`);
        console.log('Role check API response status:', res.status);
        if (res.ok) {
          const data = await res.json();
          console.log('Role check API response:', data);
          // Check if user has any assigned roles
          if (data.assignedRoles && data.assignedRoles.length > 0) {
            return 'Role is assigned';
          } else {
            return 'Role is not assigned';
          }
        } else {
          console.log('Role check API failed');
          return 'Error checking role';
        }
      } catch (error) {
        console.error('Error checking user role:', error);
        return 'Error checking role';
      }
    }

    // Helper function to get expected role based on header mapping
    function getExpectedRoleByHeader(headerName, context = {}) {
      console.log('Processing header:', headerName);

      const normalizeHeaderKey = (value) => String(value || '')
        .trim()
        .toLowerCase()
        .replace(/\s+/g, ' ');

      const key = normalizeHeaderKey(headerName);

      if (currentModule === 'FAC') {
        if (key === 'email id' || key === 'lm email id' || key === 'lcm email id') {
          console.log('Header mapping result:', headerName, '->', 'LM USER');
          return 'LM USER';
        }
        if (key.includes('cbs') && (key.includes('email') || key.includes('mail'))) {
          const role = context.cbsSequence === 2 ? 'CBS USER 2' : 'CBS USER 1';
          console.log('Header mapping result:', headerName, '->', role);
          return role;
        }
      }
      
      const headerRoleMapping = {
        'poc email id': 'FA-POC',
        'poc email': 'FA-POC',
        'email id': 'FA-POC',
        'approver email id': 'FA-FUNCTIONAL',
        'approver email': 'FA-FUNCTIONAL',
        'cbs email id': 'FA-CBS',
        'cbs member1 mail id': 'FA-CBS',
        'cbs member2 mail id': 'FA-CBS',
        'cbs member3 mail id': 'FA-CBS'
      };
      
      const result = headerRoleMapping[key] || '-';
      console.log('Header mapping result:', headerName, '->', result);
      return result;
    }

    function buildEmailExpectedRoleMapping(selectedExcelRowNumber = null) {
      const mapping = {};
      if (!parsedData || !Array.isArray(parsedData)) return mapping;
      const start = hasHeaders ? 1 : 0;
      const emailIdxs = Array.isArray(headerIndices.emails) ? headerIndices.emails : [];
      for (let r = start; r < parsedData.length; r++) {
        if (selectedExcelRowNumber && (r + 1) !== selectedExcelRowNumber) continue;
        const row = Array.isArray(parsedData[r]) ? parsedData[r] : [parsedData[r]];
        let cbsSequence = 0;
        for (const idx of emailIdxs) {
          if (idx === undefined || idx === null) continue;
          const headerName = headers[idx] ? String(headers[idx]).trim() : `Email Column ${idx + 1}`;
          const emailValue = normalize(row[idx]);
          const headerKey = String(headerName || '').toLowerCase();
          const roleContext = {};
          if (currentModule === 'FAC' && headerKey.includes('cbs') && (headerKey.includes('email') || headerKey.includes('mail'))) {
            roleContext.cbsSequence = ++cbsSequence;
          }
          const expectedRole = getExpectedRoleByHeader(headerName, roleContext);
          if (!emailValue || !normalizeRole(expectedRole)) continue;
          mapping[emailValue] = expectedRole;
          const emailKey = normalizeEmailKey(emailValue);
          if (emailKey) mapping[emailKey] = expectedRole;
        }
      }
      return mapping;
    }

    async function renderResults(result, emailResults) {
      const currentModule = (new URLSearchParams(window.location.search).get('module') || 'FAT').toUpperCase();
      const resultsSection = document.getElementById('results');
      const tbody = document.querySelector('#resultsTable tbody');
            const sumValid = document.getElementById('sumValid');
      const sumInvalid = document.getElementById('sumInvalid');

      if (!tbody) return;

      let asArray = Array.isArray(result) ? result : [result];
      // Resolve any pending promises from email augmentation
      asArray = await Promise.all(asArray);
      const rows = [];
      asArray.forEach((res) => {
        const plantValid = res.plantStatus === 'Existing';
        const deptValid = res.departmentStatus === 'Existing';
        const plantStatus = plantValid ? 'Existing' : 'Not Existing';
        const deptStatus = deptValid ? 'Existing' : 'Not Existing';
        
        // Get actual column names from Excel headers
        const plantColumnName = headerIndices.plant >= 0 && headers[headerIndices.plant] ? String(headers[headerIndices.plant]).trim() : 'Plant Code';
        const deptColumnName = headerIndices.department >= 0 && headers[headerIndices.department] ? String(headers[headerIndices.department]).trim() : 'Department Code';
        
        rows.push({
          field: plantColumnName,
          type: 'plant',
          code: res.plantCode || '-',
          name: res.plantCode || '-', // Show the actual plant code value
          status: plantStatus,
          message: plantValid ? 'Plant found' : 'Plant not found',
          expectedRole: '-'
        });
        rows.push({
          field: deptColumnName,
          type: 'department',
          code: res.departmentCode || '-',
          name: res.departmentCode || '-', // Show the actual department code value
          status: deptStatus,
          message: deptValid ? 'Department found' : 'Department not exists',
          expectedRole: '-'
        });
      });

      // Append all email results as individual rows
      if (Array.isArray(emailResults)) {
        console.log('Email results to display:', emailResults);
        let facCbsSequence = 0;
        
        // Keep existing email-to-header mapping from source rows (used for role lookup).
        window.emailToHeaderMapping = window.emailToHeaderMapping || {};
        
        // Filter out specific email rows we don't want to show
        emailResults = emailResults.filter(er => {
          const emailHeader = headers[headerIndices.emails[emailResults.indexOf(er)]] || '';
          return !['RCM/HO DEP HOD/FACTORY Cluster Manager MAIL ID', 'CBS Member3 MAIL ID'].includes(emailHeader);
        });
        
        emailResults.forEach((er, index) => {
          // Find the corresponding column name for this email
          let emailColumnName = 'Email';
          const normalizedEmail = normalize(er.email);
          const emailKey = normalizeEmailKey(normalizedEmail);
          if (normalizedEmail && window.emailToHeaderMapping) {
            emailColumnName =
              window.emailToHeaderMapping[normalizedEmail] ||
              window.emailToHeaderMapping[emailKey] ||
              emailColumnName;
          } else if (headerIndices.emails && headerIndices.emails[index] !== undefined && headers[headerIndices.emails[index]]) {
            emailColumnName = String(headers[headerIndices.emails[index]]).trim();
          }
          
          console.log('Processing email result:', { email: normalizedEmail, header: emailColumnName, status: er.status });
          const roleContext = {};
          const normalizedHeaderForRole = String(emailColumnName || '').toLowerCase();
          if (currentModule === 'FAC' && normalizedHeaderForRole.includes('cbs') && (normalizedHeaderForRole.includes('email') || normalizedHeaderForRole.includes('mail'))) {
            roleContext.cbsSequence = ++facCbsSequence;
          }
          
          // Only create mapping for non-empty emails
          if (normalizedEmail !== "") {
            console.log(`Created mapping: ${normalizedEmail} -> ${emailColumnName}`);
            window.emailToHeaderMapping[normalizedEmail] = emailColumnName;
            const emailKey = normalizeEmailKey(normalizedEmail);
            if (emailKey) window.emailToHeaderMapping[emailKey] = emailColumnName;
          } else {
            console.log(`No value found for column: ${emailColumnName}. Skipping mapping.`);
          }
          
          // Always create a row for each header, including empty values
          if (normalizedEmail === "") {
            // Handle empty/null/NaN values
            rows.push({
              field: emailColumnName,
              type: 'email',
              code: '-',
              name: '-',
              status: 'NOT FOUND',
              message: 'No data provided',
              expectedRole: getExpectedRoleByHeader(emailColumnName, roleContext)
            });
          } else {
            // Handle non-empty emails
            rows.push({
              field: emailColumnName,
              type: 'email',
              code: normalizedEmail || '-',
              name: normalizedEmail || '-', // Show the actual email value
              status: er.status || '-',
              message: er.message || 'Not found', // Show the actual message including role assignment status
              expectedRole: getExpectedRoleByHeader(emailColumnName, roleContext) // Store expected role
            });
          }
        });
      }

      // Use filtered rows for both counting and display
      const displayRows = rows.filter(row => {
        // Keep all plant and department rows
        if (row.type === 'plant' || row.type === 'department') {
          return true;
        }
        // Filter out specific email form fields
        if (row.field && ['RCM/HO DEP HOD/FACTORY Cluster Manager MAIL ID', 'CBS Member3 MAIL ID'].includes(row.field)) {
          return false;
        }
        // Filter out rows with 'No data provided' message
        if (row.message === 'No data provided') {
          return false;
        }
        return true;
      });

      tbody.innerHTML = displayRows.map(r => {
        const hasCode = r.code && r.code !== '-' && String(r.code).trim() !== '';
        const showInsert = r.status === 'Not Existing';
        
        // Use stored expected role or get it if not stored
        let expectedRole = r.expectedRole || getExpectedRoleByHeader(r.field);
        
        // Format display values: show '-' for empty fields except for FORM FIELD column
        const fieldName = r.field || '-'; // FORM FIELD column: always show field name
        const nameValue = r.name && r.name.trim() !== '' ? r.name : '-'; // Other columns: show '-' if empty
        const statusValue = r.status && r.status.trim() !== '' ? r.status : '-';
        const expectedRoleValue = expectedRole && expectedRole.trim() !== '' ? expectedRole : '-';
        const messageValue = r.message && r.message.trim() !== '' ? r.message : '-';
        
        console.log('Row data:', { field: r.field, name: r.name, expectedRole });
        
        return `
        <tr data-row-type="${r.type || ''}" ${r.type === 'email' && hasCode ? `data-email="${r.code}"` : ''}>
          <td>${fieldName}</td>
          <td>${nameValue}</td>
          <td class="${statusValue === 'Existing' ? 'status-valid' : 'status-invalid'}">${statusValue}</td>
          <td style="text-align: center; vertical-align: middle;">${expectedRoleValue}</td>
          <td>${messageValue}</td>
          <td style="display:flex;gap:6px;">
            ${r.type === 'email' && hasCode
              ? `<button class="btn btn-outline-secondary validate-email-btn" data-email="${r.code}" data-expected-role="${expectedRoleValue}">ADD ROLE</button>`
              : (showInsert ? `<button class="btn btn-success insert-btn" style="background-color:#28a745;border-color:#28a745;color:white;" data-type="${r.type}" data-code="${hasCode ? r.code : ''}">Insert</button>` : '')}
          </td>
        </tr>
      `;
      }).join('');

      // Capture validated plant code for prefill on insert page
      try {
        const plantRow = rows.find(r => (
          (r.type && String(r.type).toLowerCase().includes('plant')) ||
          (r.field && String(r.field).toLowerCase().includes('plant'))
        ) && r.status === 'Existing');
        const plantCodeVal = plantRow ? (plantRow.code || plantRow.name || '') : '';
        if (plantCodeVal) {
          try { window._lastPlantCode = String(plantCodeVal).trim(); } catch (_) {}
        }
      } catch (_) {}

const total = displayRows.length;
      const valid = displayRows.filter(r => r.status === 'Existing').length;
      const invalid = total - valid;
            if (sumValid) sumValid.textContent = String(valid);
      if (sumInvalid) sumInvalid.textContent = String(invalid);

      if (resultsSection) resultsSection.classList.remove('d-none', 'hidden');
      document.getElementById('results')?.classList.add('fade-in');

      // Add "Check Plant Mapping" button for the first valid email
      try {
        const existingBtn = document.getElementById('checkPlantMappingBtn');
        if (existingBtn) existingBtn.remove();
        // FAC does not require plant mapping checks.
        if (currentModule !== 'FAC') {
          const firstValid = Array.isArray(emailResults) ? emailResults.find(er => er && er.email && er.status === 'Existing') : null;
          if (firstValid && firstValid.email) {
            const bar = document.querySelector('.validate-bar') || resultsSection;
            if (bar) {
              const btn = document.createElement('button');
              btn.id = 'checkPlantMappingBtn';
              btn.className = 'btn btn-success';
              btn.style.marginLeft = '10px';
              btn.textContent = 'Check Plant Mapping';
              btn.addEventListener('click', () => showPlantMappingModalForEmail(firstValid.email));
              bar.appendChild(btn);
            }
          }
        }
      } catch (_) {}

      // Add "Hierarchy Check" button only when all visible status values are Existing
      try {
        const allStatusExisting = displayRows.length > 0 && displayRows.every(r => r && r.status === 'Existing');
        const firstValid = Array.isArray(emailResults) ? emailResults.find(er => er && er.email && er.status === 'Existing') : null;
        // Find validated plant and department rows from rendered results
        const plantRow = rows.find(r => (
          (r.type && String(r.type).toLowerCase().includes('plant')) || (r.field && String(r.field).toLowerCase().includes('plant'))
        ) && r.status === 'Existing');
        const deptRow = rows.find(r => (
          (r.type && String(r.type).toLowerCase().includes('department')) || (r.field && String(r.field).toLowerCase().includes('department'))
        ) && r.status === 'Existing');
        const plantCode = plantRow ? (plantRow.code || plantRow.name || '').toString().trim() : '';
        const deptCode = deptRow ? (deptRow.code || deptRow.name || '').toString().trim() : '';
        const initiatorEmail = firstValid && firstValid.email ? String(firstValid.email).trim() : '';
        const allFieldsValid = !!(plantCode && deptCode && initiatorEmail);
        // Persist for global handler
        try {
          if (plantCode) window._lastPlantCode = plantCode;
          if (deptCode) window._lastDeptCode = deptCode;
          if (initiatorEmail) window._lastInitiatorEmail = initiatorEmail;
        } catch (_) {}
        const existingHBtn = document.getElementById('hierarchyCheckBtn');
        if (existingHBtn) existingHBtn.remove();
        if (allStatusExisting && allFieldsValid) {
          const bar = document.querySelector('.validate-bar') || resultsSection;
          if (bar) {
            const hbtn = document.createElement('button');
            hbtn.id = 'hierarchyCheckBtn';
            hbtn.className = (currentModule === 'FAC') ? 'btn btn-success' : 'btn btn-outline-secondary';
            hbtn.style.marginLeft = '10px';
            hbtn.textContent = currentModule === 'FAC'
              ? 'FAC Hierarchy Insert'
              : 'Hierarchy Check';
            // Set data attributes for the global event listener
            hbtn.setAttribute('data-plant', plantCode);
            hbtn.setAttribute('data-dept', deptCode);
            hbtn.setAttribute('data-email', initiatorEmail);
            if (currentModule === 'FAC') {
              const norm = (s) => String(s || '').trim().toLowerCase();
              const pickEmailByHeader = (needle) => {
                const row = rows.find(r => r && r.type === 'email' && r.status === 'Existing' && norm(r.field).includes(norm(needle)));
                return row && row.code ? String(row.code).trim() : '';
              };
              const cbsRows = rows.filter(r => r && r.type === 'email' && r.status === 'Existing' && norm(r.field).includes('cbs'));
              const lcmEmail = pickEmailByHeader('poc') || pickEmailByHeader('email id') || initiatorEmail;
              const cbs1Email = pickEmailByHeader('cbs member1') || pickEmailByHeader('cbs member 1') || (cbsRows[0] && cbsRows[0].code ? String(cbsRows[0].code).trim() : '');
              const cbs2Email = pickEmailByHeader('cbs member2') || pickEmailByHeader('cbs member 2') || (cbsRows[1] && cbsRows[1].code ? String(cbsRows[1].code).trim() : '');
              if (lcmEmail) hbtn.setAttribute('data-lcm-email', lcmEmail);
              if (cbs1Email) hbtn.setAttribute('data-cbs1-email', cbs1Email);
              if (cbs2Email) hbtn.setAttribute('data-cbs2-email', cbs2Email);

            }
            bar.appendChild(hbtn);
          }
        }
      } catch (_) {}
    }

    async function postJSON(url, payload) {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(text || 'Request failed');
      }
      return res.json();
    }

    async function openFACHierarchyInsert(payload) {
      try {
        const result = await postJSON(`${API_BASE}/api/fac/hierarchy`, payload);
        showToast(result.message || 'FAC hierarchy inserted successfully', 'success');
      } catch (error) {
        console.error('FAC hierarchy insert failed:', error);
        showToast('FAC hierarchy insert failed. Check console for details.', 'error');
      }
    }
    try { window.openFACHierarchyInsert = openFACHierarchyInsert; } catch (_) {}

    // Handle Insert button clicks -> open modal with insert page
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('.insert-btn');
      if (!btn) return;
      const type = btn.getAttribute('data-type');
      const code = (btn.getAttribute('data-code') || '').trim();
      if (!type) return; // require type only
      if (type === 'plant') {
        const qp = code ? `?${new URLSearchParams({ code }).toString()}` : '';
        openModal(`plant-insert.html${qp}`, 'Insert Plant');
        return;
      }
      if (type === 'department') {
        const currentModule = new URLSearchParams(window.location.search).get('module') || '';
        const params = {};
        if (code) params.code = code;
        if (currentModule) params.module = currentModule;
        const qp = Object.keys(params).length ? `?${new URLSearchParams(params).toString()}` : '';
        openModal(`department-insert.html${qp}`, 'Insert Department');
        return;
      }
    });

    // Listen for child (iframe) success to close modal
    window.addEventListener('message', (event) => {
      const data = event.data || {};
      if (data && data.type === 'request-excel-data') {
        try {
          // Only respond to our own insert pages (typically http://localhost:8080 when index.html is opened via file://)
          const expectedOrigin = (() => {
            try {
              if (API_BASE) return new URL(API_BASE).origin;
            } catch (_) {}
            try { return window.location.origin; } catch (_) {}
            return '';
          })();
          // If the parent is opened via file:// the origin is typically "null" and cannot match the child.
          const originOk = !expectedOrigin || expectedOrigin === 'null' || event.origin === expectedOrigin;
          if (!originOk) return;

          const excelDataRaw = sessionStorage.getItem('excelData');
          const currentRowRaw = sessionStorage.getItem('currentHierarchyRow');
          const payload = {
            type: 'excel-data-response',
            excelData: excelDataRaw ? JSON.parse(excelDataRaw) : [],
            currentHierarchyRow: currentRowRaw ? JSON.parse(currentRowRaw) : {}
          };
          const targetOrigin = (event.origin && event.origin !== 'null') ? event.origin : '*';
          event.source && event.source.postMessage(payload, targetOrigin);
        } catch (err) {
          console.warn('[ExcelDataBridge] Failed to respond:', err);
        }
        return;
      }
      if (data && data.type === 'insert-success') {
        closeModal();
        // Auto-revalidate after insert so messages update immediately
        setTimeout(() => {
          // Trigger the same UI flow as the Validate button so results re-render.
          if (typeof validateBtn !== 'undefined' && validateBtn && typeof validateBtn.click === 'function') {
            validateBtn.click();
            return;
          }
          if (typeof validateFABData === 'function') validateFABData();
        }, 300);
      }
      if (data && data.type === 'close-insert') {
        closeModal();
      }
    });

    function openModal(url, title) {
      if (!modalOverlay || !modalFrame) {
        // Fallback to navigation if modal not present
        window.location.href = resolveStaticPageUrl(url);
        return;
      }
      if (modalTitle) modalTitle.textContent = title || 'Insert';
      modalFrame.src = resolveStaticPageUrl(url);
      modalOverlay.style.display = 'flex';
    }

    function closeModal() {
      if (!modalOverlay || !modalFrame) return;
      modalOverlay.style.display = 'none';
      modalFrame.src = 'about:blank';
    }

    function detectHeaderIndices(headers, maxCols) {
      const getName = (h, i) => (h && String(h).trim()) || `Column ${i + 1}`;
      const normalize = (s) => s.toLowerCase().trim();

      // simple heuristics for plant/department codes
      const looksLikePlant = (name) => /plant/.test(name) && /code|id|no|number/.test(name);
      const looksLikeDept = (name) => /(dept|department)/.test(name) && /code|id|no|number/.test(name);

      let plant = -1;
      let department = -1;
      const emails = [];
      for (let i = 0; i < maxCols; i++) {
        const raw = getName(headers[i], i);
        const name = normalize(raw);
        if (plant === -1 && looksLikePlant(name)) plant = i;
        if (department === -1 && looksLikeDept(name)) department = i;
        if (name.includes('mail') || name.includes('email')) emails.push(i);
      }
      return { plant, department, emails };
    }

    // Normalize function to handle all forms of empty values
    function normalize(v) {
        if (v === null || v === undefined) return "";
        if (typeof v === "number" && isNaN(v)) return "";
        if (String(v).trim() === "" || String(v).trim().toLowerCase() === "nan") return "";
        return String(v).trim();
    }

    function collectCodes(selectedExcelRowNumber = null) {
      if (!parsedData) return { plantCodes: [], departmentCodes: [], emails: [] };
      const start = hasHeaders ? 1 : 0;
      const plantIdx = headerIndices.plant;
      const deptIdx = headerIndices.department;
      const emailIdxs = Array.isArray(headerIndices.emails) ? headerIndices.emails : [];
      const plantCodes = [];
      const departmentCodes = [];
      const emails = [];
      for (let r = start; r < parsedData.length; r++) {
        if (selectedExcelRowNumber && (r + 1) !== selectedExcelRowNumber) continue;
        const row = Array.isArray(parsedData[r]) ? parsedData[r] : [parsedData[r]];
        if (plantIdx >= 0 && row[plantIdx] !== undefined && String(row[plantIdx]).trim() !== '')
          plantCodes.push(String(row[plantIdx]).trim());
        if (deptIdx >= 0 && row[deptIdx] !== undefined && String(row[deptIdx]).trim() !== '')
          departmentCodes.push(String(row[deptIdx]).trim());
        // collect only non-empty emails across any 'mail' columns in this row
        for (const idx of emailIdxs) {
          const v = row[idx];
          const headerName = headers[headerIndices.emails[idx]] || `Email Column ${idx}`;
          const normalizedValue = normalize(v);
          
          if (normalizedValue !== "") {
            console.log(`Created mapping: ${normalizedValue} -> ${headerName}`);
            emails.push(normalizedValue);
          }
        }
      }
      return { plantCodes, departmentCodes, emails };
    }

    function buildEmailHeaderMapping(selectedExcelRowNumber = null) {
      const mapping = {};
      if (!parsedData || !Array.isArray(parsedData)) return mapping;
      const start = hasHeaders ? 1 : 0;
      const emailIdxs = Array.isArray(headerIndices.emails) ? headerIndices.emails : [];
      for (let r = start; r < parsedData.length; r++) {
        if (selectedExcelRowNumber && (r + 1) !== selectedExcelRowNumber) continue;
        const row = Array.isArray(parsedData[r]) ? parsedData[r] : [parsedData[r]];
        for (const idx of emailIdxs) {
          if (idx === undefined || idx === null) continue;
          const headerName = headers[idx] ? String(headers[idx]).trim() : `Email Column ${idx + 1}`;
          const emailValue = normalize(row[idx]);
          if (!emailValue) continue;
          mapping[emailValue] = headerName;
          const emailKey = normalizeEmailKey(emailValue);
          if (emailKey) mapping[emailKey] = headerName;
        }
      }
      return mapping;
    }

    function buildBatchRequests(selectedExcelRowNumber = null) {
      if (!parsedData || !Array.isArray(parsedData) || parsedData.length === 0) return [];
      const pIdx = headerIndices.plant;
      const dIdx = headerIndices.department;
      const eIdxs = Array.isArray(headerIndices.emails) ? headerIndices.emails : [];
      if (pIdx < 0 && dIdx < 0 && eIdxs.length === 0) return [];
      const start = hasHeaders ? 1 : 0;
      const max = Math.min(parsedData.length, 1000);
      const requests = [];
      for (let i = start; i < max; i++) {
        if (selectedExcelRowNumber && (i + 1) !== selectedExcelRowNumber) continue;
        const row = Array.isArray(parsedData[i]) ? parsedData[i] : [parsedData[i]];
        const plantCode = pIdx >= 0 && row[pIdx] != null ? String(row[pIdx]).trim() : '';
        const departmentCode = dIdx >= 0 && row[dIdx] != null ? String(row[dIdx]).trim() : '';
        let email = '';
        for (const idx of eIdxs) {
          const v = row[idx];
          if (v != null && String(v).trim() !== '') { email = String(v).trim(); break; }
        }
        if (!plantCode && !departmentCode && !email) continue;
        requests.push({ plantCode, departmentCode, email });
      }
      return requests;
    }

    function updateValidateButton() {
      if (currentModule === 'FAB' || currentModule === 'FAP') {
        validateBtn && (validateBtn.disabled = true);
        validateBtn && validateBtn.classList.add('d-none');
        return;
      }
      const hasEmailCols = Array.isArray(headerIndices.emails) && headerIndices.emails.length > 0;
      const enabled = headerIndices.plant >= 0 || headerIndices.department >= 0 || hasEmailCols;
      const requiresRowSelection = shouldUseFatRowSelector();
      const selectedRowNumber = getSelectedFatExcelRowNumber();
      if (validateBtn) {
        validateBtn.innerHTML = requiresRowSelection
          ? '<i class="bi bi-check2-circle"></i> Validate Selected Row'
          : '<i class="bi bi-check2-circle"></i> Validate All';
      }
      if (enabled) {
        validateBtn && (validateBtn.disabled = requiresRowSelection && !selectedRowNumber);
        validateBtn && validateBtn.classList.remove('btn-loading');
        validateBtn && validateBtn.classList.remove('d-none'); // Show the button
      } else {
        validateBtn && (validateBtn.disabled = true);
        validateBtn && validateBtn.classList.add('d-none'); // Hide the button
      }
    }

    function updateSummary() {
      if (!codeSummary) return;
      const { plantCodes, departmentCodes, emails } = collectCodes();
      codeSummary.innerHTML = `<strong>Plant Codes:</strong> ${plantCodes.length} &nbsp;&nbsp; <strong>Department Codes:</strong> ${departmentCodes.length} &nbsp;&nbsp; <strong>Emails:</strong> ${emails.length}`;
      codeSummary.classList.remove('d-none', 'hidden');
      refreshFatRowSelectorOptions();
    }

    validateBtn && validateBtn.addEventListener('click', async () => {
      const selectedRowNumber = getSelectedFatExcelRowNumber();
      if (shouldUseFatRowSelector() && !selectedRowNumber) {
        alert('Please select a row to validate.');
        return;
      }

      const batch = buildBatchRequests(selectedRowNumber);
      validateBtn.disabled = true;
      const originalHtml = validateBtn.innerHTML;
      validateBtn.innerHTML = 'Validating...';
      try {
        const { emails } = collectCodes(selectedRowNumber);
        
        // Create/refresh email-to-header mapping before checking emails
        window.emailToHeaderMapping = buildEmailHeaderMapping(selectedRowNumber);
        window.emailToExpectedRoleMapping = buildEmailExpectedRoleMapping(selectedRowNumber);
        console.log('Email mapping count:', Object.keys(window.emailToHeaderMapping).length);
        
        const emailResults = await checkEmails(emails);
        if (batch.length > 1) {
          const result = await validateBatch(batch);
          await renderResults(result, emailResults);
        } else {
          const { plantCode, departmentCode } = pickFirstCodes(selectedRowNumber);
          if (!plantCode && !departmentCode && emails.length === 0) {
            alert('No Plant/Department/Email detected.');
            return;
          }
          const result = await validateData({ plantCode, departmentCode });
          await renderResults(result, emailResults);
        }
      } catch (e) {
        console.error(e);
        alert('Validation failed. Please try again.');
      } finally {
        validateBtn.innerHTML = originalHtml;
        updateValidateButton();
      }
    });
  });

  // User Details Modal Tab functionality
  function initUserDetailsTabs() {
    const tabButtons = document.querySelectorAll('.user-details-tab');
    const tabContents = document.querySelectorAll('.user-details-tab-content');
    const closeBtn = document.getElementById('closeUserDetails');
    const cancelBtn = document.getElementById('cancelManualEntry');
    const saveBtn = document.getElementById('saveManualEntry');

    // Tab switching functionality
    tabButtons.forEach(button => {
      button.addEventListener('click', () => {
        const targetTab = button.getAttribute('data-tab');
        
        // Remove active class from all buttons and contents
        tabButtons.forEach(btn => btn.classList.remove('active'));
        tabContents.forEach(content => content.classList.remove('active'));
        
        // Add active class to clicked button and corresponding content
        button.classList.add('active');
        const targetContent = document.getElementById(`${targetTab}-tab`);
        if (targetContent) {
          targetContent.classList.add('active');
          
          // Load roles and set created date when switching to manual tab
          if (targetTab === 'manual') {
            console.log('Switching to manual tab');
            initManualEntryTab();
          }
        }
      });
    });

    // Close modal functionality
    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (cancelBtn) cancelBtn.addEventListener('click', closeModal);

    // Manual entry functionality (exact copy from member-insert.js with username flow)
    function initManualEntryTab() {
      console.log('Initializing manual entry tab');
      const API_BASE = (location.protocol === 'file:') ? 'http://localhost:8080' : '';
      const qs = (k) => new URLSearchParams(location.search).get(k) || '';
      const alertBox = document.getElementById('manualAlert');
      
      function setAlert(msg, ok) {
        if (!alertBox) return;
        alertBox.className = 'alert ' + (ok ? 'alert-success' : 'alert-error');
        alertBox.style.background = ok ? '#dcfce7' : '#fee2e2';
        alertBox.style.border = ok ? '1px solid #bbf7d0' : '1px solid #fecaca';
        alertBox.style.color = ok ? '#166534' : '#b91c1c';
        alertBox.textContent = msg;
        alertBox.style.display = 'block';
      }
      
      function pad(n) { return String(n).padStart(2, '0'); }
      function nowStr() { 
        const d = new Date(); 
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`; 
      }

      const ormInstanceId = document.getElementById('ormInstanceId');
      const userName = document.getElementById('userName');
      const userId = document.getElementById('userId');
      const userType = document.getElementById('userType');
      const createdDate = document.getElementById('createdDate');
      
      if (createdDate) createdDate.value = nowStr();

      // Get email from current user context and fetch username
      (async () => {
        try {
          let email = qs('userId'); // from query param
          console.log('Email from query param:', email);
          
          // Use the specific email stored from ADD ROLE button click
          if (!email && window._currentUserEmail) {
            email = window._currentUserEmail;
            console.log('Email from ADD ROLE button:', email);
          }
          
          // If still not found, try to get from modal context (fallback)
          if (!email) {
            const userDetailsMsg = document.getElementById('userDetailsMsg');
            console.log('User details msg element:', userDetailsMsg);
            if (userDetailsMsg && userDetailsMsg.textContent) {
              console.log('User details msg text:', userDetailsMsg.textContent);
              // Extract email from message like "User ID: 32 (user@example.com)"
              const emailMatch = userDetailsMsg.textContent.match(/\(([^)]+@[^)]+)\)/);
              console.log('Email match:', emailMatch);
              if (emailMatch && emailMatch[1]) {
                email = emailMatch[1];
              }
            }
          }
          
          console.log('Final email to use:', email);
          
          if (email) {
            console.log('Fetching username for email:', email);
            
            // Clear previous values
            userName.value = '';
            userId.value = '';
            
            // Step 1: Get username from email
            const usernameRes = await fetch(`${API_BASE}/api/user/get-username?email=${encodeURIComponent(email)}`);
            console.log('Username response status:', usernameRes.status);
            if (usernameRes.ok) {
              const usernameData = await usernameRes.json();
              console.log('Username response data:', usernameData);
              if (usernameData.success && usernameData.username) {
                userName.value = usernameData.username;
                console.log('Got username:', usernameData.username);
                
                // Step 2: Get user_id from username for form submission
                const userIdRes = await fetch(`${API_BASE}/api/user/get-userid?username=${encodeURIComponent(usernameData.username)}`);
                console.log('User ID response status:', userIdRes.status);
                if (userIdRes.ok) {
                  const userIdData = await userIdRes.json();
                  console.log('User ID response data:', userIdData);
                  if (userIdData.success && userIdData.userId) {
                    userId.value = userIdData.userId;
                    console.log('Got user ID:', userIdData.userId);
                  }
                }
              } else {
                console.log('Username data not successful:', usernameData);
                userName.value = 'User not found';
              }
            } else {
              console.log('Username request failed');
              userName.value = 'Error fetching user';
            }
          } else {
            console.log('No email found');
            userName.value = 'No email specified';
          }
        } catch (error) {
          console.error('Error fetching user details:', error);
          userName.value = 'Error occurred';
        }
      })();

      // Populate instances dropdown and load roles
      (async () => {
        try {
          // Load instances first
          const instancesRes = await fetch(`${API_BASE}/api/member/instances`);
          if (instancesRes.ok) {
            const instancesJson = await instancesRes.json();
            const instances = (instancesJson && instancesJson.results) || [];
            ormInstanceId.innerHTML = '<option value="">Select</option>' + 
              instances.map(i => `<option value="${i.id}">${i.name}</option>`).join('');
            console.log('Loaded instances:', instances);
          }

          // Load processes
          const processesRes = await fetch(`${API_BASE}/api/member/processes`);
          if (processesRes.ok) {
            const processesJson = await processesRes.json();
            const processes = (processesJson && processesJson.results) || [];
            const processNameSelect = document.getElementById('processName');
            if (processNameSelect) {
              processNameSelect.innerHTML = '<option value="">Select</option>' + 
                processes.map(p => `<option value="${p.process_name}">${p.process_name}</option>`).join('');
              console.log('Loaded processes:', processes);
            }
          }

          // Load initial roles (without app_name filter)
          const rolesRes = await fetch(`${API_BASE}/api/member/roles`);
          if (rolesRes.ok) {
            const rolesJson = await rolesRes.json();
            const roles = (rolesJson && rolesJson.results) || [];
            userType.innerHTML = '<option value="">Select</option>' + 
              roles.map(r => `<option value="${r.id}">${r.key}</option>`).join('');
            console.log('Loaded initial roles:', roles);
          }
        } catch (_) { /* non-fatal */ }
      })();

      // Add change listener for app_id dropdown to filter roles
      ormInstanceId.addEventListener('change', async () => {
        const selectedOption = ormInstanceId.options[ormInstanceId.selectedIndex];
        const appName = selectedOption ? selectedOption.textContent : '';
        const processNameSelect = document.getElementById('processName');
        const processName = processNameSelect ? processNameSelect.value : '';
        
        console.log('App changed to:', appName, 'Process:', processName);
        
        if (appName && appName !== 'Select') {
          try {
            // First, load process names for the selected app
            const processRes = await fetch(`${API_BASE}/api/member/processes-by-app?appName=${encodeURIComponent(appName)}`);
            if (processRes.ok) {
              const processJson = await processRes.json();
              const processRows = (processJson && processJson.results) || [];
              processNameSelect.innerHTML = '<option value="">Select</option>' + 
                processRows.map(r => `<option value="${r.process_name}">${r.process_name}</option>`).join('');
              console.log(`Loaded processes for app ${appName}:`, processRows);
            }
            
            // Then, load roles for the selected app and process
            const url = processName && processName !== 'Select' 
              ? `${API_BASE}/api/member/roles?appName=${encodeURIComponent(appName)}&processName=${encodeURIComponent(processName)}`
              : `${API_BASE}/api/member/roles?appName=${encodeURIComponent(appName)}`;
            
            const res = await fetch(url);
            if (res.ok) {
              const json = await res.json();
              const rows = (json && json.results) || [];
              userType.innerHTML = '<option value="">Select</option>' + 
                rows.map(r => `<option value="${r.id}">${r.key}</option>`).join('');
              console.log(`Loaded roles for app ${appName} and process ${processName}:`, rows);
            }
          } catch (error) {
            console.error('Error loading filtered roles:', error);
          }
        } else {
          // Reset process dropdown and user type when no app is selected
          if (processNameSelect) {
            processNameSelect.innerHTML = '<option value="">Select</option>';
          }
          userType.innerHTML = '<option value="">Select</option>';
        }
      });

      // Add change listener for process_name dropdown to filter roles
      const processNameSelect = document.getElementById('processName');
      if (processNameSelect) {
        processNameSelect.addEventListener('change', async () => {
          const selectedOption = ormInstanceId.options[ormInstanceId.selectedIndex];
          const appName = selectedOption ? selectedOption.textContent : '';
          const processName = processNameSelect.value;
          
          console.log('Process changed to:', processName, 'App:', appName);
          
          if (appName && appName !== 'Select') {
            try {
              const url = processName && processName !== 'Select'
                ? `${API_BASE}/api/member/roles?appName=${encodeURIComponent(appName)}&processName=${encodeURIComponent(processName)}`
                : `${API_BASE}/api/member/roles?appName=${encodeURIComponent(appName)}`;
              
              const res = await fetch(url);
              if (res.ok) {
                const json = await res.json();
                const rows = (json && json.results) || [];
                userType.innerHTML = '<option value="">Select</option>' + 
                  rows.map(r => `<option value="${r.id}">${r.key}</option>`).join('');
                console.log(`Loaded roles for app ${appName} and process ${processName}:`, rows);
              }
            } catch (error) {
              console.error('Error loading filtered roles:', error);
            }
          }
        });
      }

      // Remove existing listener to avoid duplicates
      const btnInsert = document.getElementById('btnInsert');
      const newBtnInsert = btnInsert.cloneNode(true);
      btnInsert.parentNode.replaceChild(newBtnInsert, btnInsert);
      
      newBtnInsert.addEventListener('click', async () => {
        // Clear previous alerts
        setAlert('', true);
        
        // Check if any dropdown is still on "Select"
        if (!ormInstanceId.value || ormInstanceId.value === '') {
          setAlert('Please select a value from app_id dropdown', false);
          ormInstanceId.focus();
          return;
        }
        
        const processNameSelect = document.getElementById('processName');
        if (processNameSelect && (!processNameSelect.value || processNameSelect.value === '')) {
          setAlert('Please select a value from Process Name dropdown', false);
          processNameSelect.focus();
          return;
        }
        
        if (!userType.value || userType.value === '') {
          setAlert('Please select a value from user_type dropdown', false);
          userType.focus();
          return;
        }
        
        const payload = {
          ormInstanceId: parseInt(ormInstanceId.value, 10),
          userId: parseInt(userId.value, 10), // Use the hidden user_id field
          userType: parseInt(userType.value, 10)
        };
        if (!payload.userId || !payload.ormInstanceId || !payload.userType) {
          setAlert('All fields are required', false); 
          return;
        }
        try {
          const res = await fetch(`${API_BASE}/api/member/insert`, {
            method: 'POST', 
            headers: {'Content-Type': 'application/json'}, 
            body: JSON.stringify(payload)
          });
          const j = await res.json();
          if (res.ok && j && j.success) {
            setAlert(`Inserted successfully. New ID: ${j.id}`, true);
            // Reset form after successful insertion
            setTimeout(() => {
              if (ormInstanceId) ormInstanceId.selectedIndex = 0;
              if (processNameSelect) processNameSelect.selectedIndex = 0;
              if (userType) userType.selectedIndex = 0;
              // Keep userName and userId as they are
            }, 2000);
            // Refresh the user details table after 2 seconds
            setTimeout(() => {
              const event = new CustomEvent('refreshUserDetails');
              document.dispatchEvent(event);
            }, 2000);
          } else {
            setAlert(j && j.error ? j.error : 'Insert failed', false);
          }
        } catch (err) { 
          setAlert('Insert failed', false); 
        }
      });
    }

    // Listen for refresh event
    document.addEventListener('refreshUserDetails', () => {
      // Refresh the user details if there's an active user
      const modal = document.getElementById('userDetailsModal');
      if (modal && modal.style.display !== 'none' && modal.style.display !== '') {
        // Trigger a refresh of the current user details
        const refreshEvent = new CustomEvent('refreshCurrentUserData');
        document.dispatchEvent(refreshEvent);
      }
    });
  }

  
  // Initialize tabs when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initUserDetailsTabs);
  } else {
    initUserDetailsTabs();
  }

  // FAP Hierarchy Addition Tab System
  function openFAPHierarchyTab(queryParams, currentRow) {
    console.log('Opening FAP Hierarchy Addition tab with params:', queryParams.toString());
    console.log('Current row data:', currentRow);
    
    // Store the form data for the tab
    const formData = {
      plant_code: queryParams.get('plant_code') || '',
      department: queryParams.get('dept_code') || '',
      initiator_login_name: queryParams.get('poc_login_name') || '',
      reviewer1_list: queryParams.get('reviewer_email') || '',
      reviewer2_list: queryParams.get('level1_reviewer_email') || '',
      approver_list: queryParams.get('approver_email') || '',
      cbs_member1_email: queryParams.get('cbs1_email') || '',
      cbs_member2_email: queryParams.get('cbs2_email') || '',
      cbs_member3_email: queryParams.get('cbs3_email') || '',
      management_approver_list: queryParams.get('level2_approver_email') || '',
      status_id: 1 // Default to Active
    };

    console.log('Form data prepared:', formData);
    
    // Create a new tab in the existing tab panel
    createNewTab({
      label: 'FAP Hierarchy Addition',
      closable: true,
      component: 'FAPHierarchyAdditionForm',
      params: formData
    });
  }

  function createNewTab(options) {
    // Find the existing tab panel (similar to how user details tabs work)
    const tabPanel = document.querySelector('.tab-panel') || document.querySelector('.tab-container');
    if (!tabPanel) {
      console.error('Tab panel not found');
      // Fallback: create a simple modal if tab system doesn't exist
      showFAPHierarchyModal(options.params);
      return;
    }

    // Create tab element
    const tab = document.createElement('div');
    tab.className = 'tab-item active';
    tab.innerHTML = `
      <span class="tab-label">${options.label}</span>
      <button class="tab-close" onclick="closeTab(this)">×</button>
    `;

    // Create tab content
    const tabContent = document.createElement('div');
    tabContent.className = 'tab-content active';
    tabContent.innerHTML = createFAPHierarchyFormHTML(options.params);

    // Add to tab panel
    const tabBar = tabPanel.querySelector('.tab-bar') || tabPanel;
    const tabContentContainer = tabPanel.querySelector('.tab-content-container') || tabPanel;
    
    if (tabBar && tabContentContainer) {
      // Deactivate existing tabs
      tabBar.querySelectorAll('.tab-item').forEach(t => t.classList.remove('active'));
      tabContentContainer.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      
      // Add new tab
      tabBar.appendChild(tab);
      tabContentContainer.appendChild(tabContent);
      
      // Initialize the form
      initializeFAPHierarchyForm(options.params);
    } else {
      console.error('Tab bar or content container not found');
      // Fallback
      showFAPHierarchyModal(options.params);
    }
  }

  function closeTab(closeButton) {
    const tab = closeButton.closest('.tab-item');
    const tabContent = Array.from(document.querySelectorAll('.tab-content')).find(content => 
      content.classList.contains('active')
    );
    
    if (tab && tabContent) {
      tab.remove();
      tabContent.remove();
      
      // Activate first remaining tab if any
      const remainingTabs = document.querySelectorAll('.tab-item');
      const remainingContents = document.querySelectorAll('.tab-content');
      
      if (remainingTabs.length > 0 && remainingContents.length > 0) {
        remainingTabs[0].classList.add('active');
        remainingContents[0].classList.add('active');
      }
    }
  }

  function createFAPHierarchyFormHTML(formData) {
    return `
      <div class="fap-hierarchy-form">
        <div class="form-header">
          <h4>FAP Hierarchy Addition</h4>
          <button class="btn btn-primary btn-sm" onclick="loadFAPData()">Load Data</button>
        </div>
        
        <div class="form-grid">
          <div class="form-group">
            <label>Plant Code</label>
            <input type="text" id="plant_code" value="${formData.plant_code}" readonly>
          </div>
          
          <div class="form-group">
            <label>Department</label>
            <input type="text" id="department" value="${formData.department}" readonly>
          </div>
          
          <div class="form-group">
            <label>Initiator Login Name</label>
            <input type="text" id="initiator_login_name" value="${formData.initiator_login_name}" readonly>
          </div>
          
          <div class="form-group">
            <label>Reviewer 1 Email</label>
            <input type="text" id="reviewer1_email" value="${formData.reviewer1_list}" readonly>
          </div>
          
          <div class="form-group">
            <label>Reviewer 2 Email</label>
            <input type="text" id="reviewer2_email" value="${formData.reviewer2_list}" readonly>
          </div>
          
          <div class="form-group">
            <label>Approver Email</label>
            <input type="text" id="approver_email" value="${formData.approver_list}" readonly>
          </div>
          
          <div class="form-group">
            <label>CBS Member 1 Email</label>
            <input type="text" id="cbs_member1_email" value="${formData.cbs_member1_email}" readonly>
          </div>
          
          <div class="form-group">
            <label>CBS Member 2 Email</label>
            <input type="text" id="cbs_member2_email" value="${formData.cbs_member2_email}" readonly>
          </div>
          
          <div class="form-group">
            <label>CBS Member 3 Email</label>
            <input type="text" id="cbs_member3_email" value="${formData.cbs_member3_email}" readonly>
          </div>
          
          <div class="form-group">
            <label>Management Approver Email</label>
            <input type="text" id="management_approver_email" value="${formData.management_approver_list}" readonly>
          </div>
          
          <div class="form-group">
            <label>Status</label>
            <select id="status_id">
              <option value="1">Active</option>
              <option value="2">Inactive</option>
            </select>
          </div>
        </div>
        
        <div class="name-fields" style="display: none;">
          <h5>User Details (Loaded)</h5>
          <div class="form-grid">
            <div class="form-group">
              <label>Reviewer 1 Name</label>
              <input type="text" id="reviewer1_name" readonly>
            </div>
            <div class="form-group">
              <label>Reviewer 2 Name</label>
              <input type="text" id="reviewer2_name" readonly>
            </div>
            <div class="form-group">
              <label>Approver Name</label>
              <input type="text" id="approver_name" readonly>
            </div>
            <div class="form-group">
              <label>Management Approver Name</label>
              <input type="text" id="management_approver_name" readonly>
            </div>
            <div class="form-group">
              <label>CBS Member Names</label>
              <input type="text" id="cbs_member_names" readonly>
            </div>
          </div>
        </div>
        
        <div class="form-actions">
          <button class="btn btn-success" onclick="insertFAPHierarchy()">Insert Hierarchy</button>
          <button class="btn btn-secondary" onclick="closeTab(this)">Cancel</button>
        </div>
        
        <div class="loading-indicator" style="display: none;">
          <div class="spinner"></div>
          <span>Loading...</span>
        </div>
      </div>
    `;
  }

  function initializeFAPHierarchyForm(formData) {
    // Set initial status
    document.getElementById('status_id').value = formData.status_id;
    
    // Store form data globally for later use
    window.fapHierarchyFormData = formData;
  }

  function loadFAPData() {
    const loadingIndicator = document.querySelector('.loading-indicator');
    const nameFields = document.querySelector('.name-fields');
    const loadBtn = document.querySelector('.form-header button');
    
    loadingIndicator.style.display = 'flex';
    loadBtn.disabled = true;
    loadBtn.textContent = 'Loading...';
    
    const emails = [
      document.getElementById('reviewer1_email').value,
      document.getElementById('reviewer2_email').value,
      document.getElementById('approver_email').value,
      document.getElementById('management_approver_email').value,
      document.getElementById('cbs_member1_email').value,
      document.getElementById('cbs_member2_email').value,
      document.getElementById('cbs_member3_email').value
    ].filter(email => email);
    
    // Load user details in parallel
    Promise.all(emails.map(email => getUserDetails(email)))
      .then(results => {
        // Fill name fields
        if (results[0]) document.getElementById('reviewer1_name').value = results[0].name || '';
        if (results[1]) document.getElementById('reviewer2_name').value = results[1].name || '';
        if (results[2]) document.getElementById('approver_name').value = results[2].name || '';
        if (results[3]) document.getElementById('management_approver_name').value = results[3].name || '';
        
        const cbsNames = results.slice(4).map(r => r.name || '').filter(n => n).join(', ');
        document.getElementById('cbs_member_names').value = cbsNames;
        
        nameFields.style.display = 'block';
        loadingIndicator.style.display = 'none';
        loadBtn.disabled = false;
        loadBtn.textContent = 'Load Data';
      })
      .catch(error => {
        console.error('Error loading user data:', error);
        loadingIndicator.style.display = 'none';
        loadBtn.disabled = false;
        loadBtn.textContent = 'Load Data';
        alert('Failed to load user data. Please try again.');
      });
  }

  function getUserDetails(email) {
    return fetch(`${API_BASE}/api/user/${email}`)
      .then(response => response.json())
      .catch(error => {
        console.error(`Error fetching user details for ${email}:`, error);
        return null;
      });
  }

  function insertFAPHierarchy() {
    const formData = {
      plant_code: document.getElementById('plant_code').value,
      department: document.getElementById('department').value,
      initiator_login_name: document.getElementById('initiator_login_name').value,
      reviewer1_list: document.getElementById('reviewer1_email').value,
      reviewer2_list: document.getElementById('reviewer2_email').value,
      approver_list: document.getElementById('approver_email').value,
      cbs_member1_email: document.getElementById('cbs_member1_email').value,
      cbs_member2_email: document.getElementById('cbs_member2_email').value,
      cbs_member3_email: document.getElementById('cbs_member3_email').value,
      management_approver_list: document.getElementById('management_approver_email').value,
      status_id: parseInt(document.getElementById('status_id').value)
    };

    const insertBtn = document.querySelector('.form-actions .btn-success');
    insertBtn.disabled = true;
    insertBtn.textContent = 'Inserting...';

    fetch(`${API_BASE}/api/fap-task-assignee/hierarchy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(formData)
    })
    .then(response => response.json())
    .then(result => {
      if (result.success) {
        alert(`Success: ${result.totalInserted} rows inserted successfully!`);
        closeTab(document.querySelector('.tab-close'));
        // Refresh parent page table if needed
        if (typeof refreshFAPTable === 'function') {
          refreshFAPTable(result.insertedIds);
        }
      } else {
        alert(`Error: ${result.message}`);
      }
    })
    .catch(error => {
      console.error('Error inserting hierarchy:', error);
      alert(`Error: Insert failed. Please try again.`);
    })
    .finally(() => {
      insertBtn.disabled = false;
      insertBtn.textContent = 'Insert Hierarchy';
    });
  }

  function showFAPHierarchyModal(formData) {
    // Fallback modal implementation if tab system doesn't exist
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.style.display = 'flex';
    modal.innerHTML = `
      <div class="modal-content" style="max-width: 800px;">
        <div class="modal-header">
          <h5>FAP Hierarchy Addition</h5>
          <button class="btn btn-outline-secondary btn-sm" onclick="this.closest('.modal-overlay').remove()">×</button>
        </div>
        <div class="modal-body">
          ${createFAPHierarchyFormHTML(formData)}
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    initializeFAPHierarchyForm(formData);
  }
})();

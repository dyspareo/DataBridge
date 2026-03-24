(function () {
  const API_BASE = (location.protocol === 'file:') ? 'http://localhost:8080' : '';
  function qs(key) { return new URLSearchParams(location.search).get(key) || ''; }
  function allParamsLower() {
    const out = {};
    const sp = new URLSearchParams(location.search);
    for (const [k, v] of sp.entries()) out[k.toLowerCase()] = v;
    return out;
  }
  function toSqlDateTime(v) {
    if (!v) return '';
    const s = v.replace('T', ' ');
    return s.length === 16 ? s + ':00' : s;
  }
  function setAlert(msg, type) {
    const box = document.getElementById('alertBox');
    if (!box) return;
    box.classList.remove('d-none');
    box.className = '';
    box.style.padding = '6px 8px';
    box.style.borderRadius = '6px';
    box.style.marginBottom = '10px';
    box.style.fontWeight = '600';
    if (type === 'error') {
      box.style.color = '#b91c1c';
      box.style.background = '#fee2e2';
      box.style.border = '1px solid #fecaca';
    } else {
      box.style.color = '#166534';
      box.style.background = '#dcfce7';
      box.style.border = '1px solid #bbf7d0';
    }
    box.textContent = msg;
  }
  async function postJSON(url, payload) {
    const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    if (!res.ok) throw new Error(await res.text().catch(() => 'Request failed'));
    return res.json();
  }
  document.addEventListener('DOMContentLoaded', () => {
    const code = document.getElementById('code');
    const name = document.getElementById('name');
    const deptShortName = document.getElementById('deptShortName');
    const deptSapValue = document.getElementById('deptSapValue');
    const statusId = document.getElementById('statusId');
    const createdDate = document.getElementById('createdDate');
    const createdBy = document.getElementById('createdBy');
    // Prefill fields as requested
    const pad = (n) => String(n).padStart(2, '0');
    const now = new Date();
    const nowInput = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
    if (createdDate) createdDate.value = nowInput; // show current date-time in input
    if (createdBy) createdBy.value = '2';
    if (statusId) statusId.value = '1';

    const params = allParamsLower();
    const moduleName = (params['module'] || '').toUpperCase();
    try { window.currentModule = moduleName || 'FAT'; } catch (_) {}

    const fatTableWrap = document.querySelector('#insertForm .table-responsive');
    const fabForm = document.getElementById('fabDeptForm');
    const cardTitle = document.querySelector('.card-header h3');
    if (moduleName === 'FAB') {
      if (cardTitle) cardTitle.textContent = 'Insert FAB Department';
      if (fatTableWrap) {
        fatTableWrap.classList.add('d-none');
        fatTableWrap.querySelectorAll('input, select, textarea, button').forEach((el) => {
          el.disabled = true;
          el.removeAttribute('required');
        });
      }
      if (fabForm) fabForm.classList.remove('d-none');
      const nowIso = new Date().toISOString().replace('T', ' ').slice(0, 19);
      const createdDateFab = document.getElementById('created_date');
      const createdByFab = document.getElementById('created_by');
      const statusFab = document.getElementById('status_id');
      const deptNameFab = document.getElementById('department_name');
      const deptCodeFab = document.getElementById('wbs_department_code');
      if (createdDateFab) createdDateFab.value = nowIso;
      if (createdByFab) createdByFab.value = '2';
      if (statusFab) statusFab.value = '1';
      if (deptCodeFab && params['code']) deptCodeFab.value = String(params['code']).trim();
      const incomingFabName =
        params['department_name'] ||
        params['dept_name'] ||
        params['departmentname'] ||
        params['deptname'] ||
        '';
      if (deptNameFab && incomingFabName) deptNameFab.value = incomingFabName.trim();
    }

    let codeVal = params['code'] || '';
    if (moduleName !== 'FAB' && codeVal && !codeVal.toUpperCase().startsWith('D')) codeVal = 'D' + codeVal;
    code.value = codeVal;
    // Prefill department name from file-provided params (case-insensitive). Do not fallback to code.
    const incomingDeptName =
      params['deptname'] ||
      params['departmentname'] ||
      params['dept_name'] ||
      params['department_name'] ||
      params['name'] || '';
    if (name && !name.value && incomingDeptName) name.value = incomingDeptName.trim();

    document.getElementById('btnCancel').addEventListener('click', () => {
      history.length > 1 ? history.back() : (location.href = 'index.html');
    });
    document.getElementById('btnBackHome').addEventListener('click', () => {
      try {
        if (window.parent && window.parent !== window) {
          window.parent.postMessage({ type: 'close-insert' }, '*');
        } else {
          location.href = 'index.html';
        }
      } catch (_) {
        location.href = 'index.html';
      }
    });

    document.getElementById('insertForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      if (moduleName === 'FAB') {
        const payload = {
          department_name: (document.getElementById('department_name')?.value || '').trim(),
          wbs_department_code: (document.getElementById('wbs_department_code')?.value || '').trim(),
          status_id: parseInt((document.getElementById('status_id')?.value || '1').trim(), 10) || 1
        };
        if (!payload.department_name || !payload.wbs_department_code) {
          return setAlert('Department Name and WBS Department Code are required.', 'error');
        }
        try {
          let out;
          try {
            out = await postJSON(`${API_BASE}/api/fab/department/insert`, payload);
          } catch (primaryErr) {
            const errMsg = String(primaryErr && primaryErr.message || '');
            if (errMsg.includes('404') || errMsg.includes('405')) {
              // Backward-compatible fallback for older FAB endpoint shape.
              const fallbackPayload = {
                deptCode: payload.wbs_department_code,
                deptName: payload.department_name,
                statusId: payload.status_id
              };
              out = await postJSON(`${API_BASE}/api/fab/department`, fallbackPayload);
            } else {
              throw primaryErr;
            }
          }
          setAlert(out.message || 'Department inserted successfully!', 'success');
          if (out) {
            try { window.parent && window.parent.postMessage({ type: 'insert-success', entity: 'department', code: payload.wbs_department_code }, '*'); } catch (_) {}
          }
        } catch (err) {
          let msg = err.message || 'Department insert failed.';
          try {
            const parsed = JSON.parse(msg);
            if (parsed && parsed.message) msg = parsed.message;
          } catch (_) {}
          setAlert(msg, 'error');
        }
        return;
      }
      const payload = {
        deptCode: (code.value || '').trim(),
        deptName: (name.value || '').trim(),
        deptShortName: (deptShortName.value || '').trim(),
        deptSapValue: (deptSapValue.value || '').trim(),
        statusId: 1,
        createdDate: toSqlDateTime((createdDate.value || nowInput).trim()),
        createdBy: 2
      };
      if (!payload.deptCode || !payload.deptName) return setAlert('departmentCode and departmentName are required.', 'error');
      try {
        const out = await postJSON(`${API_BASE}/api/department`, payload);
        setAlert(out.message || (out.success ? 'Department inserted' : 'Insert failed'), out.success ? 'success' : 'error');
        if (out && out.success) {
          // Notify parent (modal opener) to close
          try { window.parent && window.parent.postMessage({ type: 'insert-success', entity: 'department', code: payload.deptCode }, '*'); } catch (_) {}
        }
      } catch (err) {
        setAlert(err.message || 'Insert failed', 'error');
      }
    });
  });
})();

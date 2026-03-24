(function () {
  const API_BASE = (location.protocol === 'file:') ? 'http://localhost:8080' : '';
  function qs(key) { return new URLSearchParams(location.search).get(key) || ''; }
  function toSqlDateTime(v) {
    if (!v) return '';
    // v from datetime-local is like 'YYYY-MM-DDTHH:mm' or 'YYYY-MM-DDTHH:mm:ss'
    const s = v.replace('T', ' ');
    return s.length === 16 ? s + ':00' : s; // add seconds if missing
  }
  function setAlert(msg, type) {
    const box = document.getElementById('alertBox');
    if (!box) return;
    box.classList.remove('d-none');
    box.className = `alert ${type === 'error' ? 'alert-danger' : 'alert-success'}`;
    box.innerText = msg;
  }
  async function postJSON(url, payload) {
    const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    if (!res.ok) throw new Error(await res.text().catch(() => 'Request failed'));
    return res.json();
  }
  document.addEventListener('DOMContentLoaded', () => {
    const code = document.getElementById('code');
    const purchaseOrg = document.getElementById('purchaseOrg');
    const companyCodeId = document.getElementById('companyCodeId');
    const companyCode = document.getElementById('companyCode');
    const plantCode = document.getElementById('plantCode');
    const plantName = document.getElementById('plantName');
    const plantShortName = document.getElementById('plantShortName');
    const branchCode = document.getElementById('branchCode');
    const sapValue = document.getElementById('sapValue');
    const statusId = document.getElementById('statusId');
    const createdBy = document.getElementById('createdBy');
    const createdDate = document.getElementById('createdDate');
    // Prefill fields as requested
    const pad = (n) => String(n).padStart(2, '0');
    const now = new Date();
    const nowInput = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
    if (createdDate) createdDate.value = nowInput;
    if (createdBy) createdBy.value = '2';
    if (statusId) statusId.value = '1';

    plantCode.value = qs('code') || '';
    if (code && !code.value && plantCode.value) {
      code.value = plantCode.value;
    }
    // Prefill plant name from file-provided params (plantName/name). Do not fallback to code.
    const incomingPlantName = qs('plantName') || qs('name') || '';
    if (plantName && !plantName.value && incomingPlantName) plantName.value = incomingPlantName;

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
      const payload = {
        code: (code.value || plantCode.value || '').trim(),
        purchaseOrg: (purchaseOrg.value || '').trim(),
        companyCodeId: (companyCodeId.value || '').trim(),
        companyCode: (companyCode.value || '').trim(),
        plantCode: (plantCode.value || '').trim(),
        plantName: (plantName.value || '').trim(),
        plantShortName: (plantShortName.value || '').trim(),
        branchCode: (branchCode.value || '').trim(),
        sapValue: (sapValue.value || '').trim(),
        statusId: 1,
        createdBy: 2,
        createdDate: toSqlDateTime((createdDate.value || nowInput).trim())
      };

      if (!payload.plantCode || !payload.plantName) return setAlert('plantCode and plantName are required.', 'error');
      try {
        const out = await postJSON(`${API_BASE}/api/plant`, payload);
        setAlert(out.message || (out.success ? 'Plant inserted' : 'Insert failed'), out.success ? 'success' : 'error');
        if (out && out.success) {
          // Notify parent (modal opener) to close
          try { window.parent && window.parent.postMessage({ type: 'insert-success', entity: 'plant', code: payload.plantCode }, '*'); } catch (_) {}
        }
      } catch (err) {
        setAlert(err.message || 'Insert failed', 'error');
      }
    });
  });
})();

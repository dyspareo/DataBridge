(function () {
  'use strict';

  const API_BASE = (location.protocol === 'file:') ? 'http://localhost:8080' : '';

  const $ = (id) => document.getElementById(id);
  const msg = $('msg');

  function setMsg(text, type = 'info') {
    if (!msg) return;
    msg.textContent = text || '';
    msg.style.color = type === 'error' ? '#b91c1c' : (type === 'success' ? '#065f46' : '#64748b');
  }

  function qp(name) {
    return new URLSearchParams(window.location.search).get(name) || '';
  }

  async function fetchJson(url, options) {
    const res = await fetch(url, options);
    const json = await res.json().catch(() => null);
    if (!res.ok) {
      const m = json && (json.message || json.error);
      throw new Error(m ? String(m) : `HTTP ${res.status}`);
    }
    return json;
  }

  function initialFill() {
    $('plant_code').value = qp('plant_code');
    $('dept_code').value = qp('dept_code');
    $('lcm_user').value = qp('lcm_user');
    $('cbs_user1').value = qp('cbs_user1');
    $('cbs_user2').value = qp('cbs_user2');
    $('status_id').value = qp('status_id') || '1';
  }

  async function loadData() {
    const plantCode = $('plant_code').value;
    const deptCode = $('dept_code').value;
    if (!plantCode || !deptCode) {
      setMsg('Missing plant_code/dept_code.', 'error');
      return;
    }
    setMsg('Loading plant/dept names...');
    const json = await fetchJson(`${API_BASE}/api/fac/master/names?plantCode=${encodeURIComponent(plantCode)}&deptCode=${encodeURIComponent(deptCode)}`);
    if (json && typeof json.plantName === 'string') $('plant_name').value = json.plantName;
    if (json && typeof json.deptName === 'string') $('dept_name').value = json.deptName;
    $('status_id').value = '1';
    setMsg('Loaded names successfully.', 'success');
  }

  async function insert(e) {
    e.preventDefault();
    const payload = {
      plant_code: $('plant_code').value,
      plant_name: $('plant_name').value,
      dept_code: $('dept_code').value,
      dept_name: $('dept_name').value,
      lcm_user: $('lcm_user').value,
      cbs_user1: $('cbs_user1').value,
      cbs_user2: $('cbs_user2').value,
      status_id: parseInt($('status_id').value || '1', 10)
    };

    setMsg('Inserting FAC hierarchy...');
    const result = await fetchJson(`${API_BASE}/api/fac/hierarchy`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    setMsg(result && result.message ? String(result.message) : 'Inserted successfully.', 'success');
    try {
      window.parent && window.parent.postMessage({ type: 'insert-success' }, '*');
    } catch (_) {}
  }

  function close() {
    try {
      window.parent && window.parent.postMessage({ type: 'close-insert' }, '*');
    } catch (_) {}
    try { window.close(); } catch (_) {}
  }

  document.addEventListener('DOMContentLoaded', () => {
    initialFill();
    $('loadBtn')?.addEventListener('click', () => loadData().catch(err => setMsg(err.message || 'Load failed', 'error')));
    $('facForm')?.addEventListener('submit', (e) => insert(e).catch(err => setMsg(err.message || 'Insert failed', 'error')));
    $('closeBtn')?.addEventListener('click', close);
  });
})();


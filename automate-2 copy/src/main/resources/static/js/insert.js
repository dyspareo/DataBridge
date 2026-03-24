(function () {
  const API_BASE = (location.protocol === 'file:') ? 'http://localhost:8080' : '';

  function qs(key) {
    return new URLSearchParams(location.search).get(key) || '';
  }

  function setAlert(msg, type) {
    const box = document.getElementById('alertBox');
    if (!box) return;
    box.classList.remove('d-none');
    box.className = `alert ${type === 'error' ? 'alert-danger' : 'alert-success'}`;
    box.innerText = msg;
  }

  async function postJSON(url, payload) {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      throw new Error(await res.text().catch(() => 'Request failed'));
    }
    return res.json();
  }

  document.addEventListener('DOMContentLoaded', () => {
    const type = (qs('type') || '').toLowerCase();
    let code = qs('code') || '';

    const fieldType = document.getElementById('fieldType');
    const codeInput = document.getElementById('code');
    const nameInput = document.getElementById('name');
    const formTitle = document.getElementById('formTitle');

    fieldType.textContent = type === 'plant' ? 'Plant' : 'Department';
    formTitle.textContent = `Insert ${type === 'plant' ? 'Plant' : 'Department'}`;
    codeInput.value = code;

    document.getElementById('btnCancel').addEventListener('click', () => {
      history.length > 1 ? history.back() : (location.href = 'index.html');
    });

    const backHome = document.getElementById('btnBackHome');
    if (backHome) {
      backHome.addEventListener('click', () => {
        location.href = 'index.html';
      });
    }

    document.getElementById('insertForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = (nameInput.value || '').trim();
      if (!code || !name) return setAlert('All fields are required.', 'error');

      try {
        if (type === 'plant') {
          const out = await postJSON(`${API_BASE}/api/plant`, { plantCode: code, plantName: name });
          setAlert(out.message || (out.success ? 'Plant inserted' : 'Insert failed'), out.success ? 'success' : 'error');
        } else {
          const out = await postJSON(`${API_BASE}/api/department`, { departmentCode: code, departmentName: name });
          setAlert(out.message || (out.success ? 'Department inserted' : 'Insert failed'), out.success ? 'success' : 'error');
        }
      } catch (err) {
        setAlert(err.message || 'Insert failed', 'error');
      }
    });
  });
})();

(function(){
  const API_BASE = (location.protocol === 'file:') ? 'http://localhost:8080' : '';
  const qs = new URLSearchParams(location.search);
  const alertBox = document.getElementById('alert');

  function setAlert(msg, ok){
    if(!alertBox) return;
    alertBox.className = 'alert ' + (ok ? 'alert-success' : 'alert-error');
    alertBox.textContent = msg;
    alertBox.style.display = 'block';
  }

  document.addEventListener('DOMContentLoaded', () => {
    const departmentCode = document.getElementById('departmentCode');
    const userEmail = document.getElementById('userEmail');
    const backButton = document.getElementById('btnBack');
    if (departmentCode) departmentCode.value = qs.get('departmentCode') || '';
    if (userEmail) userEmail.value = qs.get('userEmail') || '';

    if (backButton) {
      backButton.addEventListener('click', () => {
        try {
          if (window.history.length > 1) {
            window.history.back();
            return;
          }
        } catch (_) {}
        window.close();
      });
    }

    document.getElementById('btnInsert').addEventListener('click', async () => {
      const payload = {
        departmentCode: (departmentCode.value || '').trim(),
        userEmail: (userEmail.value || '').trim()
      };
      if (!payload.departmentCode || !payload.userEmail) {
        setAlert('Department and user email are required', false);
        return;
      }
      try{
        const res = await fetch(`${API_BASE}/api/department/mapping/insert`, {
          method:'POST',
          headers:{'Content-Type':'application/json'},
          body: JSON.stringify(payload)
        });
        const j = await res.json().catch(()=>({}));
        if (res.ok && j && j.success) {
          setAlert('Inserted mapping successfully.', true);
        } else {
          setAlert(j && j.error ? j.error : 'Insert failed', false);
        }
      }catch(err){
        setAlert('Insert failed', false);
      }
    });
  });
})();

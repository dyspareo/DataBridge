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
    const plantCode = document.getElementById('plantCode');
    const departmentCode = document.getElementById('departmentCode');
    const backButton = document.getElementById('btnBack');
    if (plantCode) plantCode.value = qs.get('plantCode') || '';
    if (departmentCode) departmentCode.value = qs.get('departmentCode') || '';

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
        plantCode: (plantCode.value || '').trim(),
        departmentCode: (departmentCode.value || '').trim()
      };
      if (!payload.plantCode || !payload.departmentCode) {
        setAlert('Plant code and department code are required', false);
        return;
      }
      try{
        const res = await fetch(`${API_BASE}/api/plant-department/mapping/insert`, {
          method:'POST',
          headers:{'Content-Type':'application/json'},
          body: JSON.stringify(payload)
        });
        const j = await res.json().catch(()=>({}));
        if (res.ok && j && j.success) {
          setAlert('Inserted mapping successfully.', true);
        } else {
          setAlert(j && (j.message || j.error) ? (j.message || j.error) : 'Insert failed', false);
        }
      }catch(err){
        setAlert('Insert failed', false);
      }
    });
  });
})();

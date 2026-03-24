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
    const userLoginName = document.getElementById('userLoginName');
    if (plantCode) plantCode.value = qs.get('plantCode') || '';
    if (userLoginName) userLoginName.value = qs.get('userLoginName') || '';

    document.getElementById('btnInsert').addEventListener('click', async () => {
      const payload = {
        plantCode: (plantCode.value || '').trim(),
        userLoginName: (userLoginName.value || '').trim()
      };
      if (!payload.plantCode || !payload.userLoginName) { setAlert('Plant code and user login are required', false); return; }
      try{
        const res = await fetch(`${API_BASE}/api/plant/mapping/insert`, {
          method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload)
        });
        const j = await res.json().catch(()=>({}));
        if (res.ok && j && j.success) {
          setAlert(`Inserted mapping successfully. New ID: ${j.id}`, true);
        } else {
          setAlert(j && j.error ? j.error : 'Insert failed', false);
        }
      }catch(err){ setAlert('Insert failed', false); }
    });
  });
})();

(function(){
  const API_BASE = (location.protocol === 'file:') ? 'http://localhost:8080' : '';
  const qs = (k) => new URLSearchParams(location.search).get(k) || '';
  const alertBox = document.getElementById('alert');
  function setAlert(msg, ok){
    if(!alertBox) return;
    alertBox.className = 'alert ' + (ok ? 'alert-success' : 'alert-error');
    alertBox.textContent = msg;
    alertBox.style.display = 'block';
  }
  function pad(n){ return String(n).padStart(2,'0'); }
  function nowStr(){ const d=new Date(); return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`; }

  document.addEventListener('DOMContentLoaded', async () => {
    const ormInstanceId = document.getElementById('ormInstanceId');
    const userId = document.getElementById('userId');
    const userType = document.getElementById('userType');
    const createdDate = document.getElementById('createdDate');
    if (createdDate) createdDate.value = nowStr();

    // Prefill userId from query param
    const u = qs('userId');
    if (u && userId) userId.value = u;

    // Populate user_type (roles dropdown)
    try {
      const res = await fetch(`${API_BASE}/api/member/roles`);
      if (res.ok) {
        const json = await res.json();
        const rows = (json && json.results) || [];
        userType.innerHTML = rows.map(r => `<option value="${r.id}">${r.key}</option>`).join('');
      }
    } catch (_) { /* non-fatal */ }

    document.getElementById('btnInsert').addEventListener('click', async () => {
      const payload = {
        ormInstanceId: parseInt(ormInstanceId.value,10),
        userId: parseInt(userId.value,10),
        userType: parseInt(userType.value,10)
      };
      if(!payload.userId || !payload.ormInstanceId || !payload.userType){
        setAlert('All fields are required', false); return;
      }
      try{
        const res = await fetch(`${API_BASE}/api/member/insert`, {
          method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload)
        });
        const j = await res.json();
        if (res.ok && j && j.success){
          setAlert(`Inserted successfully. New ID: ${j.id}`, true);
        } else {
          setAlert(j && j.error ? j.error : 'Insert failed', false);
        }
      }catch(err){ setAlert('Insert failed', false); }
    });
  });
})();

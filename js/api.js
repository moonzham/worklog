const CLIENT_ID='603081180385-5dmfebn8mm239lod4solqkig2molj886.apps.googleusercontent.com';
const SCOPES='https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.file';
const SHEET_ID='11EkPFAcWP57VLHIbDuu4e7ntKpv8JxoUUuhJppeA5io';
const API_BASE=`https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}`;
let accessToken='';
let tokenClient=null;

async function sheetsGet(range){
  const res=await fetch(`${API_BASE}/values/${encodeURIComponent(range)}`,{
    headers:{Authorization:`Bearer ${accessToken}`}
  });
  if(!res.ok)throw new Error(await res.text());
  return res.json();
}
async function sheetsAppend(range,values){
  const res=await fetch(`${API_BASE}/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,{
    method:'POST',
    headers:{Authorization:`Bearer ${accessToken}`,'Content-Type':'application/json'},
    body:JSON.stringify({values})
  });
  if(!res.ok)throw new Error(await res.text());
  return res.json();
}
async function sheetsUpdate(range,values){
  const res=await fetch(`${API_BASE}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`,{
    method:'PUT',
    headers:{Authorization:`Bearer ${accessToken}`,'Content-Type':'application/json'},
    body:JSON.stringify({values})
  });
  if(!res.ok)throw new Error(await res.text());
  return res.json();
}
async function sheetsBatchUpdate(data){
  const res=await fetch(`${API_BASE}/values:batchUpdate`,{
    method:'POST',
    headers:{Authorization:`Bearer ${accessToken}`,'Content-Type':'application/json'},
    body:JSON.stringify({valueInputOption:'USER_ENTERED',data})
  });
  if(!res.ok)throw new Error(await res.text());
  return res.json();
}

/* ── 날짜/시간 유틸 ── */
function nowStr(){return new Date().toISOString().replace('T',' ').slice(0,19);}
function todayStr(){return new Date().toISOString().slice(0,10);}
function yearWeek(){
  const d=new Date();
  const jan1=new Date(d.getFullYear(),0,1);
  const week=Math.ceil(((d-jan1)/86400000+jan1.getDay()+1)/7);
  return `${d.getFullYear()}-W${String(week).padStart(2,'0')}`;
}
function yearMon(){
  const d=new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
}
function dateOffset(n){
  const d=new Date();d.setDate(d.getDate()-n);
  return d.toISOString().slice(0,10);
}

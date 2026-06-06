/* ═══════════════════════════════════════════════════════════════
   외부 API 설정
   ───────────────────────────────────────────────────────────────
   1. Google OAuth 2.0 (Google Identity Services)
      - 용도: 구글 계정 로그인 및 accessToken 발급
      - 라이브러리: https://accounts.google.com/gsi/client (index.html에서 로드)
      - 콘솔: https://console.cloud.google.com → API 및 서비스 → 사용자 인증 정보
      - CLIENT_ID: OAuth 2.0 클라이언트 ID
      - SCOPES: 요청할 권한 범위 (Sheets 읽기/쓰기 + Drive 파일)

   2. Google Sheets API v4
      - 용도: ISSUE / DAILY / WEEKLY / MONTHLY / COMMON_CODE 데이터 CRUD
      - 엔드포인트: https://sheets.googleapis.com/v4/spreadsheets/{SHEET_ID}
      - 인증: OAuth accessToken을 Authorization 헤더에 Bearer로 전달
      - 콘솔: https://console.cloud.google.com → API 및 서비스 → Google Sheets API 활성화
      - SHEET_ID: 연결된 Google Sheets 문서 ID (URL에서 확인 가능)

   3. Gemini AI (Google Apps Script 프록시 경유)
      - 용도: 주간/월간 보고서 AI 자동 생성
      - 직접 호출 불가 (CORS 문제) → Google Apps Script를 프록시로 사용
      - AI_PROXY_URL: Apps Script 배포 URL (웹 앱으로 배포된 프록시)
      - Apps Script 내부에서 Gemini Flash API 호출 후 결과 반환
      - Apps Script 콘솔: https://script.google.com
   ═══════════════════════════════════════════════════════════════ */

/* ── 1. Google OAuth 2.0 설정 ── */
const CLIENT_ID='603081180385-5dmfebn8mm239lod4solqkig2molj886.apps.googleusercontent.com';
const SCOPES='https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.file';

/* ── 2. Google Sheets API v4 설정 ── */
const SHEET_ID='11EkPFAcWP57VLHIbDuu4e7ntKpv8JxoUUuhJppeA5io';
const API_BASE=`https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}`;
let accessToken='';
let tokenClient=null;

/* 토큰 만료 5분 전이면 조용히 재발급 (팝업 없음)
 * GIS에서 이미 동의한 계정이면 prompt:'' 로 자동 재발급 가능 */
function ensureFreshToken(){
  return new Promise((resolve,reject)=>{
    const expiry=parseInt(localStorage.getItem('wl_token_expiry')||'0');
    /* 만료까지 5분 이상 남았으면 그냥 통과 */
    if(accessToken&&Date.now()<expiry-300000){resolve();return;}
    if(!tokenClient){reject(new Error('tokenClient 미초기화'));return;}
    /* 기존 callback 백업 후 일회성 재발급 callback 설정 */
    tokenClient.callback=(tokenResponse)=>{
      if(tokenResponse.error){reject(new Error(tokenResponse.error));return;}
      accessToken=tokenResponse.access_token;
      const newExpiry=Date.now()+(tokenResponse.expires_in||3600)*1000-60000;
      localStorage.setItem('wl_token',accessToken);
      localStorage.setItem('wl_token_expiry',newExpiry);
      resolve();
    };
    tokenClient.requestAccessToken({prompt:''});
  });
}

async function sheetsGet(range){
  await ensureFreshToken();
  const res=await fetch(`${API_BASE}/values/${encodeURIComponent(range)}`,{
    headers:{Authorization:`Bearer ${accessToken}`}
  });
  if(!res.ok)throw new Error(await res.text());
  return res.json();
}
async function sheetsAppend(range,values){
  await ensureFreshToken();
  const res=await fetch(`${API_BASE}/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,{
    method:'POST',
    headers:{Authorization:`Bearer ${accessToken}`,'Content-Type':'application/json'},
    body:JSON.stringify({values})
  });
  if(!res.ok)throw new Error(await res.text());
  return res.json();
}
async function sheetsUpdate(range,values){
  await ensureFreshToken();
  const res=await fetch(`${API_BASE}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`,{
    method:'PUT',
    headers:{Authorization:`Bearer ${accessToken}`,'Content-Type':'application/json'},
    body:JSON.stringify({values})
  });
  if(!res.ok)throw new Error(await res.text());
  return res.json();
}
async function sheetsBatchUpdate(data){
  await ensureFreshToken();
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

/* ── 3. Gemini AI 프록시 설정 (Google Apps Script 경유) ── */
const AI_PROXY_URL = 'https://script.google.com/macros/s/AKfycbzqC0ln6Ja1t4QX24NiXuj5KFgN0cbMk64mm4XRLHbT11doTcgjs6h7IDB5TNDIzSRa/exec';

/* Gemini AI 호출 함수
 * - prompt: 보고서 생성용 프롬프트 문자열
 * - Apps Script 프록시로 POST 요청 → Gemini Flash API 호출 → 결과 반환
 * - 응답: { ok: boolean, text: string, error?: string } */
async function callGemini(prompt) {
  const res = await fetch(AI_PROXY_URL, {
    method: 'POST',
    body: JSON.stringify({ prompt })
  });

  const data = await res.json();

  if (!data.ok) {
    throw new Error(data.error || 'AI 호출 실패');
  }

  return data.text || '';
}
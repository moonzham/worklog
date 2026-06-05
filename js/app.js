/* ── COMMON CODE CRUD ── */
async function commonCodeLoad(){
  try{
    const data=await sheetsGet('COMMON_CODE!A2:G');
    const rows=(data.values||[]).filter(r=>r[4]!=='N');
    CODES.PROJECT=rows
      .filter(r=>r[0]==='PROJECT')
      .sort((a,b)=>parseInt(a[3]||99)-parseInt(b[3]||99))
      .map(r=>({code:r[1]||'',name:r[2]||''}));
  }catch(e){console.error('commonCodeLoad',e);}
}

/* ── DAILY CRUD ── */
async function dailyLoad(){
  try{
    const data=await sheetsGet('DAILY!A2:E');
    return (data.values||[]).filter(r=>r[2]!=='N').map(r=>({
      date:r[0]||'',content:r[1]||'',useYn:r[2]||'Y',createdAt:r[3]||'',updatedAt:r[4]||''
    }));
  }catch(e){console.error('dailyLoad',e);return[];}
}
async function dailySave(date,content){
  const rows=await sheetsGet('DAILY!A2:E');
  const vals=rows.values||[];
  const idx=vals.findIndex(r=>r[0]===date);
  const now=nowStr();
  if(idx>=0){
    await sheetsUpdate(`DAILY!A${idx+2}:E${idx+2}`,[[date,content,'Y',vals[idx][3]||now,now]]);
  } else {
    await sheetsAppend('DAILY!A:E',[[date,content,'Y',now,now]]);
  }
}

/* ── ISSUE CRUD ── */
async function issueLoad(){
  try{
    const data=await sheetsGet('ISSUE!A2:P');
    return (data.values||[]).filter(r=>r[13]!=='N').map(r=>({
      seq:r[0]||'',id:r[1]||'',project:r[2]||'',title:r[3]||'',priority:r[4]||'mid',
      status:r[5]||'진행예정',link:r[6]||'',issueRegDate:r[7]||'',
      targetDate:r[8]||'',devStart:r[9]||'',devEnd:r[10]||'',
      prodDate:r[11]||'',progressNote:r[12]||'',useYn:r[13]||'Y',
      createdAt:r[14]||'',updatedAt:r[15]||''
    }));
  }catch(e){console.error('issueLoad',e);return[];}
}
async function genIssueSeq(){
  /* 기존 마지막 ISSUE_SEQ 읽어서 +1 채번 */
  try{
    const data=await sheetsGet('ISSUE!A2:A');
    const vals=(data.values||[]).map(r=>r[0]||'').filter(v=>v.startsWith('WL-'));
    if(!vals.length)return'WL-000001';
    const nums=vals.map(v=>parseInt(v.replace('WL-',''),10)).filter(n=>!isNaN(n));
    const next=Math.max(...nums)+1;
    return'WL-'+String(next).padStart(6,'0');
  }catch(e){return'WL-000001';}
}
async function issueSave(iss,isNew){
  const now=nowStr();
  if(isNew){
    const seq=await genIssueSeq();
    await sheetsAppend('ISSUE!A:P',[[
      seq,iss.id,iss.project,iss.title,iss.priority,iss.status,iss.link,
      iss.issueRegDate,iss.targetDate,iss.devStart,iss.devEnd,iss.prodDate,
      iss.progressNote,'Y',now,now
    ]]);
  } else {
    const rows=await sheetsGet('ISSUE!A2:P');
    const vals=rows.values||[];
    const idx=vals.findIndex(r=>r[0]===iss.seq);
    if(idx>=0){
      await sheetsUpdate(`ISSUE!A${idx+2}:P${idx+2}`,[[
        iss.seq,iss.id,iss.project,iss.title,iss.priority,iss.status,iss.link,
        iss.issueRegDate,iss.targetDate,iss.devStart,iss.devEnd,iss.prodDate,
        iss.progressNote,'Y',vals[idx][14]||now,now
      ]]);
    }
  }
}
async function issueDelete(seq){
  const rows=await sheetsGet('ISSUE!A2:P');
  const vals=rows.values||[];
  const idx=vals.findIndex(r=>r[0]===seq);
  if(idx>=0){
    const now=nowStr();
    await sheetsUpdate(`ISSUE!N${idx+2}:P${idx+2}`,[['N',vals[idx][14]||now,now]]);
  }
}

/* ── WEEKLY CRUD ── */
async function weeklySave(yearWeekKey,content){
  const rows=await sheetsGet('WEEKLY!A2:E');
  const vals=rows.values||[];
  const idx=vals.findIndex(r=>r[0]===yearWeekKey);
  const now=nowStr();
  if(idx>=0){
    await sheetsUpdate(`WEEKLY!A${idx+2}:E${idx+2}`,[[yearWeekKey,content,'Y',vals[idx][3]||now,now]]);
  } else {
    await sheetsAppend('WEEKLY!A:E',[[yearWeekKey,content,'Y',now,now]]);
  }
}
async function weeklyLoad(yearWeekKey){
  try{
    const data=await sheetsGet('WEEKLY!A2:E');
    const row=(data.values||[]).find(r=>r[0]===yearWeekKey&&r[2]!=='N');
    return row?row[1]:'';
  }catch(e){return'';}
}

/* ── MONTHLY CRUD ── */
async function monthlySave(yearMonKey,content){
  const rows=await sheetsGet('MONTHLY!A2:E');
  const vals=rows.values||[];
  const idx=vals.findIndex(r=>r[0]===yearMonKey);
  const now=nowStr();
  if(idx>=0){
    await sheetsUpdate(`MONTHLY!A${idx+2}:E${idx+2}`,[[yearMonKey,content,'Y',vals[idx][3]||now,now]]);
  } else {
    await sheetsAppend('MONTHLY!A:E',[[yearMonKey,content,'Y',now,now]]);
  }
}
async function monthlyLoad(yearMonKey){
  try{
    const data=await sheetsGet('MONTHLY!A2:E');
    const row=(data.values||[]).find(r=>r[0]===yearMonKey&&r[2]!=='N');
    return row?row[1]:'';
  }catch(e){return'';}
}

const P_COLOR={high:'#C94040',mid:'#D06A10',low:'#1F7A52'};
const STATUS_STYLE={
  '진행중':{bg:'#1F7A52',color:'#fff'},
  '진행예정':{bg:'#D06A10',color:'#fff'},
  '테스트':{bg:'#5E52B8',color:'#fff'},
  '완료':{bg:'#888780',color:'#fff'},
  '보류':{bg:'#C8C5BE',color:'#5F5E5A'}
};
const P_LABEL={high:'높음',mid:'중간',low:'낮음'};
const HOLIDAYS={6:{6:'현충일'}};
const DOW=['일','월','화','수','목','금','토'];

let ISSUES=[];
const JOURNALS={};
let CODES={PROJECT:[]};  /* 공통코드 캐시 */

let curYear=new Date().getFullYear(),curMonth=new Date().getMonth()+1,selDate=null,prevTab='calendar',bottomMode='none';
let jdOriginal='',jdDirty=false,curSelDateKey='';

/* ── 업무일지 페이지네이션 상태 ── */
let jlistAllDates=[];  /* 전체 날짜 풀 (ASC) */
let jlistFrom=0;       /* 현재 보이는 구간 시작 인덱스 */
let jlistTo=0;         /* 현재 보이는 구간 끝 인덱스 (exclusive) */
const JLIST_PAGE=7;

function chipColor(iss){return P_COLOR[iss.priority]||P_COLOR.mid;}

/* 날짜 기준 이슈 조회 */
function issuesForDate(d){
  const dateStr=`${curYear}-${String(curMonth).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
  return ISSUES.filter(i=>{
    if(!i.devStart||i.useYn==='N')return false;
    const endDate=i.prodDate||i.targetDate;
    if(!endDate)return false;
    return i.devStart<=dateStr&&endDate>=dateStr;
  });
}

/* 날짜 기준 이슈 조회 (문자열 날짜 직접) */
function issuesForDateStr(dt){
  return ISSUES.filter(i=>{
    if(!i.devStart||i.useYn==='N')return false;
    const endDate=i.prodDate||i.targetDate;
    if(!endDate)return false;
    return i.devStart<=dt&&endDate>=dt;
  });
}

const CLIENT_ID='603081180385-5dmfebn8mm239lod4solqkig2molj886.apps.googleusercontent.com';
const SCOPES='https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.file';
const SHEET_ID='11EkPFAcWP57VLHIbDuu4e7ntKpv8JxoUUuhJppeA5io';
const API_BASE=`https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}`;
let accessToken='';
let tokenClient=null;

/* ── Sheets API ── */
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
/* 날짜 오프셋 유틸: 오늘 기준 n일 전 문자열 */
function dateOffset(n){
  const d=new Date();d.setDate(d.getDate()-n);
  return d.toISOString().slice(0,10);
}

function initTokenClient(){
  if(tokenClient)return;
  tokenClient=google.accounts.oauth2.initTokenClient({
    client_id:CLIENT_ID,
    scope:SCOPES,
    callback:(tokenResponse)=>{
      if(tokenResponse.error)return;
      accessToken=tokenResponse.access_token;
      const expiry=Date.now()+(tokenResponse.expires_in||3600)*1000-60000;
      localStorage.setItem('wl_token',accessToken);
      localStorage.setItem('wl_token_expiry',expiry);
      startApp();
    }
  });
}
function doGoogleLogin(){
  initTokenClient();
  tokenClient.requestAccessToken({prompt:'select_account'});
}

window.addEventListener('load',()=>{
  const token=localStorage.getItem('wl_token');
  const expiry=parseInt(localStorage.getItem('wl_token_expiry')||'0');
  if(token&&Date.now()<expiry){
    accessToken=token;
    startApp();
  }
});

async function startApp(){
  document.getElementById('view-login').style.display='none';
  document.getElementById('main-app').style.display='flex';
  history.replaceState({tab:'calendar'},'','#calendar');
  ISSUES=[];
  Object.keys(JOURNALS).forEach(k=>delete JOURNALS[k]);
  try{
    const [issues,dailies]=await Promise.all([issueLoad(),dailyLoad(),commonCodeLoad()]);
    ISSUES=issues;
    dailies.forEach(d=>{JOURNALS[d.date]=d.content;});
  }catch(e){console.error('데이터 로드 실패',e);}
  renderProjectSelect();
  const today=new Date();
  curYear=today.getFullYear();
  curMonth=today.getMonth()+1;
  document.getElementById('month-label').textContent=`${curYear}년 ${curMonth}월`;
  renderCalendar();renderJournalList();renderTaskList();renderGantt();
  selectDate(today.getDate());
}

function doLogout(){
  if(accessToken){google.accounts.oauth2.revoke(accessToken,()=>{});accessToken='';}
  localStorage.removeItem('wl_token');localStorage.removeItem('wl_token_expiry');
  document.getElementById('view-login').style.display='flex';
  document.getElementById('main-app').style.display='none';
}

function switchTab(t,skipHistory){
  ['calendar','journal','jdetail','tasks','detail','gantt','search'].forEach(v=>{
    const el=document.getElementById('view-'+v);
    if(el){el.style.display='none';el.classList.remove('active');}
  });
  const el=document.getElementById('view-'+t);
  if(el){el.style.display='flex';el.classList.add('active');}
  document.querySelectorAll('.tab-btn').forEach((b,i)=>{
    b.classList.toggle('active',['calendar','journal','tasks','gantt'][i]===t);
  });
  if(!['detail','jdetail','search'].includes(t))prevTab=t;
  if(t!=='search'){
    document.getElementById('nav-search-input').value='';
    document.getElementById('search-bar-input').value='';
    document.getElementById('search-keyword').style.display='none';
    document.getElementById('search-results').innerHTML='';
  }
  if(!skipHistory)history.pushState({tab:t},'',`#${t}`);
  if(!['detail','jdetail','search'].includes(t))reloadTab(t);
}

async function reloadTab(t){
  if(!accessToken)return;
  try{
    if(t==='calendar'){
      const [issues,dailies]=await Promise.all([issueLoad(),dailyLoad()]);
      ISSUES=issues;
      Object.keys(JOURNALS).forEach(k=>delete JOURNALS[k]);
      dailies.forEach(d=>{JOURNALS[d.date]=d.content;});
      renderCalendar();
      if(selDate)selectDate(selDate);
    } else if(t==='journal'){
      const dailies=await dailyLoad();
      Object.keys(JOURNALS).forEach(k=>delete JOURNALS[k]);
      dailies.forEach(d=>{JOURNALS[d.date]=d.content;});
      renderJournalList();
    } else if(t==='tasks'){
      ISSUES=await issueLoad();
      renderTaskList();
    } else if(t==='gantt'){
      ISSUES=await issueLoad();
      renderGantt();
    }
  }catch(e){console.error('탭 리로드 실패',e);}
}
function goBack(){switchTab(prevTab);}

window.addEventListener('popstate',e=>{
  const t=(e.state&&e.state.tab)||(location.hash.replace('#','')||'calendar');
  switchTab(t,true);
});

function openDetail(seq,fromGantt){
  const iss=ISSUES.find(i=>i.seq===seq);if(!iss)return;
  fillDetailForm(iss);
  const btn=document.getElementById('detail-back-btn');
  if(fromGantt){btn.textContent='← 간트차트로';btn.onclick=()=>switchTab('gantt');}
  else{btn.textContent='← 목록으로';btn.onclick=goBack;}
  switchTab('detail');
}
function openNewTask(){
  fillDetailForm(null);
  const btn=document.getElementById('detail-back-btn');
  btn.textContent='← 목록으로';btn.onclick=goBack;
  prevTab='tasks';switchTab('detail');
}
function renderProjectSelect(selectedCode){
  const sel=document.getElementById('d-project');
  const current=selectedCode||sel.value||'';
  sel.innerHTML='';
  const projects=CODES.PROJECT.length
    ?CODES.PROJECT
    :[{code:'DARWIN',name:'DARWIN'},{code:'API',name:'API'},{code:'WEB',name:'WEB'},{code:'OPS',name:'OPS'},{code:'기타',name:'기타'}];
  projects.forEach(p=>{
    const opt=document.createElement('option');
    opt.value=p.code;opt.textContent=p.name;
    if(p.code===current)opt.selected=true;
    sel.appendChild(opt);
  });
  /* 선택값 없으면 첫 번째 선택 */
  if(!current&&sel.options.length)sel.selectedIndex=0;
}

function fillDetailForm(iss){
  document.getElementById('d-seq').value=iss?iss.seq:'';
  document.getElementById('d-id').value=iss?iss.id:'';
  document.getElementById('d-title').value=iss?iss.title:'';
  renderProjectSelect(iss?iss.project:'');
  document.getElementById('d-priority').value=iss?iss.priority:'mid';
  document.getElementById('d-status').value=iss?iss.status:'진행예정';
  document.getElementById('d-created').value=iss?iss.issueRegDate:'';
  document.getElementById('d-due').value=iss?iss.targetDate:'';
  document.getElementById('d-devstart').value=iss?iss.devStart:'';
  document.getElementById('d-devend').value=iss?iss.devEnd:'';
  document.getElementById('d-deploy').value=iss?iss.prodDate:'';
  document.getElementById('d-progress').value=iss?iss.progressNote:'';
  /* 제목 에러 상태 초기화 */
  clearTitleError();
  const link=iss?iss.link:'';
  const disp=document.getElementById('d-link-display');
  if(link){disp.textContent=link;disp.href=link;}
  else{disp.textContent='링크 없음';disp.href='#';}
  document.getElementById('d-link-input').value=link||'';
  document.getElementById('d-link-wrap').style.display='flex';
  document.getElementById('d-link-edit').style.display='none';
}
function toggleLinkEdit(){
  document.getElementById('d-link-wrap').style.display='none';
  document.getElementById('d-link-edit').style.display='flex';
}
function saveLinkEdit(){
  const val=document.getElementById('d-link-input').value.trim();
  const disp=document.getElementById('d-link-display');
  disp.textContent=val||'링크 없음';disp.href=val||'#';
  document.getElementById('d-link-wrap').style.display='flex';
  document.getElementById('d-link-edit').style.display='none';
}

/* ── CALENDAR ── */
function renderCalendar(){
  const tbody=document.getElementById('cal-body');tbody.innerHTML='';
  const firstDay=new Date(curYear,curMonth-1,1).getDay();
  const daysInMonth=new Date(curYear,curMonth,0).getDate();
  const todayObj=new Date();
  let d=1,wk=0;
  while(d<=daysInMonth){
    const tr=document.createElement('tr');
    for(let dow=0;dow<7;dow++){
      const td=document.createElement('td');
      const blank=(wk===0&&dow<firstDay);
      if(!blank&&d<=daysInMonth){
        const dd=d;
        const isToday=(curYear===todayObj.getFullYear()&&curMonth===todayObj.getMonth()+1&&dd===todayObj.getDate());
        const hol=HOLIDAYS[curMonth]&&HOLIDAYS[curMonth][dd];
        if(dow===0)td.classList.add('td-sun');
        if(dow===6)td.classList.add('td-sat');
        if(isToday)td.classList.add('today-cell');
        if(dd===selDate)td.classList.add('selected-cell');
        if(hol)td.classList.add('td-hol');
        td.onclick=()=>selectDate(dd);
        const hdrDiv=document.createElement('div');hdrDiv.className='day-hdr';
        if(isToday){
          const circ=document.createElement('span');circ.className='day-num-circle';circ.textContent=dd;hdrDiv.appendChild(circ);
        } else {
          const num=document.createElement('span');num.className='day-num';num.textContent=dd;hdrDiv.appendChild(num);
        }
        if(hol){const hn=document.createElement('span');hn.className='hol-name';hn.textContent=hol;hdrDiv.appendChild(hn);}
        td.appendChild(hdrDiv);
        const issues=issuesForDate(dd);
        issues.slice(0,3).forEach(iss=>{
          const chip=document.createElement('div');chip.className='issue-chip';
          chip.style.background=chipColor(iss);
          const label=iss.id||iss.seq;
          const shortTitle=iss.title.length>14?iss.title.slice(0,14)+'…':iss.title;
          chip.textContent=label+' '+shortTitle;chip.title=iss.title;
          chip.onclick=(e)=>{e.stopPropagation();prevTab='calendar';openDetail(iss.seq);};
          td.appendChild(chip);
        });
        if(issues.length>3){const m=document.createElement('div');m.className='chip-more';m.textContent=`+${issues.length-3}`;td.appendChild(m);}
        d++;
      } else if(blank){
        td.classList.add('other-month');
      } else {
        td.classList.add('other-month');d++;
      }
      tr.appendChild(td);
    }
    const wkTd=document.createElement('td');wkTd.className='week-btn-cell';
    wkTd.innerHTML=`<div class="wk-btn-inner"><div class="wk-num">W${wk+1}</div><div class="wk-sub">주간보고</div></div>`;
    wkTd.onclick=()=>showWeekReport(wk);
    tr.appendChild(wkTd);
    tbody.appendChild(tr);wk++;
  }
}

function selectDate(d){
  selDate=d;bottomMode='agenda';
  curSelDateKey=`${curYear}-${String(curMonth).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
  ['month-report-box','week-report-box'].forEach(id=>document.getElementById(id).style.display='none');
  document.getElementById('journal-box').style.display='block';
  document.getElementById('agenda-box').style.display='block';
  const dow=new Date(curYear,curMonth-1,d).getDay();
  const todayObj=new Date();
  const isToday=curYear===todayObj.getFullYear()&&curMonth===todayObj.getMonth()+1&&d===todayObj.getDate();
  document.getElementById('journal-box-label').textContent=`${curYear}년 ${curMonth}월 ${d}일 업무일지`;
  const text=JOURNALS[curSelDateKey]||'';
  const viewEl=document.getElementById('journal-view');
  if(text){
    viewEl.textContent=text;viewEl.classList.remove('empty');
  } else {
    viewEl.textContent='업무일지가 없습니다. 클릭하여 등록하세요.';viewEl.classList.add('empty');
  }
  document.getElementById('agenda-date-hdr').innerHTML=`${curMonth}월 ${d}일 (${DOW[dow]}) ${isToday?'<span class="today-badge">오늘</span>':''}`;
  const list=document.getElementById('agenda-list');list.innerHTML='';
  const issues=issuesForDate(d);
  if(!issues.length){list.innerHTML='<div class="agenda-empty">등록된 업무가 없습니다</div>';renderCalendar();return;}
  issues.forEach(iss=>{
    const s=STATUS_STYLE[iss.status]||STATUS_STYLE['보류'];
    const item=document.createElement('div');item.className='agenda-item';
    item.innerHTML=`<div class="agenda-chip" style="background:${chipColor(iss)}">${iss.id||iss.seq}</div>
    <div class="agenda-title">${iss.title}</div>
    <div class="status-badge" style="background:${s.bg};color:${s.color}">${iss.status}</div>
    <div class="agenda-arrow">›</div>`;
    item.onclick=()=>{prevTab='calendar';openDetail(iss.seq);};
    list.appendChild(item);
  });
  renderCalendar();
}

/* 캘린더 journal-view 클릭: 내용 있으면 조회, 없으면 신규 등록 */
function goToJournalDetail(){
  if(!curSelDateKey)return;
  prevTab='calendar';
  openJournalDetail(curSelDateKey,!JOURNALS[curSelDateKey]);
}

function hideBottom(){
  bottomMode='none';selDate=null;
  ['journal-box','agenda-box','month-report-box','week-report-box'].forEach(id=>document.getElementById(id).style.display='none');
  renderCalendar();
}
function toggleMonthReport(){
  if(bottomMode==='month'){bottomMode='none';document.getElementById('month-report-box').style.display='none';return;}
  bottomMode='month';
  ['agenda-box','journal-box','week-report-box'].forEach(id=>document.getElementById(id).style.display='none');
  document.getElementById('month-report-box').style.display='block';
  document.getElementById('month-report-title').textContent=`${curYear}년 ${curMonth}월 월간보고`;
}
function showWeekReport(idx){
  bottomMode='week';
  ['agenda-box','journal-box','month-report-box'].forEach(id=>document.getElementById(id).style.display='none');
  document.getElementById('week-report-box').style.display='block';
  document.getElementById('week-report-title').textContent=`${curMonth}월 ${idx+1}주차 주간보고`;
}
function genReport(type){
  const ta=document.getElementById(type==='month'?'month-report-ta':'week-report-ta');
  ta.value='AI가 보고서를 생성하고 있습니다...';
  setTimeout(()=>{
    ta.value=type==='month'
      ?'월간보고\n\n이번 달 업무 이슈 현황 및 진행 요약입니다.'
      :'주간보고\n\n이번 주 주요 업무 진행 현황 요약입니다.';
  },1200);
}
function changeMonth(dir){
  curMonth+=dir;
  if(curMonth>12){curMonth=1;curYear++;}
  if(curMonth<1){curMonth=12;curYear--;}
  document.getElementById('month-label').textContent=`${curYear}년 ${curMonth}월`;
  selDate=null;bottomMode='none';
  ['month-report-box','week-report-box','agenda-box','journal-box'].forEach(id=>document.getElementById(id).style.display='none');
  renderCalendar();
}
function goToday(){
  const t=new Date();curYear=t.getFullYear();curMonth=t.getMonth()+1;
  document.getElementById('month-label').textContent=`${curYear}년 ${curMonth}월`;
  renderCalendar();selectDate(t.getDate());
}

/* ── JOURNAL LIST ── */
function buildJlistDates(){
  const today=todayStr();
  const dateSet=new Set();
  /* 과거 365일 */
  for(let i=0;i<365;i++) dateSet.add(dateOffset(i));
  /* 미래 365일 */
  for(let i=1;i<=365;i++){
    const d=new Date();d.setDate(d.getDate()+i);
    dateSet.add(d.toISOString().slice(0,10));
  }
  /* JOURNALS 날짜 전부 포함 (과거/미래 모두) */
  Object.keys(JOURNALS).forEach(dt=>dateSet.add(dt));
  jlistAllDates=[...dateSet].sort((a,b)=>a.localeCompare(b));
}

function makeJlistItem(dt){
  const d=new Date(dt+'T00:00:00');
  const text=JOURNALS[dt];
  const issues=issuesForDateStr(dt);
  const item=document.createElement('div');item.className='jlist-item';
  /* 카드 전체 클릭 → 일지 상세(신규 or 조회) */
  item.onclick=()=>openJournalDetail(dt,!text);
  let issHtml='';
  if(issues.length){
    issHtml=`<div style="margin-top:2px">${issues.map(i=>{
      const s=STATUS_STYLE[i.status]||STATUS_STYLE['보류'];
      /* 이슈행은 별도 div로 클릭 이벤트 분리 */
      return `<div class="issue-row" data-seq="${i.seq}">
        <div class="issue-row-chip" style="background:${chipColor(i)}">${i.id||i.seq}</div>
        <div class="issue-row-title">${i.title}</div>
        <div class="issue-row-status" style="background:${s.bg}">${i.status}</div>
        <div class="issue-row-arrow">›</div>
      </div>`;
    }).join('')}</div>`;
  }
  const preview=text
    ?text.slice(0,120)+(text.length>120?'…':'')
    :'<span style="color:var(--text3);font-style:italic">작성된 일지가 없습니다.</span>';
  item.innerHTML=`<div class="jlist-date">${dt} (${DOW[d.getDay()]})</div>
  <div class="jlist-text">${preview}</div>${issHtml}`;
  /* 이슈행 클릭 → 이슈 상세 (카드 클릭 이벤트 버블링 차단) */
  item.querySelectorAll('.issue-row').forEach(row=>{
    row.onclick=(e)=>{
      e.stopPropagation();
      prevTab='journal';
      openDetail(row.dataset.seq);
    };
  });
  return item;
}

function updateJlistButtons(){
  document.getElementById('jlist-btn-up').style.display=jlistFrom>0?'block':'none';
  document.getElementById('jlist-btn-down').style.display=jlistTo<jlistAllDates.length?'block':'none';
}

function renderJournalList(){
  buildJlistDates();
  const el=document.getElementById('journal-entries');el.innerHTML='';
  const today=todayStr();
  /* 오늘 인덱스 찾기 */
  const todayIdx=jlistAllDates.findIndex(dt=>dt>=today);
  const centerIdx=todayIdx>=0?todayIdx:jlistAllDates.length-1;
  /* 오늘 기준 앞 3개 + 오늘 + 뒤 3개 = 7개 */
  jlistFrom=Math.max(0,centerIdx-3);
  jlistTo=Math.min(jlistAllDates.length,jlistFrom+JLIST_PAGE);
  /* 끝에 붙은 경우 앞으로 당기기 */
  if(jlistTo-jlistFrom<JLIST_PAGE) jlistFrom=Math.max(0,jlistTo-JLIST_PAGE);
  jlistAllDates.slice(jlistFrom,jlistTo).forEach(dt=>el.appendChild(makeJlistItem(dt)));
  updateJlistButtons();
}

function loadMore(dir){
  const el=document.getElementById('journal-entries');
  if(dir==='up'){
    /* 과거 방향 */
    const newFrom=Math.max(0,jlistFrom-JLIST_PAGE);
    if(newFrom>=jlistFrom)return;
    const frag=document.createDocumentFragment();
    jlistAllDates.slice(newFrom,jlistFrom).forEach(dt=>frag.appendChild(makeJlistItem(dt)));
    el.insertBefore(frag,el.firstChild);
    jlistFrom=newFrom;
  } else {
    /* 최신 방향 */
    const total=jlistAllDates.length;
    const newTo=Math.min(total,jlistTo+JLIST_PAGE);
    if(newTo<=jlistTo)return;
    jlistAllDates.slice(jlistTo,newTo).forEach(dt=>el.appendChild(makeJlistItem(dt)));
    jlistTo=newTo;
  }
  updateJlistButtons();
}

/* ── JOURNAL DETAIL ── */
function openJournalDetail(dt,isNew){
  const d=new Date(dt+'T00:00:00');
  document.getElementById('jd-date').textContent=`${dt} (${DOW[d.getDay()]})`;
  const text=isNew?'':(JOURNALS[dt]||'');
  const ta=document.getElementById('jd-textarea');ta.value=text;
  jdOriginal=text;jdDirty=false;
  document.getElementById('jd-save-btn').className='btn-sm primary';
  document.getElementById('unsaved-hint').style.display='none';
  /* 이슈 목록: devStart~prodDate/targetDate 범위 기반 */
  const issues=issuesForDateStr(dt);
  const issBox=document.getElementById('jd-issues');issBox.innerHTML='';
  const sec=document.getElementById('jd-issues-section');
  sec.style.display=issues.length?'block':'none';
  issues.forEach(iss=>{
    const s=STATUS_STYLE[iss.status]||STATUS_STYLE['보류'];
    const row=document.createElement('div');row.className='issue-row';
    row.innerHTML=`<div class="issue-row-chip" style="background:${chipColor(iss)}">${iss.id||iss.seq}</div>
    <div class="issue-row-title">${iss.title}</div>
    <div class="issue-row-status" style="background:${s.bg}">${iss.status}</div>
    <div class="issue-row-arrow">›</div>`;
    row.onclick=()=>{prevTab='jdetail';openDetail(iss.seq);};
    issBox.appendChild(row);
  });
  prevTab='journal';switchTab('jdetail');
}
function onJournalEdit(){
  const ta=document.getElementById('jd-textarea');
  jdDirty=ta.value!==jdOriginal;
  const btn=document.getElementById('jd-save-btn');
  const hint=document.getElementById('unsaved-hint');
  if(jdDirty){btn.className='btn-sm unsaved';btn.textContent='저장';hint.style.display='inline-flex';}
  else{btn.className='btn-sm primary';btn.textContent='저장';hint.style.display='none';}
}
async function saveJournalDetail(){
  const dt=document.getElementById('jd-date').textContent.split(' ')[0];
  const content=document.getElementById('jd-textarea').value;
  const btn=document.getElementById('jd-save-btn');
  btn.textContent='저장 중...';btn.disabled=true;
  try{
    await dailySave(dt,content);
    JOURNALS[dt]=content;
    jdOriginal=content;jdDirty=false;
    btn.className='btn-sm primary';btn.textContent='저장';btn.disabled=false;
    document.getElementById('unsaved-hint').style.display='none';
    renderJournalList();
  }catch(e){
    btn.textContent='저장 실패';btn.disabled=false;
    alert('저장 중 오류가 발생했습니다: '+e.message);
  }
}

/* ── TASK LIST ── */
function renderTaskList(filter='all'){
  const tbody=document.getElementById('task-tbody');tbody.innerHTML='';
  let list=filter==='all'?[...ISSUES]:ISSUES.filter(i=>i.status===filter);
  /* ISSUE_SEQ DESC 정렬 */
  list.sort((a,b)=>b.seq.localeCompare(a.seq));
  if(!list.length){
    tbody.innerHTML=`<tr><td colspan="8" style="text-align:center;color:var(--text3);padding:2rem">등록된 업무가 없습니다</td></tr>`;
    return;
  }
  list.forEach(iss=>{
    const s=STATUS_STYLE[iss.status]||STATUS_STYLE['보류'];
    const tr=document.createElement('tr');
    tr.onclick=()=>{prevTab='tasks';openDetail(iss.seq);};
    const numCell=iss.id
      ?(iss.link
        ?`<a class="task-num-link" href="${iss.link}" target="_blank" onclick="event.stopPropagation()">${iss.id}</a>`
        :`<span class="task-num-plain">${iss.id}</span>`)
      :`<span class="task-num-plain" style="color:var(--text3)">미등록</span>`;
    tr.innerHTML=`<td><span class="priority-badge" style="background:${P_COLOR[iss.priority]||P_COLOR.mid}">${P_LABEL[iss.priority]||'중간'}</span></td>
    <td>${numCell}</td>
    <td style="font-size:12px;color:var(--text)">${iss.title||''}</td>
    <td style="font-size:11px;color:var(--text2)">${iss.issueRegDate||'—'}</td>
    <td style="font-size:11px;color:var(--text2)">${iss.targetDate||'—'}</td>
    <td style="font-size:11px;color:var(--text2)">${iss.devStart||'—'}</td>
    <td style="font-size:11px;color:var(--text2)">${iss.prodDate||'—'}</td>
    <td><span class="status-badge" style="background:${s.bg};color:${s.color}">${iss.status}</span></td>`;
    tbody.appendChild(tr);
  });
}
function filterTask(btn,f){
  document.querySelectorAll('.filter-chip').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');renderTaskList(f);
}

function showTitleError(msg){
  const input=document.getElementById('d-title');
  input.style.borderBottom='2px solid var(--red)';
  let err=document.getElementById('d-title-err');
  if(!err){
    err=document.createElement('div');err.id='d-title-err';
    err.style.cssText='font-size:11px;color:var(--red);margin-top:4px';
    input.parentNode.insertBefore(err,input.nextSibling);
  }
  err.textContent=msg;
  input.oninput=()=>clearTitleError();
}
function clearTitleError(){
  const input=document.getElementById('d-title');
  if(input){input.style.borderBottom='';}
  const err=document.getElementById('d-title-err');
  if(err)err.remove();
}

async function saveIssueDetail(){
  const btn=document.querySelector('#view-detail .btn-sm.primary');
  btn.textContent='저장 중...';btn.disabled=true;
  const seq=document.getElementById('d-seq').value.trim();
  const id=document.getElementById('d-id').value.trim();
  const title=document.getElementById('d-title').value.trim();
  const project=document.getElementById('d-project').value;

  /* 제목 필수 체크 */
  if(!title){
    showTitleError('이슈 제목은 필수입니다.');
    btn.textContent='저장';btn.disabled=false;return;
  }

  /* 같은 프로젝트 내 ISSUE_ID 중복 체크 (null/empty 제외, 자기 자신 제외) */
  if(id){
    const dup=ISSUES.find(i=>
      i.id===id &&
      i.project===project &&
      i.seq!==seq
    );
    if(dup){
      alert(`[${project}] 프로젝트에 이미 존재하는 이슈코드입니다: ${id}`);
      btn.textContent='저장';btn.disabled=false;return;
    }
  }

  const linkInput=document.getElementById('d-link-input').value.trim();
  const linkDisplay=document.getElementById('d-link-display').href;
  const link=linkInput||(linkDisplay==='#'||linkDisplay===window.location.href?'':linkDisplay);
  const iss={
    seq,id,project,title,
    priority:document.getElementById('d-priority').value,
    status:document.getElementById('d-status').value,
    link:link||'',
    issueRegDate:document.getElementById('d-created').value||'',
    targetDate:document.getElementById('d-due').value||'',
    devStart:document.getElementById('d-devstart').value||'',
    devEnd:document.getElementById('d-devend').value||'',
    prodDate:document.getElementById('d-deploy').value||'',
    progressNote:document.getElementById('d-progress').value||'',
  };
  const isNew=!seq;
  try{
    await issueSave(iss,isNew);
    ISSUES=await issueLoad();
    renderTaskList();renderGantt();renderCalendar();
    btn.textContent='저장';btn.disabled=false;
    goBack();
  }catch(e){
    btn.textContent='저장 실패';btn.disabled=false;
    alert('저장 중 오류가 발생했습니다: '+e.message);
  }
}

function doSearch(){
  const navInput=document.getElementById('nav-search-input');
  const barInput=document.getElementById('search-bar-input');
  const kw=(navInput.value||barInput.value).trim();
  if(!kw)return;
  navInput.value=kw;barInput.value=kw;
  switchTab('search');
  const kwEl=document.getElementById('search-keyword');
  kwEl.style.display='block';
  kwEl.innerHTML=`<strong>"${kw}"</strong> 검색 결과`;
  const lower=kw.toLowerCase();
  const wrap=document.getElementById('search-results');wrap.innerHTML='';
  function highlight(text){
    if(!text)return '';
    return text.replace(new RegExp(`(${kw.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')})`,'gi'),'<span class="sri-highlight">$1</span>');
  }
  const dailyHits=Object.entries(JOURNALS).filter(([,v])=>v.toLowerCase().includes(lower));
  const dailyEl=document.createElement('div');dailyEl.className='search-section';
  dailyEl.innerHTML=`<div class="search-section-title">업무일지 (${dailyHits.length})</div>`;
  if(!dailyHits.length){
    dailyEl.innerHTML+=`<div style="font-size:12px;color:var(--text3);padding:8px 0">검색 결과 없음</div>`;
  } else {
    dailyHits.forEach(([dt,content])=>{
      const d=new Date(dt+'T00:00:00');
      const item=document.createElement('div');item.className='search-result-item';
      item.innerHTML=`<div class="sri-top">
        <span class="sri-date">${dt} (${DOW[d.getDay()]})</span>
        <span style="font-size:10px;padding:2px 7px;border-radius:3px;background:#E8E6E0;color:var(--text2)">업무일지</span>
      </div><div class="sri-body">${highlight(content)}</div>`;
      item.onclick=()=>openJournalDetail(dt);
      dailyEl.appendChild(item);
    });
  }
  wrap.appendChild(dailyEl);
  const issueHits=ISSUES.filter(i=>
    (i.id&&i.id.toLowerCase().includes(lower))||
    (i.title&&i.title.toLowerCase().includes(lower))||
    (i.progressNote&&i.progressNote.toLowerCase().includes(lower))
  );
  const issueEl=document.createElement('div');issueEl.className='search-section';
  issueEl.innerHTML=`<div class="search-section-title">업무 이슈 (${issueHits.length})</div>`;
  if(!issueHits.length){
    issueEl.innerHTML+=`<div style="font-size:12px;color:var(--text3);padding:8px 0">검색 결과 없음</div>`;
  } else {
    issueHits.forEach(iss=>{
      const s=STATUS_STYLE[iss.status]||STATUS_STYLE['보류'];
      const item=document.createElement('div');item.className='search-result-item';
      item.innerHTML=`<div class="sri-top">
        <span class="sri-chip" style="background:${chipColor(iss)}">${iss.id||iss.seq}</span>
        <span class="sri-title">${highlight(iss.title)}</span>
        <span class="status-badge" style="background:${s.bg};color:${s.color}">${iss.status}</span>
      </div>${iss.progressNote?`<div class="sri-body">${highlight(iss.progressNote)}</div>`:''}`;
      item.onclick=()=>{prevTab='search';openDetail(iss.seq);};
      issueEl.appendChild(item);
    });
  }
  wrap.appendChild(issueEl);
  if(!dailyHits.length&&!issueHits.length)wrap.innerHTML=`<div class="search-empty">검색 결과가 없습니다</div>`;
}

/* ── GANTT ── */
function renderGantt(){
  const wrap=document.getElementById('gantt-wrap');
  if(!wrap)return;
  const today=new Date();
  const yr=today.getFullYear(),mo=today.getMonth()+1;
  const daysInMonth=new Date(yr,mo,0).getDate();
  const days=Array.from({length:daysInMonth},(_,i)=>i+1);
  const todayD=today.getDate();
  const cw=26;
  if(!ISSUES||!ISSUES.length){
    wrap.innerHTML='<div style="text-align:center;color:var(--text3);padding:3rem;font-size:13px">등록된 업무가 없습니다</div>';
    return;
  }
  let html=`<div style="display:flex;flex-direction:column">`;
  html+=`<div class="gantt-hdr-row"><div class="gantt-task-col">업무</div><div style="display:flex">`;
  days.forEach(d=>{
    const dow=new Date(yr,mo-1,d).getDay();
    const hol=HOLIDAYS[mo]&&HOLIDAYS[mo][d];
    html+=`<div class="gantt-day-hdr${dow===0||hol?' td-sun':dow===6?' td-sat':''}">${d}</div>`;
  });
  html+=`</div></div>`;
  ISSUES.forEach(iss=>{
    if(!iss||!iss.devStart)return;
    const endDate=iss.prodDate||iss.targetDate;
    if(!endDate)return;
    let startD,endD;
    try{startD=new Date(iss.devStart);endD=new Date(endDate);}catch(e){return;}
    if(isNaN(startD.getTime())||isNaN(endD.getTime()))return;
    const monthStart=new Date(yr,mo-1,1);
    const monthEnd=new Date(yr,mo-1,daysInMonth);
    if(endD<monthStart||startD>monthEnd)return;
    const barStart=Math.max(1,startD.getMonth()+1===mo&&startD.getFullYear()===yr?startD.getDate():1);
    const barEnd=Math.min(daysInMonth,endD.getMonth()+1===mo&&endD.getFullYear()===yr?endD.getDate():daysInMonth);
    const barL=(barStart-1)*cw;
    const barW=(barEnd-barStart+1)*cw;
    const c=chipColor(iss);
    html+=`<div class="gantt-row" onclick="openDetail('${iss.seq}',true)">
    <div class="gantt-task-info"><div class="gantt-task-id">${iss.id||iss.seq}</div><div class="gantt-task-name">${iss.title}</div></div>
    <div style="flex:1;position:relative;height:38px;display:flex">
      ${days.map(d=>{const dow=new Date(yr,mo-1,d).getDay();const hol=HOLIDAYS[mo]&&HOLIDAYS[mo][d];return `<div class="gantt-day-cell${dow===0||dow===6||hol?' weekend':''}"></div>`;}).join('')}
      <div class="gantt-bar" style="left:${barL}px;width:${barW}px;background:${c}"></div>
      <div class="gantt-today-line" style="left:${(todayD-1)*cw+cw/2}px"></div>
    </div></div>`;
  });
  html+=`</div>`;
  wrap.innerHTML=html;
}

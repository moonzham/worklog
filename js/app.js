/* ── 전역 상수/변수 ── */
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
let CODES={PROJECT:[]};

function getProjectName(code){
  if(!code)return'';
  const p=CODES.PROJECT.find(p=>p.code===code);
  return p?p.name:code;
}

let curYear=new Date().getFullYear(),curMonth=new Date().getMonth()+1,selDate=null,prevTab='calendar',bottomMode='none',curWeekIdx=null;
let jdOriginal='',jdDirty=false,curSelDateKey='';

let jlistAllDates=[];
let jlistFrom=0;
let jlistTo=0;
const JLIST_PAGE=7;

function chipColor(iss){return P_COLOR[iss.priority]||P_COLOR.mid;}

/* 종료일 없으면 9999-12-31 (무기한 진행) */
function issuesForDate(d){
  const dateStr=`${curYear}-${String(curMonth).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
  return ISSUES.filter(i=>{
    if(!i.devStart||i.useYn==='N')return false;
    const endDate=i.prodDate||i.targetDate||'9999-12-31';
    return i.devStart<=dateStr&&endDate>=dateStr;
  });
}
function issuesForDateStr(dt){
  return ISSUES.filter(i=>{
    if(!i.devStart||i.useYn==='N')return false;
    const endDate=i.prodDate||i.targetDate||'9999-12-31';
    return i.devStart<=dt&&endDate>=dt;
  });
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
  if(token&&Date.now()<expiry){accessToken=token;startApp();}
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
  renderTaskProjectFilter();
  const today=new Date();
  curYear=today.getFullYear();curMonth=today.getMonth()+1;
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
      ISSUES=await issueLoad();renderTaskList();
    } else if(t==='gantt'){
      ISSUES=await issueLoad();renderGantt();
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
  clearTitleError();
  /* 삭제 버튼: 신규면 숨김, 수정이면 표시 */
  const delBtn=document.getElementById('detail-delete-btn');
  if(delBtn)delBtn.style.display=iss?'inline-block':'none';
  const link=iss?iss.link:'';
  const disp=document.getElementById('d-link-display');
  if(link){disp.textContent=link;disp.href=link;disp.style.pointerEvents='auto';disp.style.color='';}
  else{disp.textContent='링크 없음';disp.removeAttribute('href');disp.style.pointerEvents='none';disp.style.color='var(--text3)';}
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
  if(val){disp.textContent=val;disp.href=val;disp.style.pointerEvents='auto';disp.style.color='';}
  else{disp.textContent='링크 없음';disp.removeAttribute('href');disp.style.pointerEvents='none';disp.style.color='var(--text3)';}
  document.getElementById('d-link-wrap').style.display='flex';
  document.getElementById('d-link-edit').style.display='none';
}

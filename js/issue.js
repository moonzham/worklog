/* ── ISSUE 삭제 ── */
async function deleteIssueDetail(){
  const seq=document.getElementById('d-seq').value.trim();
  if(!seq)return;
  const title=document.getElementById('d-title').value.trim();
  if(!confirm(`"${title}" 이슈를 삭제하시겠습니까?`))return;
  try{
    await issueDelete(seq);
    ISSUES=await issueLoad();
    renderTaskList();renderGantt();renderCalendar();
    goBack();
  }catch(e){
    alert('삭제 중 오류가 발생했습니다: '+e.message);
  }
}

/* ── 간트 월 상태 ── */
let ganttYear=new Date().getFullYear();
let ganttMonth=new Date().getMonth()+1;

function changeGanttMonth(dir){
  ganttMonth+=dir;
  if(ganttMonth>12){ganttMonth=1;ganttYear++;}
  if(ganttMonth<1){ganttMonth=12;ganttYear--;}
  renderGantt();
}
function resetGanttMonth(){
  const t=new Date();ganttYear=t.getFullYear();ganttMonth=t.getMonth()+1;
  renderGantt();
}

/* ── TASK LIST ── */
function renderTaskList(filter='all',projectFilter){
  if(projectFilter===undefined){
    const sel=document.getElementById('task-project-filter');
    projectFilter=sel?sel.value:'all';
  }
  const tbody=document.getElementById('task-tbody');tbody.innerHTML='';
  let list=filter==='all'?[...ISSUES]:ISSUES.filter(i=>i.status===filter);
  if(projectFilter&&projectFilter!=='all') list=list.filter(i=>i.project===projectFilter);
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
function renderTaskProjectFilter(){
  const sel=document.getElementById('task-project-filter');
  if(!sel)return;
  const prev=sel.value;
  sel.innerHTML='<option value="all">전체 프로젝트</option>';
  CODES.PROJECT.forEach(p=>{
    const opt=document.createElement('option');
    opt.value=p.code;opt.textContent=p.name;
    sel.appendChild(opt);
  });
  if(prev&&prev!=='all') sel.value=prev;
  else if(CODES.PROJECT.length) sel.value=CODES.PROJECT[0].code;
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
  if(!title){
    showTitleError('이슈 제목은 필수입니다.');
    btn.textContent='저장';btn.disabled=false;return;
  }
  if(id){
    const dup=ISSUES.find(i=>i.id===id&&i.project===project&&i.seq!==seq);
    if(dup){
      alert(`[${project}] 프로젝트에 이미 존재하는 이슈코드입니다: ${id}`);
      btn.textContent='저장';btn.disabled=false;return;
    }
  }
  const linkInput=document.getElementById('d-link-input').value.trim();
  const linkDisplayEl=document.getElementById('d-link-display');
  const linkDisplayHref=linkDisplayEl.href;
  /* linkInput 우선, 없으면 display에 실제 URL이 있는지 확인 (# 또는 현재 페이지면 빈값) */
  const link=linkInput||(
    linkDisplayHref&&
    linkDisplayHref!=='#'&&
    linkDisplayHref!==window.location.href&&
    !linkDisplayHref.endsWith('#')
    ?linkDisplayHref:''
  );
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

/* ── GANTT ── */
function renderGantt(){
  const wrap=document.getElementById('gantt-wrap');
  const scroll=document.querySelector('.gantt-scroll');
  if(!wrap)return;

  /* 월 레이블 제거 (전체 기간 방식이므로 불필요) */
  const label=document.getElementById('gantt-month-label');
  if(label)label.textContent='';

  const activeIssues=(ISSUES||[]).filter(i=>i.devStart);
  if(!activeIssues.length){
    wrap.innerHTML='<div style="text-align:center;color:var(--text3);padding:3rem;font-size:13px">등록된 업무가 없습니다</div>';
    return;
  }

  const today=new Date();today.setHours(0,0,0,0);
  const todayStr2=today.toISOString().slice(0,10);

  /* 전체 기간 계산 */
  const allStarts=activeIssues.map(i=>new Date(i.devStart+'T00:00:00'));
  const allEnds=activeIssues.map(i=>{
    const e=i.prodDate||i.targetDate||'9999-12-31';
    return new Date(e+'T00:00:00');
  });
  /* 최소 시작일: 이슈 중 가장 이른 날, 최대 종료일: 오늘+30 or 이슈 중 가장 늦은 날 중 큰 것 */
  let minDate=new Date(Math.min(...allStarts));
  let maxDate=new Date(Math.max(...allEnds,today.getTime()+30*86400000));

  /* 월 단위로 앞뒤 여유 */
  minDate=new Date(minDate.getFullYear(),minDate.getMonth(),1);
  maxDate=new Date(maxDate.getFullYear(),maxDate.getMonth()+1,0);

  /* 전체 일수 배열 생성 */
  const dates=[];
  for(let d=new Date(minDate);d<=maxDate;d.setDate(d.getDate()+1)){
    dates.push(d.toISOString().slice(0,10));
  }
  const cw=26; /* 하루 너비 */

  /* 날짜→인덱스 맵 */
  const dateIdx={};
  dates.forEach((dt,i)=>dateIdx[dt]=i);

  /* ── 헤더: 월 표시 ── */
  let monthHdr='';
  let mStart=0,curMon='';
  dates.forEach((dt,i)=>{
    const mon=dt.slice(0,7);
    if(mon!==curMon){
      if(curMon) monthHdr+=`<div class="gantt-mon-hdr" style="width:${(i-mStart)*cw}px">${curMon}</div>`;
      curMon=mon;mStart=i;
    }
  });
  monthHdr+=`<div class="gantt-mon-hdr" style="width:${(dates.length-mStart)*cw}px">${curMon}</div>`;

  /* ── 헤더: 일 표시 ── */
  let dayHdr='';
  dates.forEach(dt=>{
    const d=new Date(dt+'T00:00:00');
    const dow=d.getDay();
    const isToday=dt===todayStr2;
    const hol=HOLIDAYS[d.getMonth()+1]&&HOLIDAYS[d.getMonth()+1][d.getDate()];
    let cls='gantt-day-hdr';
    if(dow===0||hol) cls+=' td-sun';
    else if(dow===6) cls+=' td-sat';
    if(isToday) cls+=' gantt-today-hdr';
    dayHdr+=`<div class="${cls}">${d.getDate()}</div>`;
  });

  /* ── 이슈 행 ── */
  let rows='';
  activeIssues.forEach(iss=>{
    const startDt=iss.devStart;
    const endDt=iss.prodDate||iss.targetDate||'9999-12-31';
    const si=dateIdx[startDt]??0;
    const ei=dateIdx[endDt]??dates.length-1;
    const barL=si*cw;
    const barW=Math.max((ei-si+1)*cw,cw);
    const c=chipColor(iss);

    /* 셀 배경 (주말 표시) */
    const cells=dates.map(dt=>{
      const dow=new Date(dt+'T00:00:00').getDay();
      const isToday=dt===todayStr2;
      return `<div class="gantt-day-cell${dow===0||dow===6?' weekend':''}${isToday?' gantt-today-col':''}"></div>`;
    }).join('');

    rows+=`<div class="gantt-row" onclick="openDetail('${iss.seq}',true)">
      <div class="gantt-task-info">
        <div class="gantt-task-id">${iss.id||''}</div>
        <div class="gantt-task-name">${iss.title}</div>
      </div>
      <div style="flex:1;position:relative;height:38px;display:flex">
        ${cells}
        <div class="gantt-bar" style="left:${barL}px;width:${barW}px;background:${c};top:12px"></div>
      </div>
    </div>`;
  });

  const totalW=dates.length*cw;
  wrap.innerHTML=`<div style="display:flex;flex-direction:column;min-width:${totalW+210}px">
    <div class="gantt-hdr-row">
      <div class="gantt-task-col">업무</div>
      <div style="display:flex;flex-direction:column;flex:1">
        <div style="display:flex">${monthHdr}</div>
        <div style="display:flex">${dayHdr}</div>
      </div>
    </div>
    ${rows}
  </div>`;

  /* 오늘 기준으로 스크롤 (오늘이 화면 중앙쯤 오도록) */
  if(scroll&&dateIdx[todayStr2]!==undefined){
    const todayX=dateIdx[todayStr2]*cw+210;
    scroll.scrollLeft=Math.max(0,todayX-scroll.clientWidth/2);
  }
}

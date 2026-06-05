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
    /* 종료일 없으면 9999-12-31 (무기한 진행) */
    const endDate=iss.prodDate||iss.targetDate||'9999-12-31';
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

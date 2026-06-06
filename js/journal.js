/* ── JOURNAL LIST ── */
function buildJlistDates(){
  const dateSet=new Set();
  /* 과거 365일 */
  for(let i=0;i<365;i++) dateSet.add(dateOffset(i));
  /* 미래 365일 */
  for(let i=1;i<=365;i++){
    const d=new Date();d.setDate(d.getDate()+i);
    dateSet.add(d.toISOString().slice(0,10));
  }
  /* JOURNALS 날짜 전부 포함 */
  Object.keys(JOURNALS).forEach(dt=>dateSet.add(dt));
  jlistAllDates=[...dateSet].sort((a,b)=>a.localeCompare(b));
}

function makeJlistItem(dt){
  const d=new Date(dt+'T00:00:00');
  const text=JOURNALS[dt];
  const issues=issuesForDateStr(dt);
  const item=document.createElement('div');item.className='jlist-item';
  item.onclick=()=>openJournalDetail(dt,!text);
  let issHtml='';
  if(issues.length){
    issHtml=`<div style="margin-top:2px">${issues.map(i=>{
      const s=STATUS_STYLE[i.status]||STATUS_STYLE['보류'];
      return `<div class="issue-row" data-seq="${i.seq}">
        <div class="issue-row-chip" style="background:${chipColor(i)}">${i.id||''}</div>
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
  const todayIdx=jlistAllDates.findIndex(dt=>dt>=today);
  const centerIdx=todayIdx>=0?todayIdx:jlistAllDates.length-1;
  jlistFrom=Math.max(0,centerIdx-3);
  jlistTo=Math.min(jlistAllDates.length,jlistFrom+JLIST_PAGE);
  if(jlistTo-jlistFrom<JLIST_PAGE) jlistFrom=Math.max(0,jlistTo-JLIST_PAGE);
  jlistAllDates.slice(jlistFrom,jlistTo).forEach(dt=>el.appendChild(makeJlistItem(dt)));
  updateJlistButtons();
}

function loadMore(dir){
  const el=document.getElementById('journal-entries');
  if(dir==='up'){
    const newFrom=Math.max(0,jlistFrom-JLIST_PAGE);
    if(newFrom>=jlistFrom)return;
    const frag=document.createDocumentFragment();
    jlistAllDates.slice(newFrom,jlistFrom).forEach(dt=>frag.appendChild(makeJlistItem(dt)));
    el.insertBefore(frag,el.firstChild);
    jlistFrom=newFrom;
  } else {
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
  const issues=issuesForDateStr(dt);
  const issBox=document.getElementById('jd-issues');issBox.innerHTML='';
  const sec=document.getElementById('jd-issues-section');
  sec.style.display=issues.length?'block':'none';
  issues.forEach(iss=>{
    const s=STATUS_STYLE[iss.status]||STATUS_STYLE['보류'];
    const row=document.createElement('div');row.className='issue-row';
    row.innerHTML=`<div class="issue-row-chip" style="background:${chipColor(iss)}">${iss.id||''}</div>
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

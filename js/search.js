/* ── SEARCH ── */
function doSearch(){
  const navInput=document.getElementById('nav-search-input');
  const barInput=document.getElementById('search-bar-input');
  const kw=(barInput.value||navInput.value).trim();
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
      item.onclick=()=>{prevTab='search';openJournalDetail(dt);};
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
        <span class="sri-chip" style="background:${chipColor(iss)}">${iss.id||''}</span>
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

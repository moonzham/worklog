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

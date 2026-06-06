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
          const label=iss.id||'';
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
    const weekIdx=wk;
    const wkTd=document.createElement('td');wkTd.className='week-btn-cell';
    wkTd.innerHTML=`<div class="wk-btn-inner"><div class="wk-num">W${weekIdx+1}</div><div class="wk-sub">주간보고</div></div>`;
    wkTd.onclick=()=>showWeekReport(weekIdx);
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
    item.innerHTML=`<div class="agenda-chip" style="background:${chipColor(iss)}">${iss.id||''}</div>
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
  bottomMode='none';selDate=null;curWeekIdx=null;
  ['journal-box','agenda-box','month-report-box','week-report-box'].forEach(id=>document.getElementById(id).style.display='none');
  renderCalendar();
}
function reportDateStr(date){
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
}
function monthReportKey(year=curYear,month=curMonth){
  return `${year}-${String(month).padStart(2,'0')}`;
}
function weekReportKey(year=curYear,month=curMonth,weekIdx=curWeekIdx){
  return `${monthReportKey(year,month)}-W${String((weekIdx||0)+1).padStart(2,'0')}`;
}
function getMonthReportPeriod(year=curYear,month=curMonth){
  const start=new Date(year,month-1,1);
  const end=new Date(year,month,0);
  return {
    key:monthReportKey(year,month),
    label:`${year}년 ${month}월`,
    startDate:reportDateStr(start),
    endDate:reportDateStr(end)
  };
}
function getWeekReportPeriod(weekIdx=curWeekIdx,year=curYear,month=curMonth){
  const daysInMonth=new Date(year,month,0).getDate();
  const firstDay=new Date(year,month-1,1).getDay();
  const rowStartDay=weekIdx*7-firstDay+1;
  const startDay=Math.max(1,rowStartDay);
  const endDay=Math.min(daysInMonth,rowStartDay+6);
  const safeStartDay=startDay>daysInMonth?daysInMonth:startDay;
  const safeEndDay=endDay<1?1:endDay;
  return {
    key:weekReportKey(year,month,weekIdx),
    label:`${year}년 ${month}월 ${weekIdx+1}주차`,
    weekIndex:weekIdx,
    startDate:reportDateStr(new Date(year,month-1,safeStartDay)),
    endDate:reportDateStr(new Date(year,month-1,safeEndDay))
  };
}
function getReportPeriod(type){
  return type==='month'?getMonthReportPeriod():getWeekReportPeriod(curWeekIdx===null?0:curWeekIdx);
}
function dateInRange(date,startDate,endDate){
  return date>=startDate&&date<=endDate;
}
function getIssueReportStartDate(iss){
  return iss.devStart||'';
}
function getIssueReportEndDate(iss){
  return iss.prodDate||iss.targetDate||'9999-12-31';
}
function issueOverlapsPeriod(iss,startDate,endDate){
  const start=getIssueReportStartDate(iss);
  if(!start)return false;
  const end=getIssueReportEndDate(iss);
  return start<=endDate&&end>=startDate;
}
function countBy(list,fn){
  return list.reduce((acc,item)=>{
    const key=fn(item)||'미지정';
    acc[key]=(acc[key]||0)+1;
    return acc;
  },{});
}
function buildWeeksForMonth(year=curYear,month=curMonth){
  const daysInMonth=new Date(year,month,0).getDate();
  const firstDay=new Date(year,month-1,1).getDay();
  const weeks=[];
  let wk=0;
  let d=1;
  while(d<=daysInMonth){
    const rowStartDay=wk*7-firstDay+1;
    const startDay=Math.max(1,rowStartDay);
    const endDay=Math.min(daysInMonth,rowStartDay+6);
    if(startDay<=daysInMonth){
      const startDate=reportDateStr(new Date(year,month-1,startDay));
      const endDate=reportDateStr(new Date(year,month-1,endDay));
      const weekLabel=`${wk+1}주차`;
      const journals=Object.entries(JOURNALS)
        .filter(([date,content])=>content&&dateInRange(date,startDate,endDate))
        .sort(([a],[b])=>a.localeCompare(b))
        .map(([date,content])=>({date,content}));
      const issues=ISSUES
        .filter(iss=>iss.useYn!=='N'&&issueOverlapsPeriod(iss,startDate,endDate))
        .sort((a,b)=>getIssueReportStartDate(a).localeCompare(getIssueReportStartDate(b)))
        .map(iss=>({
          issueNo:iss.id||iss.seq,
          issueTitle:iss.title,
          projectName:getProjectName(iss.project),
          status:iss.status,
          productionDate:iss.prodDate,
          progressNote:iss.progressNote
        }));
      weeks.push({weekLabel,startDate,endDate,journals,issues});
    }
    d=endDay+1;wk++;
  }
  return weeks;
}
function buildReportAiPayload(type){
  const period=getReportPeriod(type);
  const journals=Object.entries(JOURNALS)
    .filter(([date,content])=>content&&dateInRange(date,period.startDate,period.endDate))
    .sort(([a],[b])=>a.localeCompare(b))
    .map(([date,content])=>({date,content}));
  const issues=ISSUES
    .filter(iss=>iss.useYn!=='N'&&issueOverlapsPeriod(iss,period.startDate,period.endDate))
    .sort((a,b)=>getIssueReportStartDate(a).localeCompare(getIssueReportStartDate(b)))
    .map(iss=>({
      issueNo:iss.id||iss.seq,
      issueTitle:iss.title,
      projectName:getProjectName(iss.project),
      status:iss.status,
      productionDate:iss.prodDate,
      reportStartDate:getIssueReportStartDate(iss),
      reportEndDate:getIssueReportEndDate(iss),
      progressNote:iss.progressNote
    }));
  const payload={
    reportType:type,
    generatedAt:nowStr(),
    period,
    journals,
    issues,
    summary:{
      journalCount:journals.length,
      issueCount:issues.length,
      statusCounts:countBy(issues,iss=>iss.status),
      projectCounts:countBy(issues,iss=>iss.projectName)
    }
  };
  /* 월간보고는 주차별 구조 추가 */
  if(type==='month'){
    payload.weeks=buildWeeksForMonth(curYear,curMonth);
  }
  return payload;
}
function buildReportPrompt(payload){
  const reportName=payload.reportType==='month'?'월간보고':'주간보고';
  const periodText=`${payload.period.label} (${payload.period.startDate} ~ ${payload.period.endDate})`;

  const commonRules=[
    '작성 기준:',
    '- 업무일지 journals[].content 원문을 가장 우선 근거로 사용한다. 업무 관련 내용은 반드시 보고서에 반영한다.',
    '- issues[]는 이슈번호, 제목, 상태, 프로젝트, 운영반영일, 진행사항을 확인하기 위한 보조 자료로 사용한다.',
    '- 특정 이슈를 언급할 때는 반드시 "[issueNo] issueTitle" 형식으로 표기하되, "issueNo"가 없을 경우에는 "issueTitle"로만 표기한다.',
    '- issues[].reportStartDate가 해당되는 주차에는 issues[].progressNote의 내용도 진행 상황에 적절히 포함한다.',
    '- "issueNo: issueTitle", "issueNo - issueTitle", Markdown 굵게(**텍스트**) 형식은 절대 사용하지 않는다.',
    '- 데이터에 없는 내용은 추측하지 말고, 확인되지 않은 완료/배포/일정은 단정하지 않는다.',
    '- 한국어로 자연스럽고 간결하게 작성한다.',
    '',
    '출력 금지:',
    '- **굵게** 같은 Markdown 강조 표현을 절대 사용하지 않는다.',
    '- #, ##, ### 같은 Markdown 제목 표현을 사용하지 않는다.',
    '- 표(table) 형식을 사용하지 않는다.',
    '- JSON, payload, 데이터 미리보기 같은 내부 표현을 언급하지 않는다.',
    '- 제목 줄 없이 본문만 작성한다.',
	'- 주차별 이슈 없는 일반 작업은 "기타 작업" 항목 하나로만 묶는다.',
    '- 관련 데이터가 거의 없으면 데이터가 부족하다고 간단히 적는다.',
  ];

  let formatRules=[];
  if(payload.reportType==='week'){
    formatRules=[
      '',
      '출력 형식 (반드시 아래 형식을 그대로 따른다):',
      '<주요 성과>',
      '* [이슈코드] 이슈명',
      ' - 수행한 작업 내용과 확인된 결과가 있으면 1~2줄로 요약한다.',
      '',
      '<진행 중 업무>',
      '* [이슈코드] 이슈명',
      ' - 현재 진행 중인 작업과 다음에 이어서 할 작업을 한 문장으로 요약한다.',
      '',
      '<리스크/특이사항>',
      ' - 지연, 이슈, 확인 필요 사항 (없으면 이 섹션 생략)',
    ];
  } else {
    formatRules=[
      '',
      '출력 형식 (반드시 아래 형식을 그대로 따른다):',
      '- weeks[] 배열 순서대로 <1주차>, <2주차> ... <N주차> 섹션을 만든다.',
      '- 각 주차에 해당 weeks[].journals와 weeks[].issues를 근거로 작성한다.',
      '- 주차 데이터가 비어있으면 "- 업무 기록 없음" 으로 표기한다.',
      '',
      '<1주차>',
      '* [이슈코드] 이슈명',
      ' - 작업한 내용과 진행 상황, 성과, 이슈, 지연사항이 있으면 1~2줄로 요약한다.',
      '',
      '<2주차>',
      '* [이슈코드] 이슈명',
      ' - 작업한 내용과 진행 상황, 성과, 이슈, 지연사항이 있으면 1~2줄로 요약한다.',
      '',
      '(이하 주차 반복)',
      '',
      '<월간 종합>',
      '* 주요 성과 요약',
      ' - 이번 달에 완료했거나 핵심적으로 달성한 성과를 2~3줄로 압축하여 작성함',
      '* 진행중 업무 요약',
      ' - 다음 달로 넘어가는 현재 진행 중인 주요 이슈들을 한눈에 보게 정리함',
      '* 리스크 및 다음 계획 (없으면 생략)',
      ' - 개발 중단, 서버 이슈 등 긴급한 리스크와 차주 대응 방안을 간결하게 기술함',
    ];
  }

  return [
    `너는 업무일지와 이슈 데이터를 바탕으로 ${reportName}를 작성하는 비서다.`,
    '',
    `보고서 기간: ${periodText}`,
    '',
    ...commonRules,
    ...formatRules,
    '',
    '보고서 작성용 데이터:',
    JSON.stringify(payload,null,2)
  ].join('\n');
}
function renderReportAiPayloadPreview(type){
  const payload=buildReportAiPayload(type);
  const prompt=buildReportPrompt(payload);
  return `AI 전송 전 데이터/프롬프트 미리보기\n${payload.period.label} (${payload.period.startDate} ~ ${payload.period.endDate})\n\n[PAYLOAD]\n${JSON.stringify(payload,null,2)}\n\n[PROMPT]\n${prompt}`;
}
function mergeGeneratedReport(generatedText,existingText){
  const generated=(generatedText||'').trim();
  const existing=(existingText||'').trim();
  if(!generated)return existing;
  if(!existing)return generated;
  return `${generated}\n\n=================================\n\n${existing}`;
}
async function loadReport(type){
  const ta=document.getElementById(type==='month'?'month-report-ta':'week-report-ta');
  const period=getReportPeriod(type);
  ta.value='보고서를 불러오는 중입니다...';
  try{
    ta.value=type==='month'
      ?await monthlyLoad(period.key)
      :await weeklyLoad(period.key);
  }catch(e){
    ta.value='';
    alert('보고서를 불러오는 중 오류가 발생했습니다: '+e.message);
  }
}
async function saveReport(type){
  const ta=document.getElementById(type==='month'?'month-report-ta':'week-report-ta');
  const period=getReportPeriod(type);
  try{
    if(type==='month')await monthlySave(period.key,ta.value);
    else await weeklySave(period.key,ta.value);
    alert(`${period.label} 보고서를 저장했습니다.`);
  }catch(e){
    alert('보고서 저장 중 오류가 발생했습니다: '+e.message);
  }
}
function toggleMonthReport(){
  if(bottomMode==='month'){bottomMode='none';document.getElementById('month-report-box').style.display='none';return;}
  bottomMode='month';curWeekIdx=null;
  ['agenda-box','journal-box','week-report-box'].forEach(id=>document.getElementById(id).style.display='none');
  document.getElementById('month-report-box').style.display='block';
  const period=getMonthReportPeriod();
  document.getElementById('month-report-title').textContent=`${period.label} 월간보고`;
  loadReport('month');
}
function showWeekReport(idx){
  bottomMode='week';curWeekIdx=idx;
  ['agenda-box','journal-box','month-report-box'].forEach(id=>document.getElementById(id).style.display='none');
  document.getElementById('week-report-box').style.display='block';
  const period=getWeekReportPeriod(idx);
  document.getElementById('week-report-title').textContent=`${period.label} 주간보고`;
  loadReport('week');
}
async function genReport(type){
  const ta=document.getElementById(type==='month'?'month-report-ta':'week-report-ta');
  const btn=document.querySelector(`#${type==='month'?'month':'week'}-report-box .report-gen-btn`);
  const existingText=ta.value;
  const payload=buildReportAiPayload(type);
  const prompt=buildReportPrompt(payload);
  ta.value='AI 보고서를 생성하는 중입니다...';
  if(btn){btn.disabled=true;btn.textContent='생성 중...';}
  try{
    const generatedText=await callGemini(prompt);
    ta.value=mergeGeneratedReport(generatedText,existingText);
  }catch(e){
    ta.value=existingText;
    const msg=e.message&&e.message.includes('high demand')
      ?'AI 서버 사용량이 많아 보고서 생성에 실패했습니다. 잠시 후 다시 시도해주세요.'
      :'AI 보고서 생성 중 오류가 발생했습니다: '+e.message;
    alert(msg);
  }finally{
    if(btn){btn.disabled=false;btn.textContent='✦ AI 생성';}
  }
}
function changeMonth(dir){
  curMonth+=dir;
  if(curMonth>12){curMonth=1;curYear++;}
  if(curMonth<1){curMonth=12;curYear--;}
  document.getElementById('month-label').textContent=`${curYear}년 ${curMonth}월`;
  selDate=null;bottomMode='none';curWeekIdx=null;
  ['month-report-box','week-report-box','agenda-box','journal-box'].forEach(id=>document.getElementById(id).style.display='none');
  renderCalendar();
}
function goToday(){
  const t=new Date();curYear=t.getFullYear();curMonth=t.getMonth()+1;curWeekIdx=null;
  document.getElementById('month-label').textContent=`${curYear}년 ${curMonth}월`;
  renderCalendar();selectDate(t.getDate());
}

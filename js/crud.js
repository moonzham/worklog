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

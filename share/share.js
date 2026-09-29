(()=>{
const D=window.INPPL_DATA,$=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
let selectedWeek=D.weeks.at(-1)?.week||'';
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const fmtK=n=>`${Math.round((Number(n)||0)/1000)}k`;
const fmtPct=n=>`${n>=0?'+':''}${Math.round(Number(n)||0)}%`;
const medal=i=>i===0?'👑':i===1?'🥈':i===2?'🥉':i<9?'⭐':'🔥';
const weekNo=w=>{const m=String(w||'').match(/\d+/);return m?Number(m[0]):w};
const resultText=w=>w?.result==='win'?'WYGRANA':w?.result==='loss'?'PRZEGRANA':(w?.resultLabel||'BRAK WYNIKU');
const currentWeek=()=>D.weeks.find(w=>w.week===selectedWeek)||D.weeks.at(-1);
const limit=id=>Number($('#'+id).value)||15;

function renderWeekbar(){
 window.renderWeekPicker($('#weekbar'),D.weeks,selectedWeek,week=>{selectedWeek=week;render();});
}
function warRows(){
 const w=currentWeek(),threshold=Number($('#warThreshold').value)*1000;
 return (w?.entries||[]).slice().sort((a,b)=>b.points-a.points).filter(x=>x.points>=threshold).slice(0,limit('warLimit'));
}
function powerRows(){
 const w=currentWeek(),threshold=Number($('#powerThreshold').value);
 return D.players.map(p=>{
   const i=p.powers?.findIndex(x=>x.week===w.week)??-1;if(i<0)return null;
   const cur=p.powers[i],prev=i>0?p.powers[i-1]:null;
   if(!prev||!prev.powerM)return null;
   const pct=cur.growthPct??((cur.powerM-prev.powerM)/prev.powerM*100);
   return{nick:p.nick,pct,powerM:cur.powerM};
 }).filter(Boolean).filter(x=>x.pct>=threshold).sort((a,b)=>b.pct-a.pct).slice(0,limit('powerLimit'));
}
function rankHtml(rows,type){
 return rows.map((x,i)=>`<div class="rank-row"><div class="rank-place">${medal(i)}</div><div class="rank-name">${i+1}. ${esc(x.nick)}</div><div class="rank-value ${type}-value">${type==='war'?fmtK(x.points):fmtPct(x.pct)}</div></div>`).join('')||'<div class="empty">Brak graczy spełniających wybrany próg.</div>';
}
function warText(){
 const w=currentWeek(),rows=warRows(),threshold=Number($('#warThreshold').value);
 const head=threshold<=0?'Topka graczy:':`Topka graczy (powyżej ${threshold>=1000?(threshold/1000).toLocaleString(window.INPPL_I18N?.locale||'pl-PL')+'m':threshold+'k'} punktów):`;
 return [`🏆 WOJNA NR ${weekNo(w.week)} — ${resultText(w)}`,head,'',...rows.map((x,i)=>`${medal(i)} ${i+1}. ${x.nick} — ${fmtK(x.points)}`)].join('\n');
}
function powerText(){
 const w=currentWeek(),rows=powerRows(),threshold=Number($('#powerThreshold').value);
 const head=threshold<=-999?'Zaktualizowana moc graczy — Topka wzrostu:':`Zaktualizowana moc graczy — Topka wzrostu (powyżej +${threshold}%):`;
 return [`🏆 WOJNA NR ${weekNo(w.week)} — ${resultText(w)}`,head,'',...rows.map((x,i)=>`${medal(i)} ${i+1}. ${x.nick} — ${fmtPct(x.pct)}`)].join('\n');
}
async function copy(text){
 text=window.INPPL_I18N?.t(text)||text;
 try{await navigator.clipboard.writeText(text)}catch{
   const ta=document.createElement('textarea');ta.value=text;document.body.appendChild(ta);ta.select();document.execCommand('copy');ta.remove();
 }
 const t=$('#toast');t.classList.add('show');setTimeout(()=>t.classList.remove('show'),1200);
}
function render(){
 renderWeekbar();
 const w=currentWeek();
 $('#warSub').textContent=`${w.week} • ${resultText(w)} • ${w.date||''}`;
 $('#powerSub').textContent=`${w.week} • wzrost względem poprzedniego dostępnego snapshotu`;
 const wr=warRows(),pr=powerRows();
 $('#warRank').innerHTML=rankHtml(wr,'war');
 $('#powerRank').innerHTML=rankHtml(pr,'power');
 $('#warPreview').textContent=warText();
 $('#powerPreview').textContent=powerText();
}
function formatGeneratedAt(value){
 if(!value)return'Aktualizacja —';
 const d=new Date(value);if(Number.isNaN(d.getTime()))return'Aktualizacja —';
 return `Aktualizacja ${d.toLocaleDateString(window.INPPL_I18N?.locale||'pl-PL')} • ${d.toLocaleTimeString(window.INPPL_I18N?.locale||'pl-PL',{hour:'2-digit',minute:'2-digit'})}`;
}
function init(){
 const warRange=D.weeks.length?`${D.weeks[0].week}–${D.weeks.at(-1).week}`:'—';
 const powerRange=D.powerWeeks?.length?`${D.powerWeeks[0].week}–${D.powerWeeks.at(-1).week}`:'—';
 if($('#sideDataRange'))$('#sideDataRange').textContent=`Wojny ${warRange} • Power ${powerRange}`;
 if($('#dataUpdated'))$('#dataUpdated').textContent=formatGeneratedAt(D.generatedAt);
 ['warThreshold','warLimit','powerThreshold','powerLimit'].forEach(id=>{
   $('#'+id).addEventListener('change',render);
   $('#'+id).addEventListener('input',render);
 });
 $('#copyWar').onclick=()=>copy(warText());
 $('#copyPower').onclick=()=>copy(powerText());
 render();
}
init();
})();

const D = window.INPPL_DATA;
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
function cmpVal(a,b,dir=1){
 if(a==null)a=dir>0?Infinity:-Infinity;
 if(b==null)b=dir>0?Infinity:-Infinity;
 if(typeof a==='string'||typeof b==='string')return String(a??'').localeCompare(String(b??''),'pl',{numeric:true})*dir;
 return (Number(a)-Number(b))*dir;
}
function paintSortHeaders(root,state){
 $$(root+' th.sortable').forEach(th=>{
   th.classList.remove('sort-asc','sort-desc');
   if(th.dataset.sort===state.key)th.classList.add(state.dir>0?'sort-asc':'sort-desc');
 });
}

const fmt=n=>n==null?'—':Math.round(n).toLocaleString('pl-PL');
const compact=n=>{
  if(n==null)return'—'; const a=Math.abs(n);
  if(a>=1e12)return (n/1e12).toFixed(2).replace('.',',')+'t';
  if(a>=1e9)return (n/1e9).toFixed(2).replace('.',',')+'b';
  if(a>=1e6)return (n/1e6).toFixed(2).replace('.',',')+'m';
  if(a>=1e3)return (n/1e3).toFixed(1).replace('.',',')+'k';
  return fmt(n);
};
const power=n=>{
  if(n==null)return'—';
  // source unit = millions; convert to absolute notation k/m/b/t
  const absolute=n*1e6, a=Math.abs(absolute);
  if(a>=1e12)return (absolute/1e12).toFixed(2).replace('.',',')+'t';
  if(a>=1e9)return (absolute/1e9).toFixed(2).replace('.',',')+'b';
  if(a>=1e6)return (absolute/1e6).toFixed(2).replace('.',',')+'m';
  if(a>=1e3)return (absolute/1e3).toFixed(1).replace('.',',')+'k';
  return fmt(absolute);
};
const pct=n=>n==null?'—':`${n>=0?'+':''}${n.toFixed(1).replace('.',',')}%`;
const sign=n=>n>=0?'+':'';
const escapeHtml=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));

let charts={};
function killChart(id){ if(charts[id]){ charts[id].destroy(); delete charts[id]; } }
function baseOptions(formatter=compact){
  return {
    responsive:true, maintainAspectRatio:false, animation:{duration:650,easing:'easeOutQuart'},
    interaction:{mode:'index',intersect:false},
    plugins:{
      legend:{display:false},
      tooltip:{
        backgroundColor:'#121820',borderColor:'#2b3544',borderWidth:1,titleColor:'#f5f7fb',bodyColor:'#b9c4d2',
        padding:10,displayColors:true,callbacks:{label:c=>`${c.dataset.label}: ${formatter(c.parsed.y)}`}
      }
    },
    scales:{
      x:{grid:{display:false},border:{display:false},ticks:{color:'#657286',font:{size:9}}},
      y:{grid:{color:'rgba(255,255,255,.045)'},border:{display:false},ticks:{color:'#657286',font:{size:9},callback:v=>formatter(v)}}
    }
  };
}
function lineChart(id, labels, datasets, formatter=compact, extra={}){
  killChart(id); const el=$('#'+id); if(!el || typeof Chart==='undefined')return;
  const opts=baseOptions(formatter);
  opts.interaction={mode:'nearest',axis:'xy',intersect:false};
  opts.plugins.tooltip={
    backgroundColor:'#121820',borderColor:'#2b3544',borderWidth:1,titleColor:'#f5f7fb',bodyColor:'#b9c4d2',
    padding:10,displayColors:true,
    callbacks:{label:c=>`${c.dataset.label}: ${formatter(c.parsed.y)}`}
  };
  charts[id]=new Chart(el,{
    type:'line',
    data:{labels,datasets:datasets.map((d,i)=>({
      label:d.label,data:d.data,
      borderColor:d.color||['#f4b651','#6ea8ff','#ad88ff'][i%3],
      backgroundColor:d.fill?`${d.color||'#f4b651'}22`:'transparent',
      fill:!!d.fill,tension:d.tension??.28,
      borderWidth:d.borderWidth??(i===0?2.5:2),
      pointRadius:d.pointRadius??2.5,
      pointHoverRadius:d.pointHoverRadius??5,
      pointBackgroundColor:d.color||['#f4b651','#6ea8ff','#ad88ff'][i%3],
      pointBorderColor:d.pointBorderColor??'#0b1016',
      pointBorderWidth:d.pointBorderWidth??1.5,
      spanGaps:d.spanGaps??true,
      order:d.order??0
    }))},
    options:{...opts,...extra}
  });
}
function barChart(id, labels, values, formatter=compact, horizontal=false){
  killChart(id); const el=$('#'+id); if(!el || typeof Chart==='undefined')return;
  const opt=baseOptions(formatter); opt.indexAxis=horizontal?'y':'x'; opt.interaction={mode:'nearest',intersect:true}; opt.hover={mode:'nearest',intersect:true}; opt.plugins.tooltip.callbacks.label=c=>formatter(horizontal?c.parsed.x:c.parsed.y);
  if(horizontal){opt.scales.x.ticks.callback=v=>formatter(v);opt.scales.y.grid.display=false}
  charts[id]=new Chart(el,{type:'bar',data:{labels,datasets:[{
    label:'Punkty',data:values,backgroundColor:values.map((_,i)=>i<3?['rgba(244,182,81,.92)','rgba(209,164,89,.78)','rgba(176,141,85,.72)'][i]:'rgba(110,168,255,.28)'),
    borderColor:values.map((_,i)=>i<3?['#f4b651','#d8ad69','#af8c58'][i]:'rgba(110,168,255,.65)'),borderWidth:1,borderRadius:5,borderSkipped:false
  }]},options:opt});
}

const viewIds=['overview','warsView','playersView','outcastsView','power','compare','rosterReview','donations'];
function setView(id, push=true){
 if(!viewIds.includes(id)&&id!=='profile')id='overview';
 scrollPageTop();
  if(id!=='warsView')document.body.classList.remove('war-page-win','war-page-loss');
  $$('.view').forEach(v=>v.classList.toggle('active',v.id===id));
  $$('.nav-btn').forEach(b=>b.classList.toggle('active',b.dataset.view===id));
  if(push && id!=='profile') location.hash!== '#'+id && history.pushState(null,'','#'+id);
  if(id==='overview') requestAnimationFrame(renderOverviewCharts);
  if(id==='warsView') requestAnimationFrame(renderWarView);
  if(id==='power') requestAnimationFrame(()=>{renderPower();renderPowerCharts();});
  if(id==='outcastsView') requestAnimationFrame(renderOutcasts);
  if(id==='donations') requestAnimationFrame(renderDonations);
  if(id==='compare') requestAnimationFrame(renderCompare);
}
$$('.nav-btn[data-view]').forEach(b=>b.addEventListener('click',()=>setView(b.dataset.view)));

function tierClass(tier){
 let t=String(tier||'').trim().toUpperCase();
 t=t.replace(/^TIER[\s:_-]*/,'').trim();
 if(t==='S++')return'tier-spp';
 if(t==='S+')return'tier-sp';
 if(t==='S')return'tier-s';
 return'tier-other';
}
function tierLabel(tier){
 let t=String(tier||'').trim();
 return t.replace(/^TIER[\s:_-]*/i,'').trim()||'—';
}
function tierBadge(tier,large=false){
 return `<span class="tier-badge ${tierClass(tier)} ${large?'large':''}">${escapeHtml(tierLabel(tier))}</span>`;
}

function rangeLabel(items){
 if(!items?.length)return'—';
 if(items.length===1)return items[0].week;
 return `${items[0].week}–${items.at(-1).week}`;
}
function formatGeneratedAt(value){
 if(!value)return'Aktualizacja —';
 const d=new Date(value);
 if(Number.isNaN(d.getTime()))return'Aktualizacja —';
 return `Aktualizacja ${d.toLocaleDateString('pl-PL')} • ${d.toLocaleTimeString('pl-PL',{hour:'2-digit',minute:'2-digit'})}`;
}

function metric(label,value,sub,delta=null){
  return `<div class="metric"><div class="metric-label">${label}</div><div class="metric-val">${value}${delta!=null?`<span class="delta ${delta>=0?'positive':'negative'}">${pct(delta)}</span>`:''}</div><div class="metric-bottom">${sub}</div></div>`;
}
function formatDelta(v,formatter=compact){ return v==null?'—':`${sign(v)}${formatter(v)}`; }
function powerPct(deltaM,currentM){
  if(deltaM==null||currentM==null)return null;
  const prev=currentM-deltaM;
  return prev?deltaM/prev*100:null;
}
function fmtPct1(v){return v==null?'—':`${v>=0?'+':''}${v.toFixed(1).replace('.',',')}%`;}
function placeClass(place){
 if(place===1)return'place-1'; if(place===2)return'place-2'; if(place===3)return'place-3';
 if(place<=10)return'place-top10'; if(place<=20)return'place-top20'; if(place<=35)return'place-mid'; return'place-low';
}
function placeBadge(place){return `<span class="place-badge ${placeClass(place)}">#${place}</span>`;}
function playerButton(nick,extra=''){return `<button class="player-inline ${extra}" data-profile="${escapeHtml(nick)}">${escapeHtml(nick)}</button>`;}
const expandedLists={topFive:false,jumps:false,growth:false,powerGrowth:false,powerDrop:false,powerAnalytics:false};
let jumpMode='up';
function moreButton(id,key,total,shown){
 const b=$('#'+id);if(!b)return;
 const expanded=!!expandedLists[key];
 b.textContent=expanded?'Pokaż mniej':(total>shown?`Pokaż więcej (${total})`:'');
 b.style.display=b.textContent?'inline-flex':'none';
 b.onclick=()=>{expandedLists[key]=!expandedLists[key];if(['topFive','jumps','growth'].includes(key))renderOverview();else if(key==='powerAnalytics')renderPowerAnalytics();else renderPower();};
}



function renderOverview(){
  const l=D.latest,pw=D.powerWeeks.at(-1);
  $('#heroWeek').textContent=l.week;
  $('#heroTier').className=`chip hero-tier-chip ${tierClass(l.tier)}`;
  $('#heroTier').innerHTML=`<span class="hero-tier-label">TIER</span>${tierBadge(l.tier,true)}`;
  $('#heroDate').textContent=l.date||'';
  $('#heroScore').textContent=compact(l.total);
  $('#heroTrend').textContent=`${D.warDeltaPct>=0?'▲':'▼'} ${Math.abs(D.warDeltaPct||0).toFixed(1).replace('.',',')}% vs poprzedni tydzień`;
  $('#heroTrend').className='trend '+(D.warDeltaPct>=0?'up':'down');


}
function listRow(i,nick,meta,delta,formatter,secondary=''){
 const place=i+1;
 return `<div class="list-row ${placeClass(place)}"><div class="list-index">${placeBadge(place)}</div><div><div class="list-name">${playerButton(nick)}</div><div class="list-meta">${meta}${secondary?` • ${secondary}`:''}</div></div><div class="list-value ${delta>=0?'positive':'negative'}">${delta>=0?'▲':'▼'} ${formatter(Math.abs(delta))}</div></div>`;
}


let selectedOverviewPlayer = D.players.find(p=>p.nick==='Wosiu'&&p.active!==false)?.nick || D.players.find(p=>p.active!==false)?.nick || '';
let selectedPowerPlayer = selectedOverviewPlayer;

function allPlayerWarDatasets(selectedNick){
  const labels=D.weeks.map(w=>w.week);
  const muted=D.players.map(p=>({
    label:p.nick,
    data:labels.map(w=>p.history.find(h=>h.week===w)?.points??null),
    color:'rgba(139,151,167,.18)', borderWidth:1, pointRadius:0, pointHoverRadius:3, tension:.18, order:3
  }));
  const avg={
    label:'Średnia klanu',data:D.weeks.map(w=>w.avg),
    color:'#f4b651',borderWidth:3.6,pointRadius:3.2,pointHoverRadius:5.5,tension:.22,order:1
  };
  const p=D.players.find(x=>x.nick===selectedNick);
  const selected=p?{
    label:p.nick,data:labels.map(w=>p.history.find(h=>h.week===w)?.points??null),
    color:'#55b7ff',borderWidth:3.2,pointRadius:3,pointHoverRadius:6,tension:.22,order:0
  }:null;
  return [...muted,avg,...(selected?[selected]:[])];
}
function allPlayerPowerDatasets(selectedNick){
  const labels=D.powerWeeks.map(w=>w.week);
  const muted=D.players.map(p=>({
    label:p.nick,
    data:labels.map(w=>p.powers.find(h=>h.week===w)?.powerM??null),
    color:'rgba(139,151,167,.18)',borderWidth:1,pointRadius:0,pointHoverRadius:3,tension:.18,order:3
  }));
  const avg={
    label:'Średnia klanu',data:D.powerWeeks.map(w=>w.avgM),
    color:'#f4b651',borderWidth:3.6,pointRadius:3.2,pointHoverRadius:5.5,tension:.22,order:1
  };
  const p=D.players.find(x=>x.nick===selectedNick);
  const selected=p?{
    label:p.nick,data:labels.map(w=>p.powers.find(h=>h.week===w)?.powerM??null),
    color:'#55b7ff',borderWidth:3.2,pointRadius:3,pointHoverRadius:6,tension:.22,order:0
  }:null;
  return [...muted,avg,...(selected?[selected]:[])];
}
function renderOverviewCharts(){
 const war=D.weeks.at(-1),pw=D.powerWeeks.at(-1);
 $('#overviewWarShareWeek').textContent=war?.week||'—';$('#overviewPowerShareWeek').textContent=pw?.week||'—';
 renderClanShare(war?.entries||[],'overviewWar',compact,fmt);renderClanShare(powerShareRows(pw?.week),'overviewPower',power,power);
 renderOutcastSummary(D.players.filter(p=>p.active===false),'overviewOutcastSummary');
 lineChart('overviewTotalPointsChart',D.weeks.map(w=>w.week),[{label:'Punkty',data:D.weeks.map(w=>w.total),color:'#f4b651',fill:true}],compact);
 lineChart('overviewTotalPowerChart',D.powerWeeks.map(w=>w.week),[{label:'Power',data:D.powerWeeks.map(w=>w.totalM),color:'#6ea8ff',fill:true}],power);

  const warLabels=D.weeks.map(w=>w.week);
  lineChart('overviewWarChart',warLabels,allPlayerWarDatasets(selectedOverviewPlayer),compact);
  const powerLabels=D.powerWeeks.map(w=>w.week);
  lineChart('overviewPowerChart',powerLabels,allPlayerPowerDatasets(selectedPowerPlayer),power);
}
$('#overviewPlayerSelect').onchange=()=>{
  selectedOverviewPlayer=$('#overviewPlayerSelect').value;
  // keep power selection synced if player has power history
  selectedPowerPlayer=selectedOverviewPlayer;
  $('#overviewPowerPlayerSelect').value=selectedPowerPlayer;
  $('#powerPagePlayerSelect').value=selectedPowerPlayer;
  renderOverviewCharts();
  if($('#power').classList.contains('active'))renderPowerCharts();
};
$('#overviewPowerPlayerSelect').onchange=()=>{
  selectedPowerPlayer=$('#overviewPowerPlayerSelect').value;
  $('#powerPagePlayerSelect').value=selectedPowerPlayer;
  renderOverviewCharts();
};
$('#powerPagePlayerSelect').onchange=()=>{
  selectedPowerPlayer=$('#powerPagePlayerSelect').value;
  $('#overviewPowerPlayerSelect').value=selectedPowerPlayer;
  renderPowerCharts();
};


let selectedPowerSnapshot=D.powerWeeks.at(-1)?.week || '';
let powerSearch='';
let powerRankFilter='';
let powerSort='growthPct';
let powerSortDir=-1;
let powerAnalyticsMode='growthPct';

let selectedWeek=D.latest.week;
function renderWeekBar(){
 window.renderWeekPicker($('#weekbar'),D.weeks,selectedWeek,week=>{selectedWeek=week;renderWeekBar();renderWarView();});
}
function getWarDeltas(w){
 const idx=D.weeks.findIndex(x=>x.week===w.week); if(idx<=0)return [];
 const prev=D.weeks[idx-1]; const pm=Object.fromEntries(prev.entries.map(e=>[e.nick,e.points]));
 return w.entries.filter(e=>pm[e.nick]!=null).map(e=>({...e,delta:e.points-pm[e.nick]}));
}
let warSort={key:'points',dir:-1};

function clanShareMedal(i,n){return i===0?'👑':i===n-1?'💩':i===1?'🥈':i===2?'🥉':i<9?'⭐':'🔥';}
function renderClanShare(rows,prefix,totalFormatter,valueFormatter){
 const entries=[...rows].sort((a,b)=>b.points-a.points),total=entries.reduce((a,e)=>a+e.points,0),id=prefix+'Distribution';killChart(id);
 const share=n=>new Intl.NumberFormat(window.INPPL_I18N?.locale||'pl-PL',{maximumFractionDigits:2}).format(total?n/total*100:0)+'%';
 const lo=entries.at(-1)?.points||0,hi=entries[0]?.points||0,stops=[[239,68,68],[250,204,21],[74,190,92],[22,101,52]];
 const colors=entries.map(e=>{const pos=(hi>lo?(e.points-lo)/(hi-lo):hi>0?1:0)*3,i=Math.min(2,Math.floor(pos));return 'rgb('+stops[i].map((v,k)=>Math.round(v+(stops[i+1][k]-v)*(pos-i))).join(',')+')';});
 $('#'+prefix+'DonutTotal').textContent=totalFormatter(total);$('#'+prefix+'DonutCount').textContent=entries.length+(window.INPPL_I18N?.language==='en'?' players':' graczy');
 $('#'+prefix+'DistributionLegend').innerHTML=entries.map((e,i)=>'<button class="war-share-row" data-profile="'+escapeHtml(e.nick)+'"><span class="war-share-dot" style="background:'+colors[i]+'"></span><span class="war-share-name">'+clanShareMedal(i,entries.length)+' '+escapeHtml(e.nick)+'</span><span class="war-share-points">'+valueFormatter(e.points)+'</span><strong>'+share(e.points)+'</strong></button>').join('');
 if(prefix.startsWith('overview')){
  const en=window.INPPL_I18N?.language==='en';
  const renderRanks=(list,bottom)=>'<div class="overview-rank-group"><div class="overview-rank-title">'+(bottom?(en?'Bottom 3':'Najniższe 3'):'Top 3')+'</div>'+list.map(e=>{
   const rank=entries.indexOf(e);
   return '<button class="overview-rank-row" data-profile="'+escapeHtml(e.nick)+'"><span class="overview-rank-nick">'+clanShareMedal(rank,entries.length)+' '+escapeHtml(e.nick)+'</span><strong>'+valueFormatter(e.points)+'</strong></button>';
  }).join('')+'</div>';
  $('#'+prefix+'DistributionLegend').innerHTML='<div class="overview-rank-grid">'+renderRanks(entries.slice(0,3),false)+renderRanks(entries.slice(-3).reverse(),true)+'</div>';
 }
 if(typeof Chart==='undefined')return;
 charts[id]=new Chart($('#'+id),{type:'doughnut',data:{labels:entries.map(e=>e.nick),datasets:[{data:entries.map(e=>e.points),backgroundColor:colors,borderColor:'#0d131b',borderWidth:2,hoverOffset:10,hoverBorderColor:'#fff'}]},options:{responsive:true,maintainAspectRatio:false,cutout:'68%',layout:{padding:14},plugins:{legend:{display:false},tooltip:{backgroundColor:'#121820',titleColor:'#f5f7fb',bodyColor:'#b9c4d2',padding:12,callbacks:{label:c=>valueFormatter(c.parsed)+' · '+share(c.parsed)}}},onClick:(event,elements,chart)=>{const active=elements.map(({datasetIndex,index})=>({datasetIndex,index}));chart.setActiveElements(active);chart.tooltip.setActiveElements(active,{x:event.x,y:event.y});chart.update('none');}}});
}
function powerShareRows(week){return D.players.filter(p=>p.active!==false).flatMap(p=>{const value=p.powers?.find(h=>h.week===week)?.powerM;return Number.isFinite(value)?[{nick:p.nick,points:value}]:[];});}
function renderPowerShare(){ $('#powerShareWeek').textContent=selectedPowerSnapshot;renderClanShare(powerShareRows(selectedPowerSnapshot),'power',power,power);}
function renderOutcastSummary(players,targetId){
 const en=window.INPPL_I18N?.language==='en';const values=players.flatMap(p=>{const last=p.history?.at(-1),avg=last&&D.weeks.find(w=>w.week===last.week)?.avg;return avg>0?[last.points/avg*100]:[];}).sort((a,b)=>a-b);
 const target=$('#'+targetId);if(!values.length){target.innerHTML='<div class="empty">Brak wyników</div>';return;}
 const groups=[{label:en?'Below half the average':'Poniżej połowy średniej',color:'#e66565',count:values.filter(v=>v<50).length},{label:en?'Half to below average':'Od połowy do poniżej średniej',color:'#f4b651',count:values.filter(v=>v>=50&&v<100).length},{label:en?'At or above average':'Na poziomie średniej lub wyżej',color:'#47b877',count:values.filter(v=>v>=100).length}];
 const mid=Math.floor(values.length/2),median=values.length%2?values[mid]:(values[mid-1]+values[mid])/2,percent=n=>new Intl.NumberFormat(en?'en-GB':'pl-PL',{maximumFractionDigits:1}).format(n)+'%';
 target.innerHTML='<div class="outcast-distribution"><div class="outcast-median"><strong>'+percent(median)+'</strong><span>'+(en?'Median share of clan average':'Mediana względem średniej klanu')+'</span><small>'+(en?'Players compared: ':'Porównani gracze: ')+values.length+'</small></div><div><div class="outcast-distribution-bar" aria-hidden="true">'+groups.map(g=>'<span style="width:'+g.count/values.length*100+'%;background:'+g.color+'"></span>').join('')+'</div><div class="outcast-distribution-key">'+groups.map(g=>'<div><span class="war-share-dot" style="background:'+g.color+'"></span><span>'+g.label+'</span><strong>'+g.count+' <small>('+percent(g.count/values.length*100)+')</small></strong></div>').join('')+'</div></div></div>';
}
let selectedOutcast='';
function renderOutcastCharts(players){
 const select=$('#outcastChartPlayer');if(!players.some(p=>p.nick===selectedOutcast))selectedOutcast=players[0]?.nick||'';
 select.innerHTML=players.map(p=>'<option value="'+escapeHtml(p.nick)+'">'+escapeHtml(p.nick)+'</option>').join('');select.value=selectedOutcast;select.onchange=()=>{selectedOutcast=select.value;renderOutcastCharts(players);};
 $('#outcastChartNote').textContent=(window.INPPL_I18N?.language==='en'?'All former players • highlighted: ':'Wszyscy byli gracze • podświetlony: ')+selectedOutcast;
 const series=(weeks,field,value,avg)=>[...players.map(p=>({label:p.nick,data:weeks.map(w=>p[field]?.find(h=>h.week===w.week)?.[value]??null),color:p.nick===selectedOutcast?'#f4b651':'rgba(148,163,184,.4)',borderWidth:p.nick===selectedOutcast?3:1.2,pointRadius:p.nick===selectedOutcast?3:1,order:p.nick===selectedOutcast?0:2,spanGaps:false})),{label:'Średnia klanu',data:weeks.map(w=>w[avg]??null),color:'#6ea8ff',order:1,spanGaps:false}];
 lineChart('outcastPointsChart',D.weeks.map(w=>w.week),series(D.weeks,'history','points','avg'));
 lineChart('outcastPowerChart',D.powerWeeks.map(w=>w.week),series(D.powerWeeks,'powers','powerM','avgM'),power);
 for(const id of ['outcastPointsChart','outcastPowerChart'])if(charts[id]){charts[id].options.scales.y.beginAtZero=true;charts[id].update();}
 renderOutcastSummary(players,'outcastComparisonList');
}

function renderWarView(){
 const w=D.weeks.find(x=>x.week===selectedWeek); const deltas=getWarDeltas(w);
 const best=[...deltas].sort((a,b)=>b.delta-a.delta)[0], worst=[...deltas].sort((a,b)=>a.delta-b.delta)[0];
 const tierFocus=$('#warTierFocus');
 if(tierFocus) tierFocus.className=`war-tier-focus ${tierClass(w.tier)}`;
 if($('#warTierValue')) $('#warTierValue').textContent=tierLabel(w.tier);
 if($('#warTierWeek')) $('#warTierWeek').textContent=`${w.week}${w.date?` • ${w.date}`:''}`;
 document.body.classList.remove('war-page-win','war-page-loss');
 const warPageClass=w.result==='win'?'war-page-win':w.result==='loss'?'war-page-loss':null;
 if(warPageClass) document.body.classList.add(warPageClass);
 const warSummary=$('#warSummary');
 warSummary.classList.remove('war-win','war-loss','war-unknown');
 warSummary.classList.add(w.result==='win'?'war-win':w.result==='loss'?'war-loss':'war-unknown');
 const resultText=w.resultLabel||'BRAK WYNIKU';
 const typeText=w.resultType&&w.resultType.toUpperCase()!==resultText?escapeHtml(w.resultType):'';
 warSummary.innerHTML=[
   ['Wynik wojny',`<span class="war-result-badge ${w.result==='win'?'win':w.result==='loss'?'loss':'unknown'}">${escapeHtml(resultText)}</span>${typeText?`<span class="war-result-type">${typeText}</span>`:''}`],
   ['Suma punktów',compact(w.total)],['Średnia',compact(w.avg)],['Gracze',w.count],['Lider punktów',escapeHtml(w.winner)]
 ].map((x,i)=>`<div class="mini-stat ${i===0?'war-result-stat':''}"><div class="l">${x[0]}</div><div class="v">${x[1]}</div></div>`).join('');
 $('#warDeltaNote').innerHTML=best?`Największy wzrost: <b class="positive">${escapeHtml(best.nick)} +${compact(best.delta)}</b> &nbsp;•&nbsp; Największy spadek: <b class="negative">${escapeHtml(worst.nick)} ${compact(worst.delta)}</b>`:'Brak poprzedniego tygodnia do porównania.';
 let warEntries=w.entries.slice().sort((a,b)=>{
   const key=warSort.key;
   return cmpVal(a[key],b[key],warSort.dir);
 });
 paintSortHeaders('#warsView',warSort);
 $('#warTable').innerHTML=warEntries.map(e=>`<tr class="${placeClass(e.place)}"><td>${placeBadge(e.place)}</td><td><button class="player-link" data-profile="${escapeHtml(e.nick)}">${escapeHtml(e.nick)}</button></td><td><span class="rank-tag">${escapeHtml(e.rank)}</span></td><td class="num"><b>${fmt(e.points)}</b></td><td class="num">${e.position??'—'}</td></tr>`).join('');
 requestAnimationFrame(()=>renderClanShare(w.entries,'war',compact,fmt));
}

$$('#warsView th.sortable').forEach(th=>th.onclick=()=>{
 const k=th.dataset.sort;
 if(warSort.key===k)warSort.dir*=-1;else{warSort.key=k;warSort.dir=(k==='nick'||k==='rank')?1:-1}
 renderWarView();
});

let playerSort={key:'latestPlace',dir:1};
function formTag(v){
 if(v==null)return'<span class="form-pill flat">brak</span>';
 if(v>30000)return`<span class="form-pill up">▲ ${compact(v)}</span>`;
 if(v<-30000)return`<span class="form-pill down">▼ ${compact(Math.abs(v))}</span>`;
 return'<span class="form-pill flat">● stabilnie</span>';
}
function renderPlayers(){
 const q=($('#playerSearch').value||'').toLowerCase().trim();
 const rk=$('#rankFilter').value;
 let arr=D.players.filter(p=>p.active!==false&&(!q||p.nick.toLowerCase().includes(q))&&(!rk||p.rank===rk));
 arr.sort((a,b)=>{
   let av=a[playerSort.key], bv=b[playerSort.key];
   if(av==null)av=playerSort.dir>0?Infinity:-Infinity;if(bv==null)bv=playerSort.dir>0?Infinity:-Infinity;
   if(typeof av==='string')return av.localeCompare(bv)*playerSort.dir;
   return (av-bv)*playerSort.dir;
 });
 paintSortHeaders('#playersView',playerSort);
 $('#playersCount').textContent=`${arr.length} graczy`;
 $('#playersTable').innerHTML=arr.map(p=>`<tr class="${p.latestPlace?placeClass(p.latestPlace):''}">
 <td>${p.latestPlace?placeBadge(p.latestPlace):'—'}</td><td><button class="player-link" data-profile="${escapeHtml(p.nick)}">${escapeHtml(p.nick)}</button></td>
 <td><span class="rank-tag">${escapeHtml(p.rank)}</span></td><td class="num">${fmt(p.latestPoints)}</td><td class="num">${fmt(p.avg)}</td><td class="num">${fmt(p.best)}</td>
 <td class="num">${power(p.powerM)}</td><td class="num ${p.powerChangeM>0?'positive':p.powerChangeM<0?'negative':''}">${formatDelta(p.powerChangeM,power)}</td><td>${formTag(p.formDelta)}</td></tr>`).join('');
}
$('#playerSearch').oninput=renderPlayers;$('#rankFilter').onchange=renderPlayers;
$$('#playersView th.sortable').forEach(th=>th.onclick=()=>{let k=th.dataset.sort; if(playerSort.key===k)playerSort.dir*=-1;else{playerSort.key=k;playerSort.dir=1}renderPlayers()});


let outcastSearch='';
let outcastSort='lastWeek';
let outcastSortDir=-1;
function weekNumber(week){
 const m=String(week||'').match(/\d+/);return m?Number(m[0]):-1;
}
function renderOutcasts(){
 const all=D.players.filter(p=>p.active===false);
 const q=(outcastSearch||'').trim().toLowerCase();
 let arr=all.filter(p=>!q||p.nick.toLowerCase().includes(q));
 arr.sort((a,b)=>{
   const va=outcastSort==='lastWeek'?weekNumber(a.history?.at(-1)?.week):a[outcastSort];
   const vb=outcastSort==='lastWeek'?weekNumber(b.history?.at(-1)?.week):b[outcastSort];
   return cmpVal(va,vb,outcastSortDir);
 });
 paintSortHeaders('#outcastsView',{key:outcastSort,dir:outcastSortDir});
 renderOutcastCharts(arr);
 const wars=all.reduce((s,p)=>s+(p.warCount||0),0);
 const best=[...all].sort((a,b)=>(b.best??0)-(a.best??0))[0];
 const strongest=[...all].filter(p=>p.powerM!=null).sort((a,b)=>b.powerM-a.powerM)[0];
 $('#outcastsCount').textContent=`${all.length} byłych graczy`;
 $('#outcastSummary').innerHTML=[
   ['Archiwum',all.length,'zachowanych profili'],
   ['Łącznie wojen',wars,'wpisów graczy'],
   ['Najwyższy rekord',best?compact(best.best):'—',best?best.nick:'—'],
   ['Najwyższy zapisany Power',strongest?power(strongest.powerM):'—',strongest?strongest.nick:'—']
 ].map(x=>`<div class="outcast-kpi"><span>${x[0]}</span><b>${x[1]}</b><small>${escapeHtml(String(x[2]))}</small></div>`).join('');
 $('#outcastsTable').innerHTML=arr.map(p=>{
   const last=p.history?.at(-1)||null;
   const pct=p.powerChangePct??powerPct(p.powerChangeM,p.powerM);
   return `<tr class="outcast-row">
     <td><button class="player-link" data-profile="${escapeHtml(p.nick)}">${escapeHtml(p.nick)}</button><span class="out-badge">POZA KLANEM</span></td>
     <td><span class="rank-tag">${escapeHtml(p.rank||'—')}</span></td>
     <td>${last?`${escapeHtml(last.week)} • ${escapeHtml(last.date||'')}`:'—'}</td>
     <td class="num">${fmt(p.latestPoints)}</td>
     <td class="num">${fmt(p.avg)}</td>
     <td class="num"><b>${fmt(p.best)}</b>${p.bestWeek?`<small class="cell-sub">${escapeHtml(p.bestWeek)}</small>`:''}</td>
     <td class="num">${p.warCount||0}</td>
     <td class="num">${power(p.powerM)}</td>
     <td class="num ${p.powerChangeM>0?'positive':p.powerChangeM<0?'negative':''}">${p.powerChangeM==null?'—':`${formatDelta(p.powerChangeM,power)}<small class="cell-sub">${fmtPct1(pct)}</small>`}</td>
   </tr>`;
 }).join('') || '<tr><td colspan="9" class="empty">Brak wyników</td></tr>';
}

$$('#outcastsView th.sortable').forEach(th=>th.onclick=()=>{
 const k=th.dataset.sort;
 if(outcastSort===k)outcastSortDir*=-1;else{outcastSort=k;outcastSortDir=(k==='nick'||k==='rank')?1:-1}
 renderOutcasts();
});

function getPowerPlayerRows(){
  let rows=D.players.filter(p=>p.active!==false).map(p=>{
    const latest=p.powers?.at(-1)||null;
    const prev=p.powers?.length>1?p.powers.at(-2):null;
    const growthPct=latest?.growthPct ?? p.powerChangePct ?? (prev&&prev.powerM&&latest?((latest.powerM-prev.powerM)/prev.powerM*100):null);
    const growthAbs=latest&&prev?latest.powerM-prev.powerM:p.powerChangeM;
    return {p,latest,prev,growthPct,growthAbs};
  });
  const q=(powerSearch||'').trim().toLowerCase();
  if(q)rows=rows.filter(x=>x.p.nick.toLowerCase().includes(q));
  if(powerRankFilter)rows=rows.filter(x=>x.p.rank===powerRankFilter);
  rows.sort((a,b)=>{
    if(powerSort==='power')return (b.latest?.powerM??b.p.powerM??-Infinity)-(a.latest?.powerM??a.p.powerM??-Infinity);
    if(powerSort==='growthAbs')return (b.growthAbs??-Infinity)-(a.growthAbs??-Infinity);
    if(powerSort==='nick')return a.p.nick.localeCompare(b.p.nick,'pl');
    return (b.growthPct??-Infinity)-(a.growthPct??-Infinity);
  });
  return rows;
}

function renderPower(){
 const pw=D.powerWeeks.at(-1), prevPw=D.powerWeeks.at(-2);
 if(!pw){
   $('#powerTotal').textContent='—';$('#powerTotalSub').textContent='Brak snapshotów Power';
   $('#powerDelta').textContent='—';$('#powerDeltaSub').textContent='—';
   $('#powerSnapshotTable').innerHTML='<tr><td colspan="6" class="empty">Brak danych Power</td></tr>';
   return;
 }
 $('#powerTotal').textContent=power(pw.totalM);$('#powerTotalSub').textContent=`${pw.count} graczy • snapshot ${pw.week}`;
 $('#powerDelta').textContent=pct(D.powerDeltaPct);$('#powerDelta').className=D.powerDeltaPct>=0?'positive':'negative';
 $('#powerDeltaSub').textContent=prevPw?`${pw.week} vs ${prevPw.week}`:'brak poprzedniego snapshotu';

 const growthLim=expandedLists.powerGrowth?D.topGrowth.length:7;
 $('#powerGrowthList').innerHTML=D.topGrowth.slice(0,growthLim).map((x,i)=>listRow(i,x.nick,power(x.powerM),x.pct,fmtPct1,formatDelta(x.deltaM,power))).join('');
 moreButton('powerGrowthMore','powerGrowth',D.topGrowth.length,growthLim);
 const drops=D.topDrops.filter(x=>x.pct<0);
 const dropLim=expandedLists.powerDrop?drops.length:7;
 $('#powerDropList').innerHTML=drops.slice(0,dropLim).map((x,i)=>listRow(i,x.nick,power(x.powerM),x.pct,fmtPct1,formatDelta(x.deltaM,power))).join('') || '<div class="empty">Brak spadków w ostatnim snapshotcie</div>';
 moreButton('powerDropMore','powerDrop',drops.length,dropLim);

 renderPowerSnapshotBar();
 renderPowerAnalytics();
}
function renderPowerSnapshotBar(){
 const weeks=D.powerWeeks.map(w=>({...w,...(D.weeks.find(war=>war.week===w.week)||{})}));
 window.renderWeekPicker($('#powerSnapshotBar'),weeks,selectedPowerSnapshot,week=>{selectedPowerSnapshot=week;renderPowerSnapshotBar();});
 renderPowerSnapshot();
}
function renderPowerSnapshot(){
 const snap=D.powerWeeks.find(w=>w.week===selectedPowerSnapshot); if(!snap)return;
 renderPowerShare();
 const idx=D.powerWeeks.findIndex(w=>w.week===selectedPowerSnapshot);
 const prev=idx>0?D.powerWeeks[idx-1]:null;
 $('#powerSnapshotSummary').innerHTML=[
   ['Łączna moc',power(snap.totalM)],['Średnia',power(snap.avgM)],['Gracze',snap.count],['Zmiana klanu',prev?fmtPct1((snap.totalM/prev.totalM-1)*100):'—']
 ].map(x=>`<div class="mini-stat"><div class="l">${x[0]}</div><div class="v">${x[1]}</div></div>`).join('');

 let arr=D.players.filter(p=>p.active!==false).map(p=>{
   const cur=p.powers.find(x=>x.week===selectedPowerSnapshot);
   if(!cur)return null;
   const pi=p.powers.findIndex(x=>x.week===selectedPowerSnapshot);
   const prv=pi>0?p.powers[pi-1]:null;
   const delta=prv?cur.powerM-prv.powerM:null;
   const pc=cur.growthPct??(prv&&prv.powerM?delta/prv.powerM*100:null);
   return {nick:p.nick,rank:p.rank,powerM:cur.powerM,deltaM:delta,pct:pc};
 }).filter(Boolean);

 const q=(powerSearch||'').trim().toLowerCase();
 if(q)arr=arr.filter(x=>x.nick.toLowerCase().includes(q));
 if(powerRankFilter)arr=arr.filter(x=>x.rank===powerRankFilter);

 const powerKey=({power:'powerM',growthAbs:'deltaM',growthPct:'pct'}[powerSort]||powerSort);
 arr.sort((a,b)=>cmpVal(a[powerKey],b[powerKey],powerSortDir));
 paintSortHeaders('#power',{key:powerKey,dir:powerSortDir});

 if($('#powerFilterCount'))$('#powerFilterCount').textContent=`${arr.length} aktywnych graczy • ${selectedPowerSnapshot}`;

 $('#powerSnapshotTable').innerHTML=arr.map((x,i)=>`<tr class="${placeClass(i+1)}">
   <td>${placeBadge(i+1)}</td>
   <td><button class="player-link" data-profile="${escapeHtml(x.nick)}">${escapeHtml(x.nick)}</button></td>
   <td><span class="rank-tag">${escapeHtml(x.rank||'')}</span></td>
   <td class="num growth-pct-cell ${x.pct>0?'positive':x.pct<0?'negative':''}"><b>${fmtPct1(x.pct)}</b></td>
   <td class="num ${x.deltaM>0?'positive':x.deltaM<0?'negative':''}">${x.deltaM==null?'—':formatDelta(x.deltaM,power)}</td>
   <td class="num"><b>${power(x.powerM)}</b></td>
 </tr>`).join('');
}

$$('#power th.sortable').forEach(th=>th.onclick=()=>{
 if(!th.closest('#powerSnapshotTable') && th.closest('table')?.querySelector('#powerSnapshotTable')===null)return;
 const map={growthRank:'growthPct',pct:'growthPct',deltaM:'growthAbs',powerM:'power'};
 const k=map[th.dataset.sort]||th.dataset.sort;
 if(powerSort===k)powerSortDir*=-1;else{powerSort=k;powerSortDir=(k==='nick'||k==='rank')?1:-1}
 renderPowerSnapshot();
});

let powerAnalyticsSort={key:null,dir:-1};
function renderPowerAnalytics(){
 $$('[data-power-analytics]').forEach(b=>b.classList.toggle('active',b.dataset.powerAnalytics===powerAnalyticsMode));
 const head=$('#powerAnalyticsHead'), body=$('#powerAnalyticsBody');
 let source=[], mode=powerAnalyticsMode;
 if(mode==='spikePct')source=D.powerSpikesTopPct;
 else if(mode==='spikeAbs')source=D.powerSpikesTopAbs;
 else if(mode==='growthPct')source=D.fastestGrowthPct;
 else source=D.fastestGrowthAbs;
 if(powerAnalyticsSort.key){
   source=source.slice().sort((a,b)=>cmpVal(a[powerAnalyticsSort.key],b[powerAnalyticsSort.key],powerAnalyticsSort.dir));
 }
 const lim=expandedLists.powerAnalytics?source.length:15;
 const shown=source.slice(0,lim); let rows=[];
 if(mode==='spikePct'||mode==='spikeAbs'){
   head.innerHTML='<tr><th>#</th><th class="sortable" data-sort="nick">Gracz</th><th>Okres</th><th class="sortable num" data-sort="fromM">Przed</th><th class="sortable num" data-sort="toM">Po</th><th class="sortable num" data-sort="deltaM">Spike</th><th class="sortable num" data-sort="pct">Spike %</th></tr>';
   rows=shown.map((x,i)=>`<tr class="${placeClass(i+1)}"><td>${placeBadge(i+1)}</td><td><button class="player-link" data-profile="${escapeHtml(x.nick)}">${escapeHtml(x.nick)}</button></td><td>${x.fromWeek} → ${x.toWeek}</td><td class="num">${power(x.fromM)}</td><td class="num">${power(x.toM)}</td><td class="num positive">+${power(x.deltaM)}</td><td class="num positive"><b>${fmtPct1(x.pct)}</b></td></tr>`);
 }else if(mode==='growthPct'){
   head.innerHTML='<tr><th>#</th><th class="sortable" data-sort="nick">Gracz</th><th class="sortable num" data-sort="avgPct">Śr. wzrost / snapshot</th><th class="sortable num" data-sort="totalM">Łączny wzrost</th><th class="sortable num" data-sort="totalPct">Łącznie %</th></tr>';
   rows=shown.map((x,i)=>`<tr class="${placeClass(i+1)}"><td>${placeBadge(i+1)}</td><td><button class="player-link" data-profile="${escapeHtml(x.nick)}">${escapeHtml(x.nick)}</button></td><td class="num positive"><b>${fmtPct1(x.avgPct)}</b></td><td class="num positive">+${power(x.totalM)}</td><td class="num positive">${fmtPct1(x.totalPct)}</td></tr>`);
 }else{
   head.innerHTML='<tr><th>#</th><th class="sortable" data-sort="nick">Gracz</th><th class="sortable num" data-sort="avgM">Śr. wzrost / snapshot</th><th class="sortable num" data-sort="totalM">Łączny wzrost</th><th class="sortable num" data-sort="totalPct">Łącznie %</th></tr>';
   rows=shown.map((x,i)=>`<tr class="${placeClass(i+1)}"><td>${placeBadge(i+1)}</td><td><button class="player-link" data-profile="${escapeHtml(x.nick)}">${escapeHtml(x.nick)}</button></td><td class="num positive"><b>+${power(x.avgM)}</b></td><td class="num positive">+${power(x.totalM)}</td><td class="num positive">${fmtPct1(x.totalPct)}</td></tr>`);
 }
 body.innerHTML=rows.join('');
 $$('#powerAnalyticsHead th.sortable').forEach(th=>th.onclick=()=>{
   const k=th.dataset.sort;
   if(powerAnalyticsSort.key===k)powerAnalyticsSort.dir*=-1;else{powerAnalyticsSort.key=k;powerAnalyticsSort.dir=(k==='nick'?1:-1)}
   renderPowerAnalytics();
 });
 paintSortHeaders('#powerAnalyticsHead',{key:powerAnalyticsSort.key,dir:powerAnalyticsSort.dir});
 moreButton('powerAnalyticsMore','powerAnalytics',source.length,lim);
}
$$('[data-power-analytics]').forEach(b=>b.onclick=()=>{
 powerAnalyticsMode=b.dataset.powerAnalytics;powerAnalyticsSort={key:null,dir:-1};
 $$('[data-power-analytics]').forEach(x=>x.classList.toggle('active',x===b));
 renderPowerAnalytics();
});

function renderPowerCharts(){
  const labels=D.powerWeeks.map(x=>x.week);
  lineChart('powerHistoryChart',labels,allPlayerPowerDatasets(selectedPowerPlayer),power);
  barChart('growthChart',D.topGrowth.slice(0,10).map(x=>x.nick),D.topGrowth.slice(0,10).map(x=>x.pct),v=>fmtPct1(v),true);
}

function fillCompareSelectors(){
 const activePlayers=D.players.filter(p=>p.active!==false);
 const opts='<option value="">— wybierz —</option>'+activePlayers.map(p=>`<option value="${escapeHtml(p.nick)}">${escapeHtml(p.nick)}</option>`).join('');
 ['compare1','compare2','compare3'].forEach(id=>{$('#'+id).innerHTML=opts;});
 $('#compare1').value=activePlayers[0]?.nick||'';
 $('#compare2').value=activePlayers[1]?.nick||'';
}
function renderCompare(){
 const picks=[...new Set(['compare1','compare2','compare3']
   .map(id=>$('#'+id)?.value)
   .filter(Boolean)
   .filter(n=>D.players.some(p=>p.nick===n&&p.active!==false)))];
 if(!picks.length){killChart('compareScoreChart');killChart('comparePowerChart');return;}
 const labels=D.weeks.map(w=>w.week);
 const colors=['#f4b651','#6ea8ff','#ad88ff'];
 const scoreDs=picks.map((n,i)=>{
   const p=D.players.find(x=>x.nick===n&&x.active!==false);
   return{label:n,data:labels.map(w=>p?.history.find(h=>h.week===w)?.points??null),color:colors[i],spanGaps:false};
 });
 scoreDs.push({label:'Średnia klanu',data:D.weeks.map(w=>w.avg),color:'#6e7b8e',spanGaps:false});
 lineChart('compareScoreChart',labels,scoreDs,compact);
 const plabels=D.powerWeeks.map(x=>x.week);
 const powerDs=picks.map((n,i)=>{
   const p=D.players.find(x=>x.nick===n&&x.active!==false);
   return{label:n,data:plabels.map(w=>p?.powers.find(h=>h.week===w)?.powerM??null),color:colors[i],spanGaps:false};
 });
 lineChart('comparePowerChart',plabels,powerDs,power);
}
['compare1','compare2','compare3'].forEach(id=>$('#'+id).onchange=renderCompare);

function profileMetrics(player,data){
 const mean=values=>values.length?values.reduce((a,b)=>a+b,0)/values.length:null;
 const wars=(player.history||[]).filter(h=>Number.isFinite(h.points)).map(h=>({...h,clan:data.weeks.find(w=>w.week===h.week)?.avg}));
 const matched=wars.filter(h=>h.clan>0),weekly=(player.donationHistory||[]).filter(h=>h.kind==='week'&&Number.isFinite(h.amount));
 const donations=(player.donationHistory||[]).filter(h=>Number.isFinite(h.amount)).map(h=>{const values=data.players.flatMap(p=>(p.donationHistory||[]).filter(x=>x.week===h.week&&x.kind===h.kind&&Number.isFinite(x.amount)).map(x=>x.amount));return {...h,clan:mean(values)};}).sort((a,b)=>weekNumber(a.week)-weekNumber(b.week));
 const powers=(player.powers||[]).filter(h=>Number.isFinite(h.powerM));
 return {wars,matched,donations,average:mean(wars.map(h=>h.points)),clanAverage:mean(matched.map(h=>h.clan)),relative:mean(matched.map(h=>h.points/h.clan*100)),weeklyAverage:mean(weekly.map(h=>h.amount)),weeklyTotal:weekly.reduce((a,h)=>a+h.amount,0),weeklyCount:weekly.length,powerAverage:mean(powers.map(h=>h.powerM))};
}
function renderProfileDetails(p){
 const m=profileMetrics(p,D),percent=n=>n===null?'—':new Intl.NumberFormat('pl-PL',{maximumFractionDigits:1}).format(n)+'%',value=n=>n===null?'—':fmt(n);
 const active=p.active!==false,assessment=rosterAssessment(D,Number($('#reviewWindow').value),$('#reviewDonationWeek').value,$('#reviewSkipConceded').checked,$('#reviewUseDonations').checked,$('#reviewUseProgress').checked),r=assessment.rows.find(x=>x.p.nick===p.nick);
 const category=r?(r.score===0?'excellent':r.status==='ok'&&r.score<15?'strong':r.status):'insufficient';
 const labels={excellent:'👑 Wzorowy wkład',strong:'🌟 Bardzo dobry wkład',ok:'✅ Wkład w porządku',watch:'🔎 Warto poprawić wyniki',high:'⚠️ Potrzebna rozmowa',insufficient:'⏳ Jeszcze bez oceny'};
 $('#profileAssessment').className='panel roster-controls review-category '+category;
 $('#profileAssessment').innerHTML='<div class="panel-title">'+(active?labels[category]+(r?.partialProgress&&r.score!==null?' · Ocena częściowa — bez progresji':''):'Były gracz — historia wkładu')+'</div><p class="panel-desc">'+(r?'Ryzyko: '+(r.score===null?'brak oceny':r.score.toFixed(1).replace('.',',')+' / 100')+' • '+r.count+'/'+assessment.weeks.length+' zapisanych wojen • '+(r.scoreBasis+' • równe wagi dostępnych kategorii')+'<br>Mediana wyniku względem klanu: '+percent(r.ratio===null?null:r.ratio*100)+' • Trend: '+(r.trend===null?'—':r.trend.toFixed(1).replace('.',',')+' p.p.')+($('#reviewUseProgress').checked?'<br>Progresja: '+percent(r.progressRatio===null?null:r.progressRatio*100)+' • '+escapeHtml(r.progressNote):'')+'<br>Zakres: '+assessment.weeks.map(w=>w.week).join(', '):'Nie jest uwzględniany w rekomendacjach dla obecnego składu.')+'</p><div class="panel-desc">Ocena korzysta z aktualnych ustawień zakładki Ocena składu. Średnie poniżej obejmują całą zapisaną historię gracza.</div>';
 $('#profileAverages').innerHTML=[['Średnia klanu — wojny z wpisem gracza',value(m.clanAverage)],['Średni wynik względem klanu',percent(m.relative)],['Średnia mocy — zapisane pomiary',m.powerAverage===null?'—':power(m.powerAverage)],['Średnia fiolek / tydzień',value(m.weeklyAverage)],['Suma wpłat tygodniowych',m.weeklyCount?fmt(m.weeklyTotal):'—'],['Tygodnie z wpisem fiolek',m.weeklyCount]].map(([label,val])=>'<div class="mini-stat"><div class="l">'+label+'</div><div class="v">'+val+'</div></div>').join('');
 $('#profileDonationHistory').innerHTML=m.donations.slice().reverse().map(h=>'<div class="list-row"><div><div class="list-name">'+escapeHtml(h.week)+(h.kind==='season'?' · Koniec sezonu':'')+'</div><div class="list-meta">Średnia klanu: '+value(h.clan)+'</div></div><div class="list-value">'+fmt(h.amount)+'<small style="display:block">'+(h.clan>0?percent(h.amount/h.clan*100):'—')+' średniej</small></div></div>').join('')||'<div class="empty">Brak zapisanych wpłat fiolek</div>';
 requestAnimationFrame(()=>{
 const history=m.matched,labels=history.map(h=>h.week),ratios=history.map(h=>h.points/h.clan*100);
 killChart('profileRelativeChart');
 if(typeof Chart!=='undefined')charts.profileRelativeChart=new Chart($('#profileRelativeChart'),{type:'bar',data:{labels,datasets:[{label:'Wynik gracza / średnia',data:ratios,backgroundColor:ratios.map(n=>n>=100?'#4abe5c':n>=65?'#eeb34b':'#ef6868'),borderRadius:5,maxBarThickness:42},{type:'line',label:'Średnia klanu = 100%',data:labels.map(()=>100),borderColor:'#a4b0c2',borderDash:[5,5],pointRadius:0,borderWidth:1.5}]},options:baseOptions(n=>Math.round(n)+'%')});
 const periods=m.donations.slice().reverse();
 $('#profileDonationPeriod').innerHTML=periods.map((h,i)=>'<option value="'+i+'">'+escapeHtml(h.week)+(h.kind==='season'?' · Koniec sezonu':' · Tydzień')+'</option>').join('');
 $('#profileDonationPeriod').disabled=!periods.length;
 const drawDonation=()=>{
 const h=periods[Number($('#profileDonationPeriod').value)],records=h?D.players.flatMap(x=>(x.donationHistory||[]).filter(d=>d.week===h.week&&d.kind===h.kind&&Number.isFinite(d.amount))):[],total=records.reduce((sum,d)=>sum+d.amount,0);
 killChart('profileDonationChart');
 $('#profileDonationShare').textContent=h?fmt(h.amount)+' fiolek · '+percent(total?h.amount/total*100:0)+' wpłat klanu · Średnia: '+value(h.clan):'Brak zapisanych wpłat fiolek';
 if(typeof Chart!=='undefined')charts.profileDonationChart=new Chart($('#profileDonationChart'),{type:'doughnut',data:{labels:h?[p.nick,'Pozostali gracze']:['Brak danych'],datasets:[{data:total>0?[h.amount,Math.max(0,total-h.amount)]:[1],backgroundColor:total>0?['#ffd166','#33465b']:['#25303e'],borderColor:'#0d131b',borderWidth:3}]},options:{responsive:true,maintainAspectRatio:false,cutout:'72%',plugins:{legend:{position:'bottom',labels:{color:'#b9c4d2',boxWidth:12}},tooltip:{enabled:total>0,callbacks:{label:c=>c.label+': '+fmt(c.parsed)+' fiolek'}}}}});
 };
 $('#profileDonationPeriod').onchange=drawDonation;drawDonation();
 });
}

let lastView='playersView';
let profileSort={key:'week',dir:-1};
let currentProfileNick=null;
window.openProfile=function(nick){
 const p=D.players.find(x=>x.nick===nick); if(!p)return;
 if($('.view.active')?.id!=='profile')lastView=$('.view.active')?.id||'playersView';
 $('#profileName').textContent=p.nick;$('#profileRank').textContent=p.rank;
 $('#profilePower').textContent=power(p.powerM);
 const profPct=p.powerChangePct??powerPct(p.powerChangeM,p.powerM);
 $('#profilePowerDelta').textContent=p.powerChangeM==null?'brak poprzedniego snapshotu':`${sign(p.powerChangeM)}${power(p.powerChangeM)} (${fmtPct1(profPct)}) vs poprzedni`;
 $('#profilePowerDelta').className=p.powerChangeM>=0?'positive':'negative';
 $('#profileKpis').innerHTML=[
   ['Ostatni wynik',fmt(p.latestPoints)],['Średnia punktów — cała historia',fmt(p.avg)],['Rekord',fmt(p.best)],['Najlepszy tydzień',p.bestWeek||'—'],['Wojny',p.warCount]
 ].map(x=>`<div class="mini-stat"><div class="l">${x[0]}</div><div class="v">${x[1]}</div></div>`).join('');
 currentProfileNick=nick;
 const profileRows=p.history.slice().sort((a,b)=>{
   const va=profileSort.key==='week'?weekNumber(a.week):profileSort.key==='tier'?tierLabel(a.tier):a[profileSort.key];
   const vb=profileSort.key==='week'?weekNumber(b.week):profileSort.key==='tier'?tierLabel(b.tier):b[profileSort.key];
   return cmpVal(va,vb,profileSort.dir);
 });
 paintSortHeaders('#profile',{key:profileSort.key,dir:profileSort.dir});
 $('#profileHistory').innerHTML=profileRows.map(h=>`<tr><td>${h.week}</td><td>${escapeHtml(tierLabel(h.tier))}</td><td>${h.date}</td><td class="num">${fmt(h.points)}</td><td class="num">${D.weeks.find(w=>w.week===h.week)?.avg>0?fmt(D.weeks.find(w=>w.week===h.week).avg):'—'}</td><td class="num">${D.weeks.find(w=>w.week===h.week)?.avg>0?(h.points/D.weeks.find(w=>w.week===h.week).avg*100).toFixed(1).replace('.',',')+'%':'—'}</td><td class="num">${h.position??'—'}</td></tr>`).join('');
 setView('profile',false);
 renderProfileDetails(p);
 requestAnimationFrame(()=>{
   const labs=D.weeks.map(w=>w.week);
   lineChart('profileScoreChart',labs,[{label:p.nick,data:labs.map(w=>p.history.find(h=>h.week===w)?.points??null),fill:true},{label:'Średnia klanu',data:D.weeks.map(w=>w.avg),color:'#6ea8ff'}],compact);
   const powerLabs=p.powers.map(h=>h.week);
   const powerVals=p.powers.map(h=>h.powerM);
   lineChart('profilePowerChart',powerLabs,[{label:p.nick,data:powerVals,color:'#6ea8ff',fill:true,spanGaps:false},{label:'Średnia klanu',data:powerLabs.map(w=>{const vals=D.players.flatMap(x=>(x.powers||[]).filter(h=>h.week===w&&Number.isFinite(h.powerM)).map(h=>h.powerM));return vals.length?vals.reduce((a,b)=>a+b,0)/vals.length:null;}),color:'#ffd166'}],power);
   const powerRows=p.powers.map((h,i)=>{
     const prev=i>0?p.powers[i-1]:null;
     const delta=prev?h.powerM-prev.powerM:null;
     const pc=h.growthPct??(prev&&prev.powerM?delta/prev.powerM*100:null);
     return `<div class="list-row">
       <div class="list-index">${escapeHtml(h.week)}</div>
       <div><div class="list-name">${power(h.powerM)}</div><div class="list-meta">${prev?`poprzednio ${power(prev.powerM)}`:'pierwszy dostępny snapshot'}</div></div>
       <div class="list-value ${delta>0?'positive':delta<0?'negative':''}">${delta==null?'—':`${sign(delta)}${power(delta)}<small style="display:block">${fmtPct1(pc)}</small>`}</div>
     </div>`;
   }).join('');
   const histEl=$('#profilePowerHistory');
   if(histEl) histEl.innerHTML=powerRows || '<div class="empty">Brak historii Power dla tego gracza</div>';
   const posLabs=p.history.filter(h=>h.position!=null).map(h=>h.week), posVals=p.history.filter(h=>h.position!=null).map(h=>h.position);
   killChart('profilePositionChart');
   if(typeof Chart!=='undefined')charts.profilePositionChart=new Chart($('#profilePositionChart'),{type:'line',data:{labels:posLabs,datasets:[{label:'Pozycja',data:posVals,borderColor:'#ad88ff',backgroundColor:'rgba(173,136,255,.12)',fill:true,tension:.3,borderWidth:2.3,pointRadius:3}]},options:{...baseOptions(v=>'#'+Math.round(v)),scales:{x:{grid:{display:false},border:{display:false},ticks:{color:'#657286',font:{size:9}}},y:{reverse:true,grid:{color:'rgba(255,255,255,.045)'},border:{display:false},ticks:{color:'#657286',font:{size:9},callback:v=>'#'+v}}}}});
 });
};
$('#profileBack').onclick=()=>setView(lastView,false);
$('#profileCompare').onclick=()=>{
 const n=$('#profileName').textContent; setView('compare'); $('#compare1').value=n; renderCompare();
};

function scrollPageTop(){
  window.scrollTo({top:0,left:0,behavior:'auto'});
  const main=document.querySelector('.main, main, .content, .page-content');
  if(main && typeof main.scrollTo==='function') main.scrollTo({top:0,left:0,behavior:'auto'});
}


function rosterAssessment(data,size,week,skip,useDonations=false,useProgress=false){
 const players=data.players.filter(p=>p.active!==false),weeks=data.weeks.filter(w=>!skip||!String(w.resultType||'').toLowerCase().includes('odpuszcz')).slice(-size);
 const amounts=players.map(p=>p.donationHistory?.find(h=>h.week===week&&h.kind==='week')?.amount).filter(Number.isFinite);
 const average=amounts.length?amounts.reduce((a,b)=>a+b,0)/amounts.length:null;
 const median=a=>{const v=[...a].sort((a,b)=>a-b),m=Math.floor(v.length/2);return v.length?(v.length%2?v[m]:(v[m-1]+v[m])/2):null;};
 const rows=players.map(p=>{
 const samples=weeks.flatMap(w=>{const value=p.history?.find(h=>h.week===w.week)?.points;return Number.isFinite(value)&&w.avg>0?[{value,ratio:value/w.avg}]:[];});
 const ratio=median(samples.map(h=>h.ratio)),donation=p.donationHistory?.find(h=>h.week===week&&h.kind==='week')?.amount??null,donationRatio=donation!==null&&average>0?donation/average:null;
 const timeline=(p.powers||[]).filter(h=>Number.isFinite(h.powerM)&&weeks.length&&weekNumber(h.week)>=weekNumber(weeks[0].week)&&weekNumber(h.week)<=weekNumber(weeks.at(-1).week)).sort((a,b)=>weekNumber(a.week)-weekNumber(b.week));
 const first=timeline[0],last=timeline.at(-1),growth=timeline.length>=2&&first.powerM>0?(last.powerM-first.powerM)/first.powerM:null;
 // Select the cohort from starting power only, before checking end measurements.
 const cohort=first?.powerM>0?data.players.filter(x=>x.nick!==p.nick).flatMap(x=>{
 const start=x.powers?.find(h=>h.week===first.week)?.powerM;
 return Number.isFinite(start)&&start>=first.powerM*.75&&start<=first.powerM*1.25?[{nick:x.nick,start,distance:Math.abs(start-first.powerM),end:x.powers?.find(h=>h.week===last.week)?.powerM}]:[];
 }).sort((a,b)=>a.distance-b.distance||a.nick.localeCompare(b.nick)).slice(0,7):[];
 const complete=cohort.filter(x=>Number.isFinite(x.end)&&x.end>=0),baselineM=complete.length>=3?median(complete.map(x=>x.end-x.start)):null,clanGrowth=complete.length>=3?median(complete.map(x=>(x.end-x.start)/x.start)):null;
 const delta=growth===null?null:last.powerM-first.powerM;
 const progressRatio=growth!==null&&baselineM>0&&clanGrowth>0?(Math.max(0,delta)/baselineM+Math.max(0,growth)/clanGrowth)/2:null;
 const intervals=timeline.slice(1).flatMap((end,i)=>{const start=timeline[i];return start.powerM>0&&weekNumber(end.week)-weekNumber(start.week)===1?[{from:start.week,to:end.week,pct:(end.powerM-start.powerM)/start.powerM}]:[];});
 const latestWeek=weeks.at(-1)?.week;
 let stagnantWeeks=0;
 if(last?.week===latestWeek)for(let i=intervals.length-1;i>=0;i--){const h=intervals[i];if(h.to!==(i===intervals.length-1?latestWeek:intervals[i+1].from)||h.pct>.01)break;stagnantWeeks++;}
 const displayM=n=>new Intl.NumberFormat('pl-PL',{maximumFractionDigits:1}).format(n)+'m';
 const progressNote=(first&&last?first.week+' → '+last.week+': '+displayM(first.powerM)+' → '+displayM(last.powerM):'Brak pomiarów')+' • stała grupa: '+complete.length+'/'+cohort.length+' z kompletem danych'+(baselineM!==null?' • mediana przyrostu grupy: '+displayM(baselineM):'')+(cohort.length?' • porównywani: '+cohort.map(x=>x.nick+(Number.isFinite(x.end)?'':' (brak końca)')).join(', '):'')+(stagnantWeeks>=2?' • stagnacja ≤1%/tydzień: '+stagnantWeeks+' ostatnich tygodni':'');
 const partialProgress=useProgress&&progressRatio===null;
 const components=[ratio,...(useDonations?[donationRatio]:[]),...(useProgress&&progressRatio!==null?[progressRatio]:[])];
 const scoreBasis=['punkty wojenne',...(useDonations?['fiolki']:[]),...(useProgress&&progressRatio!==null?['progresja mocy']:[])].join(' + ');
 const score=samples.length>=3&&components.every(x=>x!==null)?components.reduce((sum,x)=>sum+Math.max(0,1-x),0)*100/components.length:null,half=Math.floor(samples.length/2);
 const trend=samples.length>=4?(median(samples.slice(-half).map(h=>h.ratio))-median(samples.slice(0,half).map(h=>h.ratio)))*100:null;
 return {p,ratio,donation,donationRatio,score,trend,partialProgress,scoreBasis,growth,clanGrowth,progressRatio,progressNote,stagnantWeeks,progressIntervals:intervals,progressCohort:cohort,progressBaselineM:baselineM,progressFrom:first?.week,progressTo:last?.week,count:samples.length,missing:weeks.length-samples.length,low:samples.filter(h=>h.ratio<.5).length,zeros:samples.filter(h=>h.value===0).length,status:score===null?'insufficient':score>=60?'high':score>=35?'watch':'ok'};
 }).sort((a,b)=>(b.score??-1)-(a.score??-1)||a.p.nick.localeCompare(b.p.nick));
 return {rows,weeks,average,donated:amounts.length};
}
let selectedDonationWeek='';
function donationRecords(week){return D.players.flatMap(p=>(p.donationHistory||[]).filter(h=>h.week===week&&Number.isFinite(h.amount)).map(h=>({...h,nick:p.nick})));}
function donationPeriods(){
 const entries=[...new Map(D.players.flatMap(p=>(p.donationHistory||[]).filter(h=>Number.isFinite(h.amount)).map(h=>[h.week,h]))).values()];
 return entries.map(h=>{const war=D.weeks.find(w=>w.week===h.week)||{week:h.week,date:h.date};return {...war,tier:h.kind==='season'?'Koniec sezonu':war.tier};}).sort((a,b)=>weekNumber(b.week)-weekNumber(a.week));
}
function initDonations(){selectedDonationWeek=donationPeriods()[0]?.week||'';}
function renderDonations(){
 window.renderWeekPicker($('#donationWeekbar'),donationPeriods(),selectedDonationWeek,w=>{selectedDonationWeek=w;renderDonations();});
 const records=donationRecords(selectedDonationWeek),total=records.reduce((sum,r)=>sum+r.amount,0),season=records.some(r=>r.kind==='season');
 $('#donationPeriodNote').textContent=selectedDonationWeek+' • '+(season?'Koniec sezonu — suma sezonowa':'Wpłaty tygodniowe')+(records.length?' • '+(records[0].date||'')+'–'+(records[0].endDate||''):' • Brak wpisów w Excelu');
 $('#donationSummary').innerHTML=[['Suma fiolek',records.length?fmt(total):'—'],['Średnia wpłata',records.length?fmt(total/records.length):'—'],['Gracze z wpisem',records.length],['Największa wpłata',records.length?fmt(Math.max(...records.map(r=>r.amount))):'—']].map(([label,value])=>'<div class="mini-stat"><div class="l">'+label+'</div><div class="v">'+value+'</div></div>').join('');
 renderClanShare(records.map(r=>({nick:r.nick,points:r.amount})),'donation',fmt,fmt);
 if(!records.length){$('#donationDonutTotal').textContent='—';$('#donationDistributionLegend').innerHTML='<div class="empty">Brak wpisów o fiolkach w tej wojnie</div>';}
 const periods=[...new Map(D.players.flatMap(p=>(p.donationHistory||[]).map(h=>[h.week+':'+h.kind,h]))).values()].sort((a,b)=>weekNumber(b.week)-weekNumber(a.week));
 const players=D.players.filter(p=>p.donationHistory?.length).sort((a,b)=>(b.donationHistory.find(h=>h.week===selectedDonationWeek)?.amount??-1)-(a.donationHistory.find(h=>h.week===selectedDonationWeek)?.amount??-1));
 $('#donationTableHead').innerHTML='<tr><th>Gracz</th>'+periods.map(h=>'<th class="num">'+escapeHtml(h.week)+'<small class="cell-sub">'+(h.kind==='season'?'koniec sezonu':'tydzień')+'</small></th>').join('')+'</tr>';
 $('#donationTableBody').innerHTML=players.map(p=>'<tr><td><button class="player-link" data-profile="'+escapeHtml(p.nick)+'">'+escapeHtml(p.nick)+'</button></td>'+periods.map(h=>{const value=p.donationHistory.find(d=>d.week===h.week&&d.kind===h.kind)?.amount;return '<td class="num" data-label="'+escapeHtml(h.week+(h.kind==='season'?' · Koniec sezonu':''))+'">'+(Number.isFinite(value)?fmt(value):'—')+'</td>';}).join('')+'</tr>').join('');
 const weeks=donationPeriods().slice().reverse();
 killChart('donationHistoryChart');
 if(typeof Chart!=='undefined')charts.donationHistoryChart=new Chart($('#donationHistoryChart'),{type:'bar',data:{labels:weeks.map(w=>w.week+(donationRecords(w.week).some(r=>r.kind==='season')?' · Koniec sezonu':'')),datasets:[{label:'Fiolki',data:weeks.map(w=>{const rows=donationRecords(w.week);return rows.length?rows.reduce((a,r)=>a+r.amount,0):null;}),backgroundColor:weeks.map(w=>donationRecords(w.week).some(r=>r.kind==='season')?'#ad88ff':'#eeb34b'),borderRadius:5,maxBarThickness:48}]},options:{...baseOptions(fmt),onClick:(event,elements)=>{if(elements.length){selectedDonationWeek=weeks[elements[0].index].week;renderDonations();}}}});
}
function initRosterReview(){
 const weeks=[...new Set(D.players.filter(p=>p.active!==false).flatMap(p=>(p.donationHistory||[]).filter(h=>h.kind==='week').map(h=>h.week)))].sort((a,b)=>weekNumber(b)-weekNumber(a));
 $('#reviewDonationWeek').innerHTML=weeks.length?weeks.map(w=>'<option value="'+escapeHtml(w)+'">'+escapeHtml(w)+'</option>').join(''):'<option value="">—</option>';
 for(const id of ['reviewWindow','reviewDonationWeek','reviewSkipConceded','reviewUseDonations','reviewUseProgress'])$('#'+id).onchange=renderRosterReview;
 $('#reviewSearch').oninput=renderRosterReview;renderRosterReview();
}
function renderRosterReview(){
 const en=window.INPPL_I18N?.language==='en',t=(pl,eng)=>en?eng:pl,week=$('#reviewDonationWeek').value;
 const useDonations=$('#reviewUseDonations').checked;$('#reviewDonationWeek').disabled=!useDonations;
 $$('.review-progress-column').forEach(el=>el.hidden=!$('#reviewUseProgress').checked);
 $$('.review-donation-column').forEach(el=>el.hidden=!useDonations);
 const result=rosterAssessment(D,Number($('#reviewWindow').value),week,$('#reviewSkipConceded').checked,useDonations,$('#reviewUseProgress').checked),q=$('#reviewSearch').value.trim().toLowerCase(),rows=result.rows.filter(r=>r.p.nick.toLowerCase().includes(q));
 const percentage=n=>n===null?'—':new Intl.NumberFormat(en?'en-GB':'pl-PL',{maximumFractionDigits:1}).format(n*100)+'%';
 $('#reviewCoverage').textContent=t('Wojny: ','Wars: ')+result.weeks.map(w=>w.week).join(', ')+(useDonations?t(' • Fiolki: ',' • Donations: '):t(' • Fiolki wyłączone • dostępny tydzień: ',' • Donations excluded • available week: '))+(week||'—')+' • '+result.donated+'/'+result.rows.length+t(' graczy z wpisem • Średnia fiolek: ',' players with an entry • Average donations: ')+(result.average===null?'—':fmt(result.average));
 const category=r=>r.score===0?'excellent':r.status==='ok'&&r.score<15?'strong':r.status;
 const labels={excellent:t('👑 Wzorowy wkład','👑 Outstanding contribution'),strong:t('🌟 Bardzo dobry wkład','🌟 Very good contribution'),ok:t('✅ Wkład w porządku','✅ Good contribution'),watch:t('🔎 Warto poprawić wyniki','🔎 Room to improve'),high:t('⚠️ Potrzebna rozmowa','⚠️ Discussion needed'),insufficient:t('⏳ Jeszcze bez oceny','⏳ Not rated yet')};
 $('#reviewSummary').innerHTML=Object.entries(labels).map(([key,label])=>'<div class="mini-stat review-category '+key+'"><div class="l">'+label+'</div><div class="v">'+result.rows.filter(r=>category(r)===key).length+'</div></div>').join('');
 const playerLink=p=>'<button class="player-link" data-profile="'+escapeHtml(p.nick)+'">'+escapeHtml(p.nick)+'</button>';
 $('#reviewTable').innerHTML=rows.map(r=>{
 const reasons=[...(r.partialProgress&&r.score!==null?['Ocena częściowa: '+r.scoreBasis+'; moc nie wpływa na wynik']:[]),...(r.status==='ok'?[t('Brak sygnałów do rozmowy o usunięciu w tej ocenie','No removal discussion flags in this assessment')]:r.status==='insufficient'?[t('Brak danych nie oznacza słabego wkładu','Missing data does not mean poor contribution')]:[]),r.count+'/'+result.weeks.length+t(' zapisanych wojen',' recorded wars'),r.low+t(' wojen poniżej 50% średniej',' wars below 50% of average')];
 if(r.zeros)reasons.push(r.zeros+t(' wyników zerowych',' zero scores'));if(r.missing)reasons.push(r.missing+t(' brakujących wpisów',' missing entries'));
 if($('#reviewUseProgress').checked)reasons.push(r.progressRatio===null?'Moc: za mało porównań • '+escapeHtml(r.progressNote):'Progresja: '+percentage(r.progressRatio)+' tempa grupy • '+escapeHtml(r.progressNote));
 if(useDonations)reasons.push(r.donation===null?t('brak wpisu o fiolkach','no donation entry'):t('fiolki: ','donations: ')+fmt(r.donation));
 if(useDonations&&result.average===0)reasons.push(t('średnia fiolek wynosi 0 — brak podstawy porównania','donation average is zero — no comparison baseline'));
 return '<tr class="review-category '+category(r)+'"><td>'+playerLink(r.p)+'</td><td><span class="review-status '+category(r)+'">'+labels[category(r)]+'</span>'+(r.partialProgress&&r.score!==null?'<small class="cell-sub">Ocena częściowa · bez progresji</small>':'')+'</td><td class="num"><b>'+(r.score===null?'—':r.score.toFixed(1).replace('.',en?'.':','))+'</b></td><td class="num">'+percentage(r.ratio)+'</td><td class="num review-donation-column" '+(!useDonations?'hidden':'')+'>'+percentage(r.donationRatio)+'</td><td class="num review-progress-column" '+(!$('#reviewUseProgress').checked?'hidden':'')+'>'+percentage(r.progressRatio)+'</td><td class="num">'+(r.trend===null?'—':(r.trend>=0?'+':'')+r.trend.toFixed(1).replace('.',en?'.':','))+'</td><td class="review-reasons">'+reasons.join(' • ')+'</td></tr>';
 }).join('')||'<tr><td colspan="8" class="empty">'+t('Brak wyników','No results')+'</td></tr>';

}

function init(){
 $$('.jump-tab').forEach(b=>b.onclick=()=>{jumpMode=b.dataset.jumpMode||'up';expandedLists.jumps=false;renderOverview();});
 renderOverview(); renderWeekBar(); renderWarView();
 const ranks=[...new Set(D.players.filter(p=>p.active!==false).map(p=>p.rank))].sort();
 $('#rankFilter').innerHTML='<option value="">Wszystkie rangi</option>'+ranks.map(r=>`<option value="${escapeHtml(r)}">${escapeHtml(r)}</option>`).join('');
 const activePlayers=D.players.filter(p=>p.active!==false);
 const playerOptions=activePlayers.map(p=>`<option value="${escapeHtml(p.nick)}">${escapeHtml(p.nick)}</option>`).join('');
 if(!activePlayers.some(p=>p.nick===selectedOverviewPlayer))selectedOverviewPlayer=activePlayers[0]?.nick||'';
 if(!activePlayers.some(p=>p.nick===selectedPowerPlayer))selectedPowerPlayer=selectedOverviewPlayer;
 $('#heroPlayerCount').textContent=`${D.activeCount??D.players.filter(p=>p.active!==false).length} graczy w składzie`;
 const warRange=rangeLabel(D.weeks), powerRange=rangeLabel(D.powerWeeks);
 if($('#sideDataRange'))$('#sideDataRange').textContent=`Wojny ${warRange} • Power ${powerRange}`;
 if($('#dataUpdated'))$('#dataUpdated').textContent=formatGeneratedAt(D.generatedAt);
 if($('#warHistoryRange'))$('#warHistoryRange').textContent=`Każda linia to jeden gracz • ${warRange}`;
 if($('#overviewPowerRange'))$('#overviewPowerRange').textContent=`Każda linia to jeden gracz • ${powerRange} • 1 w Excelu = 1 mln`;
 if($('#powerHistoryRange'))$('#powerHistoryRange').textContent=`${powerRange} • rozkład całego klanu`;
 if($('#powerStatus'))$('#powerStatus').textContent=D.powerWeeks.length?`${D.powerWeeks.at(-1).week} • ${D.powerWeeks.at(-1).count} aktywnych graczy`:'Brak danych Power';
 $('#overviewPlayerSelect').innerHTML=playerOptions;
 $('#overviewPowerPlayerSelect').innerHTML=playerOptions;
 $('#powerPagePlayerSelect').innerHTML=playerOptions;
 $('#overviewPlayerSelect').value=selectedOverviewPlayer;
 $('#overviewPowerPlayerSelect').value=selectedPowerPlayer;
 $('#powerPagePlayerSelect').value=selectedPowerPlayer;
 renderPlayers(); renderOutcasts(); renderPower(); fillCompareSelectors(); initRosterReview(); initDonations();
 const os=$('#outcastSearch');if(os){os.oninput=()=>{outcastSearch=os.value;renderOutcasts();};}
 const oso=$('#outcastSort');if(oso){oso.value=({powerM:'power',warCount:'wars'}[outcastSort]||outcastSort);oso.onchange=()=>{outcastSort=({power:'powerM',wars:'warCount'}[oso.value]||oso.value);outcastSortDir=(outcastSort==='nick'?1:-1);renderOutcasts();};}
 const ps=$('#powerSearch');
 if(ps){ps.value=powerSearch;ps.oninput=()=>{powerSearch=ps.value;renderPowerSnapshot();};}
 const prf=$('#powerRankFilter');
 if(prf){
   const ranks=[...new Set(D.players.filter(p=>p.active!==false).map(p=>p.rank).filter(Boolean))].sort();
   prf.innerHTML='<option value="">Wszystkie rangi</option>'+ranks.map(r=>`<option value="${escapeHtml(r)}">${escapeHtml(r)}</option>`).join('');
   prf.value=powerRankFilter;
   prf.onchange=()=>{powerRankFilter=prf.value;renderPowerSnapshot();};
 }

 const hash=location.hash.replace('#',''); const allowed=['overview','warsView','playersView','outcastsView','power','compare','rosterReview','donations'];
 setView(allowed.includes(hash)?hash:'overview',false);
 requestAnimationFrame(()=>{renderOverviewCharts();renderPowerCharts();});
}
init();

window.addEventListener('hashchange',()=>{
  setView(location.hash.slice(1),false);
});

document.addEventListener('click',(e)=>{
  const profile=e.target.closest('[data-profile]');
  if(profile)openProfile(profile.dataset.profile);
  const a=e.target.closest('a[href^="#"], [data-view], .nav-item, .nav-link');
  if(!a) return;
  requestAnimationFrame(()=>scrollPageTop());
});

$$('#profile th.sortable').forEach(th=>th.onclick=()=>{
 const k=th.dataset.sort;
 if(profileSort.key===k)profileSort.dir*=-1;else{profileSort.key=k;profileSort.dir=(k==='tier'||k==='date')?1:-1}
 if(currentProfileNick)openProfile(currentProfileNick);
});

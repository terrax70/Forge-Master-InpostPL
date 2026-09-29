(()=>{
const D=window.FM_PLANNER_DATA,$=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const DAY=86400000,HOUR=3600000,MIN=60000;
const DEFAULT_SLEEP_START='23:00',DEFAULT_SLEEP_END='08:00';
const defaults={researchSpeed:60,forgeSpeed:26,forgeLevel:27,waitLimit:30,horizon:56,reactionMinutes:30,sleepStart:DEFAULT_SLEEP_START,sleepEnd:DEFAULT_SLEEP_END,forgeMode:'points',forgeOngoing:false,remainingDays:0,remainingHours:0,remainingMinutes:0,techQueue:[],techCount:10};
let state=load(),results={tech:[],forge:[]};

function load(){try{return {...defaults,...JSON.parse(localStorage.getItem('fmPlannerV2')||'{}')}}catch{return {...defaults}}}
function save(){try{localStorage.setItem('fmPlannerV2',JSON.stringify(state))}catch{/* Planning also works when browser storage is unavailable. */}}
function pad(n){return String(n).padStart(2,'0')}
function fmtDate(d){return d?`${pad(d.getDate())}.${pad(d.getMonth()+1)} ${pad(d.getHours())}:${pad(d.getMinutes())}`:'—'}
function fmtDur(ms){if(!isFinite(ms))return'—';let m=Math.max(0,Math.round(ms/MIN)),d=Math.floor(m/1440);m-=d*1440;let h=Math.floor(m/60);m-=h*60;return `${d?d+'d ':''}${h?h+'h ':''}${m}m`}
function speed(v){return 1+Math.max(0,Number(v)||0)/100}
function reactionMs(){return Math.max(0,Number(state.reactionMinutes)||0)*MIN}
function timeParts(value,fallback){
  const m=String(value||fallback).match(/^(\d{1,2}):(\d{2})$/);
  if(!m)return timeParts(fallback,'00:00');
  return {h:Math.max(0,Math.min(23,+m[1])),m:Math.max(0,Math.min(59,+m[2]))};
}
function sleepStartParts(){return timeParts(state.sleepStart,DEFAULT_SLEEP_START)}
function sleepEndParts(){return timeParts(state.sleepEnd,DEFAULT_SLEEP_END)}
function atTime(base,parts,dayOffset=0){
  return new Date(base.getFullYear(),base.getMonth(),base.getDate()+dayOffset,parts.h,parts.m,0,0);
}

function gameStart(t){let d=new Date(t),g=new Date(d.getFullYear(),d.getMonth(),d.getDate(),D.resetHour);if(d<g)g.setDate(g.getDate()-1);return g}
function weekday(t){let x=gameStart(t).getDay();return x===0?7:x}
function nextBoundary(after,days){
  let g=gameStart(after);
  for(let i=0;i<18;i++){
    let base=new Date(g);base.setDate(base.getDate()+i);
    if(days.includes(weekday(base))){
      let c=scoringActionAt(base);
      if(c>=after)return c;
    }
  }
  return new Date(after.getTime()+14*DAY);
}
function techDef(n){return D.tech.find(x=>x.name===n)}
function forgeDef(l){return D.forge.find(x=>x.level===Number(l))}
function techDur(x){return x.baseDays*DAY/speed(state.researchSpeed)}
function forgeDur(x){return x.baseDays*DAY/speed(state.forgeSpeed)}
function isTechDay(t){return D.techScoringWeekdays.includes(weekday(t))}
function isForgeDay(t){return D.forgeScoringWeekdays.includes(weekday(t))}
function isQuiet(t){
  const s=sleepStartParts(),e=sleepEndParts();
  const cur=t.getHours()*60+t.getMinutes(),sm=s.h*60+s.m,em=e.h*60+e.m;
  if(sm===em)return false;
  return sm>em ? (cur>=sm || cur<em) : (cur>=sm && cur<em);
}
function nextAwakeTime(t){
  let d=new Date(t);
  if(!isQuiet(d))return d;
  const s=sleepStartParts(),e=sleepEndParts();
  const cur=d.getHours()*60+d.getMinutes(),sm=s.h*60+s.m,em=e.h*60+e.m;
  if(sm>em && cur>=sm){
    return atTime(d,e,1);
  }
  return atTime(d,e,0);
}
function scoringActionAt(dayStart){
  const wake=atTime(dayStart,sleepEndParts(),0);
  // Wake-up before reset belongs to the preceding game day.
  if(wake<dayStart)wake.setDate(wake.getDate()+1);
  return nextAwakeTime(wake);
}

function quietOverlap(start,end){
  let total=0;
  const s=sleepStartParts(),e=sleepEndParts();
  let cursor=new Date(start.getFullYear(),start.getMonth(),start.getDate()-1);
  for(let i=0;i<24;i++){
    let qs=atTime(cursor,s,0);
    let qe;
    const sm=s.h*60+s.m,em=e.h*60+e.m;
    if(sm===em)return 0;
    qe=atTime(cursor,e,sm>em?1:0);
    let a=Math.max(start.getTime(),qs.getTime()),b=Math.min(end.getTime(),qe.getTime());
    if(b>a)total+=b-a;
    cursor.setDate(cursor.getDate()+1);
    if(cursor.getTime()>end.getTime()+DAY)break;
  }
  return total;
}
function candidateTechStarts(avail,latest){
  const values=[new Date(avail),new Date(latest)];
  const s=sleepStartParts(),e=sleepEndParts(),sm=s.h*60+s.m,em=e.h*60+e.m;
  let d=new Date(avail.getFullYear(),avail.getMonth(),avail.getDate()-1);
  for(let i=0;i<24;i++){
    let q1=atTime(d,s,0),q2=atTime(d,e,sm>em?1:0);
    for(const c of [q1,q2])if(c>=avail&&c<=latest)values.push(c);
    d.setDate(d.getDate()+1);
    if(d>latest)break;
  }
  return values.map(nextAwakeTime).filter(t=>t>=avail&&t<=latest);
}
function nextTechSlot(avail,dur){
  // Dates have millisecond precision. Use the same integer duration throughout.
  dur=Math.ceil(dur);
  const earliest=nextAwakeTime(avail);
  let collect=nextAwakeTime(new Date(earliest.getTime()+dur));
  // A scoring day is a whole game day, not just the wake-up instant.
  while(!isTechDay(collect)){
    const next=gameStart(collect);
    next.setDate(next.getDate()+1);
    collect=nextAwakeTime(next);
  }
  const latest=new Date(collect.getTime()-dur);
  const candidates=candidateTechStarts(earliest,latest);
  let best=earliest,bestNight=-1;
  for(const start of candidates){
    const night=quietOverlap(start,new Date(start.getTime()+dur));
    // Optimize overnight work only within the earliest achievable collection.
    if(night>bestNight || (night===bestNight && start>best)){
      best=start;bestNight=night;
    }
  }
  return {start:new Date(best),finish:new Date(best.getTime()+dur),collect};
}
function nextForgeSlot(avail){
  let awake=nextAwakeTime(avail);
  let g=gameStart(awake);
  if(isForgeDay(g)){
    let today=scoringActionAt(g);
    if(today>=awake)return today;
  }
  return nextBoundary(awake,D.forgeScoringWeekdays);
}

function read(){
  state.researchSpeed=+$('#researchSpeed').value||0;state.forgeSpeed=+$('#forgeSpeed').value||0;state.forgeLevel=+$('#forgeLevel').value||1;
  state.forgeMode=$('#forgeMode').value;state.forgeOngoing=$('#forgeOngoing').checked;state.remainingDays=+$('#remainingDays').value||0;
  state.remainingHours=+$('#remainingHours').value||0;state.remainingMinutes=+$('#remainingMinutes').value||0;state.waitLimit=+$('#waitLimit').value||0;state.horizon=+$('#horizon').value||14;state.reactionMinutes=Math.max(0,+$('#reactionMinutesQuick').value||0);state.sleepStart=$('#sleepStart').value||DEFAULT_SLEEP_START;state.sleepEnd=$('#sleepEnd').value||DEFAULT_SLEEP_END;state.techCount=Math.max(1,Math.min(100,+$('#techCount').value||10));
}
function sync(){
  ['researchSpeed','forgeSpeed','forgeLevel','forgeMode','remainingDays','remainingHours','remainingMinutes','waitLimit','horizon'].forEach(id=>$('#'+id).value=state[id]);
  $('#reactionMinutesQuick').value=state.reactionMinutes;
  $('#sleepStart').value=state.sleepStart||DEFAULT_SLEEP_START;
  $('#sleepEnd').value=state.sleepEnd||DEFAULT_SLEEP_END;
  $('#techCount').value=state.techCount||state.techQueue?.length||10;
  $('#forgeOngoing').checked=state.forgeOngoing;toggleRemaining();
}
function toggleRemaining(){$('#remainingInputs').style.opacity=$('#forgeOngoing').checked?'1':'.32';$('#remainingInputs').querySelectorAll('input').forEach(x=>x.disabled=!$('#forgeOngoing').checked)}

function calcTech(start,endLimit){
  let avail=new Date(start),out=[];
  for(let i=0;i<state.techQueue.length;i++){
    const def=techDef(state.techQueue[i]);if(!def)continue;
    const dur=techDur(def),slot=nextTechSlot(avail,dur);
    if(slot.collect>endLimit)break;
    out.push({
      type:'tech',i:i+1,def,start:slot.start,finish:slot.finish,end:slot.collect,collect:slot.collect,
      dur,gap:slot.start-avail,readyWait:slot.collect-slot.finish,
      quiet:quietOverlap(slot.start,slot.finish),scored:isTechDay(slot.collect)
    });
    avail=new Date(slot.collect.getTime()+reactionMs());
  }
  return out
}
function calcForge(start,endLimit){
  let avail=new Date(start),out=[];
  if(state.forgeOngoing){
    avail=new Date(start.getTime()+state.remainingDays*DAY+state.remainingHours*HOUR+state.remainingMinutes*MIN);
  }
  let lvl=state.forgeLevel;
  for(let i=0;i<80;i++){
    let def=forgeDef(lvl+1);if(!def)break;

    // Gracz nie zakłada ręcznej aktywności między 23:00 a 08:00.
    let completion=new Date(avail);
    let afterReaction=new Date(completion.getTime()+reactionMs());
    let earliest=nextAwakeTime(afterReaction);
    let reactionWait=Math.min(reactionMs(),Math.max(0,earliest-completion));
    let sleepWait=Math.max(0,earliest-afterReaction);

    let point=nextForgeSlot(earliest);
    let pointWait=Math.max(0,point-earliest);
    let s=earliest,decision=sleepWait>0?'POCZEKAJ DO KOŃCA SNU':'ODPAL OD RAZU';

    if(state.forgeMode==='points'&&!isForgeDay(gameStart(earliest))){
      s=point;decision='CZEKAJ NA PUNKTOWANY DZIEŃ';
    }else if(state.forgeMode==='hybrid'&&!isForgeDay(gameStart(earliest))&&pointWait<=state.waitLimit*HOUR){
      s=point;decision='CZEKAJ NA PUNKTOWANY DZIEŃ';
    }else if(state.forgeMode==='progress'){
      s=earliest;
      decision=sleepWait>0?'ODPAL PO ŚNIE':'ODPAL OD RAZU';
    }

    let e=new Date(s.getTime()+forgeDur(def));
    if(s>endLimit)break;

    const reactionStart=new Date(completion);
    const reactionEnd=new Date(completion.getTime()+reactionWait);
    const sleepStart=new Date(reactionEnd);
    const sleepEnd=new Date(reactionEnd.getTime()+sleepWait);
    const extraWaitStart=new Date(sleepEnd);
    const extraWaitEnd=new Date(s);

    out.push({
      type:'forge',level:lvl+1,def,start:s,end:e,dur:forgeDur(def),
      previousEnd:new Date(completion),
      reactionStart,reactionEnd,
      sleepStart,sleepEnd,
      extraWaitStart,extraWaitEnd,
      wait:s-completion,reactionWait,sleepWait,pointWait,
      scored:isForgeDay(gameStart(s)),decision
    });
    avail=e;lvl++;
  }
  return out;
}
function calculate(){
  read();save();
  Array.from($('#techSelect').options).forEach(option=>{
    const def=techDef(option.value);
    if(def)option.textContent=`${def.name} • ${fmtDur(techDur(def))}`;
  });
  let start=new Date(),limit=new Date(start.getTime()+state.horizon*DAY);results.tech=calcTech(start,limit);results.forge=calcForge(start,limit);
  renderAll();
  $('#results').classList.remove('hidden');
}

function renderQueue(){
  const count=Math.max(1,Math.min(100,Number(state.techCount)||10));
  $('#queueEmpty').style.display=state.techQueue.length?'none':'block';
  if($('#techCountBadge'))$('#techCountBadge').textContent=count;
  $('#techQueue').innerHTML=state.techQueue.map((n,i)=>`<span class="chip">${i+1}. ${n}</span>`).join('');
}
function rebuildTechQueue(){
  const selected=$('#techSelect').value;
  const count=Math.max(1,Math.min(100,+$('#techCount').value||10));
  state.techCount=count;
  state.techQueue=selected?Array(count).fill(selected):[];
  save();
  calculate();
}
function renderSummary(){
  let t=results.tech[0],f=results.forge[0],now=new Date();
  $('#nextTechAction').textContent=t?(t.gap>5*MIN?'NA RAZIE NIE URUCHAMIAJ':'URUCHOM BADANIE TERAZ'):'DODAJ BADANIE';
  $('#nextTechName').textContent=t?.def.name||'Nie wybrano żadnego Tech';
  $('#nextTechTime').textContent=t?(t.gap>5*MIN?`Uruchom ${fmtDate(t.start)} • odbierz ${fmtDate(t.collect)}`:`Odbierz ${fmtDate(t.collect)}`):'—';
  $('#nextTechNote').textContent=t?(t.gap>5*MIN?`Opłaca się poczekać ${fmtDur(t.gap)}. Planner ustawił badanie tak, żeby możliwie dużo robiło się w nocy i można je było odebrać w punktowanym dniu.`:`Badanie może ruszyć od razu. Odbierz je w punktowanym dniu.`):'Dodaj przynajmniej jedno badanie do kolejki.';
  const ongoing=state.forgeOngoing&&(state.remainingDays*DAY+state.remainingHours*HOUR+state.remainingMinutes*MIN)>0;
  $('#nextForgeAction').textContent=ongoing?'KUŹNIA JUŻ PRACUJE':f?(f.wait>5*MIN?'NA RAZIE NIE URUCHAMIAJ':'URUCHOM KUŹNIĘ TERAZ'):'BRAK KOLEJNEGO POZIOMU';
  $('#nextForgeName').textContent=ongoing?`Trwa poziom ${state.forgeLevel}`:(f?`Następnie: poziom ${f.level}`:'—');
  $('#nextForgeTime').textContent=ongoing?`Pozostało ${fmtDur(state.remainingDays*DAY+state.remainingHours*HOUR+state.remainingMinutes*MIN)}`:(f?`Start ${fmtDate(f.start)} • koniec ${fmtDate(f.end)}`:'—');
  $('#nextForgeNote').textContent=ongoing?(f?`Po zakończeniu obecnej kuźni zakładamy około ${state.reactionMinutes} min na wejście do gry. ${f.sleepWait>5*MIN?'Jeśli wypadnie noc, następna akcja przechodzi na poranek. ':''}Następny poziom: około ${fmtDate(f.start)}.`:'Obecna kuźnia trwa.'):(f?(f.sleepWait>5*MIN?`Po zakończeniu kuźni doliczamy około ${state.reactionMinutes} min na wejście do gry. Następny poziom zaplanuj około ${fmtDate(f.start)}.`:f.wait>5*MIN?`Poczekaj do ${fmtDate(f.start)} — wtedy start będzie korzystniejszy.`:`Nie ma sensu czekać — uruchom następny poziom.`):'');
  $('#techHits').textContent=results.tech.filter(x=>x.scored).length;$('#forgeHits').textContent=results.forge.filter(x=>x.scored).length;
  let tw=results.tech.reduce((a,x)=>a+x.gap,0),fw=results.forge.reduce((a,x)=>a+x.wait,0);$('#waitSummary').textContent=`Łączne czekanie: Tech ${fmtDur(tw)} • Kuźnia ${fmtDur(fw)}`;
}
function renderTimeline(){
  $$('.zoom-tabs button').forEach(b=>b.classList.toggle('active',Number(b.dataset.days)===Number(state.horizon)));
  const start=gameStart(new Date()),days=state.horizon,dayW=148,labelW=112,total=labelW+days*dayW,nowTime=new Date();
  let h=`<div class="tl-header" style="width:${total}px"><div class="tl-label-corner"></div>`;
  for(let i=0;i<days;i++){
    let d=new Date(start.getTime()+i*DAY),cfg=D.days[weekday(d)-1],labels=[];
    if(cfg.tech)labels.push('★ PUNKTY ZA ODBIÓR TECH');
    if(cfg.forge)labels.push('★ PUNKTY ZA START KUŹNI');
    h+=`<div class="tl-day ${cfg.tech?'tech-score':''} ${cfg.forge?'forge-score':''}" style="left:${labelW+i*dayW}px;width:${dayW}px"><b>${cfg.short} ${pad(d.getDate())}.${pad(d.getMonth()+1)}</b>${labels.join(' • ')||'ZWYKŁY DZIEŃ'}</div>`;
  }
  h+='</div>';

  const clip=d=>Math.max(start.getTime(),Math.min(start.getTime()+days*DAY,d.getTime()));
  const pos=d=>labelW+(clip(d)-start)/DAY*dayW;
  const exactWidth=(a,b)=>Math.max(0,(clip(b)-clip(a))/DAY*dayW);
  const eventWidth=(a,b)=>Math.max(8,exactWidth(a,b));
  const gapWidth=(a,b)=>Math.max(1,exactWidth(a,b));

  let techEvents='';
  results.tech.forEach(x=>{
    // Start marker
    techEvents+=`<div class="tech-action-marker start" style="left:${pos(x.start)}px" title="Start ${x.def.name}: ${fmtDate(x.start)}"></div>`;

    // Czekanie przed startem — cienka linia, bez kapsułki
    if(x.gap>5*MIN){
      let gapStart=new Date(x.start.getTime()-x.gap);
      const gw=gapWidth(gapStart,x.start);
      const label=gw>=90?`<span class="tech-gap-label">POCZEKAJ ${fmtDur(x.gap)}</span>`:'';
      techEvents+=`<div class="tech-gap wait" style="left:${pos(gapStart)}px;width:${gw}px"><span class="tech-gap-line"></span>${label}</div>`;
    }

    // Samo badanie — jedyny duży blok
    techEvents+=`<div class="tl-event tech ${x.scored?'scored':''}" style="left:${pos(x.start)}px;width:${eventWidth(x.start,x.finish)}px" title="${x.def.name}: start ${fmtDate(x.start)} • gotowe ${fmtDate(x.finish)} • odbiór ${fmtDate(x.collect)}"><span class="event-tag">BADANIE TECH</span><b>${x.def.name}</b><span>START ${fmtDate(x.start)} • GOTOWE ${fmtDate(x.finish)}</span></div>`;

    // Gotowe, ale czekamy z odbiorem — cienka zielona linia
    if(x.readyWait>5*MIN){
      const rw=gapWidth(x.finish,x.collect);
      const label=rw>=105?`<span class="tech-gap-label">GOTOWE — ODBIERZ ${fmtDate(x.collect)}</span>`:'';
      techEvents+=`<div class="tech-gap ready" style="left:${pos(x.finish)}px;width:${rw}px" title="Badanie gotowe. Odbierz ${fmtDate(x.collect)}, żeby dostać punkty."><span class="tech-gap-line"></span>${label}</div>`;
    }

    // Odbiór marker. Jeśli odbiór daje punkty, jest głównym beaconem wizualnym.
    techEvents+=`<div class="tech-action-marker collect" style="left:${pos(x.collect)}px" title="Odbierz ${x.def.name}: ${fmtDate(x.collect)}"></div>`;
    if(x.scored){
      techEvents+=`<div class="score-ray tech-score" style="left:${pos(x.collect)}px" title="PUNKTY: odbierz Tech ${x.def.name} ${fmtDate(x.collect)}"></div>`;
      techEvents+=`<div class="score-point tech" style="left:${pos(x.collect)}px"></div>`;
      techEvents+=`<div class="score-callout tech" style="left:${pos(x.collect)}px">+ PUNKTY • ODBIÓR TECH</div>`;
    }
  });

  let forgeEvents='';
  const rem=state.remainingDays*DAY+state.remainingHours*HOUR+state.remainingMinutes*MIN;
  if(state.forgeOngoing&&rem>0){
    let ongoingStart=nowTime,ongoingEnd=new Date(nowTime.getTime()+rem);
    forgeEvents+=`<div class="tl-event ongoing" style="left:${pos(ongoingStart)}px;width:${eventWidth(ongoingStart,ongoingEnd)}px" title="Aktualnie wykonywana kuźnia. Pozostało ${fmtDur(rem)}"><span class="event-tag">KUŹNIA W TRAKCIE</span><b>Poziom ${state.forgeLevel}</b><span>TERAZ • KONIEC ${fmtDate(ongoingEnd)}</span></div>`;
  }
  results.forge.forEach(x=>{
    if(x.wait>5*MIN){
      // 1) Reakcja = znacznik czasu, a nie szeroka kapsułka.
      if(x.reactionWait>5*MIN && x.reactionEnd>x.reactionStart){
        forgeEvents+=`<div class="forge-reaction-marker" style="left:${pos(x.reactionStart)}px" title="Zakładamy około ${state.reactionMinutes} min na powrót gracza do gry."></div>`;
      }

      // 2) Sen = cienka przerywana linia. Noc jest dodatkowo widoczna w tle osi.
      if(x.sleepWait>5*MIN && x.sleepEnd>x.sleepStart){
        const sw=gapWidth(x.sleepStart,x.sleepEnd);
        const sleepLabel=sw>=54?`<span class="forge-gap-label">SEN</span>`:'';
        forgeEvents+=`<div class="forge-gap sleep" style="left:${pos(x.sleepStart)}px;width:${sw}px"><span class="forge-gap-line"></span>${sleepLabel}</div>`;
      }

      // 3) Dodatkowe oczekiwanie na punktowany start = cienka neutralna linia.
      if(x.extraWaitEnd-x.extraWaitStart>5*MIN){
        const ww=gapWidth(x.extraWaitStart,x.extraWaitEnd);
        const waitText=ww>=76?`<span class="forge-gap-label">CZEKAJ ${fmtDur(x.extraWaitEnd-x.extraWaitStart)}</span>`:'';
        forgeEvents+=`<div class="forge-gap wait" style="left:${pos(x.extraWaitStart)}px;width:${ww}px"><span class="forge-gap-line"></span>${waitText}</div>`;
      }
    }
    forgeEvents+=`<div class="tl-event forge ${x.scored?'scored':''}" style="left:${pos(x.start)}px;width:${eventWidth(x.start,x.end)}px" title="Kuźnia ${x.level}: ${fmtDate(x.start)} → ${fmtDate(x.end)}"><span class="event-tag">${x.scored?'PUNKTOWANY START':'KUŹNIA'}</span><b>Poziom ${x.level}</b><span>START ${fmtDate(x.start)} • KONIEC ${fmtDate(x.end)}</span></div>`;
    if(x.scored){
      forgeEvents+=`<div class="score-ray forge-score" style="left:${pos(x.start)}px" title="PUNKTY: rozpocznij Kuźnię ${x.level} ${fmtDate(x.start)}"></div>`;
      forgeEvents+=`<div class="score-point forge" style="left:${pos(x.start)}px"></div>`;
      forgeEvents+=`<div class="score-callout forge" style="left:${pos(x.start)}px">+ PUNKTY • START KUŹNI</div>`;
    }
  });

  const nightBands=()=>{
    let bands='';
    const s=sleepStartParts(),e=sleepEndParts(),sm=s.h*60+s.m,em=e.h*60+e.m;
    if(sm===em)return bands;
    for(let i=-1;i<=days;i++){
      let base=new Date(start.getTime()+i*DAY);
      let qs=atTime(base,s,0),qe=atTime(base,e,sm>em?1:0);
      if(qe<=start||qs>=new Date(start.getTime()+days*DAY))continue;
      bands+=`<div class="tl-night" style="left:${pos(qs)}px;width:${exactWidth(qs,qe)}px"></div>`;
    }
    return bands;
  };
  const row=(name,events,type='')=>{
    const cls=type==='forge'?'forge-row':type==='tech'?'tech-row':'';
    return `<div class="tl-row ${cls}" style="width:${total}px"><div class="tl-row-label">${name}</div>${nightBands()}${events}</div>`;
  };
  let nowPos=pos(nowTime);

  $('#timeline').style.width=total+'px';
  $('#timeline').innerHTML=h+row('TECH',techEvents,'tech')+row('KUŹNIA',forgeEvents,'forge')+`<div class="tl-now" style="left:${nowPos}px"></div>`;

  let focusTitle='Plan gotowy',focusText='Sprawdź pierwsze bloki na osi czasu.';
  if(state.forgeOngoing&&rem>0){
    focusTitle=`Kuźnia poziom ${state.forgeLevel} jest już w trakcie`;
    focusText=`Nic z nią teraz nie rób. Zostało około ${fmtDur(rem)}. Koniec jest zaznaczony na osi czasu.`;
  }else if(results.tech[0]){
    let x=results.tech[0];
    focusTitle=x.gap>5*MIN?`Tech ${x.def.name}: poczekaj do ${fmtDate(x.start)}`:`Uruchom Tech ${x.def.name} teraz`;
    focusText=`Badanie będzie gotowe ${fmtDate(x.finish)}. Odbierz je ${fmtDate(x.collect)}. ${x.scored?'Za ten odbiór dostaniesz punkty.':''}`;
  }else if(results.forge[0]){
    let x=results.forge[0];
    focusTitle=x.sleepWait>5*MIN?`Kuźnia ${x.level}: noc — uruchom o ${fmtDate(x.start)}`:x.wait>5*MIN?`Kuźnia ${x.level}: poczekaj do ${fmtDate(x.start)}`:`Uruchom kuźnię ${x.level} teraz`;
    focusText=`Przewidywany koniec: ${fmtDate(x.end)}. ${x.scored?'Start będzie punktowany.':''}`;
  }
  $('#timelineFocusTitle').textContent=focusTitle;
  $('#timelineFocusText').textContent=focusText;

  requestAnimationFrame(()=>{
    const scroller=$('.timeline-scroll');
    if(scroller)scroller.scrollLeft=Math.max(0,nowPos-scroller.clientWidth*.28);
  });
}
function renderActions(){
  let all=[...results.tech.map(x=>({when:x.start,type:'tech',title:`Uruchom badanie ${x.def.name}`,sub:`Będzie gotowe ${fmtDate(x.finish)}. Odbierz ${fmtDate(x.collect)}${x.scored?' — wtedy dostaniesz punkty.':'.'}`})),
           ...results.tech.map(x=>({when:x.collect,type:'tech',title:`Odbierz badanie ${x.def.name}`,sub:x.scored?'Ten odbiór jest punktowany.':'Ten odbiór nie daje punktów wojennych.'})),
           ...results.forge.map(x=>({when:x.start,type:'forge',title:`Uruchom kuźnię — poziom ${x.level}`,sub:`Uruchom około ${fmtDate(x.start)}. Skończy się około ${fmtDate(x.end)}${x.scored?' — start daje punkty.':'.'}`}))]
    .sort((a,b)=>a.when-b.when).slice(0,24);
  $('#actionList').innerHTML=all.length?all.map((x,i)=>`<div class="action-item"><div class="action-num">${i+1}</div><div class="action-when">${fmtDate(x.when)}</div><div class="action-main"><b>${x.title}</b><span>${x.sub}</span></div><span class="badge ${x.type}">${x.type==='tech'?'TECH':'KUŹNIA'}</span></div>`).join(''):'<div class="empty-state">Dodaj badania Tech lub sprawdź ustawienia Kuźni.</div>';
}
function renderTables(){
  $('#techTable').innerHTML=results.tech.map(x=>`<tr><td>${x.i}</td><td>${x.def.name}</td><td>${fmtDate(x.start)}</td><td>${fmtDate(x.end)}</td><td>${fmtDur(x.gap)}</td></tr>`).join('')||'<tr><td colspan="5">Brak Tech</td></tr>';
  $('#forgeTable').innerHTML=results.forge.map(x=>`<tr><td>${x.level}</td><td>${fmtDate(x.start)}</td><td>${fmtDate(x.end)}</td><td>${fmtDur(x.wait)}</td></tr>`).join('')||'<tr><td colspan="4">Brak Kuźni</td></tr>';
  let gaps=results.tech.filter(x=>x.gap>5*MIN).map(x=>{let fits=D.tech.map(t=>({t,d:techDur(t)})).filter(y=>y.d<=x.gap).sort((a,b)=>b.d-a.d).slice(0,3);return `<div class="gap-item"><b>${fmtDur(x.gap)} przed ${x.def.name}</b><p>${fits.length?fits.map(y=>`${y.t.name} (${fmtDur(y.d)})`).join(' • '):'Brak badania z tabeli, które się mieści.'}</p><small>Sugestia tylko czasowa — bez sprawdzania wymagań drzewka.</small></div>`}).join('');
  $('#gapSuggestions').innerHTML=gaps||'<div class="gap-item"><b>Brak większych wolnych okien</b><p>Plan Tech wykorzystuje czas dość ciasno.</p></div>';
}
function renderAll(){renderQueue();renderSummary();renderTimeline();renderActions();renderTables()}
function clock(){let n=new Date(),cfg=D.days[weekday(n)-1];$('#nowText').textContent=fmtDate(n);$('#gameDayText').textContent=`Dzień gry: ${cfg.name}`}
function hint(){let m=$('#forgeMode').value;$('#strategyHint').textContent=m==='hybrid'?'Czeka tylko, gdy strata progresu jest mała.':m==='progress'?'Każdy poziom startuje natychmiast.':'Zawsze czeka na środę lub piątek.'}

function sleepOptions(){
  const out=[];
  for(let h=0;h<24;h++){
    for(let m of [0,30]){
      out.push(`${pad(h)}:${pad(m)}`);
    }
  }
  return out;
}
function updateSidebarStatus(){
 const C=window.INPPL_DATA;if(!C)return;
 const wr=C.weeks?.length?`${C.weeks[0].week}–${C.weeks.at(-1).week}`:'—';
 const pr=C.powerWeeks?.length?`${C.powerWeeks[0].week}–${C.powerWeeks.at(-1).week}`:'—';
 const r=document.querySelector('#sideDataRange'),u=document.querySelector('#dataUpdated');
 if(r)r.textContent=`Wojny ${wr} • Power ${pr}`;
 if(u&&C.generatedAt){const d=new Date(C.generatedAt);u.textContent=`Aktualizacja ${d.toLocaleDateString(window.INPPL_I18N?.locale||'pl-PL')} • ${d.toLocaleTimeString(window.INPPL_I18N?.locale||'pl-PL',{hour:'2-digit',minute:'2-digit'})}`;}
}
function init(){
  updateSidebarStatus();
  if('scrollRestoration' in history)history.scrollRestoration='manual';
  window.scrollTo(0,0);
  const sleepOpts=sleepOptions().map(t=>`<option value="${t}">${t}</option>`).join('');
  $('#sleepStart').innerHTML=sleepOpts;
  $('#sleepEnd').innerHTML=sleepOpts;
  $('#sleepStart').setAttribute('aria-label','Śpię od');
  $('#sleepEnd').setAttribute('aria-label','Wstaję o');
  $('#reactionMinutesQuick').setAttribute('aria-label','Czas reakcji w minutach');
  sync();clock();setInterval(clock,30000);
  $('#techSelect').innerHTML=D.tech.map(x=>`<option value="${x.name}">${x.name} • ${fmtDur(techDur(x))}</option>`).join('');
  if(state.techQueue?.length && techDef(state.techQueue[0]))$('#techSelect').value=state.techQueue[0];
  else $('#techSelect').value=D.tech.at(-1)?.name||D.tech[0]?.name||'';
  state.techCount=Math.max(1,Math.min(100,Number(state.techCount)||state.techQueue?.length||10));
  $('#techCount').value=state.techCount;
  state.techQueue=Array(state.techCount).fill($('#techSelect').value);
  renderQueue();hint();
  $('#forgeOngoing').addEventListener('change',toggleRemaining);
  $('#forgeMode').addEventListener('change',hint);
  $('#techSelect').addEventListener('change',rebuildTechQueue);
  $('#techCount').addEventListener('input',rebuildTechQueue);
  $('#techCount').addEventListener('change',rebuildTechQueue);
  $('#advancedBtn').addEventListener('click',()=>{$('#advanced').classList.toggle('open')});

  let timer=null;
  const live=()=>{
    clearTimeout(timer);
    timer=setTimeout(()=>calculate(),120);
  };
  ['researchSpeed','forgeSpeed','forgeLevel','forgeMode','forgeOngoing','remainingDays','remainingHours','remainingMinutes','waitLimit','horizon','reactionMinutesQuick','sleepStart','sleepEnd']
    .forEach(id=>{
      const el=$('#'+id);
      el.addEventListener('input',live);
      el.addEventListener('change',live);
    });

  $$('.zoom-tabs button').forEach(btn=>btn.addEventListener('click',()=>{
    const days=Number(btn.dataset.days)||14;
    $('#horizon').value=days;
    state.horizon=days;
    $$('.zoom-tabs button').forEach(x=>x.classList.toggle('active',x===btn));
    calculate();
  }));

  calculate();
}
init();
})();


(()=>{
"use strict";
const D=window.FM_SOURCE_DATA;
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];
const ascState={pets:0,mounts:0,skills:0,items:0};
const chartSelection={pets:null,mounts:null,skills:null,items:null};
// ForgeData.png supplied by the clan: each row is the upgrade TO this level.
const forgeCosts=[0,400,700,1500,3500,10000,25000,50000,100000,150000,250000,350000,450000,600000,800000,910000,1020000,1130000,1240000,1350000,1460000,1570000,1680000,1790000,1900000,2010000,2120000,2230000,2340000,2450000,2560000,2670000,2780000,2890000,3000000];
const forgeSeconds=[0,300,900,1800,3600,7200,27200,47200,67200,87200,107200,127200,147200,167200,187200,207200,227200,247200,277200,307200,337200,367200,397200,427200,457200,487200,517200,547200,577200,607200,637200,667200,697200,727200,757200];
function readPreference(key){
 try{return JSON.parse(localStorage.getItem('inppl.knowledge.'+key));}catch{return null;}
}
function savePreference(key,value){
 try{localStorage.setItem('inppl.knowledge.'+key,JSON.stringify(value));}catch{/* Keep the page usable when storage is unavailable. */}
}
const savedForge=readPreference('forge');
const validForgeValue=(value,max=Infinity)=>typeof value==='number'&&Number.isFinite(value)&&value>=0&&value<=max;
const forgeSettings={
 discount:validForgeValue(savedForge?.discount,100)?savedForge.discount:0,
 speed:validForgeValue(savedForge?.speed)?savedForge.speed:0
};
// User tables s1/s2/s3: row cost advances to the NEXT level.
// Sum rows before the target; Common starts at Lv1 with 100% chance.
const skillTargets={Common:{level:1,cost:0,chance:100},Rare:{level:6,cost:1200,chance:2},Epic:{level:14,cost:9200,chance:2},Legendary:{level:24,cost:49600,chance:2},Ultimate:{level:45,cost:142000,chance:2},Mythic:{level:74,cost:269600,chance:2}};
const savedSkillDiscount=readPreference('skillDiscount');
let skillDiscount=validForgeValue(savedSkillDiscount,100)?savedSkillDiscount:0;
function skillCalculator(){
 return `<section class="forge-calculator"><h4>Koszt rozwoju skilli</h4><div class="forge-inputs"><label>Discount skilli — zniżka (%)<input data-skill-discount type="number" inputmode="decimal" min="0" max="100" step="any" value="${skillDiscount}"></label></div><p>🎟️ Koszt bazowy × (1 − discount / 100). Koszty z przesłanych tabel Skill Summon: Rare–Mythic przy 🍀 2% szans; Common od Lv1 przy 100%. Koszt dojścia od Lv1 w danym cyklu; osiągnięcie poziomu nie gwarantuje wylosowania skilla. Discount zapisuje się na tym urządzeniu.</p></section>`;
}
function updateSkillTooltips(root){
 $$('.chart-point',root).forEach(point=>{
   point.dataset.baseTip??=point.dataset.tip;
   const target=skillTargets[point.dataset.rarity];
   const extra=target?`<span>🌀 Poziom przywoływania: Lv${target.level} • 🍀 szansa ${target.chance}%</span><span>🎟️ Łączny koszt: ${Math.round(target.cost*(1-skillDiscount/100)).toLocaleString(window.INPPL_I18N?.locale||'pl-PL')} Skill Tickets</span><small>Discount: ${skillDiscount.toLocaleString(window.INPPL_I18N?.locale||'pl-PL')}%. Od Lv1 w tym cyklu, według tabel Skill Summon. Próg szansy, nie gwarancja dropu.</small>`:'<small>🎟️ Przesłany arkusz nie zawiera kosztu dla tego rarity.</small>';
   point.dataset.tip=point.dataset.baseTip+extra;
 });
}
// User tables p1/p2/p3: sum costs before the target level; first chance >=7%.
const petTargets={Common:{level:1,cost:0,chance:100},Rare:{level:6,cost:1400,chance:10},Epic:{level:13,cost:5400,chance:7.2},Legendary:{level:37,cost:48600,chance:7.2},Ultimate:{level:55,cost:90000,chance:7.2},Mythic:{level:80,cost:147500,chance:7.2}};
const savedPetExtraDrop=readPreference('petExtraDrop');
let petExtraDrop=validForgeValue(savedPetExtraDrop)?savedPetExtraDrop:0;
function petCalculator(){
 return `<section class="forge-calculator"><h4>Koszt rozwoju petów</h4><div class="forge-inputs"><label>Extra drop chance — dodatkowy drop (+%)<input data-pet-extra-drop type="number" inputmode="decimal" min="0" step="any" value="${petExtraDrop}"></label></div><p>🥚 Koszt bazowy ÷ (1 + extra drop chance / 100). +50% daje koszt równy ⅔ bazowego. Koszty z tabel Pet Summon: Epic–Mythic przy 🍀 7,2% szans; Rare przy 10% (pierwszy próg powyżej 7%), Common od Lv1 przy 100%. Extra drop zwiększa liczbę dropów, nie szansę na konkretną rarity. Wartość zapisuje się na tym urządzeniu.</p></section>`;
}
function updatePetTooltips(root){
 $$('.chart-point',root).forEach(point=>{
   point.dataset.baseTip??=point.dataset.tip;
   const target=petTargets[point.dataset.rarity];
   const extra=target?`<span>🐾 Poziom przywoływania: Lv${target.level} • 🍀 szansa ${target.chance.toLocaleString(window.INPPL_I18N?.locale||'pl-PL')}%</span><span>🥚 Łączny koszt: ${Math.round(target.cost/(1+petExtraDrop/100)).toLocaleString(window.INPPL_I18N?.locale||'pl-PL')} Eggshells</span><small>Extra drop chance: +${petExtraDrop.toLocaleString(window.INPPL_I18N?.locale||'pl-PL')}%. Szacowany koszt od Lv1 w tym cyklu, według tabel Pet Summon; nie gwarancja dropu.</small>`:'<small>🥚 Przesłany arkusz nie zawiera kosztu dla tego rarity.</small>';
   point.dataset.tip=point.dataset.baseTip+extra;
 });
}
// User tables m1/m2/m3: each level transition costs 1000; first chance >=7%.
const mountTargets={Common:{level:1,cost:0,chance:100},Rare:{level:15,cost:14000,chance:9.9},Epic:{level:31,cost:30000,chance:7.2},Legendary:{level:47,cost:46000,chance:7.2},Ultimate:{level:64,cost:63000,chance:7.2},Mythic:{level:80,cost:79000,chance:7.2}};
const savedMount=readPreference('mount');
const mountSettings={discount:validForgeValue(savedMount?.discount,100)?savedMount.discount:0,extraDrop:validForgeValue(savedMount?.extraDrop)?savedMount.extraDrop:0};
function mountCalculator(){
 return `<section class="forge-calculator"><h4>Koszt rozwoju mountów</h4><div class="forge-inputs"><label>Discount mountów — zniżka (%)<input data-mount="discount" type="number" inputmode="decimal" min="0" max="100" step="any" value="${mountSettings.discount}"></label><label>Extra drop chance — dodatkowy drop (+%)<input data-mount="extraDrop" type="number" inputmode="decimal" min="0" step="any" value="${mountSettings.extraDrop}"></label></div><p>⚙️ Koszt bazowy × (1 − discount / 100) ÷ (1 + extra drop chance / 100). Wpisz oba bonusy niezależnie. Koszty z tabel Mount Summon: Epic–Mythic przy 🍀 7,2% szans; Rare przy 9,9% (pierwszy próg powyżej 7%), Common od Lv1 przy 100%. Extra drop zwiększa liczbę dropów, nie szansę na konkretną rarity. Ustawienia zapisują się na tym urządzeniu.</p></section>`;
}
function updateMountTooltips(root){
 $$('.chart-point',root).forEach(point=>{
   point.dataset.baseTip??=point.dataset.tip;
   const target=mountTargets[point.dataset.rarity];
   const extra=target?`<span>🐎 Poziom przywoływania: Lv${target.level} • 🍀 szansa ${target.chance.toLocaleString(window.INPPL_I18N?.locale||'pl-PL')}%</span><span>⚙️ Łączny koszt: ${Math.round(target.cost*(1-mountSettings.discount/100)/(1+mountSettings.extraDrop/100)).toLocaleString(window.INPPL_I18N?.locale||'pl-PL')} Clockwinders</span><small>Discount: ${mountSettings.discount.toLocaleString(window.INPPL_I18N?.locale||'pl-PL')}% • Extra drop chance: +${mountSettings.extraDrop.toLocaleString(window.INPPL_I18N?.locale||'pl-PL')}%. Szacowany koszt od Lv1 w tym cyklu, według tabel Mount Summon; nie gwarancja dropu.</small>`:'<small>⚙️ Przesłany arkusz nie zawiera kosztu dla tego rarity.</small>';
   point.dataset.tip=point.dataset.baseTip+extra;
 });
}
function forgeDuration(seconds){
 let rest=Math.round(seconds);
 return [[86400,'d'],[3600,'h'],[60,'min'],[1,'s']].map(([unit,label])=>{const n=Math.floor(rest/unit);rest%=unit;return n?`${n} ${label}`:'';}).filter(Boolean).join(' ')||'0 s';
}
function forgeTotals(level){
 return {cost:forgeCosts.slice(0,level).reduce((s,c)=>s+c,0)*(1-forgeSettings.discount/100),seconds:forgeSeconds.slice(0,level).reduce((s,t)=>s+t,0)/(1+forgeSettings.speed/100)};
}
function forgeCalculator(){
 return `<section class="forge-calculator"><h4>Przygotuj kuźnię do Ascension</h4><div class="forge-inputs"><label>Discount — zniżka (%)<input data-forge="discount" type="number" inputmode="decimal" min="0" max="100" step="any" value="${forgeSettings.discount}"></label><label>Forge speed — szybkość kuźni (+%)<input data-forge="speed" type="number" inputmode="decimal" min="0" step="any" value="${forgeSettings.speed}"></label></div><p>Koszt × (1 − discount / 100). Czas ÷ (1 + speed / 100). +50% speed skraca czas do ⅔.</p><p>Sumy od Forge 1. Recovery według poradnika: Multiverse przy Forge 22 (4% szans); bezpieczniejszy cel: Quantum przy Forge 25. Do resetu dolicz osobno 3 000 000 Gold — bez discount. Czas obejmuje ulepszanie kuźni, bez przyspieszeń i zdobywania itemów.</p><details><summary>Koszty i czasy wszystkich 35 poziomów</summary><p>Dane bazowe: przesłany arkusz Forge Data. Wiersz oznacza ulepszenie do wskazanego poziomu.</p><table class="forge-table"><thead><tr><th>Forge</th><th>Koszt Gold</th><th>Czas</th></tr></thead><tbody data-forge-rows></tbody></table></details></section>`;
}
function updateForge(root){
 const gold=n=>Math.round(n).toLocaleString(window.INPPL_I18N?.locale||'pl-PL');
 $('[data-forge-rows]',root).innerHTML=forgeCosts.map((cost,i)=>`<tr><th>${i+1}</th><td>${i?gold(cost*(1-forgeSettings.discount/100)):'—'}</td><td>${i?forgeDuration(forgeSeconds[i]/(1+forgeSettings.speed/100)):'—'}</td></tr>`).join('');
}
// ItemAgeDropChancesLibrary (2026_09_02_09_08) uses zero-based forge levels.
// First forge level with at least 4% chance; Primitive starts at 100%.
const forgeTierLevels=[1,4,7,11,15,19,22,25,30,35];
const forgeTierChances=[100,4,4,4,4,4,4,4,4,4];
function forgeTierTip(name){
 const index=D.itemAges.indexOf(name);if(index<0)return '';
 const level=forgeTierLevels[index],total=forgeTotals(level);
 return `<span>🔨 Kuźnia: Forge ${level} • 🍀 szansa ${forgeTierChances[index].toLocaleString(window.INPPL_I18N?.locale||'pl-PL')}%</span><span>💰 Łączny koszt: ${Math.round(total.cost).toLocaleString(window.INPPL_I18N?.locale||'pl-PL')} Gold</span><span>🕒 Łączny czas: ${forgeDuration(total.seconds)}</span><small>Od Forge 1 w tym cyklu do pierwszego poziomu z co najmniej 4% szans na tier. Primitive: 100% od Forge 1. Bez opłaty za Ascension i czasu zdobywania itemów.</small>`;
}
function updateForgeTooltips(root){
 $$('.chart-point',root).forEach(point=>{
   point.dataset.baseTip??=point.dataset.tip;
   point.dataset.tip=point.dataset.baseTip+forgeTierTip(point.dataset.rarity);
 });
}
const ascZoomState={};

function safeRarityKey(name){
 return String(name).replace(/[^a-z0-9_-]+/gi,"-").toLowerCase();
}
function getSystemRoot(id){
 return document.querySelector(`.system-root[data-system="${id}"]`);
}
function clearChartHover(root){
 root?.querySelectorAll(".chart-point.hovered,.rarity-assets article.hovered").forEach(x=>x.classList.remove("hovered"));
}
function syncRarityHighlight(id,rarity,{sticky=true,scrollCard=false}={}){
 const root=getSystemRoot(id); if(!root)return;
 if(sticky){
   rarity=chartSelection[id]===rarity?null:rarity;
   chartSelection[id]=rarity;
 }
 if(rarity===null)clearChartHover(root);
 root.querySelectorAll("[data-rarity]").forEach(el=>{
   el.classList.toggle("selected-rarity",el.dataset.rarity===rarity);
 });
 const card=rarity===null?null:root.querySelector(`.rarity-assets article[data-rarity="${CSS.escape(rarity)}"]`);
 if(card&&scrollCard)card.scrollIntoView({behavior:"smooth",block:"nearest",inline:"center"});
}
function showChartTooltip(host,evt,html){
 let tip=host.querySelector(".chart-hover-tip");
 if(!tip){
   tip=document.createElement("div");
   tip.className="chart-hover-tip";
   host.appendChild(tip);
 }
 tip.innerHTML=html;
 tip.classList.add("show");
 tip.style.position='fixed';
 tip.style.left=Math.max(8,Math.min(window.innerWidth-tip.offsetWidth-8,evt.clientX+12))+'px';
 tip.style.top=Math.max(8,Math.min(window.innerHeight-tip.offsetHeight-8,evt.clientY+12))+'px';
}
function hideChartTooltip(host){
 host.querySelector(".chart-hover-tip")?.classList.remove("show");
}
function dismissChartTooltips(){
 $$('.chart-hover-tip.show').forEach(tip=>tip.classList.remove('show'));
}
document.addEventListener('pointerdown',event=>{
 if(!event.target.closest('.chart-point'))dismissChartTooltips();
});
document.addEventListener('keydown',event=>{
 if(event.key==='Escape')dismissChartTooltips();
});
window.addEventListener('scroll',dismissChartTooltips,{capture:true,passive:true});
function bindChartInteractions(host,id){
 const root=getSystemRoot(id); if(!host||!root)return;
 host.querySelectorAll(".chart-point").forEach(point=>{
   const rarity=point.dataset.rarity;
   point.addEventListener("mouseenter",e=>{
     clearChartHover(root);
     point.classList.add("hovered");
     root.querySelector(`.rarity-assets article[data-rarity="${CSS.escape(rarity)}"]`)?.classList.add("hovered");
     showChartTooltip(host,e,point.dataset.tip||`<b>${rarity}</b>`);
   });
   point.addEventListener("mousemove",e=>{
     if(point.dataset.tip)showChartTooltip(host,e,point.dataset.tip);
   });
   point.addEventListener("mouseleave",()=>{
     clearChartHover(root);
     hideChartTooltip(host);
     if(chartSelection[id])syncRarityHighlight(id,chartSelection[id],{sticky:false});
   });
   point.addEventListener("focus",()=>{
     const box=point.getBoundingClientRect();
     showChartTooltip(host,{clientX:box.x+box.width/2,clientY:box.y+box.height/2},point.dataset.tip||'');
   });
   point.addEventListener("blur",()=>hideChartTooltip(host));
   point.addEventListener("click",e=>{
     if((id==="items"||id==="skills"||id==="pets"||id==="mounts")&&point.classList.contains('asc-chart-point')){
       syncRarityHighlight(id,rarity,{sticky:true});
       showChartTooltip(host,e,point.dataset.tip);return;
     }
     const targetAsc=point.dataset.asc!==undefined&&point.dataset.asc!==""?Number(point.dataset.asc):ascState[id];
     if(Number.isFinite(targetAsc)&&targetAsc!==ascState[id]){
       ascState[id]=targetAsc;
       chartSelection[id]=rarity;
       renderSystem(id);
       requestAnimationFrame(()=>syncRarityHighlight(id,rarity,{sticky:false,scrollCard:true}));
     }else{
       syncRarityHighlight(id,rarity,{sticky:true,scrollCard:true});
     }
   });
 });
}
function bindAssetInteractions(id){
 const root=getSystemRoot(id); if(!root)return;
 root.querySelectorAll(".rarity-assets article[data-rarity]").forEach(card=>{
   const rarity=card.dataset.rarity;
   card.tabIndex=0;
   card.setAttribute("role","button");
   card.setAttribute("aria-label",`Podświetl ${rarity} na wykresach`);
   const choose=()=>syncRarityHighlight(id,rarity,{sticky:true});
   card.addEventListener("click",choose);
   card.addEventListener("keydown",e=>{if(e.target!==card)return;if(e.key==="Enter"||e.key===" "){e.preventDefault();choose();}});
   card.addEventListener("mouseenter",()=>{
     clearChartHover(root);
     card.classList.add("hovered");
     root.querySelectorAll(`.chart-point[data-rarity="${CSS.escape(rarity)}"]`).forEach(p=>p.classList.add("hovered"));
   });
   card.addEventListener("mouseleave",()=>{
     clearChartHover(root);
     if(chartSelection[id])syncRarityHighlight(id,chartSelection[id],{sticky:false});
   });
 });
}


const labelMeasureContext=document.createElement('canvas').getContext('2d');
function labelTextWidth(text,fontSize,padX){
 labelMeasureContext.font=`700 ${fontSize}px Arial`;
 return Math.ceil(labelMeasureContext.measureText(String(text)).width+padX*2+10);
}
function rectOverlapArea(a,b,pad=0){
 const x=Math.max(0,Math.min(a.x+a.w+pad,b.x+b.w+pad)-Math.max(a.x-pad,b.x-pad));
 const y=Math.max(0,Math.min(a.y+a.h+pad,b.y+b.h+pad)-Math.max(a.y-pad,b.y-pad));
 return x*y;
}
function pointInsideRect(p,r,pad=0){
 return p.x>=r.x-pad&&p.x<=r.x+r.w+pad&&p.y>=r.y-pad&&p.y<=r.y+r.h+pad;
}
function clamp(v,min,max){return Math.max(min,Math.min(max,v))}
function smartLabelLayout(points,bounds,{fontSize=9,height=22,gap=8,padX=7,obstacles=[]}={}){
 const placed=[];
 const allPointObstacles=points.map(p=>({x:p.px-10,y:p.py-10,w:20,h:20}));
 return points.map((p,index)=>{
   const w=labelTextWidth(p.name,fontSize,padX);
   const h=height;
   const above={x:p.px-w/2,y:p.py-gap-h,w,h,side:"above"};
   const below={x:p.px-w/2,y:p.py+gap,w,h,side:"below"};
   const upRight={x:p.px+gap,y:p.py-gap-h,w,h,side:"up-right"};
   const upLeft={x:p.px-gap-w,y:p.py-gap-h,w,h,side:"up-left"};
   const downRight={x:p.px+gap,y:p.py+gap,w,h,side:"down-right"};
   const downLeft={x:p.px-gap-w,y:p.py+gap,w,h,side:"down-left"};
   const farAbove={x:p.px-w/2,y:p.py-gap-h-20,w,h,side:"far-above"};
   const farBelow={x:p.px-w/2,y:p.py+gap+20,w,h,side:"far-below"};
   const right={x:p.px+gap+4,y:p.py-h/2,w,h,side:"right"};
   const left={x:p.px-gap-4-w,y:p.py-h/2,w,h,side:"left"};

   const preferred=index%2===0
     ? [above,below,upRight,upLeft,downRight,downLeft,farAbove,farBelow,right,left]
     : [below,above,downLeft,downRight,upLeft,upRight,farBelow,farAbove,left,right];

   let best=null,bestScore=Infinity;
   for(const raw of preferred){
     const c={...raw};
     c.x=clamp(c.x,bounds.x,bounds.x+bounds.w-c.w);
     c.y=clamp(c.y,bounds.y,bounds.y+bounds.h-c.h);

     let score=0;
     for(const r of placed)score+=rectOverlapArea(c,r,5)*180;
     for(const r of obstacles)score+=rectOverlapArea(c,r,4)*260;
     for(const r of allPointObstacles)score+=rectOverlapArea(c,r,2)*80;

     // Keep leader lines short whenever possible.
     const cx=c.x+c.w/2,cy=c.y+c.h/2;
     score+=Math.hypot(cx-p.px,cy-p.py)*0.16;
     // Prefer the first candidates in the list.
     score+=preferred.indexOf(raw)*3;

     if(score<bestScore){bestScore=score;best=c}
     if(score===0)break;
   }
   placed.push(best);
   return {...p,box:best,fontSize};
 });
}
function laneLabelLayout(points,bounds,{fontSize=10,height=24,padX=8,obstacles=[]}={}){
 const placed=[];
 const blocked=[...obstacles,...points.map(p=>({x:p.px-14,y:p.py-14,w:28,h:28}))];
 return points.map(p=>{
   const w=labelTextWidth(p.name,fontSize,padX),h=height;
   const candidates=[];
   const add=(x,y)=>candidates.push({x:clamp(x,bounds.x,bounds.x+bounds.w-w),y:clamp(y,bounds.y,bounds.y+bounds.h-h),w,h});
   // Search progressively farther from the point, with room around every dot.
   for(let distance=22;distance<bounds.h;distance+=16){
     for(const x of [p.px-w/2,p.px+22,p.px-w-22]){
       add(x,p.py-distance-h);add(x,p.py+distance);
     }
   }
   add(p.px+22,p.py-h/2);add(p.px-w-22,p.py-h/2);
   let best=null,bestScore=Infinity;
   const consider=c=>{
     if([...blocked,...placed].some(r=>rectOverlapArea(c,r,4)>0))return;
     const edgeX=clamp(p.px,c.x,c.x+c.w),edgeY=clamp(p.py,c.y,c.y+c.h);
     const score=Math.hypot(edgeX-p.px,edgeY-p.py)+Math.abs(c.x+c.w/2-p.px)*.15;
     if(score<bestScore){best=c;bestScore=score;}
   };
   candidates.forEach(consider);
   // Full free-space search when the nearby lanes are occupied.
   if(!best)for(let y=bounds.y;y<=bounds.y+bounds.h-h;y+=8)
     for(let x=bounds.x;x<=bounds.x+bounds.w-w;x+=8)consider({x,y,w,h});
   if(!best)throw new Error('Chart label has no free position: '+p.name);
   placed.push(best);
   return {...p,box:best,fontSize};
 });
}
function labelLeaderTarget(p){
 const b=p.box,cx=b.x+b.w/2,cy=b.y+b.h/2;
 const dx=p.px-cx,dy=p.py-cy;
 if(Math.abs(dx)>Math.abs(dy)){
   return {x:dx>0?b.x+b.w:b.x,y:cy};
 }
 return {x:cx,y:dy>0?b.y+b.h:b.y};
}
function chartProfile(host,rowCount,cycles=1,mode="default"){
 const viewport=Math.max(320,Math.round(host?.getBoundingClientRect?.().width||1200));
 const dense=rowCount>6;
 const narrow=viewport<900;
 const medium=viewport>=900&&viewport<1250;
 const isItemsAsc=(mode==="items-asc");

 // SVG viewBox is now a logical coordinate system only.
 // Actual on-screen width is controlled by AUTO zoom.
 let intrinsic;
 if(cycles===4){
   intrinsic=isItemsAsc?2400:1900;
 }else{
   intrinsic=dense?1450:1320;
 }

 return {
   viewport,dense,narrow,medium,intrinsic,isItemsAsc,
   labelFont:isItemsAsc ? 13.2 : (dense?(narrow?10.0:10.8):(narrow?10.4:11.3)),
   labelHeight:isItemsAsc ? 30 : (dense?25:27),
   labelPadX:isItemsAsc ? 9.5 : (dense?7:8.5),
   labelGap:isItemsAsc ? 12 : (dense?10:11)
 };
}
let responsiveRenderTimer=0;
let renderedViewportWidth=window.innerWidth;
window.addEventListener("resize",()=>{
 // Mobile keyboards and browser bars change height without changing chart layout.
 // Keep the existing inputs (and their focus) when the width stays the same.
 if(window.innerWidth===renderedViewportWidth)return;
 clearTimeout(responsiveRenderTimer);
 responsiveRenderTimer=setTimeout(()=>{
   if(window.innerWidth===renderedViewportWidth)return;
   renderedViewportWidth=window.innerWidth;
   const active=document.querySelector(".view.active")?.id;
   if(D.systems[active])renderSystem(active);
 },180);
},{passive:true});
const COLORS={Common:"#95a4b7",Rare:"#56a7e8",Epic:"#61d291",Legendary:"#e6c24c",Ultimate:"#ed923d",Mythic:"#c95be8",
Primitive:"#95a4b7",Medieval:"#72a7d8","Early-Modern":"#59bf9a",Modern:"#89c76a",Space:"#d8bd4e",Interstellar:"#e29147",Multiverse:"#ca6bce",Quantum:"#9a77ed",Underworld:"#e46067",Divine:"#f1cb58"};
const fmt=n=>{
 if(!Number.isFinite(Number(n)))return "—";n=Number(n);const a=Math.abs(n);
 if(a>=1e12)return (n/1e12).toLocaleString(window.INPPL_I18N?.locale||'pl-PL',{maximumFractionDigits:2})+"T";
 if(a>=1e9)return (n/1e9).toLocaleString(window.INPPL_I18N?.locale||'pl-PL',{maximumFractionDigits:2})+"B";
 if(a>=1e6)return (n/1e6).toLocaleString(window.INPPL_I18N?.locale||'pl-PL',{maximumFractionDigits:2})+"M";
 if(a>=1e3)return (n/1e3).toLocaleString(window.INPPL_I18N?.locale||'pl-PL',{maximumFractionDigits:2})+"K";
 return n.toLocaleString(window.INPPL_I18N?.locale||'pl-PL',{maximumFractionDigits:1});
};
const fmtTime=s=>{s=Number(s);if(s>=86400)return (s/86400).toLocaleString(window.INPPL_I18N?.locale||'pl-PL',{maximumFractionDigits:1})+" d";if(s>=3600)return (s/3600).toLocaleString(window.INPPL_I18N?.locale||'pl-PL',{maximumFractionDigits:1})+" h";return Math.round(s/60)+" min"};
const fmtMultExact=n=>{
 n=Number(n);
 if(n===1)return "×1";
 return "×"+Math.round(n).toLocaleString(window.INPPL_I18N?.locale||'pl-PL');
};
const fmtAxis=n=>{
 n=Number(n);
 if(n>=1e12)return "×"+(n/1e12).toLocaleString(window.INPPL_I18N?.locale||'pl-PL',{maximumFractionDigits:0})+"T";
 if(n>=1e9)return "×"+(n/1e9).toLocaleString(window.INPPL_I18N?.locale||'pl-PL',{maximumFractionDigits:0})+"B";
 if(n>=1e6)return "×"+(n/1e6).toLocaleString(window.INPPL_I18N?.locale||'pl-PL',{maximumFractionDigits:0})+"M";
 if(n>=1e3)return "×"+(n/1e3).toLocaleString(window.INPPL_I18N?.locale||'pl-PL',{maximumFractionDigits:0})+"K";
 return "×"+n.toLocaleString(window.INPPL_I18N?.locale||'pl-PL',{maximumFractionDigits:0});
};
const esc=s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));

function activateTab(id,{navigate=false}={}){
 if(!$$('.tab').some(button=>button.dataset.tab===id))id='start';
 savePreference('tab',id);
 if(location.hash!=='#'+id)history[navigate?'pushState':'replaceState'](null,'','#'+id);
 $$(".tab").forEach(b=>b.classList.toggle("active",b.dataset.tab===id));
 $$(".view").forEach(v=>v.classList.toggle("active",v.id===id));
 if(D.systems[id]) renderSystem(id);
 if(id==="ascension") renderAscensionGuide();
 if(id==="tech") renderTech();
 window.scrollTo({top:0,behavior:"smooth"});
}
$$(".tab").forEach(b=>b.addEventListener("click",()=>activateTab(b.dataset.tab,{navigate:true})));
$$("[data-jump]").forEach(b=>b.addEventListener("click",()=>activateTab(b.dataset.jump,{navigate:true})));

function spriteTexture(system,asc){
 const base=D.systems[system].spriteSheet;
 if(!base)return "";
 const prefix=asc===0?"":asc===1?"Mega":asc===2?"Ultra":"Apex";
 return `assets/${prefix}${base}.png`;
}
function spriteHTML(system,rarity,asc,size=76){
 const info=D.spriteIndices[system]?.[rarity];
 if(!info)return "";
 const cfg=system==="mounts"?{cols:4,rows:4}:{cols:8,rows:8};
 const x=info.index%cfg.cols,y=Math.floor(info.index/cfg.cols);
 return `<div class="game-sprite" title="${esc(info.name)}" style="--sprite-url:url('${spriteTexture(system,asc)}');--cols:${cfg.cols};--rows:${cfg.rows};--x:${x};--y:${y};--size:${size}px"></div>`;
}
// Sprite rectangles in the original 1024×1024 item atlases (x, y, width, height).
// SVG viewBox clips one weapon without altering the source artwork.
const itemSpriteRects={
 Primitive:[280,200,138,278],Medieval:[444,250,226,395],
 'Early-Modern':[308,316,138,355],Modern:[112,167,132,197],
 Space:[106,182,56,348],Interstellar:[274,161,186,257],
 Multiverse:[2,168,123,402],Quantum:[324,193,94,335],
 Underworld:[447,395,140,330],Divine:[560,150,100,350]
};
function itemImage(name,rect=itemSpriteRects[name],variant=0){
 const file=D.itemAssets[name];
 if(!file||!rect)return '';
 return `<svg class="item-sprite" viewBox="${rect.join(' ')}" role="img" aria-label="${esc(name)} — przykładowy przedmiot" focusable="false"><defs><clipPath id="item-clip-${safeRarityKey(name)}-${variant}"><rect x="${rect[0]}" y="${rect[1]}" width="${rect[2]}" height="${rect[3]}"/></clipPath></defs><image href="assets/${file}" width="1024" height="1024" clip-path="url(#item-clip-${safeRarityKey(name)}-${variant})"/></svg>`;
}

let artworkPaused=readPreference('artworkPaused')===true;
function rotatingArtwork(system,rarity,asc,cardIndex){
 let frames;
 if(system==='items'){
   frames=(window.FM_ITEM_VARIANTS?.[rarity]||[itemSpriteRects[rarity]]).map((rect,index)=>itemImage(rarity,rect,index));
 }else{
   const variants=window.FM_VISUAL_VARIANTS?.[system]?.[rarity]||[D.spriteIndices[system][rarity]];
   frames=variants.map(info=>{
     const cols=system==='mounts'?4:8;
     return `<div class="game-sprite" style="--sprite-url:url('${spriteTexture(system,asc)}');--cols:${cols};--rows:${cols};--x:${info.index%cols};--y:${Math.floor(info.index/cols)};--size:76px"></div>`;
   });
 }
 // Shuffle once per render; never change the rarity, stage or associated statistics.
 for(let i=frames.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[frames[i],frames[j]]=[frames[j],frames[i]];}
 return `<div class="artwork-rotation" role="img" aria-label="${esc(rarity)} — przykłady wyglądu" data-count="${frames.length}" style="--artwork-offset:${cardIndex*.55}s">${frames.map((frame,i)=>`<div class="artwork-frame" aria-hidden="true" data-frame="${i}">${frame}</div>`).join('')}</div><div class="artwork-browse"><button type="button" data-artwork-step="-1" aria-label="Poprzednia grafika">‹</button><small>${frames.length} <span>grafik</span></small><button type="button" data-artwork-step="1" aria-label="Następna grafika">›</button></div>`;
}
function bindArtworkRotation(root){
 const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
 const groups=$$('.artwork-rotation',root);
 const animations=[];
 groups.forEach((group,index)=>{
   const count=Number(group.dataset.count);if(count<2)return;
   $$('.artwork-frame',group).forEach((frame,i)=>{
     const animation=frame.animate([
       {opacity:1,offset:0},{opacity:1,offset:.82/count},
       {opacity:0,offset:1/count},{opacity:0,offset:1-.18/count},{opacity:1,offset:1}
     ],{duration:count*4000,delay:-count*4000+i*4000-index*550,iterations:Infinity});
     animations.push({animation,group});
   });
 });
 groups.forEach(group=>{
   const frames=$$('.artwork-frame',group);
   $$('[data-artwork-step]',group.parentElement).forEach(button=>button.addEventListener('click',event=>{
     event.stopPropagation();
     let current=frames.findIndex(frame=>frame.classList.contains('artwork-chosen'));
     if(current<0)current=frames.reduce((best,frame,i)=>Number(getComputedStyle(frame).opacity)>Number(getComputedStyle(frames[best]).opacity)?i:best,0);
     const next=(current+Number(button.dataset.artworkStep)+frames.length)%frames.length;
     group.dataset.manual=String(next);
     frames.forEach((frame,i)=>frame.classList.toggle('artwork-chosen',i===next));
     update();
   }));
 });
 const update=()=>{
   root.classList.toggle('artwork-static',reduced.matches);
   animations.forEach(({animation,group})=>{
     if(artworkPaused||group.dataset.manual!==undefined||reduced.matches||document.hidden||!group._visible||!root.closest('.view')?.classList.contains('active'))animation.pause();else animation.play();
   });
   const button=$('[data-artwork-toggle]',root);
   button.textContent=artworkPaused?'▶ Włącz zmianę ikon':'Ⅱ Zatrzymaj zmianę ikon';
   button.setAttribute('aria-pressed',String(artworkPaused));
   button.disabled=reduced.matches;
   button.title=reduced.matches?'Animacje wyłączone zgodnie z ustawieniami urządzenia':'';
 };
 const observer=new IntersectionObserver(entries=>{entries.forEach(entry=>entry.target._visible=entry.isIntersecting);update();});
 groups.forEach(group=>observer.observe(group));
 $('[data-artwork-toggle]',root).addEventListener('click',()=>{artworkPaused=!artworkPaused;if(!artworkPaused)groups.forEach(group=>{delete group.dataset.manual;$$('.artwork-chosen',group).forEach(frame=>frame.classList.remove('artwork-chosen'));});savePreference('artworkPaused',artworkPaused);update();});
 document.addEventListener('visibilitychange',update);
 reduced.addEventListener('change',update);
 root._cleanupArtwork=()=>{observer.disconnect();animations.forEach(({animation})=>animation.cancel());document.removeEventListener('visibilitychange',update);reduced.removeEventListener('change',update);};
 update();
}

function calcRatios(rows){
 return rows.slice(1).map((r,i)=>({from:rows[i].name,to:r.name,value:r.damage/rows[i].damage}));
}
function ascAutoWidth(host,id){
 const root=getSystemRoot(id);
 const rowCount=D.systems[id]?.rows?.length||6;
 const viewport=Math.max(360,Math.round(host?.clientWidth||host?.getBoundingClientRect?.().width||1200));
 const points=rowCount*4;

 // Human-readable spacing per point. Items get more room, but no fixed 4000/7000px monster.
 const perPoint=id==="items"?46:55;
 const cycleGaps=id==="items"?270:240;
 const recoveryGutter=id==="items"?210:170;
 const contentNeed=points*perPoint+cycleGaps+recoveryGutter+130;

 // Modest scroll is okay; fitting everything into one screen is not required.
 const minReadable=id==="items"?2050:Math.max(1500,viewport);
 const maxUseful=id==="items"?2550:2200;
 return Math.round(clamp(Math.max(viewport,contentNeed,minReadable),viewport,maxUseful));
}
function applyAscChartZoom(root,id,zoom){
 const host=$('[data-chart="asc"]',root); if(!host)return;
 const svg=host.querySelector('svg'); if(!svg)return;

 const autoW=ascAutoWidth(host,id);
 const naturalW=Number(svg.dataset.naturalWidth||svg.getAttribute('width')||autoW);
 const naturalH=Number(svg.dataset.naturalHeight||svg.getAttribute('height')||700);
 const z=zoom==="auto"?(window.matchMedia("(max-width:760px)").matches?0.6:1):(Number(zoom)||1);

 // 100% is the smart AUTO width, not the giant SVG viewBox width.
 const renderW=Math.round(autoW*z);
 const aspect=naturalH/(naturalW||autoW);
 const renderH=Math.round(renderW*aspect);

 host.dataset.zoom=String(zoom);
 ascZoomState[id]=String(zoom);
 host.style.setProperty("--asc-render-width",renderW+"px");
 host.style.setProperty("--asc-render-height",renderH+"px");
 svg.style.setProperty("--asc-render-width",renderW+"px");
 svg.style.setProperty("--asc-render-height",renderH+"px");

 root.querySelectorAll('[data-chart-zoom]').forEach(b=>{
   const v=b.dataset.chartZoom;
   b.classList.toggle('active',String(v)===String(zoom));
 });
}
function bindAscChartZoom(root,id){
 const host=$('[data-chart="asc"]',root); if(!host)return;
 const current=ascZoomState[id]||"auto";
 applyAscChartZoom(root,id,current);

 root.querySelectorAll('[data-chart-zoom]').forEach(b=>b.addEventListener('click',()=>{
   applyAscChartZoom(root,id,b.dataset.chartZoom);
 }));

 // Re-fit AUTO after container/window size changes.
 if(!host._ascResizeObserver && "ResizeObserver" in window){
   host._ascResizeObserver=new ResizeObserver(()=>{
     if((host.dataset.zoom||"auto")==="auto")applyAscChartZoom(root,id,"auto");
   });
   host._ascResizeObserver.observe(host);
 }
}
const rarityZoomState={};
function bindRarityChartZoom(root,id){
 const host=$('[data-chart="rarity"]',root),svg=host.querySelector('svg');
 const toolbar=$('[data-rarity-tools]',root);
 toolbar.innerHTML=$('[data-asc-tools]',root).innerHTML.replaceAll('data-chart-zoom','data-rarity-zoom');
 toolbar.querySelector('small').textContent='AUTO na telefonie: 60%. Każdy wykres ma niezależną skalę.';
 const apply=zoom=>{
   rarityZoomState[id]=zoom;
   const {width,height}=svg.viewBox.baseVal;
   const scale=zoom==='auto'?(window.matchMedia('(max-width:760px)').matches?0.6:1):Number(zoom);
   host.style.setProperty('--rarity-render-width',Math.round(width*scale)+'px');
   host.style.setProperty('--rarity-render-height',Math.round(height*scale)+'px');
   toolbar.querySelectorAll('[data-rarity-zoom]').forEach(b=>b.classList.toggle('active',b.dataset.rarityZoom===zoom));
 };
 toolbar.querySelectorAll('[data-rarity-zoom]').forEach(b=>b.addEventListener('click',()=>apply(b.dataset.rarityZoom)));
 apply(rarityZoomState[id]||'auto');
}
function renderSystem(id){
 const root=$(`.system-root[data-system="${id}"]`); if(!root)return;
 const S=D.systems[id],asc=ascState[id],m=D.ascMultipliers[asc],rows=S.rows.map(r=>({...r,damage:r.damage*m,health:r.health*m}));
 const ratios=calcRatios(S.rows),full=S.rows.at(-1).damage/S.rows[0].damage,big=ratios.reduce((a,b)=>b.value>a.value?b:a,ratios[0]);
 const isItems=id==="items";
 root._cleanupArtwork?.();
 $('[data-chart="asc"]',root)?._ascResizeObserver?.disconnect();
 root.innerHTML=`
 <div class="system-head">
   <div><div class="eyebrow">${S.icon} ${S.label.toUpperCase()} • ROZWÓJ POSTACI</div><h2>${isItems?"Itemy i kuźnia — moc oraz koszty":S.label+" — moc oraz koszty"}</h2>
   <p>⚔️ DMG = obrażenia • ❤️ HP = zdrowie. Rarity oznacza rzadkość; tier to kolejny etap rozwoju.</p></div>
   <div class="asc-select"><span>TWÓJ ETAP • A0 = PRZED PIERWSZYM RESETEM</span><div>${D.ascMultipliers.map((x,i)=>`<button data-sys="${id}" data-a="${i}" class="${i===asc?"active":""}">A${i}<small>×${fmt(x)}</small></button>`).join("")}</div></div>
 </div>
 <div class="quick-stats">
   <article><span>WZROST MOCY</span><b>×${fmt(full)}</b><small>${S.rows.at(-1).name} vs ${S.rows[0].name}</small></article>
   <article><span>NAJWIĘKSZY SKOK</span><b>×${fmt(big.value)}</b><small>${big.from} → ${big.to}</small></article>
   <article><span>ASCENSION A${asc}</span><b>×${fmt(m)}</b><small>moc bazowa × bonus etapu</small></article>
   <article><span>PRÓG ASCENSION</span><b>${S.eligibility}</b><small>od tego poziomu możesz zrobić reset</small></article>
 </div>
   ${isItems?forgeCalculator():id==="skills"?skillCalculator():id==="pets"?petCalculator():id==="mounts"?mountCalculator():''}
 <div class="reading-guide"><b>Jak korzystać?</b><span>① Wpisz bonusy z gry powyżej.</span><span>② Dotknij punktu na wykresie, żeby sprawdzić statystyki i koszt.</span><span>③ Jeśli wykres jest za duży, wybierz mniejszy procent.</span></div>
 <section class="visual-card">
   <div class="card-headline"><div><span>1 • WYGLĄD + STATY</span><h3>Poznaj kolejne poziomy jakości</h3></div><small>Przesuń listę w bok, by zobaczyć więcej. Dotknij karty, aby zaznaczyć lub odznaczyć.</small></div>
   <div class="artwork-controls"><small>Wszystkie dostępne grafiki danego tieru. Strzałki zatrzymują rotację i pozwalają wybrać obraz. Statystyki dotyczą tieru.</small><button type="button" data-artwork-toggle></button></div>
   <div class="rarity-assets">${rows.map((r,cardIndex)=>`<article data-rarity="${r.name}" style="--c:${COLORS[r.name]||"#889"}">${rotatingArtwork(id,r.name,asc,cardIndex)}<b>${r.name}</b><div><span>⚔️ DMG ${fmt(r.damage)}</span><span>❤️ HP ${fmt(r.health)}</span>${r.hatch?`<span>🥚 ${fmtTime(r.hatch)}</span>`:""}</div></article>`).join("")}</div>
 </section>
 <section class="visual-card">
   <div class="card-headline"><div><span>2 • WYKRES PROGRESJI</span><h3>O ile mocniejszy jest kolejny tier?</h3></div><small>×10 oznacza dziesięć razy większą moc bazową.</small></div>
   <div class="asc-chart-tools" data-rarity-tools></div>
   <div class="svg-host rarity-chart-viewport" data-chart="rarity"></div>
 </section>
 ${id==="skills"?`<details class="visual-card skill-examples"><summary>🌀 Zobacz przykładowe skille i ich działanie</summary><p>Pasywne statystyki wzmacniają postać. Aktywne efekty działają przy użyciu skilla. Odnowienie to czas do kolejnego użycia. Wartości dla wybranego etapu Ascension.</p><div class="skill-grid">${D.skillExamples.map(s=>`<article style="--c:${COLORS[s.rarity]}">${spriteHTML("skills",s.rarity,0,66).replace(/--x:\d+;--y:\d+;/,(()=>{const i=s.spriteIndex,x=i%8,y=Math.floor(i/8);return `--x:${x};--y:${y};`})())}<div class="skill-title"><b>${s.name}</b><span>${s.rarity}</span></div><div class="skill-meta"><span>Odnowienie <b>${s.cooldown}s</b></span><span>Czas działania <b>${s.duration}s</b></span></div><div class="skill-values"><span>Pasywne ⚔️ <b>${fmt(s.passiveDamage*m)}</b></span><span>Pasywne ❤️ <b>${fmt(s.passiveHealth*m)}</b></span>${s.activeDamage?`<span>Aktywne ⚔️ <b>${fmt(s.activeDamage*m)}</b></span>`:""}${s.activeHealth?`<span>Aktywne ❤️ <b>${fmt(s.activeHealth*m)}</b></span>`:""}</div></article>`).join("")}</div></details>`:""}
 <section class="visual-card asc-full">
   <div class="card-headline"><div><span>3 • PEŁNA ŚCIEŻKA ASCENSION</span><h3>A0 → A1 → A2 → A3 na tej samej skali</h3></div><small>A1 = po pierwszym resecie • A2 = po drugim • A3 = po trzecim</small></div>
   <div class="recovery-note"><b>Powrót do mocy sprzed resetu (recovery):</b> poradnik wskazuje okolice <strong>${S.recovery}</strong>. To orientacyjny cel — wykres porównuje bazowe statystyki.</div>
   <div class="chart-reading-key"><span><i class="key-reset"></i>Szary: odbudowujesz moc</span><span><i class="key-recovered"></i>Zielony: moc odzyskana (A0: start)</span><span>Skala logarytmiczna: równe odstępy oznaczają taki sam mnożnik.</span></div>
   <div class="asc-chart-tools" data-asc-tools>
     <span>ROZMIAR WYKRESU</span>
     <button type="button" data-chart-zoom="auto" class="active">AUTO</button>
     <button type="button" data-chart-zoom="0.1">10%</button>
     <button type="button" data-chart-zoom="0.2">20%</button>
     <button type="button" data-chart-zoom="0.3">30%</button>
     <button type="button" data-chart-zoom="0.4">40%</button>
     <button type="button" data-chart-zoom="0.6">60%</button>
     <button type="button" data-chart-zoom="0.8">80%</button>
     
     <button type="button" data-chart-zoom="1">100%</button>
     <button type="button" data-chart-zoom="1.2">120%</button>
     <button type="button" data-chart-zoom="1.4">140%</button>
     <small>Na telefonie wybierz 10–40%, aby pomniejszyć wykres. Dotknij tieru, aby zobaczyć szczegóły.</small>
   </div>
   <div class="svg-host wide asc-chart-viewport ${id==="items"?"item-asc-chart":""}" data-chart="asc"></div>
 </section>
 <section class="source-mini"><b>Źródła tej zakładki:</b> ${sourceText(id)}</section>`;
 $$(`button[data-sys="${id}"]`,root).forEach(b=>b.addEventListener("click",()=>{ascState[id]=Number(b.dataset.a);renderSystem(id)}));
 renderRarityChart($('[data-chart="rarity"]',root),rows,id);
 renderAscChart($('[data-chart="asc"]',root),S,id);
 bindAscChartZoom(root,id);
 bindRarityChartZoom(root,id);
 if(isItems){
   updateForge(root);updateForgeTooltips(root);
   $$('[data-forge]',root).forEach(input=>input.addEventListener('input',()=>{
     if(input.value===''||!input.validity.valid)return;
     const value=Number(input.value);if(!Number.isFinite(value))return;
     forgeSettings[input.dataset.forge]=value;savePreference("forge",forgeSettings);updateForge(root);updateForgeTooltips(root);
   }));
 }
 if(id==='skills'){
   updateSkillTooltips(root);
   $('[data-skill-discount]',root).addEventListener('input',event=>{
     const input=event.target;
     if(input.value===''||!input.validity.valid)return;
     const value=Number(input.value);if(!validForgeValue(value,100))return;
     skillDiscount=value;savePreference('skillDiscount',value);updateSkillTooltips(root);
   });
 }
 if(id==='pets'){
   updatePetTooltips(root);
   $('[data-pet-extra-drop]',root).addEventListener('input',event=>{
     const input=event.target;
     if(input.value===''||!input.validity.valid)return;
     const value=Number(input.value);if(!validForgeValue(value))return;
     petExtraDrop=value;savePreference('petExtraDrop',value);updatePetTooltips(root);
   });
 }
 if(id==='mounts'){
   updateMountTooltips(root);
   $$('[data-mount]',root).forEach(input=>input.addEventListener('input',()=>{
     if(input.value===''||!input.validity.valid)return;
     const value=Number(input.value);
     if(!validForgeValue(value,input.dataset.mount==='discount'?100:Infinity))return;
     mountSettings[input.dataset.mount]=value;savePreference('mount',mountSettings);updateMountTooltips(root);
   }));
 }
 // Put detailed arithmetic behind a disclosure; keep inputs immediately visible.
 const calculator=$('.forge-calculator',root);
 if(calculator){
   const notes=[...calculator.children].filter(el=>el.tagName==='P');
   const details=document.createElement('details');
   details.className='calculation-help';
   details.innerHTML='<summary>Jak liczymy koszty i co oznaczają bonusy?</summary>';
   notes.forEach(note=>details.appendChild(note));
   calculator.appendChild(details);
   const hint=document.createElement('p');hint.className='bonus-hint';
   hint.textContent='Wpisz 25 dla 25%. Wyniki w podpowiedziach wykresów zmienią się automatycznie. Ustawienia zostają na tym urządzeniu.';
   calculator.querySelector('.forge-inputs').after(hint);
 }
 bindArtworkRotation(root);
 bindAssetInteractions(id);
 if(chartSelection[id])syncRarityHighlight(id,chartSelection[id],{sticky:false});
}
function sourceText(id){
 return id==="pets"?"PetUpgradeLibrary.json + EggLibrary.json + AscensionConfigsLibrary.json":
 id==="mounts"?"MountUpgradeLibrary.json + AscensionConfigsLibrary.json":
 id==="skills"?"SkillPassiveLibrary.json + SkillLibrary.json + AscensionConfigsLibrary.json":
 "ItemBalancingLibrary.json + AscensionConfigsLibrary.json";
}

function renderRarityChart(host,rows,id){
 const profile=chartProfile(host,rows.length,1);
 const W=profile.intrinsic,H=500,L=108,R=48,T=78,B=42;
 const base=rows[0].damage;
 const mults=rows.map(r=>r.damage/base);
 const hi=Math.log10(Math.max(...mults)),lo=0;
 const x=i=>L+i*(W-L-R)/(rows.length-1);
 const y=v=>T+(hi-Math.log10(v))/(hi-lo||1)*(H-T-B);
 const pts=rows.map((r,i)=>({name:r.name,row:r,i,px:x(i),py:y(r.damage/base),color:COLORS[r.name]||"#88a"}));
 const ratios=calcRatios(rows);

 host.style.setProperty("--chart-intrinsic-width",W+"px");

 let svg=`<svg viewBox="0 0 ${W} ${H}" class="chart-svg rarity-svg">`;
 svg+=`<text x="${L}" y="31" class="chart-kicker">PROGRESJA MOCY • NAZWA PRZY KROPCE • KLIK = PODŚWIETLENIE</text>`;

 const expMax=Math.ceil(hi);
 const exps=[];
 for(let p=0;p<=expMax;p+=Math.max(1,Math.ceil(expMax/5)))exps.push(p);
 if(exps.at(-1)!==expMax)exps.push(expMax);
 [...new Set(exps)].forEach(p=>{
   const v=10**p,yy=y(v);
   if(yy>=T-1&&yy<=H-B+1){
     svg+=`<line x1="${L}" y1="${yy}" x2="${W-R}" y2="${yy}" class="grid"/>
           <text x="${L-17}" y="${yy+5}" text-anchor="end" class="axis">${fmtAxis(v)}</text>`;
   }
 });

 svg+=`<polyline points="${pts.map(p=>`${p.px},${p.py}`).join(" ")}" class="power-line"/>`;

 // Reserve multiplier cards so labels never sit on top of ×N transitions.
 const ratioObstacles=[];
 for(let i=1;i<pts.length;i++){
   const a=pts[i-1],b=pts[i],mx=(a.px+b.px)/2,my=Math.max(T+24,(a.py+b.py)/2-3);
   ratioObstacles.push({x:mx-40,y:my-20,w:80,h:38});
 }
 const labels=laneLabelLayout(
   pts,
   {x:L+2,y:T+8,w:W-L-R-4,h:H-T-B-18},
   {fontSize:profile.labelFont,height:profile.labelHeight,padX:profile.labelPadX,obstacles:ratioObstacles,dense:profile.dense}
 );

 labels.forEach(p=>{
   const r=p.row,c=p.color,b=p.box,t=labelLeaderTarget(p);
   const tip=`<b>${r.name} • A${ascState[id]}</b><span>⚔️ DMG: ${fmt(r.damage)}</span><span>❤️ HP: ${fmt(r.health)}</span>${r.hatch?`<span>🥚 Hatch: ${fmtTime(r.hatch)}</span>`:""}<small>Moc vs ${rows[0].name}: ${fmtAxis(r.damage/base)}</small>`;

   svg+=`<g class="chart-point" tabindex="0" data-rarity="${r.name}" data-tip="${esc(tip)}" style="--rarity:${c}">
           <circle cx="${p.px}" cy="${p.py}" r="9" fill="${c}" class="dot hit-dot"/>
           <circle cx="${p.px}" cy="${p.py}" r="19" class="dot-hit-area"/>
           <line x1="${p.px}" y1="${p.py}" x2="${t.x}" y2="${t.y}" class="point-label-link" stroke="${c}"/>
           <g class="point-rarity-label" transform="translate(${b.x+b.w/2},${b.y+b.h/2})">
             <rect x="${-b.w/2}" y="${-b.h/2}" width="${b.w}" height="${b.h}" rx="${Math.min(9,b.h/2)}"
                   fill="${c}" fill-opacity=".14" stroke="${c}"/>
             <text x="0" y="${profile.labelFont*.35}" text-anchor="middle" fill="${c}" style="font-size:${profile.labelFont}px!important">${r.name}</text>
           </g>
         </g>`;
 });

 // The multiplier belongs to the transition, not to either point.
 for(let i=1;i<pts.length;i++){
   const a=pts[i-1],b=pts[i],mx=(a.px+b.px)/2,my=Math.max(T+24,(a.py+b.py)/2-3);
   svg+=`<g class="ratio transition-ratio"><rect x="${mx-38}" y="${my-18}" width="76" height="34" rx="9"/>
         <text x="${mx}" y="${my+5}" text-anchor="middle">×${fmt(ratios[i-1].value)}</text></g>`;
 }

 svg+=`<text x="${L}" y="${H-15}" class="caption">Dotknij punktu: statystyki • mniejszy procent: szerszy widok • przesuń wykres w bok, aby zobaczyć dalsze etapy</text></svg>`;
 host.innerHTML=svg;
 bindChartInteractions(host,id);
}
function renderAscChart(host,S,id){
 const cycles=[0,1,2,3],rows=S.rows,n=rows.length;
 const profile=chartProfile(host,rows.length,4,id==="items"?"items-asc":"default");
 const baseValue=rows[0].damage;
 const maxMultiple=(rows.at(-1).damage*D.ascMultipliers.at(-1))/baseValue;
 const hi=Math.log10(maxMultiple),lo=0;

 // Wider only here. Dense item ascension charts need real space.
 const recoveryGutter=profile.isItemsAsc?235:(profile.dense?220:190);
 const W=profile.intrinsic,H=profile.isItemsAsc?720:680,L=118,R=recoveryGutter,T=88,B=54;
 const usable=W-L-R;
 const cycleGap=profile.isItemsAsc?115:(profile.dense?110:95);
 const cycleW=(usable-cycleGap*3)/4;
 const cycleStart=a=>L+a*(cycleW+cycleGap);
 const xInCycle=(a,j)=>cycleStart(a)+j*cycleW/(n-1);
 const y=v=>T+(hi-Math.log10(v))/(hi-lo)*(H-T-B);
 const ascLabelFont=profile.isItemsAsc?13.2:(profile.dense?(profile.narrow?12.0:12.8):(profile.narrow?11.3:12.1));
 const ascLabelHeight=profile.isItemsAsc?30:(profile.dense?29:28);
 const ascLabelPad=profile.isItemsAsc?9.5:(profile.dense?9:8.5);

 host.style.setProperty('--chart-intrinsic-width',W+'px');

 let svg=`<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" data-natural-width="${W}" data-natural-height="${H}" class="chart-svg asc-svg continuous-asc" style="width:${W}px;height:${H}px;min-width:${W}px;max-width:none">`;
 svg+=`<text x="${L}" y="32" class="chart-kicker">A0 → A3 • PEŁNA ŚCIEŻKA ASCENSION • A0 CAŁE ZIELONE • PO ASCENDZIE SZARY = DO RECOVERY • ZIELONY = PO RECOVERY</text>`;
 svg+=`<text x="${W-20}" y="32" text-anchor="end" class="chart-subtitle">${rows[0].name} A1 = ×50 ${rows[0].name} A0</text>`;

 const expMax=Math.ceil(hi),step=Math.max(1,Math.ceil(expMax/6));
 const exps=[];
 for(let p=0;p<=expMax;p+=step)exps.push(p);
 if(exps.at(-1)!==expMax)exps.push(expMax);
 [...new Set(exps)].forEach(p=>{
   const v=10**p,yy=y(v);
   if(yy<T-1||yy>H-B+1)return;
   svg+=`<line x1="${L}" y1="${yy}" x2="${W-R+32}" y2="${yy}" class="grid"/>
         <text x="${L-18}" y="${yy+5}" text-anchor="end" class="axis">${fmtAxis(v)}</text>`;
 });

 cycles.forEach(a=>{
   const x0=cycleStart(a);
   svg+=`<rect x="${x0-14}" y="${T-24}" width="${cycleW+28}" height="${H-T-B+12}" rx="15" class="cycle-band-soft"/>
         <text x="${x0+cycleW/2}" y="${T+1}" text-anchor="middle" class="cycle-title">A${a} • ${fmtMultExact(D.ascMultipliers[a])}</text>`;
 });
 cycles.slice(1).forEach(a=>{
   const sep=cycleStart(a)-cycleGap/2;
   svg+=`<line x1="${sep}" y1="${T-6}" x2="${sep}" y2="${H-B-2}" class="cycle-separator"/>`;
 });

 const recoveryIndex=rows.findIndex(r=>r.name===S.recovery);
 const recoveryRows=[];

 cycles.forEach(a=>{
   const local=rows.map((r,j)=>({
      name:r.name,j,row:r,color:COLORS[r.name]||'#88a',
      multiple:(r.damage*D.ascMultipliers[a])/baseValue,
      damage:r.damage*D.ascMultipliers[a],
      health:r.health*D.ascMultipliers[a],
      px:xInCycle(a,j),
      py:y((r.damage*D.ascMultipliers[a])/baseValue)
   }));

   svg+=`<polyline points="${local.map(p=>`${p.px},${p.py}`).join(' ')}" class="power-line asc-base-line"/>`;

   // A0 is fully green because there is no previous peak to recover.
   // For A1–A3 split the line exactly at the recovery crossing:
   // gray = still below old peak, green = already above old peak.
   let recoveryCross=null;
   if(a===0){
     svg+=`<polyline points="${local.map(p=>`${p.px},${p.py}`).join(' ')}" class="rebuild-line-post"/>`;
   }else if(a>0){
     const prevPeakY=y((rows.at(-1).damage*D.ascMultipliers[a-1])/baseValue);
     for(let k=0;k<local.length-1;k++){
       const p1=local[k],p2=local[k+1];
       const dy1=p1.py-prevPeakY,dy2=p2.py-prevPeakY;
       if(dy1===0){
         recoveryCross={x:p1.px,y:prevPeakY,index:k,t:0};
         break;
       }
       if(dy1*dy2<=0){
         const t=(prevPeakY-p1.py)/(p2.py-p1.py||1);
         recoveryCross={x:p1.px+(p2.px-p1.px)*t,y:prevPeakY,index:k,t};
         break;
       }
     }
     if(recoveryCross){
       const prePts=[];
       for(let i=0;i<=recoveryCross.index;i++) prePts.push(local[i]);
       prePts.push({px:recoveryCross.x,py:recoveryCross.y});

       const postPts=[{px:recoveryCross.x,py:recoveryCross.y}];
       for(let i=recoveryCross.index+1;i<local.length;i++) postPts.push(local[i]);

       if(prePts.length>1)svg+=`<polyline points="${prePts.map(p=>`${p.px},${p.py}`).join(' ')}" class="rebuild-line-pre"/>`;
       if(postPts.length>1)svg+=`<polyline points="${postPts.map(p=>`${p.px},${p.py}`).join(' ')}" class="rebuild-line-post"/>`;
     }
   }

   const peak=local.at(-1);
   const peakObstacle={x:peak.px-58,y:peak.py-56,w:116,h:40};

   const labels=laneLabelLayout(
      local,
      {x:cycleStart(a)+4,y:T+18,w:cycleW-8,h:H-T-B-28},
      {
        fontSize:ascLabelFont,
        height:ascLabelHeight,
        padX:ascLabelPad,
        obstacles:[peakObstacle],
        dense:profile.dense
      }
   );

   labels.forEach(p=>{
     const b=p.box,t=labelLeaderTarget(p),c=p.color;
     const tip=`<b>${p.name} • A${a}</b><span>⚔️ DMG: ${fmt(p.damage)}</span><span>❤️ HP: ${fmt(p.health)}</span><small>Moc względem ${rows[0].name} A0: ${fmtAxis(p.multiple)}</small>`;
     svg+=`<g class="chart-point asc-chart-point" tabindex="0" data-rarity="${p.name}" data-asc="${a}" data-tip="${esc(tip)}" style="--rarity:${c};color:${c}">
             <circle cx="${p.px}" cy="${p.py}" r="${p.j===n-1?9:7}" fill="${c}" class="dot hit-dot"/>
             <circle cx="${p.px}" cy="${p.py}" r="18" class="dot-hit-area"/>
             <line x1="${p.px}" y1="${p.py}" x2="${t.x}" y2="${t.y}" class="point-label-link"/>
             <g class="point-rarity-label compact" transform="translate(${b.x+b.w/2},${b.y+b.h/2})">
               <rect x="${-b.w/2}" y="${-b.h/2}" width="${b.w}" height="${b.h}" rx="${Math.min(10,b.h/2)}"/>
               <circle cx="${-b.w/2+9}" cy="0" r="3.5" fill="${c}" class="rarity-accent-dot"/>
               <text x="5" y="${ascLabelFont*.34}" text-anchor="middle" style="font-size:${ascLabelFont}px!important">${p.name}</text>
             </g>
           </g>`;
   });

   const px=peak.px,py=peak.py;
   svg+=`<circle cx="${px}" cy="${py}" r="12" class="asc-peak-ring pointer-events-none"/>
         <g class="peak-label pointer-events-none">
           <rect x="${px-50}" y="${py-50}" width="100" height="28" rx="8"/>
           <text x="${px}" y="${py-31}" text-anchor="middle">${a<3?'ASCENSION':'KONIEC A3'}</text>
         </g>`;

   if(a<3){
     const nx=xInCycle(a+1,0);
     const nextCommon=(rows[0].damage*D.ascMultipliers[a+1])/baseValue;
     const ny=y(nextCommon);
     const gapCenter=(px+nx)/2;

     svg+=`<path d="M${px+8},${py+5} C${px+32},${py+32} ${nx-32},${ny-32} ${nx-8},${ny-5}" class="reset-curve pointer-events-none"/>
           <g class="reset-badge-clean pointer-events-none">
             <rect x="${gapCenter-35}" y="${(py+ny)/2-16}" width="70" height="32" rx="9"/>
             <text x="${gapCenter}" y="${(py+ny)/2+4}" text-anchor="middle">RESET</text>
           </g>`;

     if(recoveryIndex>=0){
       const lineEndX=W-R+28;
       const nextLocal=rows.map((r,j)=>({
         name:r.name,j,
         px:xInCycle(a+1,j),
         py:y((r.damage*D.ascMultipliers[a+1])/baseValue)
       }));
       let crossX=xInCycle(a+1,recoveryIndex), crossY=py;
       for(let k=0;k<nextLocal.length-1;k++){
         const p1=nextLocal[k],p2=nextLocal[k+1];
         const dy1=p1.py-py,dy2=p2.py-py;
         if(dy1===0){ crossX=p1.px; crossY=py; break; }
         if(dy1*dy2<=0){
           const t=(py-p1.py)/(p2.py-p1.py||1);
           crossX=p1.px+(p2.px-p1.px)*t;
           crossY=py;
           break;
         }
       }

       svg+=`<line x1="${px}" y1="${py}" x2="${lineEndX}" y2="${py}" class="recovery-guide-clean pointer-events-none"/>
             <circle cx="${crossX}" cy="${crossY}" r="8" class="recover-dot pointer-events-none"/>`;

       recoveryRows.push({
         label:`A${a} peak ≈ ${S.recovery} A${a+1}`,
         y:py,
         color:COLORS[S.recovery]||'#63d09a'
       });
     }
   }
 });

 recoveryRows.sort((a,b)=>a.y-b.y);
 const minGap=38;
 for(let i=1;i<recoveryRows.length;i++){
   if(recoveryRows[i].y-recoveryRows[i-1].y<minGap){
     recoveryRows[i].y=recoveryRows[i-1].y+minGap;
   }
 }
 recoveryRows.forEach(r=>{
   const x0=W-R+38,w=R-56;
   svg+=`<g class="recovery-side-label pointer-events-none" style="--recovery:${r.color}">
           <rect x="${x0}" y="${r.y-14}" width="${w}" height="28" rx="8"/>
           <circle cx="${x0+11}" cy="${r.y}" r="4"/>
           <text x="${x0+22}" y="${r.y+4}">${r.label}</text>
         </g>`;
 });

 svg+=`<text x="${L}" y="${H-15}" class="caption">A0: cały odcinek jest zielony • po ascension: szary odcinek = jeszcze dochodzisz do recovery • zielony odcinek = już jesteś ponad recovery • zmiana koloru następuje dokładnie w miejscu przecięcia z linią recovery</text></svg>`;
 host.innerHTML=svg;
 bindChartInteractions(host,id);
}
function renderAscensionGuide(){
 const host=$("#ascGuideCards"); if(!host)return;
 host.innerHTML=`<div class="guide-cards">${["pets","mounts","skills","items"].map(k=>{const g=D.guide.pillars[k];return `<article><div class="guide-top"><span>${g.label}</span><b>${g.eligibility}</b></div><div class="guide-three"><div><small>RESET</small><b>${g.reset}</b></div><div><small>ZOSTAJE</small><b>${g.keep}</b></div><div><small>ODZYSKANIE MOCY</small><b>${g.recovery}</b></div></div><div class="guide-target"><span>${g.targetLevel}</span><b>${g.base}</b><small>${g.discount}</small><small>${g.chance}</small>${g.alternative?`<p>${g.alternative}</p>`:""}</div></article>`}).join("")}</div>`;
 const adv=$("#officialGuide");
 adv.innerHTML=`<div class="base-stats">${D.guide.baseStats.map(([a,b])=>`<div><span>${a}</span><b>${b}</b></div>`).join("")}</div><div class="global-rules">${D.guide.global.map((x,i)=>`<div><b>${i+1}</b><span>${x}</span></div>`).join("")}</div>`;
}

function renderTech(){
 renderTechRecommendations();
 $("#techTierStrip").innerHTML=D.tech.tiers.map(t=>`<article><span>Tier ${roman(t.tier)}</span><b>${fmtTime(t.rank1Duration)}</b><small>1/5 • ${fmt(t.rank1Cost)} potions</small><small>1→5: ${fmtTime(t.fullDuration)} • ${fmt(t.fullCost)}</small></article>`).join("");
 renderTechBranch($(".tech-tabs button.active")?.dataset.tech||"Forge");
}
function roman(n){return ["I","II","III","IV","V"][n-1]||n}
function renderTechRecommendations(){
 const r=D.tech.recommendations,host=$("#techRecommendations");
 host.innerHTML=`<section class="tech-start"><span>START • NAJWAŻNIEJSZE</span><h3>Najpierw zrób to</h3><div>${r.start.map((x,i)=>`<article><b>${i+1}</b><span>${x}</span></article>`).join("")}</div><small>${r.note}</small></section>
 <div class="phase-grid"><article><span>🌱 EARLY</span>${r.early.map(x=>`<b>${x}</b>`).join("")}</article><article><span>⚙️ MID</span>${r.mid.map(x=>`<b>${x}</b>`).join("")}</article><article><span>🔥 LATE</span>${r.late.map(x=>`<b>${x}</b>`).join("")}</article></div>`;
}
function renderTechBranch(branch){
 $$(".tech-tabs button").forEach(b=>b.classList.toggle("active",b.dataset.tech===branch));
 const nodes=D.tech.branches[branch],host=$("#techBranch");
 host.innerHTML=`<div class="branch-head"><h3>${branch==="Forge"?"🔨 Forge":branch==="Power"?"⚔️ Power / Mounts":"🧬 Skills / Pets / Tech"}</h3><p>Układ i prerequisites pochodzą z PlayerTechTreePositionLibrary. Efekty poniżej są z aktualnego PlayerTechTreeNodeValuesLibrary.</p></div>
 <div class="node-grid">${nodes.map((n,i)=>`<article class="${priorityClass(n.type)}"><div class="node-order">#${i+1}</div><h4>${n.label}</h4><b>${n.effect}</b><div class="levels">${n.values.length?n.values.map((v,j)=>`<span>${j+1}/5 <strong>${formatTechValue(n.type,v)}</strong></span>`).join(""):"<span>1 poziom</span>"}</div><small>${n.requirements.length?`Wymaga node ID: ${n.requirements.join(", ")}`:"Start ścieżki"}</small></article>`).join("")}</div>`;
}
function priorityClass(type){
 if(["TechResearchTimer","TechNodeUpgradeCost","ForgeTimerSpeed","ForgeUpgradeCost"].includes(type))return "priority-top";
 if(["ExtraMountChance","MountSummonCost","FreeForgeChance","MaxOfflineReward","PetBonusDamage","PetBonusHealth"].includes(type))return "priority-high";
 return "";
}
function formatTechValue(type,v){
 if(type==="AutoForge")return "+1";
 if(type.endsWith("LevelUp"))return `+${v}`;
 const neg=["ForgeUpgradeCost","MountSummonCost","SkillSummonCost","TechNodeUpgradeCost"].includes(type);
 return `${neg?"-":"+"}${(v*100).toLocaleString(window.INPPL_I18N?.locale||'pl-PL',{maximumFractionDigits:0})}%`;
}
$$(".tech-tabs button").forEach(b=>b.addEventListener("click",()=>renderTechBranch(b.dataset.tech)));

function tabFromHash(){
 const id=location.hash.slice(1);
 return $$('.tab').some(button=>button.dataset.tab===id)?id:null;
}
window.addEventListener('hashchange',()=>activateTab(tabFromHash()||'start'));
activateTab(tabFromHash()||readPreference("tab")||"start");
})();

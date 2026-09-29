window.renderWeekPicker=function(container,weeks,selected,onSelect){
 const scroll=container.scrollLeft;
 container.replaceChildren();
 [...weeks].sort((a,b)=>Number(b.week.replace(/\D/g,''))-Number(a.week.replace(/\D/g,''))).forEach(w=>{
 const button=document.createElement('button');button.type='button';
 button.className='week-btn war-week-'+(w.result==='win'?'win':w.result==='loss'?'loss':'unknown')+(w.week===selected?' active':'');
 button.dataset.week=w.week;button.setAttribute('aria-pressed',String(w.week===selected));
 for(const [tag,value] of [['b',w.week],['strong',String(w.tier||'—').replace(/^Tier[- ]?/i,'')],['span',w.date||'—']]){const child=document.createElement(tag);child.textContent=value;button.append(child);}
 button.onclick=()=>onSelect(w.week);container.append(button);
 });container.scrollLeft=scroll;
};

// Shared UI translation. Data keys, input values, player names and game names stay intact.
(()=>{
'use strict';
const params=new URLSearchParams(location.search);
let saved;try{saved=localStorage.getItem('inppl.language');}catch{}
const requested=params.get('lang');
const language=['pl','en'].includes(requested)?requested:saved==='en'?'en':'pl';
try{localStorage.setItem('inppl.language',language);}catch{}
document.documentElement.lang=language;
const dictionary=window.INPPL_EN||{};
const normalize=s=>s.replace(/\s+/g,' ').trim();
const escape=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
const lookup=new Map(Object.entries(dictionary).map(([pl,en])=>[normalize(pl).toLocaleLowerCase('pl'),en]));
const phrases=[...lookup.keys()].sort((a,b)=>b.length-a.length);
const pattern=new RegExp('(?<![\\p{L}\\p{N}_])(?:'+phrases.map(escape).join('|')+')(?![\\p{L}\\p{N}_])','giu');
let namesRef=null,names=new Set();
function playerNames(){
 if(namesRef!==window.INPPL_DATA){namesRef=window.INPPL_DATA;names=new Set((namesRef?.players||[]).map(p=>p.nick));
 for(const group of [namesRef?.outcasts,namesRef?.removedPlayers])if(Array.isArray(group))group.forEach(p=>names.add(p.nick));}
 return names;
}
function translate(value){
 if(language!=='en'||typeof value!=='string'||!value.trim()||playerNames().has(value.trim()))return value;
 const normalized=normalize(value),exact=lookup.get(normalized.toLocaleLowerCase('pl'));
 function casing(source,target){return /[a-ząćęłńóśźż]/.test(source)?target:target.toUpperCase();}
 if(exact)return value.replace(normalized,casing(normalized,exact))===value?casing(normalized,exact):value.replace(normalized,casing(normalized,exact));
 return value.replace(pattern,(match,offset)=>{if(value.slice(offset,offset+7).toLowerCase()==='data.js')return match;return casing(match,lookup.get(normalize(match).toLocaleLowerCase('pl')));});
}
window.INPPL_I18N={language,locale:language==='en'?'en-GB':'pl-PL',t:translate};
// Canvas uses the same translations for measurement and drawing.
if(language==='en'&&window.CanvasRenderingContext2D){
 for(const method of ['fillText','strokeText','measureText']){
 const original=CanvasRenderingContext2D.prototype[method];
 CanvasRenderingContext2D.prototype[method]=function(text,...args){return original.call(this,translate(String(text)),...args);};
 }
}
function init(){
 const switcher=document.createElement('nav');switcher.className='language-switch';switcher.dataset.noTranslate='';switcher.setAttribute('aria-label',language==='en'?'Language':'Język');
 for(const code of ['pl','en']){
 const link=document.createElement('a'),url=new URL(location.href);url.searchParams.set('lang',code);
 link.href=url.href;link.lang=code;link.hreflang=code;link.textContent=code.toUpperCase();
 if(language===code)link.setAttribute('aria-current','true');
 link.addEventListener('click',event=>{event.preventDefault();const target=new URL(location.href);target.searchParams.set('lang',code);location.assign(target.href);});switcher.appendChild(link);
 }
 (document.querySelector('main,.shell')||document.body).prepend(switcher);
 if(language!=='en')return;
 const ignored='script,style,code,[data-no-translate],[contenteditable="true"]';
 const textState=new WeakMap(),attributeState=new WeakMap();
 function visit(node){
 if(node.nodeType===Node.TEXT_NODE){
 if(!node.parentElement||node.parentElement.closest(ignored))return;
 const current=node.nodeValue,last=textState.get(node);if(current===last)return;
 const result=translate(current);if(result!==current)node.nodeValue=result;textState.set(node,result);return;
 }
 if(node.nodeType!==Node.ELEMENT_NODE&&node.nodeType!==Node.DOCUMENT_NODE)return;
 if(node.nodeType===Node.ELEMENT_NODE){
 if(node.matches(ignored))return;
 // Preserve implicit option values before translating their labels.
 if(node.tagName==='OPTION'&&!node.hasAttribute('value'))node.value=node.textContent;
 const previous=attributeState.get(node)||{};
 for(const name of ['title','placeholder','aria-label','alt']){
 const current=node.getAttribute(name);if(current==null||current===previous[name])continue;
 const result=translate(current);if(result!==current)node.setAttribute(name,result);previous[name]=result;
 }attributeState.set(node,previous);
 }
 for(const child of [...node.childNodes])visit(child);
 }
 visit(document.documentElement);
 const observer=new MutationObserver(records=>{
 observer.disconnect();
 for(const record of records){
 if(record.type==='childList')record.addedNodes.forEach(visit);else visit(record.target);
 }
 observe();
 });
 function observe(){observer.observe(document.documentElement,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['title','placeholder','aria-label','alt']});}
 observe();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();

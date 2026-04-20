import React, { useState, useEffect } from 'react';
import { BrainCircuit, ChevronDown, ChevronUp, ArrowUpRight } from 'lucide-react';
import { sC, iC, CLUSTERS, fmt } from '../lib/analytics.js';

export const useWW = () => {
  const[w,setW]=useState(typeof window!=='undefined'?window.innerWidth:1024);
  useEffect(()=>{
    const h=()=>setW(window.innerWidth);
    window.addEventListener('resize',h);
    return()=>window.removeEventListener('resize',h);
  },[]);
  return w;
};

export const CSS=`:root{--surface:#FFFFFF;--surface-hover:#F5F3EE;--surface-border:rgba(26,39,68,0.08);--radius-sm:8px;--radius-md:12px;--radius-lg:16px;--shadow-sm:0 1px 3px rgba(0,0,0,0.07);--shadow-md:0 4px 12px rgba(0,0,0,0.1);--shadow-lg:0 8px 24px rgba(0,0,0,0.14);--spacing-xs:8px;--spacing-sm:12px;--spacing-md:16px;--spacing-lg:24px;--spacing-xl:32px;--font-display:'DM Sans','Inter',system-ui,sans-serif;--font-mono:'Roboto Mono','Fira Code',monospace}html{scroll-padding-top:72px;scroll-behavior:smooth}body{margin:0}*{box-sizing:border-box}@keyframes spin{to{transform:rotate(360deg)}}@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.7}}.hov-card{transition:transform 0.2s ease,box-shadow 0.2s ease,border-color 0.2s ease}.hov-card:hover{transform:translateY(-2px)!important;box-shadow:var(--shadow-lg)!important;border-color:rgba(212,160,23,0.25)!important}.panel-title{font-size:20px;font-weight:700;color:#1A2744;letter-spacing:-0.02em;margin:0}.panel-subtitle{font-size:13px;font-weight:400;color:#5A6478;margin:4px 0 0}.metric-value{font-size:32px;font-weight:700;font-family:var(--font-mono);line-height:1}.metric-label{font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;color:#5A6478;margin:4px 0 0}.body-text{font-size:14px;line-height:1.6;color:rgba(26,39,68,0.8)}.table-header{font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;color:#5A6478}.table-cell{font-size:13px;color:#1A2744}.table-row:hover{background:rgba(26,39,68,0.03)!important}.panel-fade-enter{opacity:0;transform:translateY(8px)}.panel-fade{opacity:1;transform:translateY(0);transition:opacity 0.25s ease,transform 0.25s ease}@keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}.skeleton{background:linear-gradient(90deg,var(--surface) 25%,rgba(26,39,68,0.04) 50%,var(--surface) 75%);background-size:200% 100%;animation:shimmer 1.5s infinite}::-webkit-scrollbar{width:6px;height:6px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:#C4C0B6;border-radius:3px}::-webkit-scrollbar-thumb:hover{background:#A8A49A}::selection{background:rgba(212,160,23,0.3);color:#1A2744}:focus-visible{outline:2px solid #D4A017;outline-offset:2px;box-shadow:0 0 0 4px rgba(212,160,23,0.2)}button:focus:not(:focus-visible),[role="button"]:focus:not(:focus-visible){outline:none}.skip-link{position:absolute;top:-100px;left:16px;background:#1A3A7A;color:#FFFFFF;padding:12px 24px;border-radius:4px;font-weight:600;z-index:9999;transition:top 0.2s ease;text-decoration:none}.skip-link:focus{top:16px}@media(max-width:767px){.metric-col-3,.metric-col-4{display:none!important}}@media print{nav,aside,button,.no-print{display:none!important}main{margin:0!important;padding:20px!important;width:100%!important}.hov-card{break-inside:avoid;page-break-inside:avoid}body{background:white!important;color:black!important}}`;

export const Card = ({children,style,noHover}) => (
  <div className={noHover?'':'hov-card'} style={{background:'var(--surface)',border:'1px solid var(--surface-border)',borderRadius:'var(--radius-md)',padding:'var(--spacing-lg)',boxShadow:'var(--shadow-sm)',...style}}>
    {children}
  </div>
);

export const Met = ({icon:I,label,value,sub,accent,compact}) => (
  <Card style={{flex:compact?'1 1 calc(50% - 4px)':1,minWidth:compact?0:140}}>
    <div style={{display:'flex',alignItems:'center',gap:5,marginBottom:compact?6:10}}>
      <I size={compact?11:13} style={{color:accent}}/>
      <span style={{fontSize:compact?9:11,fontWeight:600,textTransform:'uppercase',letterSpacing:'0.05em',color:'#8C93A8'}}>{label}</span>
    </div>
    <p style={{fontSize:compact?22:30,fontWeight:700,color:accent,margin:0,lineHeight:1,letterSpacing:'-0.02em',fontFamily:'var(--font-mono)'}}>{value}</p>
    {sub&&<p style={{fontSize:compact?10:12,color:'#8C93A8',marginTop:compact?4:6,fontWeight:500}}>{sub}</p>}
  </Card>
);

export const Bd = ({children,color,bg}) => (
  <span style={{padding:'3px 8px',borderRadius:6,fontSize:10,fontWeight:700,background:bg||`${color}22`,color}}>{children}</span>
);

export const Bt = ({active,color,onClick,children}) => (
  <button onClick={onClick} style={{display:'flex',alignItems:'center',gap:4,padding:'8px 14px',minHeight:36,borderRadius:20,fontSize:12,fontWeight:700,border:active?`1.5px solid ${color}`:'1.5px solid rgba(26,39,68,0.15)',background:active?`${color}1a`:'rgba(26,39,68,0.04)',color:active?color:'#5A6478',cursor:'pointer',transition:'all 0.15s ease',fontFamily:'inherit'}}>
    {children}
  </button>
);

export const PanelSkeleton = ({rows=5,title=true}) => (
  <Card>
    {title&&<div className="skeleton" style={{height:24,width:'40%',borderRadius:6,marginBottom:20}}/>}
    <div style={{display:'flex',gap:12,marginBottom:20}}>
      {[1,2,3].map(i=><div key={i} className="skeleton" style={{height:72,flex:1,borderRadius:8}}/>)}
    </div>
    {Array.from({length:rows}).map((_,i)=>(
      <div key={i} className="skeleton" style={{height:16,width:`${90-i*10}%`,borderRadius:4,marginBottom:10}}/>
    ))}
  </Card>
);

export const NC = ({item,expanded,onToggle}) => {
  const sc=sC(item.score);
  const cl=CLUSTERS.find(c=>c.id===item.cluster);
  return(
  <div className="hov-card" style={{background:'var(--surface)',border:'1px solid var(--surface-border)',borderRadius:'var(--radius-md)',borderLeft:`3px solid ${cl?.color||'#64748b'}`,padding:'18px 22px',boxShadow:'var(--shadow-sm)'}}>
    <div style={{display:'flex',justifyContent:'space-between',flexWrap:'wrap',gap:6,marginBottom:8}}>
      <div style={{display:'flex',alignItems:'center',gap:6,flexWrap:'wrap'}}>
        <Bd color={item.mentionType==='direta'?'#ef4444':item.mentionType==='indireta'?'#7C3AED':'#94a3b8'}>{item.mentionType==='direta'?'● DIRETA':item.mentionType==='eleitoral'?'◆ ELEITORAL':item.mentionType==='indireta'?'◇ INDIRETA':'○ INSTITUCIONAL'}</Bd>
        <Bd color={item.scope==='BR'?'#818cf8':'#4ade80'}>{item.scope==='BR'?'NACIONAL':'TOCANTINS'}</Bd>
        {item.relevance>=0.8&&<Bd color="#ef4444">REL {item.relevance}</Bd>}
        {item.relevance>=0.5&&item.relevance<0.8&&<Bd color="#D4A017">REL {item.relevance}</Bd>}
        {item.collectionMethod==='DIRECT_SCRAPE_INDIRECT'&&item.indirectTerm&&<Bd color="#7C3AED">REF: {item.indirectTerm}</Bd>}
        {item.hostileSource&&<Bd color="#DC2626">FONTE HOSTIL</Bd>}
        <span style={{fontSize:13,color:'#8C93A8'}}>{item.source} · {fmt(item.date)}</span>
      </div>
      <div style={{display:'flex',gap:4}}><Bd color={sc.t}>{item.sentiment}</Bd><Bd color={iC(item.impact)}>{item.impact}</Bd></div>
    </div>
    <h4 style={{fontSize:17,fontWeight:700,color:'#1A2744',margin:'0 0 8px',lineHeight:1.45,letterSpacing:'-0.01em'}}>{item.title}</h4>
    {item.keywords.length>0&&<div style={{display:'flex',gap:4,flexWrap:'wrap',marginBottom:10}}>{item.keywords.slice(0,6).map(k=><span key={k} style={{fontSize:10,fontFamily:'monospace',color:'#8C93A8'}}>#{k}</span>)}</div>}
    <div style={{borderTop:'1px solid var(--surface-border)',paddingTop:8,display:'flex',justifyContent:'space-between'}}>
      <button onClick={onToggle} style={{background:'none',border:'none',color:'#D4A017',fontSize:11,fontWeight:700,cursor:'pointer',display:'flex',alignItems:'center',gap:4,fontFamily:'inherit'}}><BrainCircuit size={12}/>{expanded?'Ocultar':'Análise'}{expanded?<ChevronUp size={12}/>:<ChevronDown size={12}/>}</button>
      <a href={item.url} target="_blank" rel="noopener noreferrer" style={{color:'#8C93A8',fontSize:11,textDecoration:'none',fontWeight:600,display:'flex',alignItems:'center',gap:3}}>Fonte <ArrowUpRight size={11}/></a>
    </div>
    {expanded&&<div style={{marginTop:10,padding:12,background:'rgba(26,39,68,0.04)',border:'1px solid rgba(26,39,68,0.08)',borderRadius:'var(--radius-sm)'}}><p style={{fontSize:14,color:'rgba(26,39,68,0.7)',lineHeight:1.6,margin:0}}>{item.analysisNote}</p></div>}
  </div>);
};

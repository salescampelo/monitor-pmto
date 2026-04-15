import React, { useState } from 'react';
import { Target, ChevronUp, ChevronDown } from 'lucide-react';
import { Card, useWW } from '../components/ui.jsx';

export default function KpiPanel({kpiData}) {
  const[open,setOpen]=useState(true);
  const isMobile=useWW()<768;
  if(!kpiData?.kpis?.length)return null;
  const phase=kpiData.current_phase||1;
  const phaseInfo=kpiData.phases?.[String(phase)]||{};
  const electionDate=kpiData.election_date?new Date(kpiData.election_date+'T00:00:00'):null;
  const today=new Date();
  const daysLeft=electionDate?Math.max(0,Math.ceil((electionDate-today)/(1000*60*60*24))):null;

  return(
  <Card style={{marginTop:isMobile?0:32}}>
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:10,cursor:'pointer',marginBottom:open?18:0}} onClick={()=>setOpen(o=>!o)}>
      <div style={{display:'flex',alignItems:'center',gap:12}}>
        <div style={{background:'rgba(212,160,23,0.1)',border:'1px solid rgba(212,160,23,0.2)',borderRadius:12,padding:10}}><Target size={22} style={{color:'#d4a017'}}/></div>
        <div>
          <h2 style={{fontSize:22,fontWeight:800,color:'#1A2744',margin:0}}>Metas da campanha</h2>
          <p style={{fontSize:12,color:'#8c93a8',fontWeight:700,textTransform:'uppercase',letterSpacing:'0.1em',margin:'2px 0 0'}}>Fase {phase}: {phaseInfo.name||''} · {phaseInfo.period||''}</p>
        </div>
      </div>
      <div style={{display:'flex',alignItems:'center',gap:16}}>
        {daysLeft!==null&&<div style={{textAlign:'center'}}><p style={{fontSize:20,fontWeight:800,color:'#d4a017',margin:0}}>{daysLeft}</p><p style={{fontSize:11,color:'#8c93a8',margin:0,textTransform:'uppercase',fontWeight:700}}>dias p/ eleição</p></div>}
        {open?<ChevronUp size={18} style={{color:'#8c93a8'}}/>:<ChevronDown size={18} style={{color:'#8c93a8'}}/>}
      </div>
    </div>
    {open&&(
    <div>
    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:10}}>
      {kpiData.kpis.map(kpi=>{
        const target=kpi.targets?.[String(phase)]||0;
        const current=kpi.current||0;
        const pct=target>0?Math.min(100,Math.round((current/target)*100)):0;
        const isOnTrack=pct>=50;
        const isAchieved=pct>=100;
        const barColor=isAchieved?'#15803d':(isOnTrack?'#1a3a7a':'#b91c1c');
        const statusLabel=isAchieved?'ATINGIDO':(isOnTrack?'NO RITMO':'ATENÇÃO');
        const statusColor=isAchieved?'#15803d':(isOnTrack?'#1a3a7a':'#b91c1c');
        const displayCurrent=kpi.format==='percent'?`${current}%`:current.toLocaleString('pt-BR');
        const displayTarget=kpi.format==='percent'?`${target}%`:target.toLocaleString('pt-BR');
        return(
        <Card key={kpi.id} style={{padding:'14px 18px'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
            <span style={{fontSize:12,fontWeight:700,color:'#8C93A8'}}>{kpi.label}</span>
            <span style={{fontSize:9,fontWeight:700,color:statusColor,background:`${statusColor}12`,padding:'2px 8px',borderRadius:4,textTransform:'uppercase'}}>{statusLabel}</span>
          </div>
          <div style={{display:'flex',alignItems:'baseline',gap:6,marginBottom:8}}>
            <span style={{fontSize:26,fontWeight:800,color:'#1A2744'}}>{displayCurrent}</span>
            <span style={{fontSize:13,color:'#8c93a8'}}>/ {displayTarget}</span>
          </div>
          <div style={{width:'100%',height:6,background:'#eef0f6',borderRadius:3,overflow:'hidden'}}>
            <div style={{width:`${pct}%`,height:'100%',background:barColor,borderRadius:3,transition:'width 0.5s ease'}}/>
          </div>
          <p style={{fontSize:10,color:'#8c93a8',marginTop:4,textAlign:'right'}}>{pct}% da meta da Fase {phase}</p>
        </Card>);
      })}
    </div>
    </div>
    )}
  </Card>);
}

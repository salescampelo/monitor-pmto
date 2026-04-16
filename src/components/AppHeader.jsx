import React from 'react';
import { RefreshCw, Menu, LogOut } from 'lucide-react';

const getKpiColor = (type, value) => {
  const n = typeof value === 'string' ? parseInt(value) : (value ?? 0);
  switch (type) {
    case 'dias':
      if (n > 120) return '#22c55e';
      if (n > 60)  return '#eab308';
      return '#ef4444';
    case 'mencoes':
      if (n > 5) return '#22c55e';
      if (n > 0) return '#eab308';
      return 'rgba(255,255,255,0.5)';
    case 'alertas':
      return n > 0 ? '#ef4444' : 'rgba(255,255,255,0.5)';
    case 'ranking':
      if (n <= 3) return '#22c55e';
      if (n <= 6) return '#eab308';
      return '#FFFFFF';
    default:
      return '#FFFFFF';
  }
};

export default function AppHeader({
  isMobile,refreshing,handleRefresh,nav,setNav,userEmail,onLogout,setPw,lastUpdate,
  daysToElection,followers,mentions24h,alertCount,ranking,
  autoRefreshEnabled,setAutoRefresh,
}) {
  const pad = isMobile ? '24px' : '40px 48px';
  const titleSize = isMobile ? 32 : 48;

  const kpis = [
    { value: daysToElection ?? '—', label: 'DIAS',      type: 'dias'      },
    { value: followers       ?? '—', label: 'SEGUIDORES',type: 'seguidores'},
    { value: mentions24h     ?? '—', label: '24H',       type: 'mencoes'   },
    { value: alertCount      ?? '—', label: 'ALERTAS',   type: 'alertas'   },
    { value: ranking         ?? '—', label: 'RANK',      type: 'ranking'   },
  ];

  return(
  <header style={{background:'linear-gradient(135deg, #1A3A7A 0%, #0D1F42 100%)',padding:pad,position:'relative'}}>

    {/* ── Utility controls (top-right absolute) ── */}
    <div style={{position:'absolute',top:16,right:isMobile?16:24,display:'flex',alignItems:'center',gap:8}}>
      {isMobile&&(
        <button onClick={()=>setNav(n=>({...n,sidebarOpen:!n.sidebarOpen}))}
          style={{background:'rgba(255,255,255,0.08)',border:'1px solid rgba(255,255,255,0.12)',borderRadius:8,padding:'6px 8px',cursor:'pointer',display:'flex',alignItems:'center',color:'rgba(255,255,255,0.7)'}}>
          <Menu size={18}/>
        </button>
      )}
      <button onClick={handleRefresh} disabled={refreshing}
        style={{display:'flex',alignItems:'center',gap:5,padding:'6px 12px',borderRadius:8,background:'rgba(255,255,255,0.08)',border:'1px solid rgba(255,255,255,0.12)',color:'rgba(255,255,255,0.7)',fontSize:11,fontWeight:700,cursor:refreshing?'wait':'pointer',opacity:refreshing?0.6:1,transition:'all 0.18s',whiteSpace:'nowrap',fontFamily:'inherit'}}>
        <RefreshCw size={11} style={{animation:refreshing?'spin 1s linear infinite':'none'}}/>
        {!isMobile&&(refreshing?'...':'Atualizar')}
      </button>
      {onLogout&&<div style={{position:'relative'}}>
        <button onClick={()=>setNav(n=>({...n,avatarOpen:!n.avatarOpen}))} title={userEmail}
          style={{width:32,height:32,borderRadius:'50%',background:'rgba(255,255,255,0.08)',border:'1px solid rgba(255,255,255,0.15)',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',color:'#D4A017',fontSize:11,fontWeight:800,outline:'none'}}>
          CB
        </button>
        {nav.avatarOpen&&<>
          <div style={{position:'fixed',inset:0,zIndex:299}} onClick={()=>setNav(n=>({...n,avatarOpen:false}))}/>
          <div style={{position:'absolute',top:'calc(100% + 6px)',right:0,zIndex:300,background:'#FFFFFF',border:'1px solid rgba(26,39,68,0.08)',borderRadius:8,boxShadow:'0 4px 12px rgba(0,0,0,0.1)',minWidth:160,overflow:'hidden'}}>
            <button onClick={()=>{setNav(n=>({...n,avatarOpen:false}));setPw(p=>({...p,show:true}));}}
              onMouseEnter={e=>e.currentTarget.style.background='#F5F3EE'} onMouseLeave={e=>e.currentTarget.style.background='none'}
              style={{display:'block',width:'100%',padding:'10px 16px',fontSize:13,color:'#1A2744',background:'none',border:'none',cursor:'pointer',textAlign:'left',fontFamily:'inherit'}}>
              Alterar senha
            </button>
            <label
              onMouseEnter={e=>e.currentTarget.style.background='#F5F3EE'} onMouseLeave={e=>e.currentTarget.style.background='none'}
              style={{display:'flex',alignItems:'center',gap:8,width:'100%',padding:'10px 16px',fontSize:13,color:'#1A2744',cursor:'pointer',boxSizing:'border-box'}}>
              <input type="checkbox" checked={!!autoRefreshEnabled} onChange={e=>setAutoRefresh(e.target.checked)} style={{cursor:'pointer',accentColor:'#1A3A7A'}}/>
              Auto-refresh (30min)
            </label>
            <button onClick={()=>{setNav(n=>({...n,avatarOpen:false}));onLogout();}}
              onMouseEnter={e=>e.currentTarget.style.background='#F5F3EE'} onMouseLeave={e=>e.currentTarget.style.background='none'}
              style={{display:'flex',alignItems:'center',gap:8,width:'100%',padding:'10px 16px',fontSize:13,color:'#B91C1C',background:'none',border:'none',cursor:'pointer',textAlign:'left',fontFamily:'inherit'}}>
              <LogOut size={13}/> Sair
            </button>
          </div>
        </>}
      </div>}
    </div>

    {/* ── Eyebrow ── */}
    <p style={{color:'rgba(255,255,255,0.7)',fontSize:12,fontWeight:500,letterSpacing:'2px',textTransform:'uppercase',marginBottom:16,marginTop:0}}>
      CENTRAL DE INTELIGÊNCIA · CAMPANHA 2026
    </p>

    {/* ── Main title ── */}
    <h1 style={{fontSize:titleSize,fontWeight:800,lineHeight:1.1,margin:0,fontFamily:"'DM Sans',sans-serif"}}>
      <span style={{color:'#FFFFFF',display:'block'}}>INTELIGÊNCIA</span>
      <span style={{color:'#FFFFFF',display:'block'}}>ELEITORAL</span>
      <span style={{color:'#D4A017',display:'block'}}>TOCANTINS.</span>
    </h1>

    {/* ── KPI strip ── */}
    <div style={{display:'flex',gap:8,marginTop:24,marginBottom:8,width:'100%',maxWidth:520}}>
      {kpis.map((kpi,i)=>(
        <div key={i} style={{flex:'1 1 0',background:'rgba(255,255,255,0.08)',borderRadius:8,padding:isMobile?'8px 6px':'12px 8px',textAlign:'center',border:'1px solid rgba(255,255,255,0.1)',minWidth:0}}>
          <div style={{fontSize:isMobile?17:22,fontWeight:700,color:getKpiColor(kpi.type,kpi.value),lineHeight:1.2,transition:'color 0.3s ease'}}>
            {kpi.value}
          </div>
          <div style={{fontSize:9,fontWeight:600,color:'rgba(255,255,255,0.5)',textTransform:'uppercase',letterSpacing:'0.5px',marginTop:4}}>
            {kpi.label}
          </div>
        </div>
      ))}
    </div>

    {/* ── Metadata ── */}
    <p style={{color:'rgba(255,255,255,0.5)',fontSize:13,fontWeight:400,marginTop:8,marginBottom:0}}>
      32 fontes monitoradas · TO + Brasil · {lastUpdate||new Date().toLocaleDateString('pt-BR')+' (auto)'}
    </p>

  </header>
  );
}

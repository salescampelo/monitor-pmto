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
  const kpis = [
    { value: daysToElection ?? '—', label: 'DIAS',       type: 'dias'      },
    { value: followers       ?? '—', label: 'SEGUIDORES', type: 'seguidores'},
    { value: mentions24h     ?? '—', label: '24H',        type: 'mencoes'   },
    { value: alertCount      ?? '—', label: 'ALERTAS',    type: 'alertas'   },
    { value: ranking         ?? '—', label: 'RANK',       type: 'ranking'   },
  ];

  return(
  <header style={{background:'linear-gradient(135deg, #1A3A7A 0%, #0D1F42 100%)',padding:isMobile?'56px 20px 24px':'32px 40px 28px',position:'relative'}}>

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

    {/* ── Two-column layout ── */}
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-end',gap:isMobile?24:40,flexDirection:isMobile?'column':'row',flexWrap:'wrap'}}>

      {/* LEFT: Eyebrow + Title + Metadata */}
      <div style={{flex:'1 1 280px',minWidth:0}}>
        <p style={{color:'rgba(255,255,255,0.7)',fontSize:11,fontWeight:500,letterSpacing:'2px',textTransform:'uppercase',margin:'0 0 12px'}}>
          CENTRAL DE INTELIGÊNCIA · CAMPANHA 2026
        </p>
        <h1 style={{fontSize:'clamp(26px, 3.5vw, 42px)',fontWeight:800,lineHeight:1.05,margin:0,fontFamily:"'DM Sans',sans-serif"}}>
          <span style={{color:'#FFFFFF',display:'block'}}>INTELIGÊNCIA</span>
          <span style={{color:'#FFFFFF',display:'block'}}>ELEITORAL</span>
          <span style={{color:'#D4A017',display:'block'}}>TOCANTINS.</span>
        </h1>
        <p style={{color:'rgba(255,255,255,0.5)',fontSize:12,fontWeight:400,margin:'14px 0 0'}}>
          32 fontes monitoradas · TO + Brasil · {lastUpdate||new Date().toLocaleDateString('pt-BR')+' (auto)'}
        </p>
      </div>

      {/* RIGHT: KPI cards */}
      <div style={{display:'flex',gap:10,flexWrap:'wrap',justifyContent:isMobile?'flex-start':'flex-end',flex:'1 1 360px',maxWidth:isMobile?'100%':580}}>
        {kpis.map((kpi,i)=>(
          <div key={i} style={{background:'rgba(255,255,255,0.08)',borderRadius:10,padding:isMobile?'12px 14px':'16px 18px',textAlign:'center',minWidth:80,flex:'1 1 80px',maxWidth:110,border:'1px solid rgba(255,255,255,0.1)'}}>
            <div style={{fontSize:isMobile?20:26,fontWeight:700,color:getKpiColor(kpi.type,kpi.value),lineHeight:1.2,transition:'color 0.3s ease'}}>
              {kpi.value}
            </div>
            <div style={{fontSize:9,fontWeight:600,color:'rgba(255,255,255,0.5)',textTransform:'uppercase',letterSpacing:'0.5px',marginTop:6}}>
              {kpi.label}
            </div>
          </div>
        ))}
      </div>

    </div>
  </header>
  );
}

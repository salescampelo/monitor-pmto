import React from 'react';
import PropTypes from 'prop-types';
import { RefreshCw, Menu, LogOut } from 'lucide-react';

const getKpiColor = (type, value) => {
  switch (type) {
    case 'dias':
      if (value > 120) return '#22c55e';
      if (value > 60)  return '#eab308';
      return '#ef4444';
    case 'seguidores':
      return '#FFFFFF';
    case 'engajamento':
      if (value >= 3)   return '#22c55e';
      if (value >= 1.5) return '#eab308';
      return '#ef4444';
    case 'mencoes':
      if (value >= 5) return '#22c55e';
      if (value >= 1) return '#eab308';
      return 'rgba(255,255,255,0.5)';
    case 'sentimento':
      if (value >= 50) return '#22c55e';
      if (value >= 30) return '#4ade80';
      if (value > 0)   return '#86efac';
      return 'rgba(255,255,255,0.5)';
    default:
      return '#FFFFFF';
  }
};

const getTrendIcon = (current, previous) => {
  if (!previous || previous === 0) return null;
  const pctChange = ((current - previous) / previous) * 100;
  if (Math.abs(pctChange) < 1) return { icon: '→', color: 'rgba(255,255,255,0.5)', label: 'estável' };
  if (pctChange > 0) return { icon: '↑', color: '#22c55e', label: 'subindo' };
  return { icon: '↓', color: '#ef4444', label: 'caindo' };
};

export default function AppHeader({
  isMobile,refreshing,handleRefresh,nav,setNav,userEmail,onLogout,setPw,lastUpdate,
  daysToElection,followers,followersRaw,followersPrevWeek,
  engagementRate,engagementPrevWeek,
  mentions48h,positiveCommentsPct,
  autoRefreshEnabled,setAutoRefresh,
}) {
  return(
  <header style={{background:'linear-gradient(135deg, #1A3A7A 0%, #0D1F42 100%)',padding:isMobile?'56px 20px 24px':'32px 40px 28px',position:'relative'}}>

    {/* ── Utility controls (top-right absolute) ── */}
    <div style={{position:'absolute',top:16,right:isMobile?16:24,display:'flex',alignItems:'center',gap:8}}>
      {isMobile&&(
        <button
          aria-label={nav.sidebarOpen ? 'Fechar menu de navegação' : 'Abrir menu de navegação'}
          aria-expanded={nav.sidebarOpen}
          aria-controls="sidebar-nav"
          onClick={()=>setNav(n=>({...n,sidebarOpen:!n.sidebarOpen}))}
          style={{background:'rgba(255,255,255,0.08)',border:'1px solid rgba(255,255,255,0.12)',borderRadius:8,padding:'6px 8px',cursor:'pointer',display:'flex',alignItems:'center',color:'rgba(255,255,255,0.7)'}}>
          <Menu size={18} aria-hidden="true"/>
        </button>
      )}
      <button
        aria-label={refreshing ? 'Atualizando dados…' : 'Atualizar dados'}
        title="Atualizar dados"
        onClick={handleRefresh} disabled={refreshing}
        style={{display:'flex',alignItems:'center',gap:5,padding:'6px 12px',borderRadius:8,background:'rgba(255,255,255,0.08)',border:'1px solid rgba(255,255,255,0.12)',color:'rgba(255,255,255,0.7)',fontSize:11,fontWeight:700,cursor:refreshing?'wait':'pointer',opacity:refreshing?0.6:1,transition:'all 0.18s',whiteSpace:'nowrap',fontFamily:'inherit'}}>
        <RefreshCw size={11} aria-hidden="true" style={{animation:refreshing?'spin 1s linear infinite':'none'}}/>
        {!isMobile&&(refreshing?'...':'Atualizar')}
      </button>
      {onLogout&&<div style={{position:'relative'}}>
        <button
          aria-label="Menu do usuário"
          aria-haspopup="menu"
          aria-expanded={nav.avatarOpen}
          onClick={()=>setNav(n=>({...n,avatarOpen:!n.avatarOpen}))}
          title={userEmail}
          style={{width:32,height:32,borderRadius:'50%',background:'rgba(255,255,255,0.08)',border:'1px solid rgba(255,255,255,0.15)',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',color:'#D4A017',fontSize:11,fontWeight:800,outline:'none'}}>
          CB
        </button>
        {nav.avatarOpen&&<>
          <div aria-hidden="true" style={{position:'fixed',inset:0,zIndex:299}} onClick={()=>setNav(n=>({...n,avatarOpen:false}))}/>
          <div role="menu" aria-label="Opções do usuário" style={{position:'absolute',top:'calc(100% + 6px)',right:0,zIndex:300,background:'#FFFFFF',border:'1px solid rgba(26,39,68,0.08)',borderRadius:8,boxShadow:'0 4px 12px rgba(0,0,0,0.1)',minWidth:160,overflow:'hidden'}}>
            <button role="menuitem" onClick={()=>{setNav(n=>({...n,avatarOpen:false}));setPw(p=>({...p,show:true}));}}
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
            <button role="menuitem" onClick={()=>{setNav(n=>({...n,avatarOpen:false}));onLogout();}}
              onMouseEnter={e=>e.currentTarget.style.background='#F5F3EE'} onMouseLeave={e=>e.currentTarget.style.background='none'}
              style={{display:'flex',alignItems:'center',gap:8,width:'100%',padding:'10px 16px',fontSize:13,color:'#B91C1C',background:'none',border:'none',cursor:'pointer',textAlign:'left',fontFamily:'inherit'}}>
              <LogOut size={13} aria-hidden="true"/> Sair
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
        <p style={{color:'rgba(255,255,255,0.7)',fontSize:12,fontWeight:400,margin:'14px 0 0'}}>
          32 fontes monitoradas · TO + Brasil · {lastUpdate||new Date().toLocaleDateString('pt-BR')+' (auto)'}
        </p>
      </div>

      {/* RIGHT: KPI cards */}
      <div style={{display:'flex',gap:12,flexWrap:'wrap',justifyContent:isMobile?'flex-start':'flex-end',flex:'1 1 500px',maxWidth:700}}>

        {/* KPI 1: Dias para Eleição */}
        <div style={{background:'rgba(255,255,255,0.08)',borderRadius:10,padding:isMobile?'12px 14px':'14px 18px',textAlign:'center',minWidth:80,flex:'1 1 80px',maxWidth:110,border:'1px solid rgba(255,255,255,0.1)'}}>
          <div style={{fontSize:isMobile?20:28,fontWeight:700,color:getKpiColor('dias',daysToElection??0),lineHeight:1.1,transition:'color 0.3s ease'}}>
            {daysToElection??'—'}
          </div>
          <div style={{fontSize:10,fontWeight:600,color:'rgba(255,255,255,0.6)',textTransform:'uppercase',letterSpacing:'0.5px',marginTop:4}}>
            DIAS P/ ELEIÇÃO
          </div>
        </div>

        {/* KPI 2: Seguidores IG + Tendência */}
        <div style={{background:'rgba(255,255,255,0.08)',borderRadius:10,padding:isMobile?'12px 14px':'14px 18px',textAlign:'center',minWidth:100,flex:'1 1 100px',maxWidth:130,border:'1px solid rgba(255,255,255,0.1)'}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:6}}>
            <span style={{fontSize:isMobile?18:24,fontWeight:700,color:'#FFFFFF',lineHeight:1.1}}>
              {followers??'—'}
            </span>
            {(()=>{const t=getTrendIcon(followersRaw,followersPrevWeek);if(!t)return null;return(
              <span style={{fontSize:16,fontWeight:700,color:t.color,lineHeight:1}} title={`Tendência: ${t.label}`} aria-label={`Tendência ${t.label}`}>{t.icon}</span>
            );})()}
          </div>
          <div style={{fontSize:10,fontWeight:600,color:'rgba(255,255,255,0.6)',textTransform:'uppercase',letterSpacing:'0.5px',marginTop:4}}>
            SEGUIDORES IG
          </div>
        </div>

        {/* KPI 3: Engajamento IG + Tendência */}
        <div style={{background:'rgba(255,255,255,0.08)',borderRadius:10,padding:isMobile?'12px 14px':'14px 18px',textAlign:'center',minWidth:100,flex:'1 1 100px',maxWidth:130,border:'1px solid rgba(255,255,255,0.1)'}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:6}}>
            <span style={{fontSize:isMobile?18:24,fontWeight:700,color:getKpiColor('engajamento',engagementRate??0),lineHeight:1.1}}>
              {(engagementRate??0).toFixed(1)}%
            </span>
            {(()=>{const t=getTrendIcon(engagementRate,engagementPrevWeek);if(!t)return null;return(
              <span style={{fontSize:16,fontWeight:700,color:t.color,lineHeight:1}} title={`Tendência: ${t.label}`} aria-label={`Tendência ${t.label}`}>{t.icon}</span>
            );})()}
          </div>
          <div style={{fontSize:10,fontWeight:600,color:'rgba(255,255,255,0.6)',textTransform:'uppercase',letterSpacing:'0.5px',marginTop:4}}>
            ENGAJAMENTO IG
          </div>
        </div>

        {/* KPI 4: Menções 48h */}
        <div style={{background:'rgba(255,255,255,0.08)',borderRadius:10,padding:isMobile?'12px 14px':'14px 18px',textAlign:'center',minWidth:80,flex:'1 1 80px',maxWidth:110,border:'1px solid rgba(255,255,255,0.1)'}}>
          <div style={{fontSize:isMobile?20:28,fontWeight:700,color:getKpiColor('mencoes',mentions48h??0),lineHeight:1.1,transition:'color 0.3s ease'}}>
            {mentions48h??0}
          </div>
          <div style={{fontSize:10,fontWeight:600,color:'rgba(255,255,255,0.6)',textTransform:'uppercase',letterSpacing:'0.5px',marginTop:4}}>
            IMPRENSA 48H
          </div>
        </div>

        {/* KPI 5: Sentimento Positivo */}
        <div style={{background:'rgba(255,255,255,0.08)',borderRadius:10,padding:isMobile?'12px 14px':'14px 18px',textAlign:'center',minWidth:80,flex:'1 1 80px',maxWidth:110,border:'1px solid rgba(255,255,255,0.1)'}}>
          <div style={{fontSize:isMobile?20:28,fontWeight:700,color:getKpiColor('sentimento',positiveCommentsPct??0),lineHeight:1.1,transition:'color 0.3s ease'}}>
            {positiveCommentsPct??0}%
          </div>
          <div style={{fontSize:10,fontWeight:600,color:'rgba(255,255,255,0.6)',textTransform:'uppercase',letterSpacing:'0.5px',marginTop:4}}>
            POSITIVO IG
          </div>
        </div>

      </div>
    </div>
  </header>
  );
}

AppHeader.propTypes = {
  isMobile:            PropTypes.bool.isRequired,
  refreshing:          PropTypes.bool,
  handleRefresh:       PropTypes.func.isRequired,
  nav:                 PropTypes.shape({
    sidebarOpen: PropTypes.bool,
    avatarOpen:  PropTypes.bool,
  }).isRequired,
  setNav:              PropTypes.func.isRequired,
  userEmail:           PropTypes.string,
  onLogout:            PropTypes.func,
  setPw:               PropTypes.func.isRequired,
  lastUpdate:          PropTypes.string,
  daysToElection:      PropTypes.number,
  followers:           PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  followersRaw:        PropTypes.number,
  followersPrevWeek:   PropTypes.number,
  engagementRate:      PropTypes.number,
  engagementPrevWeek:  PropTypes.number,
  mentions48h:         PropTypes.number,
  positiveCommentsPct: PropTypes.number,
  autoRefreshEnabled:  PropTypes.bool,
  setAutoRefresh:      PropTypes.func,
};

AppHeader.defaultProps = {
  refreshing:          false,
  userEmail:           null,
  onLogout:            null,
  lastUpdate:          null,
  daysToElection:      null,
  followers:           '—',
  followersRaw:        0,
  followersPrevWeek:   null,
  engagementRate:      0,
  engagementPrevWeek:  null,
  mentions48h:         0,
  positiveCommentsPct: 0,
  autoRefreshEnabled:  false,
  setAutoRefresh:      () => {},
};

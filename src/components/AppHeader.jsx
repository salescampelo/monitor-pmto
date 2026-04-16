import React from 'react';
import { ShieldAlert, RefreshCw, Menu } from 'lucide-react';

export default function AppHeader({isMobile,refreshing,handleRefresh,nav,setNav,hm,userEmail,onLogout,setPw}) {
  return(
  <header style={{position:'fixed',top:0,left:0,right:0,height:isMobile?48:160,zIndex:200,background:'radial-gradient(circle at 85% 30%, rgba(212,160,23,0.08) 0%, transparent 50%), linear-gradient(to right, #1A2744, #0D1B2A)',borderBottom:'1px solid rgba(255,255,255,0.06)',display:'flex',flexDirection:'column',boxSizing:'border-box',overflow:'hidden'}}>
    {/* Zona Superior 48px */}
    <div style={{height:48,flexShrink:0,display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 20px',borderBottom:isMobile?'none':'1px solid rgba(255,255,255,0.06)'}}>
      <div style={{display:'flex',alignItems:'center',gap:10}}>
        {isMobile&&<button onClick={()=>setNav(n=>({...n,sidebarOpen:!n.sidebarOpen}))} style={{background:'none',border:'none',cursor:'pointer',padding:6,display:'flex',alignItems:'center',color:'#8C93A8'}}><Menu size={20}/></button>}
        <ShieldAlert size={16} style={{color:'#D4A017'}}/>
      </div>
      <span style={{flex:1,textAlign:'center',fontSize:isMobile?15:16,fontWeight:800,color:'#FFFFFF',letterSpacing:'0.08em',textTransform:'uppercase',whiteSpace:'nowrap'}}>Hub63 Data Solutions</span>
      <div style={{display:'flex',alignItems:'center',gap:8}}>
        <button onClick={handleRefresh} disabled={refreshing} style={{display:'flex',alignItems:'center',gap:5,padding:'5px 10px',borderRadius:16,background:'transparent',border:'1px solid rgba(255,255,255,0.1)',color:'#8C93A8',fontSize:11,fontWeight:700,cursor:refreshing?'wait':'pointer',opacity:refreshing?0.6:1,transition:'all 0.18s',whiteSpace:'nowrap'}}>
          <RefreshCw size={11} style={{animation:refreshing?'spin 1s linear infinite':'none'}}/>{!isMobile&&(refreshing?'...':'Atualizar')}
        </button>
        {onLogout&&<div style={{position:'relative',flexShrink:0}}>
          <button onClick={()=>setNav(n=>({...n,avatarOpen:!n.avatarOpen}))} title={userEmail} style={{width:32,height:32,borderRadius:'50%',background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.12)',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',color:'#D4A017',fontSize:11,fontWeight:800,outline:'none'}}>CB</button>
          {nav.avatarOpen&&<>
            <div style={{position:'fixed',inset:0,zIndex:299}} onClick={()=>setNav(n=>({...n,avatarOpen:false}))}/>
            <div style={{position:'absolute',top:'calc(100% + 6px)',right:0,zIndex:300,background:'#FFFFFF',border:'1px solid rgba(26,39,68,0.08)',borderRadius:8,boxShadow:'0 4px 12px rgba(0,0,0,0.1)',minWidth:160,overflow:'hidden'}}>
              <button onClick={()=>{setNav(n=>({...n,avatarOpen:false}));setPw(p=>({...p,show:true}));}} onMouseEnter={e=>e.currentTarget.style.background='#F5F3EE'} onMouseLeave={e=>e.currentTarget.style.background='none'} style={{display:'block',width:'100%',padding:'10px 16px',fontSize:13,color:'#1A2744',background:'none',border:'none',cursor:'pointer',textAlign:'left',fontFamily:'inherit'}}>Alterar senha</button>
              <button onClick={()=>{setNav(n=>({...n,avatarOpen:false}));onLogout();}} onMouseEnter={e=>e.currentTarget.style.background='#F5F3EE'} onMouseLeave={e=>e.currentTarget.style.background='none'} style={{display:'block',width:'100%',padding:'10px 16px',fontSize:13,color:'#B91C1C',background:'none',border:'none',cursor:'pointer',textAlign:'left',fontFamily:'inherit'}}>Sair</button>
            </div>
          </>}
        </div>}
      </div>
    </div>
    {/* Zona Inferior 112px: 4 cards de métricas (desktop only) */}
    {!isMobile&&(
    <div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{display:'flex',alignItems:'center',gap:40,maxWidth:800}}>
        <div style={{textAlign:'center'}}>
          <p style={{fontSize:11,fontWeight:600,textTransform:'uppercase',letterSpacing:'0.12em',color:'rgba(255,255,255,0.45)',margin:'0 0 4px'}}>Engajamento IG</p>
          <div style={{display:'flex',alignItems:'baseline',gap:6,justifyContent:'center'}}>
            <span style={{fontSize:36,fontWeight:800,color:'#FFFFFF',lineHeight:1,fontFamily:'var(--font-mono)'}}>{hm.engCand!=null?`${hm.engCand}%`:'—'}</span>
            {hm.engDelta!==null&&<span style={{fontSize:16,fontWeight:700,color:hm.engDelta>0?'#22c55e':hm.engDelta<0?'#ef4444':'rgba(255,255,255,0.35)'}}>{hm.engDelta>0?'▲':hm.engDelta<0?'▼':'—'}</span>}
          </div>
          <p style={{fontSize:10,color:'rgba(255,255,255,0.35)',margin:'4px 0 0',whiteSpace:'nowrap'}}>vs adversários {hm.engDelta!=null?(hm.engDelta>0?'+':'')+hm.engDelta+'pp':'—'}</p>
        </div>
        <div style={{width:1,height:56,background:'rgba(255,255,255,0.08)'}}/>
        <div style={{textAlign:'center'}}>
          <p style={{fontSize:11,fontWeight:600,textTransform:'uppercase',letterSpacing:'0.12em',color:'rgba(255,255,255,0.45)',margin:'0 0 4px'}}>Sentimento IG</p>
          <span style={{fontSize:36,fontWeight:800,lineHeight:1,fontFamily:'var(--font-mono)',color:(hm.igSentNeg==null)?'rgba(255,255,255,0.4)':(hm.igSentNeg>=20?'#ef4444':hm.igSentNeg>=10?'#D4A017':'#22c55e')}}>{hm.igSentPct!=null?`${hm.igSentPct}%`:'—'}</span>
          <p style={{fontSize:10,color:'rgba(255,255,255,0.35)',margin:'4px 0 0',whiteSpace:'nowrap'}}>{hm.igSentNeg!=null?`${hm.igSentNeg}% negativo`:'—'}</p>
        </div>
        <div style={{width:1,height:56,background:'rgba(255,255,255,0.08)'}}/>
        <div style={{textAlign:'center'}}>
          <p style={{fontSize:11,fontWeight:600,textTransform:'uppercase',letterSpacing:'0.12em',color:'rgba(255,255,255,0.45)',margin:'0 0 4px'}}>Alertas</p>
          <span style={{fontSize:36,fontWeight:800,color:hm.alerts>0?'#ef4444':'#22c55e',lineHeight:1,fontFamily:'var(--font-mono)'}}>{hm.alerts}</span>
          <p style={{fontSize:10,color:'rgba(255,255,255,0.35)',margin:'4px 0 0',whiteSpace:'nowrap'}}>{hm.alerts>0?'relevantes (48h)':'nenhum alerta'}</p>
        </div>
        <div style={{width:1,height:56,background:'rgba(255,255,255,0.08)'}}/>
        <div style={{textAlign:'center'}}>
          <p style={{fontSize:11,fontWeight:600,textTransform:'uppercase',letterSpacing:'0.12em',color:'rgba(255,255,255,0.45)',margin:'0 0 4px'}}>Adversários</p>
          <span style={{fontSize:36,fontWeight:800,color:'rgba(255,255,255,0.75)',lineHeight:1,fontFamily:'var(--font-mono)'}}>{hm.totalAdv||'—'}</span>
          <p style={{fontSize:10,color:'rgba(255,255,255,0.35)',margin:'4px 0 0',whiteSpace:'nowrap'}}>monitorados</p>
        </div>
      </div>
    </div>
    )}
  </header>
  );
}

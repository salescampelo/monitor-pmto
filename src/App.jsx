import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  ShieldAlert, TrendingDown, AlertTriangle, Eye, Calendar,
  ChevronDown, ChevronUp, Newspaper, Target, Radio, Clock,
  Hash, ArrowUpRight, BrainCircuit, Layers, Upload, RefreshCw,
  Database, User, Building, Globe, MapPin, Bookmark, Trash2,
  BarChart3, TrendingUp, Heart, MessageCircle, Users, LogOut, Menu, Map,
} from 'lucide-react';
import { supabase } from './lib/supabase.js';
import LoginScreen from './components/LoginScreen.jsx';
import { CSS, Card, Met, Bd, Bt, NC, useWW } from './components/ui.jsx';
import { fetchJ, URLS } from './lib/fetch.js';
import { classify } from './lib/news.js';
import { CLUSTERS, metrics, calcHeaderMetrics } from './lib/analytics.js';
import SocialPanel from './panels/SocialPanel.jsx';
import TendenciaVotoPanel from './panels/TendenciaVotoPanel.jsx';
import KpiPanel from './panels/KpiPanel.jsx';
import GeoPanel from './panels/GeoPanel.jsx';
import AdversariosPanel from './panels/AdversariosPanel.jsx';
import MapaCampoPanel from './panels/MapaCampoPanel.jsx';
import { logAccess } from './lib/accessLog.js';

/* ═══════════════════════════════════════════════
   MAIN APP
   ═══════════════════════════════════════════════ */
const App = ({onLogout, userEmail}) => {
  const[newsRaw,setNewsRaw]=useState(null);
  const[socialData,setSocialData]=useState(null);
  const[sentimentData,setSentimentData]=useState(null);
  const[geoData,setGeoData]=useState(null);
  const[kpiData,setKpiData]=useState(null);
  const[adversariosData,setAdversariosData]=useState(null);
  const[tendenciaData,setTendenciaData]=useState(null);
  const[liderancasData,setLiderancasData]=useState(null);
  const[selectedCluster,setSelectedCluster]=useState('all');
  const[expandedCards,setExpandedCards]=useState({});
  const[sortOrder,setSortOrder]=useState('date');
  const[filterType,setFilterType]=useState('all');
  const[filterScope,setFilterScope]=useState('all');
  const[filterRelevance,setFilterRelevance]=useState('relevant');
  const[lastUpdate,setLastUpdate]=useState(null);
  const[loading,setLoading]=useState(true);
  const[refreshing,setRefreshing]=useState(false);
  const[activePanel,setActivePanel]=useState('tendencia');
  const[sidebarOpen,setSidebarOpen]=useState(false);
  const[avatarOpen,setAvatarOpen]=useState(false);
  const[showPwModal,setShowPwModal]=useState(false);
  const[pwNew,setPwNew]=useState('');
  const[pwConfirm,setPwConfirm]=useState('');
  const[pwError,setPwError]=useState('');
  const[pwSuccess,setPwSuccess]=useState(false);
  const[pwLoading,setPwLoading]=useState(false);

  const screenW=useWW();
  const isMobile=screenW<768;
  const isTablet=screenW>=768&&screenW<1024;

  // Boot: carrega apenas os 4 arquivos pequenos (~40 KB)
  useEffect(()=>{(async()=>{
    setLoading(true);
    const[s,st,k,adv]=await Promise.all([
      fetchJ(URLS.social),fetchJ(URLS.sentiment),fetchJ(URLS.kpis),fetchJ(URLS.adversarios)
    ]);
    if(s)setSocialData(s);if(st)setSentimentData(st);if(k)setKpiData(k);if(adv)setAdversariosData(adv);
    setLastUpdate(new Date().toLocaleString('pt-BR')+' (auto)');
    setLoading(false);
  })();},[]);

  // Lazy-load por painel
  useEffect(()=>{
    if(activePanel==='imprensa'&&!newsRaw)fetchJ(URLS.mentions).then(d=>{if(d)setNewsRaw(d);});
    if(activePanel==='geo'&&!geoData)fetchJ(URLS.geo).then(d=>{if(d)setGeoData(d);});
    if(activePanel==='tendencia'&&!tendenciaData)fetchJ(URLS.tendencia).then(d=>{if(d)setTendenciaData(d);});
    if(activePanel==='campo'&&!liderancasData)fetchJ(URLS.liderancas).then(d=>{if(d)setLiderancasData(d);});
  },[activePanel,newsRaw,geoData,tendenciaData,liderancasData]);

  const handleRefresh=useCallback(async()=>{
    setRefreshing(true);
    const bootFetches=[fetchJ(URLS.social),fetchJ(URLS.sentiment),fetchJ(URLS.kpis),fetchJ(URLS.adversarios)];
    const panelFetches=activePanel==='imprensa'?[fetchJ(URLS.mentions)]:
      activePanel==='geo'?[fetchJ(URLS.geo)]:
      activePanel==='tendencia'?[fetchJ(URLS.tendencia)]:
      activePanel==='campo'?[fetchJ(URLS.liderancas)]:[];
    const[s,st,k,adv,...panelResults]=await Promise.all([...bootFetches,...panelFetches]);
    if(s)setSocialData(s);if(st)setSentimentData(st);if(k)setKpiData(k);if(adv)setAdversariosData(adv);
    if(activePanel==='imprensa'&&panelResults[0])setNewsRaw(panelResults[0]);
    if(activePanel==='geo'&&panelResults[0])setGeoData(panelResults[0]);
    if(activePanel==='tendencia'&&panelResults[0])setTendenciaData(panelResults[0]);
    if(activePanel==='campo'&&panelResults[0])setLiderancasData(panelResults[0]);
    setLastUpdate(new Date().toLocaleString('pt-BR')+' (manual)');
    setRefreshing(false);
  },[activePanel]);

  const handlePwChange=useCallback(async()=>{
    if(pwNew.length<6||pwNew!==pwConfirm)return;
    setPwLoading(true);setPwError('');
    try{
      const{error}=await supabase.auth.updateUser({password:pwNew});
      if(error){
        setPwError(error.status===422?'Senha não atende aos requisitos mínimos.':'Erro ao atualizar senha. Tente novamente.');
      }else{
        setPwSuccess(true);
        setTimeout(()=>{setShowPwModal(false);setPwNew('');setPwConfirm('');setPwSuccess(false);},2000);
      }
    }catch{
      setPwError('Erro de conexão. Verifique sua internet e tente novamente.');
    }finally{
      setPwLoading(false);
    }
  },[pwNew,pwConfirm]);

  useEffect(()=>{
    const drop=e=>{e.preventDefault();const f=e.dataTransfer?.files[0];if(!f?.name.endsWith('.json'))return;const r=new FileReader();r.onload=ev=>{try{const d=JSON.parse(ev.target.result);if(Array.isArray(d)&&d[0]?.username)setSocialData(d);else if(Array.isArray(d)&&d[0]?.title)setNewsRaw(d);else if(d?.sentiment)setSentimentData(d);}catch{}};r.readAsText(f);};
    const over=e=>e.preventDefault();
    window.addEventListener('drop',drop);window.addEventListener('dragover',over);
    return()=>{window.removeEventListener('drop',drop);window.removeEventListener('dragover',over);};
  },[]);

  const articles=useMemo(()=>newsRaw?.map(classify)||[],[newsRaw]);
  const filteredNews=useMemo(()=>{
    let f=articles;
    if(filterRelevance==='relevant')f=f.filter(n=>n.relevance>=0.5);
    else if(filterRelevance==='direct')f=f.filter(n=>n.relevance>=0.8);
    if(filterType!=='all')f=f.filter(n=>n.mentionType===filterType);
    if(filterScope!=='all')f=f.filter(n=>n.scope===filterScope);
    if(selectedCluster!=='all')f=f.filter(n=>n.cluster===selectedCluster);
    return sortOrder==='score'?[...f].sort((a,b)=>a.score-b.score):[...f].sort((a,b)=>(b.date||'').localeCompare(a.date||''));
  },[articles,selectedCluster,sortOrder,filterType,filterScope,filterRelevance]);

  const todayM=useMemo(()=>{
    const cutoff=new Date(Date.now()-24*60*60*1000);
    const recent=articles.filter(n=>{
      if(n.relevance<0.5)return false;
      try{const d=new Date((n.date||'').replace(' ','T'));return d>=cutoff;}
      catch{return false;}
    });
    return metrics(recent);
  },[articles]);
  const totalM=useMemo(()=>metrics(articles.filter(n=>n.relevance>=0.5)),[articles]);
  const filtM=useMemo(()=>metrics(filteredNews),[filteredNews]);
  const hm=useMemo(()=>calcHeaderMetrics(articles,adversariosData,socialData,sentimentData),[articles,adversariosData,socialData,sentimentData]);
  const clCounts=useMemo(()=>{
    const base=articles.filter(n=>{if(filterType!=='all'&&n.mentionType!==filterType)return false;if(filterScope!=='all'&&n.scope!==filterScope)return false;return true;});
    const c={};base.forEach(n=>{c[n.cluster]=(c[n.cluster]||0)+1;});return c;
  },[articles,filterType,filterScope]);

  if(loading)return(<div style={{minHeight:'100vh',background:'#1A2744',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',fontFamily:"'DM Sans',-apple-system,sans-serif"}}><style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style><div style={{position:'relative',width:76,height:76,marginBottom:28}}><div style={{position:'absolute',inset:0,borderRadius:'50%',border:'3px solid rgba(212,160,23,0.18)'}}/><div style={{position:'absolute',inset:0,borderRadius:'50%',border:'3px solid transparent',borderTopColor:'#D4A017',animation:'spin 1s linear infinite'}}/><ShieldAlert size={26} style={{color:'#D4A017',position:'absolute',top:'50%',left:'50%',transform:'translate(-50%,-50%)'}}/></div><p style={{fontSize:11,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.25em',color:'rgba(255,255,255,0.35)',margin:0}}>Carregando dados</p></div>);

  return(
  <div style={{minHeight:'100vh',background:'#F8F7F4',color:'#1A2744',fontFamily:"'DM Sans',-apple-system,BlinkMacSystemFont,sans-serif"}}>
  <style>{CSS}</style>

  {/* ── HERO HEADER ── */}
  <header style={{position:'fixed',top:0,left:0,right:0,height:isMobile?48:160,zIndex:200,background:'radial-gradient(circle at 85% 30%, rgba(212,160,23,0.08) 0%, transparent 50%), linear-gradient(to right, #1A2744, #0D1B2A)',borderBottom:'1px solid rgba(255,255,255,0.06)',display:'flex',flexDirection:'column',boxSizing:'border-box',overflow:'hidden'}}>
    {/* Zona Superior 48px */}
    <div style={{height:48,flexShrink:0,display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 20px',borderBottom:isMobile?'none':'1px solid rgba(255,255,255,0.06)'}}>
      <div style={{display:'flex',alignItems:'center',gap:10}}>
        {isMobile&&<button onClick={()=>setSidebarOpen(o=>!o)} style={{background:'none',border:'none',cursor:'pointer',padding:6,display:'flex',alignItems:'center',color:'#8C93A8'}}><Menu size={20}/></button>}
        <ShieldAlert size={16} style={{color:'#D4A017'}}/>
      </div>
      <span style={{flex:1,textAlign:'center',fontSize:isMobile?15:16,fontWeight:800,color:'#FFFFFF',letterSpacing:'0.08em',textTransform:'uppercase',whiteSpace:'nowrap'}}>Hub63 Data Solutions</span>
      <div style={{display:'flex',alignItems:'center',gap:8}}>
        <button onClick={handleRefresh} disabled={refreshing} style={{display:'flex',alignItems:'center',gap:5,padding:'5px 10px',borderRadius:16,background:'transparent',border:'1px solid rgba(255,255,255,0.1)',color:'#8C93A8',fontSize:11,fontWeight:700,cursor:refreshing?'wait':'pointer',opacity:refreshing?0.6:1,transition:'all 0.18s',whiteSpace:'nowrap'}}>
          <RefreshCw size={11} style={{animation:refreshing?'spin 1s linear infinite':'none'}}/>{!isMobile&&(refreshing?'...':'Atualizar')}
        </button>
        {onLogout&&<div style={{position:'relative',flexShrink:0}}>
          <button onClick={()=>setAvatarOpen(o=>!o)} title={userEmail} style={{width:32,height:32,borderRadius:'50%',background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.12)',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',color:'#D4A017',fontSize:11,fontWeight:800,outline:'none'}}>CB</button>
          {avatarOpen&&<>
            <div style={{position:'fixed',inset:0,zIndex:299}} onClick={()=>setAvatarOpen(false)}/>
            <div style={{position:'absolute',top:'calc(100% + 6px)',right:0,zIndex:300,background:'#FFFFFF',border:'1px solid rgba(26,39,68,0.08)',borderRadius:8,boxShadow:'0 4px 12px rgba(0,0,0,0.1)',minWidth:160,overflow:'hidden'}}>
              <button onClick={()=>{setAvatarOpen(false);setShowPwModal(true);}} onMouseEnter={e=>e.currentTarget.style.background='#F5F3EE'} onMouseLeave={e=>e.currentTarget.style.background='none'} style={{display:'block',width:'100%',padding:'10px 16px',fontSize:13,color:'#1A2744',background:'none',border:'none',cursor:'pointer',textAlign:'left',fontFamily:'inherit'}}>Alterar senha</button>
              <button onClick={()=>{setAvatarOpen(false);onLogout();}} onMouseEnter={e=>e.currentTarget.style.background='#F5F3EE'} onMouseLeave={e=>e.currentTarget.style.background='none'} style={{display:'block',width:'100%',padding:'10px 16px',fontSize:13,color:'#B91C1C',background:'none',border:'none',cursor:'pointer',textAlign:'left',fontFamily:'inherit'}}>Sair</button>
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

  {/* ── LAYOUT BODY ── */}
  <div style={{display:'flex',paddingTop:isMobile?48:160}}>
    {isMobile&&sidebarOpen&&<div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.6)',zIndex:149}} onClick={()=>setSidebarOpen(false)}/>}

    {/* ── SIDEBAR ── */}
    <aside style={{position:'fixed',top:isMobile?48:160,left:0,bottom:0,width:isMobile?(sidebarOpen?260:0):isTablet?60:260,background:'#FFFFFF',borderRight:'1px solid rgba(26,39,68,0.08)',display:'flex',flexDirection:'column',overflow:'hidden',transition:'width 0.2s ease',zIndex:150}}>
      <div style={{display:'flex',flexDirection:'column',gap:4}}>
      {[
        {id:'tendencia', label:'Tendência 2022', icon:TrendingUp,  sub:'Bolsonaro × Lula'},
        {id:'adversarios',label:'Inteligência',  icon:Target,      sub:'17 adversários'},
        {id:'kpis',      label:'Metas',          icon:BarChart3,   sub:'Fase 1 · KPIs'},
        {id:'geo',       label:'Eleitoral',       icon:MapPin,      sub:'139 municípios'},
        {id:'campo',     label:'Mapa de Campo',   icon:Map,         sub:'Lideranças · Visitas'},
        {id:'social',    label:'Redes Sociais',   icon:Users,       sub:'18 perfis IG'},
        {id:'imprensa',  label:'Imprensa',        icon:Newspaper,   badge:hm.alerts, sub:'32 fontes'},
      ].map(({id,label,icon:Icon,badge,sub})=>{
        const isAct=activePanel===id;
        const showLabel=!isTablet||isMobile;
        const showSub=!isMobile&&!isTablet;
        return(
          <button key={id}
            onClick={()=>{setActivePanel(id);if(isMobile)setSidebarOpen(false);}}
            onMouseEnter={e=>{if(!isAct)e.currentTarget.style.background='#F5F3EE';}}
            onMouseLeave={e=>{if(!isAct)e.currentTarget.style.background='transparent';}}
            style={{display:'flex',alignItems:'center',gap:12,padding:isMobile?'16px 20px':'14px 18px',minHeight:48,
              background:isAct?'rgba(212,160,23,0.08)':'transparent',
              borderLeft:`4px solid ${isAct?'#D4A017':'transparent'}`,
              borderTop:'none',borderRight:'none',borderBottom:'none',
              outline:'none',cursor:'pointer',
              color:isAct?'#1A2744':'#5A6478',
              fontSize:14,fontWeight:isAct?700:500,
              fontFamily:'inherit',width:'100%',boxSizing:'border-box',
              transition:'background 0.15s ease',whiteSpace:'nowrap',overflow:'hidden',textAlign:'left',
            }}>
            <Icon size={20} style={{flexShrink:0,color:isAct?'#D4A017':'inherit'}}/>
            {showLabel&&(
              <span style={{display:'flex',flexDirection:'column',minWidth:0}}>
                <span>{label}</span>
                {showSub&&sub&&<span style={{fontSize:10,color:'#8C93A8',marginTop:2,fontWeight:400}}>{sub}</span>}
              </span>
            )}
            {showLabel&&badge>0&&<span style={{marginLeft:'auto',background:'#ef4444',color:'#fff',borderRadius:8,fontSize:9,fontWeight:700,padding:'1px 5px',flexShrink:0,animation:'pulse 2s infinite'}}>{badge}</span>}
          </button>
        );
      })}
      </div>
      {!isTablet&&!isMobile&&(
        <div>
          <div style={{height:1,background:'rgba(26,39,68,0.06)',margin:'16px 20px'}}/>
          <div style={{margin:'0 12px',background:'rgba(26,39,68,0.03)',borderRadius:8,padding:12}}>
            <p style={{fontSize:9,fontWeight:700,textTransform:'uppercase',color:'#8C93A8',margin:'0 0 4px',letterSpacing:'0.08em'}}>Próximo briefing</p>
            <p style={{fontSize:13,fontWeight:700,color:'#1A2744',margin:0}}>Amanhã · 07:30</p>
          </div>
          <div style={{margin:'8px 12px 0',background:'rgba(26,39,68,0.03)',borderRadius:8,padding:12}}>
            <p style={{fontSize:9,fontWeight:700,textTransform:'uppercase',color:'#8C93A8',margin:'0 0 4px',letterSpacing:'0.08em'}}>Última coleta</p>
            <p style={{fontSize:11,color:'#5A6478',margin:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{lastUpdate||'Aguardando'}</p>
          </div>
        </div>
      )}
      <div style={{marginTop:'auto',padding:'12px 20px',borderTop:'1px solid rgba(26,39,68,0.08)'}}>
        <p style={{fontSize:10,color:'rgba(26,39,68,0.3)',margin:0,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{lastUpdate||'Aguardando'}</p>
      </div>
    </aside>

    {/* ── CONTENT AREA ── */}
    <main style={{marginLeft:isMobile?0:isTablet?60:260,padding:isMobile?'8px 10px':'24px',flex:1,minWidth:0,transition:'margin-left 0.2s ease',minHeight:isMobile?'calc(100vh - 48px)':'calc(100vh - 160px)'}}>
      <div key={activePanel} className="panel-fade">
        {activePanel==='tendencia'&&<TendenciaVotoPanel tendenciaData={tendenciaData}/>}
        {activePanel==='adversarios'&&<AdversariosPanel adversariosData={adversariosData}/>}
        {activePanel==='kpis'&&<KpiPanel kpiData={kpiData}/>}
        {activePanel==='geo'&&<GeoPanel geoData={geoData}/>}
        {activePanel==='campo'&&<MapaCampoPanel liderancasData={liderancasData}/>}
        {activePanel==='social'&&<SocialPanel socialData={socialData} sentimentData={sentimentData}/>}

        {activePanel==='imprensa'&&(
        <Card>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:10,marginBottom:18}}>
          <div style={{display:'flex',alignItems:'center',gap:12}}>
            <div style={{background:'rgba(185,28,28,0.06)',border:'1px solid rgba(185,28,28,0.12)',borderRadius:12,padding:10}}><Newspaper size={22} style={{color:'#b91c1c'}}/></div>
            <div>
              <h2 style={{fontSize:22,fontWeight:800,color:'#1A2744',margin:0}}>Monitor de imprensa</h2>
              <p style={{fontSize:12,color:'#8c93a8',fontWeight:700,textTransform:'uppercase',letterSpacing:'0.1em',margin:'2px 0 0'}}>32 fontes · Tocantins + Brasil · Atualização 2x ao dia</p>
            </div>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:16}}>
            <div style={{textAlign:'center'}}><p style={{fontSize:20,fontWeight:700,color:'#ef4444',margin:0,fontFamily:'var(--font-mono)'}}>{totalM.dir}</p><p style={{fontSize:11,color:'#8c93a8',margin:0,textTransform:'uppercase',fontWeight:700}}>diretas</p></div>
            <div style={{textAlign:'center'}}><p style={{fontSize:20,fontWeight:800,color:'#1A3A7A',margin:0}}>{totalM.tot}</p><p style={{fontSize:11,color:'#8c93a8',margin:0,textTransform:'uppercase',fontWeight:700}}>menções</p></div>
          </div>
        </div>

        <div style={{display:'flex',gap:isMobile?6:8,marginBottom:16,flexWrap:'wrap'}}>
          <Met icon={User} label="Diretas" value={filtM.dir} sub="Cel. Barbosa" accent="#ef4444" compact={isMobile}/>
          <Met icon={Bookmark} label="Eleitorais" value={filtM.ele} sub="2026" accent="#6366f1" compact={isMobile}/>
          <Met icon={Building} label="PMTO" value={filtM.ins} accent="#f59e0b" compact={isMobile}/>
          <Met icon={Globe} label="Nacional" value={filtM.nac} sub="BR" accent="#3b82f6" compact={isMobile}/>
          <Met icon={MapPin} label="Local" value={filtM.loc} sub="TO" accent="#22c55e" compact={isMobile}/>
          <Met icon={Newspaper} label="Fontes" value={filtM.src} accent="#64748b" compact={isMobile}/>
        </div>

        <div style={{display:'flex',gap:6,marginBottom:10,flexWrap:'wrap',alignItems:'center'}}>
          <span style={{fontSize:11,fontWeight:700,color:'#8C93A8',textTransform:'uppercase',marginRight:4}}>Relevância:</span>
          {[
            {id:'direct',l:isMobile?'Diretas':'Diretas ao candidato',color:'#b91c1c'},
            {id:'relevant',l:isMobile?'≥0.5':'Relevantes (≥0.5)',color:'#1A3A7A'},
            {id:'all',l:isMobile?'Todas':'Todas (incl. PMTO genéricas)',color:'#8c93a8'},
          ].map(r=><Bt key={r.id} active={filterRelevance===r.id} color={r.color} onClick={()=>setFilterRelevance(r.id)}>{r.l}</Bt>)}
        </div>

        <div style={{display:'flex',gap:6,marginBottom:10,flexWrap:'wrap'}}>
          {[
            {id:'all',l:'Todas'},
            {id:'direta',l:isMobile?'● Dir.':'● Diretas'},
            {id:'eleitoral',l:isMobile?'◆ Eleit.':'◆ Eleitorais'},
            {id:'institucional',l:'○ PMTO'},
          ].map(t=><Bt key={t.id} active={filterType===t.id} color="#1a3a7a" onClick={()=>setFilterType(t.id)}>{t.l}</Bt>)}
          <div style={{width:1,height:28,background:'rgba(255,255,255,0.1)',margin:'0 4px'}}/>
          {[{id:'all',l:'TO+BR',i:Layers},{id:'TO',l:'Tocantins',i:MapPin},{id:'BR',l:'Nacional',i:Globe}].map(s=><Bt key={s.id} active={filterScope===s.id} color="#22c55e" onClick={()=>setFilterScope(s.id)}><s.i size={11}/> {s.l}</Bt>)}
        </div>

        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16,flexWrap:'wrap',gap:8}}>
          <div style={{display:'flex',gap:5,flexWrap:'wrap'}}>
            {CLUSTERS.map(c=>{const cnt=c.id==='all'?null:clCounts[c.id]||0;if(c.id!=='all'&&!cnt)return null;return<Bt key={c.id} active={selectedCluster===c.id} color={c.color} onClick={()=>setSelectedCluster(c.id)}><c.icon size={11}/> {c.label}{cnt!==null&&<span style={{opacity:0.5}}> ({cnt})</span>}</Bt>;})}
          </div>
          <div style={{display:'flex',gap:5}}>
            <Bt active={sortOrder==='date'} color="#3b82f6" onClick={()=>setSortOrder('date')}><Calendar size={10}/> Data</Bt>
            <Bt active={sortOrder==='score'} color="#ef4444" onClick={()=>setSortOrder('score')}><TrendingDown size={10}/> Toxicidade</Bt>
          </div>
        </div>

        <div style={{fontSize:13,color:'#8c93a8',marginBottom:12,display:'flex',gap:16}}>
          <span>{filteredNews.length} menção(ões) {filterType!=='all'||filterScope!=='all'||selectedCluster!=='all'?'filtradas':'no total'}</span>
          {(filterType!=='all'||filterScope!=='all'||selectedCluster!=='all')&&<span style={{color:'#b91c1c'}}>Toxicidade: {filtM.tox}%</span>}
        </div>

        <div style={{display:'flex',flexDirection:'column',gap:10,marginBottom:8}}>
          {filteredNews.slice(0,50).map(item=><NC key={item.id} item={item} expanded={!!expandedCards[item.id]} onToggle={()=>setExpandedCards(prev=>({...prev,[item.id]:!prev[item.id]}))}/>)}
          {filteredNews.length>50&&<p style={{fontSize:13,color:'#8c93a8',textAlign:'center'}}>Mostrando 50 de {filteredNews.length}. Use filtros para refinar.</p>}
          {filteredNews.length===0&&<Card noHover><p style={{color:'#8c93a8',fontSize:13,textAlign:'center'}}>Nenhuma menção para os filtros selecionados.</p></Card>}
        </div>
        </Card>
        )}
      </div>
    </main>
  </div>

  {/* ── MODAL ALTERAR SENHA ── */}
  {showPwModal&&<div style={{position:'fixed',inset:0,zIndex:500,background:'rgba(0,0,0,0.5)',display:'flex',alignItems:'center',justifyContent:'center',padding:20}}>
    <div style={{background:'#FFFFFF',borderRadius:16,padding:32,maxWidth:400,width:'100%',boxShadow:'0 8px 32px rgba(0,0,0,0.2)'}}>
      <h2 style={{fontSize:18,fontWeight:700,color:'#1A2744',margin:'0 0 20px'}}>Alterar senha</h2>
      <div style={{display:'flex',flexDirection:'column',gap:12}}>
        <input type="password" placeholder="Nova senha" minLength={6} value={pwNew} onChange={e=>{setPwNew(e.target.value);setPwError('');}}
          style={{border:`1px solid ${pwNew&&pwConfirm&&pwNew!==pwConfirm?'#B91C1C':'rgba(26,39,68,0.15)'}`,borderRadius:8,padding:12,fontSize:14,outline:'none',fontFamily:'inherit',transition:'border-color 0.15s',width:'100%',boxSizing:'border-box'}}
          onFocus={e=>e.target.style.borderColor='#D4A017'} onBlur={e=>e.target.style.borderColor=pwNew&&pwConfirm&&pwNew!==pwConfirm?'#B91C1C':'rgba(26,39,68,0.15)'}/>
        <input type="password" placeholder="Confirmar senha" value={pwConfirm} onChange={e=>{setPwConfirm(e.target.value);setPwError('');}}
          style={{border:`1px solid ${pwNew&&pwConfirm&&pwNew!==pwConfirm?'#B91C1C':'rgba(26,39,68,0.15)'}`,borderRadius:8,padding:12,fontSize:14,outline:'none',fontFamily:'inherit',transition:'border-color 0.15s',width:'100%',boxSizing:'border-box'}}
          onFocus={e=>e.target.style.borderColor='#D4A017'} onBlur={e=>e.target.style.borderColor=pwNew&&pwConfirm&&pwNew!==pwConfirm?'#B91C1C':'rgba(26,39,68,0.15)'}/>
        {pwNew&&pwConfirm&&pwNew!==pwConfirm&&<p style={{fontSize:12,color:'#B91C1C',margin:0}}>As senhas não coincidem.</p>}
        {pwError&&<p style={{fontSize:12,color:'#B91C1C',margin:0}}>{pwError}</p>}
        {pwSuccess&&<p style={{fontSize:12,color:'#15803D',margin:0,fontWeight:600}}>Senha alterada com sucesso!</p>}
        <div style={{display:'flex',gap:8,marginTop:4}}>
          <button onClick={handlePwChange} disabled={pwLoading||pwNew.length<6||pwNew!==pwConfirm}
            style={{flex:1,background:'#1A2744',color:'#FFFFFF',border:'none',borderRadius:8,padding:'12px 24px',fontSize:14,fontWeight:700,cursor:pwLoading||pwNew.length<6||pwNew!==pwConfirm?'not-allowed':'pointer',opacity:pwLoading||pwNew.length<6||pwNew!==pwConfirm?0.5:1,fontFamily:'inherit'}}>
            {pwLoading?'Salvando...':'Salvar'}
          </button>
          <button onClick={()=>{setShowPwModal(false);setPwNew('');setPwConfirm('');setPwError('');setPwSuccess(false);}}
            style={{padding:'12px 16px',background:'transparent',border:'none',color:'#5A6478',fontSize:14,cursor:'pointer',fontFamily:'inherit'}}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  </div>}

  </div>);
};

/* ═══════════════════════════════════════════════
   AUTH WRAPPER
   ═══════════════════════════════════════════════ */
const ALLOWED_CHECK_TABLE = 'allowed_users';

export default function Root() {
  const[session,    setSession]    = useState(undefined);
  const[authorized, setAuthorized] = useState(null);
  const[authChecked,setAuthChecked]= useState(false);

  useEffect(()=>{
    supabase.auth.getSession().then(({data:{session}})=>{setSession(session);});
    const{data:{subscription}}=supabase.auth.onAuthStateChange((_event,session)=>{
      setSession(session);
      if(!session){setAuthorized(null);setAuthChecked(false);}
    });
    return()=>subscription.unsubscribe();
  },[]);

  useEffect(()=>{
    if(!session?.user?.email)return;
    setAuthChecked(false);
    supabase.from(ALLOWED_CHECK_TABLE).select('email').eq('email',session.user.email)
      .then(({data,error})=>{
        if(!error&&Array.isArray(data)&&data.length>1){
          // RLS quebrado: usuário vê linhas de outros — bloquear por segurança
          console.error('[RLS] ALERTA: política allowed_users retornou múltiplas linhas. Verifique o Supabase dashboard.');
          setAuthorized(false);
          setAuthChecked(true);
          return;
        }
        const ok=Array.isArray(data)&&data.length===1;
        setAuthorized(ok);
        setAuthChecked(true);
        if(ok)logAccess('login',`panel=dashboard email=${session.user.email}`);
      });
  },[session]);

  const handleLogout=()=>supabase.auth.signOut();

  if(session===undefined)return(
    <div style={{minHeight:'100vh',background:'#1a3a7a',display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{width:40,height:40,border:'3px solid rgba(212,160,23,0.2)',borderTop:'3px solid #d4a017',borderRadius:'50%',animation:'spin 0.8s linear infinite'}}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if(!session)return<LoginScreen/>;

  if(!authChecked)return(
    <div style={{minHeight:'100vh',background:'#1a3a7a',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:12,fontFamily:"'DM Sans',sans-serif"}}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{width:40,height:40,border:'3px solid rgba(212,160,23,0.2)',borderTop:'3px solid #d4a017',borderRadius:'50%',animation:'spin 0.8s linear infinite'}}/>
      <p style={{color:'rgba(255,255,255,0.4)',fontSize:12,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.15em',margin:0}}>Verificando acesso...</p>
    </div>
  );

  if(!authorized)return(
    <div style={{minHeight:'100vh',background:'#1a3a7a',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:16,fontFamily:"'DM Sans',sans-serif",padding:20}}>
      <ShieldAlert size={40} style={{color:'#ef4444'}}/>
      <div style={{textAlign:'center'}}>
        <p style={{color:'#fff',fontSize:16,fontWeight:800,margin:'0 0 6px'}}>Acesso não autorizado</p>
        <p style={{color:'rgba(255,255,255,0.4)',fontSize:13,margin:'0 0 20px'}}>{session.user.email} não tem permissão de acesso.</p>
      </div>
      <button onClick={handleLogout} style={{display:'flex',alignItems:'center',gap:8,padding:'10px 24px',background:'rgba(255,255,255,0.1)',border:'1px solid rgba(255,255,255,0.2)',borderRadius:10,color:'#fff',fontSize:13,fontWeight:700,cursor:'pointer',fontFamily:'inherit'}}>
        <LogOut size={14}/> Sair
      </button>
    </div>
  );

  return<App onLogout={handleLogout} userEmail={session.user.email}/>;
}

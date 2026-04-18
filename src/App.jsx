import React, { useState, useReducer, useMemo, useEffect, useCallback, lazy, Suspense } from 'react';
import {
  ShieldAlert, TrendingDown, AlertTriangle, Eye, Calendar,
  ChevronDown, ChevronUp, Newspaper, Target, Radio, Clock,
  Hash, ArrowUpRight, BrainCircuit, Layers, Upload, RefreshCw,
  Database, User, Building, Globe, MapPin, Bookmark, Trash2,
  BarChart3, TrendingUp, Heart, MessageCircle, Users, LogOut, Menu, Map, Shield,
  Download, FileText,
} from 'lucide-react';
import { supabase } from './lib/supabase.js';
import LoginScreen from './components/LoginScreen.jsx';
import { CSS, Card, Met, Bd, Bt, NC, useWW, PanelSkeleton } from './components/ui.jsx';
import { fetchJ, URLS } from './lib/fetch.js';
import { classify } from './lib/news.js';
import { CLUSTERS, metrics, calcHeaderMetrics } from './lib/analytics.js';
import { CONFIG } from './lib/config.js';
import { getStateFromUrl, setStateToUrl } from './lib/urlState.js';
import { exportToCsv, exportToPdf } from './lib/export.js';
import { useAutoRefresh } from './lib/useAutoRefresh.js';
const SocialPanel      = lazy(() => import('./panels/SocialPanel.jsx'));
const TendenciaVotoPanel = lazy(() => import('./panels/TendenciaVotoPanel.jsx'));
const KpiPanel         = lazy(() => import('./panels/KpiPanel.jsx'));
const GeoPanel         = lazy(() => import('./panels/GeoPanel.jsx'));
const AdversariosPanel = lazy(() => import('./panels/AdversariosPanel.jsx'));
const MapaCampoPanel   = lazy(() => import('./panels/MapaCampoPanel.jsx'));
const AuditoriaPanel   = lazy(() => import('./panels/AuditoriaPanel.jsx'));
import { logAccess } from './lib/accessLog.js';
import { useOffline } from './lib/useOffline.js';
import AppHeader from './components/AppHeader.jsx';
import PwModal from './components/PwModal.jsx';
import HelpTooltip from './components/HelpTooltip.jsx';
import { ErrorBoundary } from './components/ErrorBoundary.jsx';

/* ═══════════════════════════════════════════════
   MAIN APP
   ═══════════════════════════════════════════════ */
const SafePanel=({children})=>(<ErrorBoundary><Suspense fallback={<PanelSkeleton/>}>{children}</Suspense></ErrorBoundary>);

const FILTER_INITIAL = {cluster:'all',sortOrder:'date',type:'all',scope:'all',relevance:'relevant'};
const filterReducer  = (state, {key, value}) => ({...state, [key]: value});
const PW_INITIAL     = {show:false,new:'',confirm:'',error:'',success:false,loading:false};

const App = ({onLogout, userEmail}) => {
  const urlState = getStateFromUrl();
  const[newsRaw,setNewsRaw]=useState(null);
  const[socialData,setSocialData]=useState(null);
  const[sentimentData,setSentimentData]=useState(null);
  const[geoData,setGeoData]=useState(null);
  const[kpiData,setKpiData]=useState(null);
  const[adversariosData,setAdversariosData]=useState(null);
  const[tendenciaData,setTendenciaData]=useState(null);
  const[liderancasData,setLiderancasData]=useState(null);
  const[filters,   dispatchFilter]=useReducer(filterReducer, {
    cluster:   urlState.cluster,
    type:      urlState.type,
    scope:     urlState.scope,
    relevance: urlState.relevance,
    sortOrder: urlState.sortOrder,
  });
  const[pw,        setPw]         =useState(PW_INITIAL);
  const[nav,       setNav]        =useState({sidebarOpen:false,avatarOpen:false});
  const[expandedCards,setExpandedCards]=useState({});
  const[visibleCount,setVisibleCount]=useState(50);
  const[lastUpdate,setLastUpdate]=useState(null);
  const[loading,setLoading]=useState(true);
  const[refreshing,setRefreshing]=useState(false);
  const[activePanel,setActivePanel]=useState(urlState.panel);

  // Sync state → URL whenever panel or filters change
  useEffect(()=>{
    setStateToUrl({panel:activePanel,...filters});
  },[activePanel,filters]);

  // Dynamic document title
  useEffect(()=>{
    const titles={tendencia:'Tendência de Voto',adversarios:'Inteligência Competitiva',kpis:'Metas e KPIs',geo:'Dados Eleitorais',campo:'Mapa de Capilaridade',social:'Redes Sociais',imprensa:'Monitor de Imprensa',auditoria:'Auditoria'};
    document.title=`${titles[activePanel]||'Dashboard'} — Monitor Coronel Barbosa`;
  },[activePanel]);

  const screenW=useWW();
  const isMobile=screenW<768;
  const isTablet=screenW>=768&&screenW<1024;
  const isOffline=useOffline();

  // Boot: carrega apenas os 4 arquivos pequenos (~40 KB)
  useEffect(()=>{(async()=>{
    setLoading(true);
    try{
      const[s,st,k,adv]=await Promise.all([
        fetchJ(URLS.social),fetchJ(URLS.sentiment),fetchJ(URLS.kpis),fetchJ(URLS.adversarios)
      ]);
      if(s)setSocialData(s);if(st)setSentimentData(st);if(k)setKpiData(k);if(adv)setAdversariosData(adv);
      setLastUpdate(new Date().toLocaleString('pt-BR')+' (auto)');
    }catch(err){
      if(err.message?.includes('Sessão expirada')){await supabase.auth.signOut();return;}
      console.error('[boot] Erro ao carregar dados:',err.message);
    }finally{
      setLoading(false);
    }
  })();},[]);

  // Lazy-load por painel
  useEffect(()=>{
    const onExpiry=async err=>{
      if(err.message?.includes('Sessão expirada'))await supabase.auth.signOut();
      else console.error('[lazy]',err.message);
    };
    if(activePanel==='imprensa'&&!newsRaw)fetchJ(URLS.mentions).then(d=>{if(d)setNewsRaw(d);}).catch(onExpiry);
    if(activePanel==='geo'&&!geoData)fetchJ(URLS.geo).then(d=>{if(d)setGeoData(d);}).catch(onExpiry);
    if(activePanel==='tendencia'&&!tendenciaData)fetchJ(URLS.tendencia).then(d=>{if(d)setTendenciaData(d);}).catch(onExpiry);
    if(activePanel==='campo'&&!liderancasData)fetchJ(URLS.liderancas).then(d=>{if(d)setLiderancasData(d);}).catch(onExpiry);
  },[activePanel,newsRaw,geoData,tendenciaData,liderancasData]);

  const handleRefresh=useCallback(async()=>{
    setRefreshing(true);
    try{
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
    }catch(err){
      if(err.message?.includes('Sessão expirada')){await supabase.auth.signOut();return;}
      console.error('[refresh] Erro ao atualizar dados:',err.message);
    }finally{
      setRefreshing(false);
    }
  },[activePanel]);

  // Silent version for auto-refresh — no spinner, label says "(auto)"
  const refreshSilent=useCallback(async()=>{
    try{
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
      setLastUpdate(new Date().toLocaleString('pt-BR')+' (auto)');
    }catch(err){
      if(err.message?.includes('Sessão expirada')){await supabase.auth.signOut();return;}
      console.error('[auto-refresh] Erro:',err.message);
    }
  },[activePanel]);

  const{enabled:autoRefreshEnabled,setEnabled:setAutoRefresh}=useAutoRefresh(refreshSilent,30);

  const handlePwChange=useCallback(async()=>{
    if(pw.new.length<6||pw.new!==pw.confirm)return;
    setPw(p=>({...p,loading:true,error:''}));
    try{
      const{error}=await supabase.auth.updateUser({password:pw.new});
      if(error){
        setPw(p=>({...p,error:error.status===422?'Senha não atende aos requisitos mínimos.':'Erro ao atualizar senha. Tente novamente.'}));
      }else{
        setPw(p=>({...p,success:true}));
        setTimeout(()=>setPw(PW_INITIAL),2000);
      }
    }catch{
      setPw(p=>({...p,error:'Erro de conexão. Verifique sua internet e tente novamente.'}));
    }finally{
      setPw(p=>({...p,loading:false}));
    }
  },[pw.new,pw.confirm]);

  useEffect(()=>{
    const drop=e=>{e.preventDefault();const f=e.dataTransfer?.files[0];if(!f?.name.endsWith('.json'))return;const r=new FileReader();r.onload=ev=>{try{const d=JSON.parse(ev.target.result);if(Array.isArray(d)&&d[0]?.username)setSocialData(d);else if(Array.isArray(d)&&d[0]?.title)setNewsRaw(d);else if(d?.sentiment)setSentimentData(d);}catch{}};r.readAsText(f);};
    const over=e=>e.preventDefault();
    window.addEventListener('drop',drop);window.addEventListener('dragover',over);
    return()=>{window.removeEventListener('drop',drop);window.removeEventListener('dragover',over);};
  },[]);

  const articles=useMemo(()=>newsRaw?.map(classify)||[],[newsRaw]);
  const filteredNews=useMemo(()=>{
    let f=articles;
    if(filters.relevance==='relevant')f=f.filter(n=>n.relevance>=0.5);
    else if(filters.relevance==='direct')f=f.filter(n=>n.relevance>=0.8);
    if(filters.type!=='all')f=f.filter(n=>n.mentionType===filters.type);
    if(filters.scope!=='all')f=f.filter(n=>n.scope===filters.scope);
    if(filters.cluster!=='all')f=f.filter(n=>n.cluster===filters.cluster);
    return filters.sortOrder==='score'?[...f].sort((a,b)=>a.score-b.score):[...f].sort((a,b)=>(b.date||'').localeCompare(a.date||''));
  },[articles,filters]);

  // Reseta paginação sempre que o conjunto filtrado muda
  useEffect(()=>{setVisibleCount(50);},[filteredNews]);

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
    const base=articles.filter(n=>{if(filters.type!=='all'&&n.mentionType!==filters.type)return false;if(filters.scope!=='all'&&n.scope!==filters.scope)return false;return true;});
    const c={};base.forEach(n=>{c[n.cluster]=(c[n.cluster]||0)+1;});return c;
  },[articles,filters.type,filters.scope]);

  // ── Header KPIs ──────────────────────────────────────────────────────────
  const daysToElection=useMemo(()=>Math.ceil((new Date('2026-10-04')-new Date())/(1000*60*60*24)),[]);

  // Snapshots do candidato ordenados por data (mais recente primeiro)
  const candidateSnapshots=useMemo(()=>{
    if(!Array.isArray(socialData))return[];
    const un=CONFIG.CANDIDATE_USERNAME?.toLowerCase();
    return socialData
      .filter(p=>p.username?.toLowerCase()===un)
      .sort((a,b)=>(b.data_coleta||'').localeCompare(a.data_coleta||''));
  },[socialData]);

  const candidateProfile=useMemo(()=>candidateSnapshots[0]||null,[candidateSnapshots]);

  // Snapshot mais próximo de 7 dias atrás
  const candidatePrevWeek=useMemo(()=>{
    if(candidateSnapshots.length<2)return null;
    const latestDate=new Date(candidateSnapshots[0]?.data_coleta||Date.now());
    const target=new Date(latestDate.getTime()-7*24*60*60*1000);
    return candidateSnapshots.slice(1).reduce((best,s)=>{
      const diff=Math.abs(new Date(s.data_coleta)-target);
      const bestDiff=best?Math.abs(new Date(best.data_coleta)-target):Infinity;
      return diff<bestDiff?s:best;
    },null);
  },[candidateSnapshots]);

  const followersRaw=useMemo(()=>candidateProfile?.seguidores||0,[candidateProfile]);

  const followers=useMemo(()=>{
    if(!followersRaw)return'—';
    return followersRaw>=1000?(followersRaw/1000).toFixed(1).replace(/\.0$/,'')+'K':String(followersRaw);
  },[followersRaw]);

  const followersPrevWeek=useMemo(()=>candidatePrevWeek?.seguidores||null,[candidatePrevWeek]);

  const engagementRate=useMemo(()=>candidateProfile?.taxa_engajamento_pct||0,[candidateProfile]);

  const engagementPrevWeek=useMemo(()=>candidatePrevWeek?.taxa_engajamento_pct||null,[candidatePrevWeek]);

  const mentions48h=useMemo(()=>{
    if(!articles.length)return 0;
    const h48ago=new Date(Date.now()-48*60*60*1000);
    const parseD=n=>{try{return new Date((n.date||'').replace(' ','T'));}catch{return new Date(0);}};
    return articles.filter(n=>parseD(n)>h48ago).length;
  },[articles]);

  const positiveCommentsPct=useMemo(()=>
    Math.round(sentimentData?.sentiment?.pct_positivo||0)
  ,[sentimentData]);
  // ─────────────────────────────────────────────────────────────────────────

  const isAdmin=userEmail==='marcelsalescampelo@gmail.com';

  if(loading)return(<div style={{minHeight:'100vh',background:'linear-gradient(135deg,#1A3A7A 0%,#0D1F42 100%)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',fontFamily:"'DM Sans',-apple-system,sans-serif"}}><style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style><div style={{position:'relative',width:76,height:76,marginBottom:28}}><div style={{position:'absolute',inset:0,borderRadius:'50%',border:'3px solid rgba(212,160,23,0.18)'}}/><div style={{position:'absolute',inset:0,borderRadius:'50%',border:'3px solid transparent',borderTopColor:'#D4A017',animation:'spin 1s linear infinite'}}/><ShieldAlert size={26} style={{color:'#D4A017',position:'absolute',top:'50%',left:'50%',transform:'translate(-50%,-50%)'}}/></div><p style={{fontSize:11,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.25em',color:'rgba(255,255,255,0.35)',margin:0}}>Carregando dados</p></div>);

  return(
  <div style={{minHeight:'100vh',background:'#F8F7F4',color:'#1A2744',fontFamily:"'DM Sans',-apple-system,BlinkMacSystemFont,sans-serif"}}>
  <style>{CSS}</style>
  <a href="#main-content" className="skip-link">Pular para conteúdo principal</a>
  {isOffline&&(
    <div style={{position:'fixed',top:0,left:0,right:0,zIndex:9999,background:'#b91c1c',color:'#fff',fontSize:12,fontWeight:700,textAlign:'center',padding:'6px 16px',letterSpacing:'0.05em'}}>
      SEM CONEXÃO — os dados exibidos podem estar desatualizados
    </div>
  )}

  <AppHeader isMobile={isMobile} refreshing={refreshing} handleRefresh={handleRefresh} nav={nav} setNav={setNav} userEmail={userEmail} onLogout={onLogout} setPw={setPw} lastUpdate={lastUpdate} daysToElection={daysToElection} followers={followers} followersRaw={followersRaw} followersPrevWeek={followersPrevWeek} engagementRate={engagementRate} engagementPrevWeek={engagementPrevWeek} mentions48h={mentions48h} positiveCommentsPct={positiveCommentsPct} autoRefreshEnabled={autoRefreshEnabled} setAutoRefresh={setAutoRefresh}/>

  {/* ── LAYOUT BODY ── */}
  <div style={{display:'flex'}}>
    {isMobile&&nav.sidebarOpen&&<div aria-hidden="true" style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.6)',zIndex:149}} onClick={()=>setNav(n=>({...n,sidebarOpen:false}))}/>}

    {/* ── SIDEBAR ── */}
    <aside id="sidebar-nav" role="navigation" aria-label="Menu principal" style={{position:isMobile?'fixed':'sticky',top:0,left:0,bottom:isMobile?0:'auto',alignSelf:'flex-start',height:isMobile?undefined:'100vh',width:isMobile?(nav.sidebarOpen?260:0):isTablet?60:260,flexShrink:0,background:'#FFFFFF',borderRight:'1px solid rgba(26,39,68,0.08)',display:'flex',flexDirection:'column',overflow:'hidden',transition:'width 0.2s ease',zIndex:150}}>
      <div style={{display:'flex',flexDirection:'column',gap:4}}>
      {[
        {id:'tendencia', label:'Tendência 2022', icon:TrendingUp,  sub:'Bolsonaro × Lula'},
        {id:'adversarios',label:'Inteligência',  icon:Target,      sub:'17 adversários'},
        {id:'kpis',      label:'Metas',          icon:BarChart3,   sub:'Fase 1 · KPIs'},
        {id:'geo',       label:'Eleitoral',       icon:MapPin,      sub:'139 municípios'},
        {id:'campo',     label:'Mapa de Capilaridade',   icon:Map,         sub:'Lideranças · Visitas'},
        {id:'social',    label:'Redes Sociais',   icon:Users,       sub:'18 perfis IG'},
        {id:'imprensa',  label:'Imprensa',        icon:Newspaper,   badge:hm.alerts, sub:'32 fontes'},
        ...(isAdmin?[{id:'auditoria',label:'Auditoria',icon:Shield,sub:'Logs de acesso'}]:[]),
      ].map(({id,label,icon:Icon,badge,sub})=>{
        const isAct=activePanel===id;
        const showLabel=!isTablet||isMobile;
        const showSub=!isMobile&&!isTablet;
        return(
          <button key={id}
            onClick={()=>{setActivePanel(id);if(isMobile)setNav(n=>({...n,sidebarOpen:false}));}}
            aria-current={isAct?'page':undefined}
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
            <Icon size={20} aria-hidden="true" style={{flexShrink:0,color:isAct?'#D4A017':'inherit'}}/>
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
    <main id="main-content" aria-label="Conteúdo principal" style={{padding:isMobile?'8px 10px':'24px',flex:1,minWidth:0,minHeight:'100vh'}}>
      <div key={activePanel} className="panel-fade">
        {activePanel==='tendencia'&&<SafePanel><TendenciaVotoPanel tendenciaData={tendenciaData}/></SafePanel>}
        {activePanel==='adversarios'&&<SafePanel><AdversariosPanel adversariosData={adversariosData}/></SafePanel>}
        {activePanel==='kpis'&&<SafePanel><KpiPanel kpiData={kpiData}/></SafePanel>}
        {activePanel==='geo'&&<SafePanel><GeoPanel geoData={geoData}/></SafePanel>}
        {activePanel==='campo'&&<SafePanel><MapaCampoPanel liderancasData={liderancasData}/></SafePanel>}
        {activePanel==='social'&&<SafePanel><SocialPanel socialData={socialData} sentimentData={sentimentData}/></SafePanel>}
        {activePanel==='auditoria'&&isAdmin&&<SafePanel><AuditoriaPanel/></SafePanel>}

        {activePanel==='imprensa'&&(
        <Card>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:10,marginBottom:18}}>
          <div style={{display:'flex',alignItems:'center',gap:12}}>
            <div style={{background:'rgba(185,28,28,0.06)',border:'1px solid rgba(185,28,28,0.12)',borderRadius:12,padding:10}}><Newspaper size={22} style={{color:'#b91c1c'}}/></div>
            <div>
              <div style={{display:'flex',alignItems:'center',gap:8}}>
                <h2 style={{fontSize:22,fontWeight:800,color:'#1A2744',margin:0}}>Monitor de imprensa</h2>
                <HelpTooltip panelId="imprensa"/>
              </div>
              <p style={{fontSize:12,color:'#8c93a8',fontWeight:700,textTransform:'uppercase',letterSpacing:'0.1em',margin:'2px 0 0'}}>32 fontes · Tocantins + Brasil · Atualização 2x ao dia</p>
            </div>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:16}}>
            <div style={{textAlign:'center'}}><p style={{fontSize:20,fontWeight:700,color:'#ef4444',margin:0,fontFamily:'var(--font-mono)'}}>{totalM.dir}</p><p style={{fontSize:11,color:'#8c93a8',margin:0,textTransform:'uppercase',fontWeight:700}}>diretas</p></div>
            <div style={{textAlign:'center'}}><p style={{fontSize:20,fontWeight:800,color:'#1A3A7A',margin:0}}>{totalM.tot}</p><p style={{fontSize:11,color:'#8c93a8',margin:0,textTransform:'uppercase',fontWeight:700}}>menções</p></div>
            <div className="no-print" style={{display:'flex',gap:6}}>
              <button onClick={()=>exportToCsv(filteredNews.map(n=>({data:n.date||n.timestamp,titulo:n.title,fonte:n.source,tipo:n.cluster,relevancia:n.relevance_score??n.relevance,sentimento:n.sentiment,url:n.url})),'mencoes_imprensa')}
                style={{display:'flex',alignItems:'center',gap:4,padding:'6px 10px',fontSize:12,background:'#f1f5f9',border:'1px solid #e2e8f0',borderRadius:4,cursor:'pointer',color:'#475569',fontFamily:'inherit',whiteSpace:'nowrap'}}>
                <Download size={13}/>{!isMobile&&'CSV'}
              </button>
              <button onClick={exportToPdf}
                style={{display:'flex',alignItems:'center',gap:4,padding:'6px 10px',fontSize:12,background:'#f1f5f9',border:'1px solid #e2e8f0',borderRadius:4,cursor:'pointer',color:'#475569',fontFamily:'inherit',whiteSpace:'nowrap'}}>
                <FileText size={13}/>{!isMobile&&'PDF'}
              </button>
            </div>
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
          ].map(r=><Bt key={r.id} active={filters.relevance===r.id} color={r.color} onClick={()=>dispatchFilter({key:'relevance',value:r.id})}>{r.l}</Bt>)}
        </div>

        <div style={{display:'flex',gap:6,marginBottom:10,flexWrap:'wrap'}}>
          {[
            {id:'all',l:'Todas'},
            {id:'direta',l:isMobile?'● Dir.':'● Diretas'},
            {id:'eleitoral',l:isMobile?'◆ Eleit.':'◆ Eleitorais'},
            {id:'institucional',l:'○ PMTO'},
          ].map(t=><Bt key={t.id} active={filters.type===t.id} color="#1a3a7a" onClick={()=>dispatchFilter({key:'type',value:t.id})}>{t.l}</Bt>)}
          <div style={{width:1,height:28,background:'rgba(255,255,255,0.1)',margin:'0 4px'}}/>
          {[{id:'all',l:'TO+BR',i:Layers},{id:'TO',l:'Tocantins',i:MapPin},{id:'BR',l:'Nacional',i:Globe}].map(s=><Bt key={s.id} active={filters.scope===s.id} color="#22c55e" onClick={()=>dispatchFilter({key:'scope',value:s.id})}><s.i size={11}/> {s.l}</Bt>)}
        </div>

        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16,flexWrap:'wrap',gap:8}}>
          <div style={{display:'flex',gap:5,flexWrap:'wrap'}}>
            {CLUSTERS.map(c=>{const cnt=c.id==='all'?null:clCounts[c.id]||0;if(c.id!=='all'&&!cnt)return null;return<Bt key={c.id} active={filters.cluster===c.id} color={c.color} onClick={()=>dispatchFilter({key:'cluster',value:c.id})}><c.icon size={11}/> {c.label}{cnt!==null&&<span style={{opacity:0.5}}> ({cnt})</span>}</Bt>;})}
          </div>
          <div style={{display:'flex',gap:5}}>
            <Bt active={filters.sortOrder==='date'} color="#3b82f6" onClick={()=>dispatchFilter({key:'sortOrder',value:'date'})}><Calendar size={10}/> Data</Bt>
            <Bt active={filters.sortOrder==='score'} color="#ef4444" onClick={()=>dispatchFilter({key:'sortOrder',value:'score'})}><TrendingDown size={10}/> Toxicidade</Bt>
          </div>
        </div>

        <div style={{fontSize:13,color:'#8c93a8',marginBottom:12,display:'flex',gap:16}}>
          <span>{filteredNews.length} menção(ões) {filters.type!=='all'||filters.scope!=='all'||filters.cluster!=='all'?'filtradas':'no total'}</span>
          {(filters.type!=='all'||filters.scope!=='all'||filters.cluster!=='all')&&<span style={{color:'#b91c1c'}}>Toxicidade: {filtM.tox}%</span>}
        </div>

        <div style={{display:'flex',flexDirection:'column',gap:10,marginBottom:8}}>
          {filteredNews.slice(0,visibleCount).map(item=><NC key={item.id} item={item} expanded={!!expandedCards[item.id]} onToggle={()=>setExpandedCards(prev=>({...prev,[item.id]:!prev[item.id]}))}/>)}
          {filteredNews.length===0&&<Card noHover><p style={{color:'#8c93a8',fontSize:13,textAlign:'center'}}>Nenhuma menção para os filtros selecionados.</p></Card>}
          {visibleCount<filteredNews.length&&(
            <div style={{textAlign:'center',paddingTop:8}}>
              <p style={{fontSize:12,color:'#8c93a8',margin:'0 0 8px'}}>Mostrando {visibleCount} de {filteredNews.length}</p>
              <button onClick={()=>setVisibleCount(c=>c+50)} style={{padding:'7px 20px',borderRadius:16,background:'transparent',border:'1px solid rgba(26,39,68,0.15)',color:'#1A2744',fontSize:12,fontWeight:700,cursor:'pointer'}}>
                Carregar mais 50
              </button>
            </div>
          )}
        </div>
        </Card>
        )}
      </div>
    </main>
  </div>

  <PwModal pw={pw} setPw={setPw} handlePwChange={handlePwChange} PW_INITIAL={PW_INITIAL}/>

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

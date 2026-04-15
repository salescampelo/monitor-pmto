import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  ShieldAlert, TrendingDown, AlertTriangle, Eye, Calendar,
  ChevronDown, ChevronUp, Newspaper, Target, Radio, Clock,
  Hash, ArrowUpRight, BrainCircuit, Layers, Upload, RefreshCw,
  Database, User, Building, Globe, MapPin, Bookmark, Trash2,
  BarChart3, TrendingUp, Heart, MessageCircle, Users, LogOut, Menu
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, LineChart, Line, Legend } from 'recharts';
import { supabase } from './lib/supabase.js';
import LoginScreen from './components/LoginScreen.jsx';

const useWW=()=>{const[w,setW]=useState(typeof window!=='undefined'?window.innerWidth:1024);useEffect(()=>{const h=()=>setW(window.innerWidth);window.addEventListener('resize',h);return()=>window.removeEventListener('resize',h);},[]);return w;};
const CSS=`:root{--surface:#FFFFFF;--surface-hover:#F5F3EE;--surface-border:rgba(26,39,68,0.08);--radius-sm:8px;--radius-md:12px;--radius-lg:16px;--shadow-sm:0 1px 3px rgba(0,0,0,0.07);--shadow-md:0 4px 12px rgba(0,0,0,0.1);--shadow-lg:0 8px 24px rgba(0,0,0,0.14);--spacing-xs:8px;--spacing-sm:12px;--spacing-md:16px;--spacing-lg:24px;--spacing-xl:32px;--font-display:'DM Sans','Inter',system-ui,sans-serif;--font-mono:'Roboto Mono','Fira Code',monospace}html{scroll-padding-top:72px;scroll-behavior:smooth}body{margin:0}*{box-sizing:border-box}@keyframes spin{to{transform:rotate(360deg)}}@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.7}}.hov-card{transition:transform 0.2s ease,box-shadow 0.2s ease,border-color 0.2s ease}.hov-card:hover{transform:translateY(-2px)!important;box-shadow:var(--shadow-lg)!important;border-color:rgba(212,160,23,0.25)!important}.panel-title{font-size:20px;font-weight:700;color:#1A2744;letter-spacing:-0.02em;margin:0}.panel-subtitle{font-size:13px;font-weight:400;color:#5A6478;margin:4px 0 0}.metric-value{font-size:32px;font-weight:700;font-family:var(--font-mono);line-height:1}.metric-label{font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;color:#5A6478;margin:4px 0 0}.body-text{font-size:14px;line-height:1.6;color:rgba(26,39,68,0.8)}.table-header{font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;color:#5A6478}.table-cell{font-size:13px;color:#1A2744}.table-row:hover{background:rgba(26,39,68,0.03)!important}.panel-fade-enter{opacity:0;transform:translateY(8px)}.panel-fade{opacity:1;transform:translateY(0);transition:opacity 0.25s ease,transform 0.25s ease}@keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}.skeleton{background:linear-gradient(90deg,var(--surface) 25%,rgba(26,39,68,0.04) 50%,var(--surface) 75%);background-size:200% 100%;animation:shimmer 1.5s infinite}::-webkit-scrollbar{width:6px;height:6px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:#C4C0B6;border-radius:3px}::-webkit-scrollbar-thumb:hover{background:#A8A49A}::selection{background:rgba(212,160,23,0.3);color:#1A2744}:focus-visible{outline:2px solid #D4A017;outline-offset:2px}@media(max-width:767px){.metric-col-3,.metric-col-4{display:none!important}}`;
const BASE = '/data';
const URLS = { mentions: `${BASE}/mention_history.json`, social: `${BASE}/social_metrics.json`, sentiment: `${BASE}/social_sentiment.json`, geo: `${BASE}/geo_electoral.json`, kpis: `${BASE}/campaign_kpis.json`, adversarios: `${BASE}/adversarios.json`, tendencia: `${BASE}/tendencia_voto_2022.json` };
const fetchJ = async u => { try { const r = await fetch(u+'?t='+Date.now()); return r.ok ? r.json() : null; } catch { return null; } };

/* ── NEWS CLASSIFICATION ── */
const CL_RULES = [
  { id:'Eleitoral', kw:['pré-candidat','pre-candidat','candidato','candidatura','deputado','eleição','eleições','eleitoral','desincompatibilização','pleito','campanha'] },
  { id:'Comando', kw:['comandante','comando','barbosa','márcio','marcio','cel.','coronel','mendonça','mendonca','passagem de comando','exoneração','nomeação'] },
  { id:'Letalidade', kw:['letalidade','intervenção policial','morte','morto','óbito','confronto','tiroteio','baleado','homicídio','resistência'] },
  { id:'Operações', kw:['operação','apreensão','prisão','preso','mandado','flagrante','tráfico','droga','arma','fuzil'] },
  { id:'Gestão', kw:['promoção','formação','curso','concurso','efetivo','déficit','irregularidade','denúncia','mpe','tce','anuário'] },
  { id:'Imprensa', kw:['imprensa','blog','jornalista','gabinete do ódio','censura','nota oficial'] },
];
const NW=['morte','morto','denúncia','irregularidade','ilegal','ódio','censura','destruí','ferido','violência','abuso','crise','homicídio','tiroteio','baleado'];
const PW=['homenage','homenagem','conquista','reconhec','reconhecimento','entrega','inaugur','capacita','formatur','solidariedade','integração','mediação','redução','queda','valorização','destaque','especial','podcast','entrevista','legado','liderança','convite','participação','presença','prestígio','elogio','condecoração','medalha','resultado','avanço'];

const classify = a => {
  const t=(a.title+' '+(a.snippet||'')+' '+(a.matched_terms||[]).join(' ')).toLowerCase();
  let cl='Geral';
  for(const r of CL_RULES){if(r.kw.some(k=>t.includes(k))){cl=r.id;break;}}
  const ng=NW.filter(w=>t.includes(w)).length, ps=PW.filter(w=>t.includes(w)).length;
  let sc=Math.max(0.05,Math.min(0.95,0.5+ps*0.12-ng*0.13));
  let sn='Neutro';if(sc<=0.2)sn='Muito Negativo';else if(sc<=0.4)sn='Negativo';else if(sc>=0.7)sn='Positivo';
  let imp='Médio';if(a.mention_type==='direta'||a.mention_type==='eleitoral')imp='Alto';else if(a.scope==='BR')imp='Alto';else if(a.priority==='complementar'&&ng===0)imp='Baixo';
  return{id:a.hash_id||Math.random().toString(36).substr(2,9),date:a.detected_at?a.detected_at.split(' ')[0]:'',source:a.source_name||'?',title:a.title,sentiment:sn,score:Math.round(sc*100)/100,cluster:cl,impact:imp,keywords:a.matched_terms||[],url:a.url,mentionType:a.mention_type||'institucional',scope:a.scope||'TO',relevance:a.relevance_score||0,relevanceLabel:a.relevance_label||'',analysisNote:`[${(a.scope||'TO')==='BR'?'NACIONAL':'LOCAL'}] ${a.mention_type||'institucional'} via ${a.source_name}. Termos: ${(a.matched_terms||[]).join(', ')}.${a.relevance_label?` Relevância: ${a.relevance_label} (${a.relevance_score})`:''}`};
};

/* ── HELPERS ── */
const CLUSTERS=[{id:'all',label:'Todas',icon:Layers,color:'#8c93a8'},{id:'Eleitoral',label:'Eleitoral',icon:Bookmark,color:'#1A3A7A'},{id:'Comando',label:'Comando',icon:User,color:'#1A3A7A'},{id:'Letalidade',label:'Letalidade',icon:AlertTriangle,color:'#b91c1c'},{id:'Operações',label:'Operações',icon:Target,color:'#1d4ed8'},{id:'Gestão',label:'Gestão',icon:Building,color:'#d4a017'},{id:'Imprensa',label:'Imprensa',icon:Radio,color:'#be185d'},{id:'Geral',label:'Geral',icon:Newspaper,color:'#8c93a8'}];
const sC=s=>{if(s<=0.2)return{t:'#7F1D1D',b:'rgba(127,29,29,0.1)'};if(s<=0.4)return{t:'#B91C1C',b:'rgba(185,28,28,0.1)'};if(s<=0.6)return{t:'#8C93A8',b:'rgba(140,147,168,0.1)'};return{t:'#15803D',b:'rgba(21,128,61,0.1)'};};
const iC=i=>({Alto:'#ef4444',Médio:'#f59e0b',Baixo:'#22c55e'}[i]||'#f59e0b');
const fmt=d=>{if(!d)return'—';const x=new Date(d+'T12:00:00');return x.toLocaleDateString('pt-BR',{day:'2-digit',month:'short',year:'numeric'});};
const fmtDt=d=>{if(!d)return'—';const[dt,hr]=d.split(' ');if(!dt)return'—';const[y,m,day]=dt.split('-');return`${day}/${m}/${y}${hr?' '+hr:''}`;};
const metrics=data=>{if(!data.length)return{tox:'0.0',tot:0,dir:0,ins:0,ele:0,nac:0,loc:0,src:0};const a=data.reduce((s,n)=>s+n.score,0)/data.length;return{tox:((1-a)*100).toFixed(1),tot:data.length,dir:data.filter(n=>n.mentionType==='direta').length,ins:data.filter(n=>n.mentionType==='institucional').length,ele:data.filter(n=>n.mentionType==='eleitoral').length,nac:data.filter(n=>n.scope==='BR').length,loc:data.filter(n=>n.scope==='TO').length,src:[...new Set(data.map(n=>n.source))].length};};
const calcHeaderMetrics=(articles,adversariosRaw,socialData,sentimentData)=>{
  // Card 1 — Engajamento IG: candidato vs média adversários
  const CANDIDATO='marciobarbosa_cel';
  const allSocial=Array.isArray(socialData)?socialData:[];
  const latestDate=allSocial.reduce((mx,x)=>x.data_coleta>mx?x.data_coleta:mx,'');
  const snap=latestDate?allSocial.filter(x=>x.data_coleta===latestDate):allSocial;
  const candEntry=snap.find(x=>x.username===CANDIDATO);
  const engCand=candEntry?.taxa_engajamento_pct??null;
  const others=snap.filter(x=>x.username!==CANDIDATO&&x.taxa_engajamento_pct!=null);
  const engAvg=others.length?Math.round((others.reduce((s,x)=>s+x.taxa_engajamento_pct,0)/others.length)*10)/10:null;
  const engDelta=engCand!=null&&engAvg!=null?Math.round((engCand-engAvg)*10)/10:null;
  // Card 2 — Sentimento IG: % positivo nos comentários
  const igSentPct=sentimentData?.sentiment?.pct_positivo??null;
  const igSentDate=sentimentData?.data_coleta??null;
  // Card 3 — Alertas imprensa (inalterado)
  const now=Date.now(),ms48=48*60*60*1000;
  const dt=a=>{try{return new Date(a.date+'T12:00:00').getTime();}catch{return 0;}};
  const alerts=(articles||[]).filter(a=>dt(a)>=now-ms48&&a.relevance>=0.8).length;
  // Card 4 — Adversários (inalterado)
  const totalAdv=adversariosRaw?.ranking?.length??0;
  return{engCand,engDelta,engAvg,igSentPct,igSentDate,alerts,totalAdv};
};

/* ── COMPONENTS ── */
const Card=({children,style,noHover})=><div className={noHover?'':'hov-card'} style={{background:'var(--surface)',border:'1px solid var(--surface-border)',borderRadius:'var(--radius-md)',padding:'var(--spacing-lg)',boxShadow:'var(--shadow-sm)',...style}}>{children}</div>;
const Met=({icon:I,label,value,sub,accent})=><Card style={{flex:1,minWidth:140}}><div style={{display:'flex',alignItems:'center',gap:5,marginBottom:10}}><I size={13} style={{color:accent}}/><span style={{fontSize:11,fontWeight:600,textTransform:'uppercase',letterSpacing:'0.05em',color:'#8C93A8'}}>{label}</span></div><p style={{fontSize:30,fontWeight:700,color:accent,margin:0,lineHeight:1,letterSpacing:'-0.02em',fontFamily:'var(--font-mono)'}}>{value}</p>{sub&&<p style={{fontSize:12,color:'#8C93A8',marginTop:6,fontWeight:500}}>{sub}</p>}</Card>;
const Bd=({children,color,bg})=><span style={{padding:'3px 8px',borderRadius:6,fontSize:10,fontWeight:700,background:bg||`${color}22`,color}}>{children}</span>;
const Bt=({active,color,onClick,children})=><button onClick={onClick} style={{display:'flex',alignItems:'center',gap:4,padding:'6px 14px',borderRadius:20,fontSize:12,fontWeight:700,border:active?`1.5px solid ${color}`:'1.5px solid rgba(26,39,68,0.15)',background:active?`${color}1a`:'rgba(26,39,68,0.04)',color:active?color:'#5A6478',cursor:'pointer',transition:'all 0.15s ease',fontFamily:'inherit'}}>{children}</button>;

/* ── NEWS CARD ── */
const NC=({item,expanded,onToggle})=>{const sc=sC(item.score);const cl=CLUSTERS.find(c=>c.id===item.cluster);return(
<div className="hov-card" style={{background:'var(--surface)',border:'1px solid var(--surface-border)',borderRadius:'var(--radius-md)',borderLeft:`3px solid ${cl?.color||'#64748b'}`,padding:'18px 22px',boxShadow:'var(--shadow-sm)'}}>
<div style={{display:'flex',justifyContent:'space-between',flexWrap:'wrap',gap:6,marginBottom:8}}>
<div style={{display:'flex',alignItems:'center',gap:6,flexWrap:'wrap'}}>
<Bd color={item.mentionType==='direta'?'#ef4444':'#94a3b8'}>{item.mentionType==='direta'?'● DIRETA':item.mentionType==='eleitoral'?'◆ ELEITORAL':'○ INSTITUCIONAL'}</Bd>
<Bd color={item.scope==='BR'?'#818cf8':'#4ade80'}>{item.scope==='BR'?'NACIONAL':'TOCANTINS'}</Bd>
{item.relevance>=0.8&&<Bd color="#ef4444">REL {item.relevance}</Bd>}
{item.relevance>=0.5&&item.relevance<0.8&&<Bd color="#D4A017">REL {item.relevance}</Bd>}
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
</div>);};

/* ═══════════════════════════════════════════════
   SOCIAL MEDIA PANEL (M2)
   ═══════════════════════════════════════════════ */
const DCOL={positivo:'#22c55e',negativo:'#ef4444',neutro:'#64748b'};

// Retorna delta semanal de seguidores: {delta, direction, label}
function calcDelta(metrics, username) {
  if (!metrics || !Array.isArray(metrics)) return {delta:0,direction:'stable',label:'—'};
  const entries = metrics
    .filter(e => e.username === username && e.seguidores > 0)
    .sort((a, b) => (a.data_coleta||'').localeCompare(b.data_coleta||''));
  if (entries.length < 2) return {delta:0,direction:'stable',label:'—'};
  const curr = entries[entries.length - 1];
  const weekAgo = new Date(curr.data_coleta);
  weekAgo.setDate(weekAgo.getDate() - 7);
  let prev = null, minDiff = Infinity;
  for (const e of entries.slice(0, entries.length - 1)) {
    const diff = Math.abs(new Date(e.data_coleta) - weekAgo);
    if (diff < minDiff) { minDiff = diff; prev = e; }
  }
  if (!prev) return {delta:0,direction:'stable',label:'—'};
  const delta = curr.seguidores - prev.seguidores;
  const threshold = curr.seguidores * 0.01;
  const direction = delta > threshold ? 'up' : delta < -threshold ? 'down' : 'stable';
  const label = delta === 0 ? '—' : `${delta > 0 ? '+' : ''}${delta.toLocaleString('pt-BR')}`;
  return {delta, direction, label};
}

// Perfis monitorados — espelha TARGET_PROFILES do instagram_monitor.py
const PANEL_PROFILES=new Set([
  'marciobarbosa_cel','janad_valcari','tiagodimas','ricardoayres_to','fabiopereiravaz',
  'depjairfariasoficial','lucascampelotocantins','filipemartinsto','cesarhalum','atosgomess',
  'nilmarruiz','sandovallobocardoso','larissarosenda','celiomourato','alfredojrto',
  'dep.lazaro','osiresdamaso','sgtjorge_carneiro_',
]);

const SocialPanel=({socialData,sentimentData})=>{
  const[open,setOpen]=useState(true);
  // Uma entrada por username — a mais recente — apenas perfis monitorados
  const profiles=useMemo(()=>{
    if(!socialData||!Array.isArray(socialData))return[];
    const byUser={};
    socialData.forEach(e=>{
      if(!PANEL_PROFILES.has(e.username))return;
      if(!byUser[e.username]||e.data_coleta>byUser[e.username].data_coleta)byUser[e.username]=e;
    });
    return Object.values(byUser).filter(p=>p.seguidores>0).sort((a,b)=>b.seguidores-a.seguidores);
  },[socialData]);
  const cand=profiles.find(p=>p.username==='marciobarbosa_cel');
  const rank=useMemo(()=>profiles.map((p,i)=>({...p,rank:i+1})),[profiles]);
  const candRank=rank.findIndex(p=>p.username==='marciobarbosa_cel')+1;
  const donut=useMemo(()=>{
    if(!sentimentData?.sentiment)return[];
    const s=sentimentData.sentiment;
    return[{name:'Positivo',value:s.positivo||0,pct:s.pct_positivo||0,color:DCOL.positivo},{name:'Negativo',value:s.negativo||0,pct:s.pct_negativo||0,color:DCOL.negativo},{name:'Neutro',value:s.neutro||0,pct:s.pct_neutro||0,color:DCOL.neutro}].filter(d=>d.value>0);
  },[sentimentData]);
  const engChart=useMemo(()=>[...profiles].sort((a,b)=>b.taxa_engajamento_pct-a.taxa_engajamento_pct).slice(0,10).map(p=>{
    const isCand = p.username==='marciobarbosa_cel';
    let color = p.taxa_engajamento_pct>=3?'#22c55e':p.taxa_engajamento_pct>=1.5?'#f59e0b':'#ef4444';
    if(isCand) color='#1a3a7a';
    return{name:'@'+p.username.substring(0,18),eng:p.taxa_engajamento_pct,fill:color,label:`${p.taxa_engajamento_pct}%`};
  }),[profiles]);

  if(!profiles.length)return null;
  return(
  <Card style={{marginTop:32}}>
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:10,cursor:'pointer',marginBottom:open?18:0}} onClick={()=>setOpen(o=>!o)}>
      <div style={{display:'flex',alignItems:'center',gap:12}}>
        <div style={{background:'rgba(26,58,122,0.06)',border:'1px solid rgba(26,58,122,0.12)',borderRadius:12,padding:10}}><Users size={22} style={{color:'#1A3A7A'}}/></div>
        <div>
          <h2 style={{fontSize:22,fontWeight:800,color:'#1A2744',margin:0}}>Monitor de redes sociais</h2>
          <p style={{fontSize:12,color:'#8c93a8',fontWeight:700,textTransform:'uppercase',letterSpacing:'0.1em',margin:'2px 0 0'}}>{profiles.length} perfis · Instagram · {sentimentData?.data_coleta||profiles[0]?.data_coleta||''}</p>
        </div>
      </div>
      <div style={{display:'flex',alignItems:'center',gap:16}}>
        {cand&&<div style={{textAlign:'center'}}><p style={{fontSize:20,fontWeight:800,color:'#1A3A7A',margin:0}}>#{candRank}</p><p style={{fontSize:11,color:'#8c93a8',margin:0,textTransform:'uppercase',fontWeight:700}}>no ranking</p></div>}
        {cand&&<div style={{textAlign:'center'}}><p style={{fontSize:20,fontWeight:800,color:'#d4a017',margin:0}}>{cand.taxa_engajamento_pct}%</p><p style={{fontSize:11,color:'#8c93a8',margin:0,textTransform:'uppercase',fontWeight:700}}>engajamento</p></div>}
        {open?<ChevronUp size={18} style={{color:'#8c93a8'}}/>:<ChevronDown size={18} style={{color:'#8c93a8'}}/>}
      </div>
    </div>
    {open&&(
    <div>

    {cand&&<Card style={{marginBottom:14,borderLeft:'3px solid #8b5cf6'}}>
      <p style={{fontSize:12,fontWeight:700,textTransform:'uppercase',color:'#8C93A8',marginBottom:10,letterSpacing:'0.1em'}}>Cel. Barbosa · @{cand.username}</p>
      <div style={{display:'flex',gap:28,flexWrap:'wrap'}}>
        <div><p style={{fontSize:26,fontWeight:700,color:'#1A2744',margin:0,fontFamily:'var(--font-mono)'}}>{cand.seguidores.toLocaleString('pt-BR')}</p><p className="metric-label">seguidores</p></div>
        <div><p style={{fontSize:26,fontWeight:700,color:'#1A3A7A',margin:0,fontFamily:'var(--font-mono)'}}>{cand.taxa_engajamento_pct}%</p><p className="metric-label">engajamento</p></div>
        <div><p style={{fontSize:26,fontWeight:700,color:'#D4A017',margin:0,fontFamily:'var(--font-mono)'}}>{cand.media_likes_recentes}</p><p className="metric-label">likes/post</p></div>
        <div><p style={{fontSize:26,fontWeight:700,color:'#22c55e',margin:0,fontFamily:'var(--font-mono)'}}>#{candRank}</p><p className="metric-label">no ranking</p></div>
      </div>
    </Card>}

    <div style={{display:'grid',gridTemplateColumns:'minmax(0,1fr) minmax(0,2.5fr)',gap:12,marginBottom:14}}>
      {/* Donut sentimento */}
      <Card>
        <p style={{fontSize:12,fontWeight:700,textTransform:'uppercase',color:'#8C93A8',marginBottom:10}}>Sentimento dos comentários</p>
        {donut.length>0?(
          <>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart><Pie data={donut} cx="50%" cy="50%" innerRadius={70} outerRadius={110} dataKey="value" stroke="none" label={({cx,cy,midAngle,innerRadius,outerRadius,pct})=>{const R=Math.PI/180,r=innerRadius+(outerRadius-innerRadius)*0.5,x=cx+r*Math.cos(-midAngle*R),y=cy+r*Math.sin(-midAngle*R);return pct>5?<text x={x} y={y} fill="#fff" textAnchor="middle" dominantBaseline="central" style={{fontSize:11,fontWeight:700}}>{pct}%</text>:null;}} labelLine={false}>{donut.map((d,i)=><Cell key={i} fill={d.color}/>)}</Pie></PieChart>
          </ResponsiveContainer>
          <div style={{display:'flex',justifyContent:'center',gap:12,marginTop:4}}>
            {donut.map(d=><div key={d.name} style={{display:'flex',alignItems:'center',gap:4}}><div style={{width:8,height:8,borderRadius:2,background:d.color}}/><span style={{fontSize:12,color:'#8C93A8'}}>{d.name} {d.value} ({d.pct}%)</span></div>)}
          </div>
          </>
        ):(
          <div style={{height:260,display:'flex',alignItems:'center',justifyContent:'center'}}>
            <p style={{fontSize:13,color:'#8c93a8',textAlign:'center',lineHeight:1.6}}>Execute<br/><code style={{fontSize:10,background:'rgba(26,58,122,0.08)',padding:'2px 6px',borderRadius:4,color:'#2a4fa0'}}>python instagram_monitor.py</code><br/>para gerar dados de sentimento</p>
          </div>
        )}
      </Card>

      {/* Ranking unificado: seguidores + engajamento + tendência */}
      <Card>
        <p style={{fontSize:12,fontWeight:700,textTransform:'uppercase',color:'#8C93A8',marginBottom:10}}>Ranking completo — seguidores e engajamento</p>
        <div style={{maxHeight:360,overflowY:'auto'}}>
          {/* Header */}
          <div style={{display:'grid',gridTemplateColumns:'28px 1fr 90px 90px 72px',gap:4,padding:'4px 4px 6px',borderBottom:'1px solid var(--surface-border)'}}>
            <span className="table-header">#</span>
            <span className="table-header">PERFIL</span>
            <span className="table-header" style={{textAlign:'right'}}>SEGUIDORES</span>
            <span className="table-header" style={{textAlign:'right'}}>ENGAJAMENTO</span>
            <span className="table-header" style={{textAlign:'center'}}>TEND. (7d)</span>
          </div>
          {/* Rows */}
          {rank.map(p=>{
            const isCand = p.username==='marciobarbosa_cel';
            const {direction, label} = calcDelta(socialData, p.username);
            const trendColor = direction==='up'?'#15803D':direction==='down'?'#B91C1C':'#8C93A8';
            const trendIcon = direction==='up'?'↑':direction==='down'?'↓':'→';
            return(
            <div key={p.username} className="table-row" style={{display:'grid',gridTemplateColumns:'28px 1fr 90px 90px 72px',gap:4,padding:'6px 4px',borderBottom:'1px solid var(--surface-border)',background:isCand?'rgba(212,160,23,0.08)':'transparent',borderRadius:isCand?6:0}}>
              <span className="table-cell" style={{fontWeight:700,color:'#8C93A8',fontFamily:'var(--font-mono)'}}>#{p.rank}</span>
              <span className="table-cell" style={{color:isCand?'#D4A017':'rgba(255,255,255,0.8)',fontWeight:isCand?700:400,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>@{p.username}</span>
              <span className="table-cell" style={{fontWeight:600,color:'rgba(255,255,255,0.8)',textAlign:'right',fontFamily:'var(--font-mono)'}}>{p.seguidores.toLocaleString('pt-BR')}</span>
              <span className="table-cell" style={{fontWeight:700,color:p.taxa_engajamento_pct>=3?'#22c55e':p.taxa_engajamento_pct>=1.5?'#f59e0b':'#ef4444',textAlign:'right',fontFamily:'var(--font-mono)'}}>{p.taxa_engajamento_pct}%</span>
              <span className="table-cell" style={{fontWeight:700,color:trendColor,textAlign:'center',fontFamily:'var(--font-mono)'}}>{trendIcon} {label}</span>
            </div>);
          })}
        </div>
        <div style={{display:'flex',gap:12,marginTop:8,paddingTop:6,borderTop:'1px solid rgba(51,65,85,0.2)'}}>
          <span style={{fontSize:10,color:'#8c93a8'}}>Engajamento:</span>
          <span style={{fontSize:10,color:'#15803d'}}>■ alto (3%+)</span>
          <span style={{fontSize:10,color:'#d4a017'}}>■ médio (1.5-3%)</span>
          <span style={{fontSize:10,color:'#b91c1c'}}>■ baixo (&lt;1.5%)</span>
          <span style={{fontSize:10,color:'#8c93a8',marginLeft:8}}>Tendência:</span>
          <span style={{fontSize:10,color:'#15803d'}}>↑ crescente</span>
          <span style={{fontSize:10,color:'#8c93a8'}}>→ estável</span>
          <span style={{fontSize:10,color:'#b91c1c'}}>↓ queda</span>
        </div>
      </Card>
    </div>

    {/* Top 10 engajamento (bar chart) */}
    <Card style={{marginBottom:14}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
        <p style={{fontSize:12,fontWeight:700,textTransform:'uppercase',color:'#8C93A8',margin:0}}>Top 10 — taxa de engajamento (%)</p>
        <div style={{display:'flex',gap:10}}>
          <span style={{fontSize:10,color:'#15803d'}}>■ alto (3%+)</span>
          <span style={{fontSize:10,color:'#d4a017'}}>■ médio</span>
          <span style={{fontSize:10,color:'#b91c1c'}}>■ baixo</span>
          <span style={{fontSize:9,color:'#1A3A7A'}}>■ candidato</span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={engChart} layout="vertical" margin={{left:0,right:50}}>
          <XAxis type="number" tick={{fontSize:12,fill:'#8c93a8'}} axisLine={false} tickLine={false} domain={[0,'auto']}/>
          <YAxis type="category" dataKey="name" tick={{fontSize:13,fill:'#5a6178',fontWeight:500}} width={150} axisLine={false} tickLine={false}/>
          <Tooltip contentStyle={{background:'#FFFFFF',border:'1px solid rgba(26,39,68,0.12)',borderRadius:8,fontSize:14,color:'#1A2744'}} formatter={v=>[`${v}%`,'Engajamento']} cursor={{fill:'rgba(139,92,246,0.05)'}}/>
          <Bar dataKey="eng" radius={[0,6,6,0]} barSize={20} animationDuration={800} animationEasing="ease-out" label={{position:'right',fill:'#8C93A8',fontSize:11,fontWeight:600,formatter:v=>`${v}%`}}>
            {engChart.map((d,i)=><Cell key={i} fill={d.fill} fillOpacity={0.85}/>)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Card>

    {/* Evolução temporal de seguidores */}
    {(()=>{
      // Build time series: apenas perfis monitorados
      const allDates = [...new Set((socialData||[]).filter(x=>PANEL_PROFILES.has(x.username)).map(x=>x.data_coleta))].sort();
      if(allDates.length < 2){
        // Snapshot da data disponível para mostrar contexto enquanto histórico acumula
        const snapDate = allDates[0]||'';
        const snap = snapDate
          ? (socialData||[]).filter(x=>PANEL_PROFILES.has(x.username)&&x.data_coleta===snapDate&&x.seguidores>0).sort((a,b)=>b.seguidores-a.seguidores).slice(0,5)
          : [];
        const snapMax = snap[0]?.seguidores||1;
        const SNAP_COLORS=['#1a3a7a','#ef4444','#8b5cf6','#f59e0b','#22c55e'];
        return(
        <Card style={{marginBottom:14}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
            <p style={{fontSize:12,fontWeight:700,textTransform:'uppercase',color:'#8C93A8',margin:0}}>Evolução de seguidores (série temporal)</p>
            <span style={{fontSize:11,fontWeight:700,color:'#d4a017',background:'rgba(212,160,23,0.1)',border:'1px solid rgba(212,160,23,0.25)',borderRadius:6,padding:'2px 8px',textTransform:'uppercase',letterSpacing:'0.05em'}}>Histórico sendo acumulado</span>
          </div>
          {snap.length>0?(
            <div>
              <p style={{fontSize:11,color:'#8c93a8',marginBottom:8}}>Snapshot {snapDate} — top 5 por seguidores. Série temporal disponível a partir da 2ª coleta.</p>
              {snap.map((p,i)=>{
                const w=Math.max(6,Math.round((p.seguidores/snapMax)*100));
                const isCand=p.username==='marciobarbosa_cel';
                return(
                <div key={p.username} style={{display:'flex',alignItems:'center',gap:8,marginBottom:6}}>
                  <span style={{width:130,fontSize:11,color:isCand?'#1a3a7a':'#5a6178',fontWeight:isCand?700:400,flexShrink:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>@{p.username}</span>
                  <div style={{flex:1,background:'#eef0f6',borderRadius:3,height:14,overflow:'hidden'}}>
                    <div style={{width:`${w}%`,height:'100%',background:SNAP_COLORS[i%5],borderRadius:3,display:'flex',alignItems:'center',paddingLeft:6,fontSize:10,fontWeight:700,color:'#fff',whiteSpace:'nowrap'}}>{fmtK(p.seguidores)}</div>
                  </div>
                </div>);
              })}
            </div>
          ):(
            <p style={{fontSize:12,color:'#8c93a8',textAlign:'center',padding:'16px 0'}}>Aguardando 1ª coleta de dados.</p>
          )}
        </Card>);
      }
      // Top 6 profiles by latest followers + always include candidate
      const latestDate = allDates[allDates.length-1];
      const latestProfiles = (socialData||[]).filter(x=>PANEL_PROFILES.has(x.username)&&x.data_coleta===latestDate&&x.seguidores>0).sort((a,b)=>b.seguidores-a.seguidores);
      const topUsernames = [...new Set(['marciobarbosa_cel',...latestProfiles.slice(0,5).map(x=>x.username)])].slice(0,6);
      const COLORS_LINE = ['#1a3a7a','#22c55e','#3b82f6','#f59e0b','#ef4444','#ec4899'];
      const chartData = allDates.map(date=>{
        const row = {date: date.substring(5)};  // MM-DD
        topUsernames.forEach(u=>{
          const entry = (socialData||[]).find(x=>x.username===u&&x.data_coleta===date);
          row[u] = entry ? entry.seguidores : null;
        });
        return row;
      });
      return(
      <Card style={{marginBottom:14}}>
        <p style={{fontSize:12,fontWeight:700,textTransform:'uppercase',color:'#8C93A8',marginBottom:10}}>Evolução de seguidores (série temporal)</p>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={chartData} margin={{left:0,right:8,top:5}}>
            <XAxis dataKey="date" tick={{fontSize:12,fill:'#8c93a8'}} axisLine={false} tickLine={false}/>
            <YAxis tick={{fontSize:12,fill:'#8c93a8'}} axisLine={false} tickLine={false} tickFormatter={v=>v>=1000?`${(v/1000).toFixed(0)}K`:v}/>
            <Tooltip contentStyle={{background:'#FFFFFF',border:'1px solid rgba(26,39,68,0.12)',borderRadius:8,fontSize:13,color:'#1A2744'}} formatter={(v,name)=>[v?.toLocaleString('pt-BR'),`@${name}`]}/>
            <Legend wrapperStyle={{fontSize:10,color:'#8c93a8'}} formatter={v=>`@${v}`}/>
            {topUsernames.map((u,i)=>(
              <Line key={u} type="monotone" dataKey={u} stroke={COLORS_LINE[i%6]} strokeWidth={u==='marciobarbosa_cel'?3:1.5} dot={{r:u==='marciobarbosa_cel'?4:2}} connectNulls animationDuration={800} animationEasing="ease-out"/>
            ))}
          </LineChart>
        </ResponsiveContainer>
      </Card>);
    })()}

    {/* Nuvem de palavras dos comentários */}
    {(()=>{
      const comments = sentimentData?.comments_sample || [];
      if(!comments.length) return null;
      // Extract word frequencies from comments
      const stopwords = new Set(['de','da','do','das','dos','e','a','o','que','em','um','uma','para','com','não','nao','no','na','se','por','mais','ao','os','as','é','esse','essa','este','esta','já','ja','foi','ser','tem','seu','sua','ou','muito','como','eu','me','meu','minha','ele','ela','nos','lhe','te','ti','são','sao','mas','isso','isto','aqui','ali','voce','você','vc','pra','pro','tb','tbm']);
      const wordMap = {};
      comments.forEach(c=>{
        const words = (c.text||'').toLowerCase().replace(/[^\p{L}\s]/gu,'').split(/\s+/).filter(w=>w.length>2&&!stopwords.has(w));
        words.forEach(w=>{wordMap[w]=(wordMap[w]||0)+1;});
      });
      const sorted = Object.entries(wordMap).sort((a,b)=>b[1]-a[1]).slice(0,40);
      if(!sorted.length) return null;
      const maxCount = sorted[0][1];
      // Color by sentiment association
      const posWords = new Set(['parabéns','parabens','excelente','otimo','ótimo','apoio','merece','sucesso','top','obrigado','obrigada','deus','bom','boa','forte','guerreiro','respeito','lindo','linda','maravilhoso','sensacional','orgulho','heroi','herói','amém','amem','bênção','bencao']);
      const negWords = new Set(['corrupto','vergonha','mentiroso','lixo','nojo','pior','fora','nunca','fake','mentira']);
      return(
      <Card style={{marginBottom:14}}>
        <p style={{fontSize:12,fontWeight:700,textTransform:'uppercase',color:'#8C93A8',marginBottom:10}}>Nuvem de palavras — comentários do candidato</p>
        <div style={{display:'flex',flexWrap:'wrap',gap:'6px 10px',justifyContent:'center',padding:'8px 0',minHeight:80}}>
          {sorted.map(([word,count])=>{
            const ratio = count/maxCount;
            const size = Math.max(13,Math.round(13+ratio*24));
            let color = '#94a3b8';
            if(posWords.has(word)) color='#22c55e';
            else if(negWords.has(word)) color='#ef4444';
            else if(ratio>0.5) color='#e2e8f0';
            return(
              <span key={word} style={{fontSize:size,fontWeight:ratio>0.3?600:400,color,opacity:0.6+ratio*0.4,lineHeight:1.2,cursor:'default'}} title={`${word}: ${count}x`}>{word}</span>
            );
          })}
        </div>
        <div style={{display:'flex',justifyContent:'center',gap:12,marginTop:8}}>
          <span style={{fontSize:10,color:'#15803d'}}>■ positivo</span>
          <span style={{fontSize:9,color:'#8C93A8'}}>■ neutro</span>
          <span style={{fontSize:10,color:'#b91c1c'}}>■ negativo</span>
          <span style={{fontSize:10,color:'#8c93a8'}}>(tamanho = frequência)</span>
        </div>
      </Card>);
    })()}

    {/* Insights */}
    <Card style={{borderLeft:'3px solid #22c55e'}}>
      <p style={{fontSize:12,fontWeight:700,textTransform:'uppercase',color:'#8C93A8',marginBottom:10}}>Insights para a campanha</p>
      <div style={{fontSize:14,color:'#8C93A8',lineHeight:1.7}}>
        {cand&&<p style={{margin:'0 0 4px'}}>Cel. Barbosa: #{candRank} em seguidores ({cand.seguidores.toLocaleString('pt-BR')}) com engajamento de {cand.taxa_engajamento_pct}% — {cand.taxa_engajamento_pct>1.5?'acima da média de políticos brasileiros (~1%)':'dentro da média'}.</p>}
        {cand&&<p style={{margin:'0 0 4px'}}>Média de {cand.media_likes_recentes} likes/post. Investir em Reels e vídeos curtos tende a amplificar o alcance orgânico em 3-5x no Instagram.</p>}
        {sentimentData?.sentiment?.total>0&&<p style={{margin:0}}>Análise de {sentimentData.sentiment.total} comentários: {sentimentData.sentiment.pct_positivo}% positivos, {sentimentData.sentiment.pct_negativo}% negativos. {sentimentData.sentiment.pct_positivo>50?'Percepção pública favorável — explorar UGC e depoimentos.':'Monitorar narrativas negativas e preparar contra-narrativas.'}</p>}
        {!sentimentData?.sentiment?.total&&<p style={{margin:0}}>Execute o scraper de comentários para gerar a análise de sentimento do público nas redes.</p>}
      </div>
    </Card>
    </div>
    )}
  </Card>);
};

/* ═══════════════════════════════════════════════
   TENDÊNCIA DE VOTO 2022 — Presidencial TO
   ═══════════════════════════════════════════════ */
const TV_CORES={Conservador:'#1A3A7A',Dividido:'#D4A017',Progressista:'#B91C1C',gap:'#15803D'};

const TendenciaVotoPanel=({tendenciaData})=>{
  const[open,setOpen]=useState(true);
  const[filtroClass,setFiltroClass]=useState('all');
  const[sortKey,setSortKey]=useState('margem');
  const[sortDir,setSortDir]=useState(-1);
  const[chartView,setChartView]=useState('conservadores');
  if(!tendenciaData?.municipios?.length)return null;

  const{agregado,municipios,top10_conservadores,top10_progressistas,top10_gap_conversao=[]}=tendenciaData;
  const hasShareRep=municipios.some(m=>m.share_republicanos_dep_federal>0);
  const pctB=agregado.pct_bolsonaro_estado,pctL=agregado.pct_lula_estado;

  const tabelaDados=useMemo(()=>{
    const list=filtroClass==='all'?municipios:municipios.filter(m=>m.classificacao===filtroClass);
    return[...list].sort((a,b)=>sortDir*((b[sortKey]||0)-(a[sortKey]||0)));
  },[municipios,filtroClass,sortKey,sortDir]);

  const titleCase=s=>s.split(' ').map(w=>w.charAt(0)+w.slice(1).toLowerCase()).join(' ');
  const chartData=(chartView==='conservadores'?top10_conservadores:top10_progressistas).map(m=>({
    nome:titleCase(m.nome),bols:m.pct_bolsonaro,lula:m.pct_lula
  }));

  const toggleSort=k=>{if(sortKey===k)setSortDir(d=>d*-1);else{setSortKey(k);setSortDir(-1);}};
  const sortArrow=k=>sortKey===k?(sortDir>0?'↑':'↓'):'';

  const BadgeCl=({c})=>{
    const cor=TV_CORES[c]||'#8c93a8';
    return<span style={{padding:'2px 7px',borderRadius:5,fontSize:9,fontWeight:700,background:`${cor}18`,color:cor,whiteSpace:'nowrap'}}>{c||'—'}</span>;
  };

  return(
  <Card style={{marginTop:32}}>
    {/* Header clicável */}
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:10,cursor:'pointer',marginBottom:open?18:0}} onClick={()=>setOpen(o=>!o)}>
      <div style={{display:'flex',alignItems:'center',gap:12}}>
        <div style={{background:'rgba(26,58,122,0.06)',border:'1px solid rgba(26,58,122,0.12)',borderRadius:12,padding:10}}><TrendingUp size={22} style={{color:'#1A3A7A'}}/></div>
        <div>
          <h2 style={{fontSize:22,fontWeight:800,color:'#1A2744',margin:0}}>Tendência de Voto 2022</h2>
          <p style={{fontSize:12,color:'#8c93a8',fontWeight:700,textTransform:'uppercase',letterSpacing:'0.1em',margin:'2px 0 0'}}>2º turno presidencial · {agregado?.total_municipios ?? 139} municípios · Fonte: TSE</p>
        </div>
      </div>
      <div style={{display:'flex',alignItems:'center',gap:16}}>
        <div style={{textAlign:'center'}}><p style={{fontSize:20,fontWeight:800,color:TV_CORES.Conservador,margin:0}}>{agregado.municipios_conservadores}</p><p style={{fontSize:11,color:'#8c93a8',margin:0,textTransform:'uppercase',fontWeight:700}}>conservadores</p></div>
        <div style={{textAlign:'center'}}><p style={{fontSize:20,fontWeight:800,color:TV_CORES.Dividido,margin:0}}>{agregado.municipios_divididos}</p><p style={{fontSize:11,color:'#8c93a8',margin:0,textTransform:'uppercase',fontWeight:700}}>divididos</p></div>
        <div style={{textAlign:'center'}}><p style={{fontSize:20,fontWeight:800,color:TV_CORES.Progressista,margin:0}}>{agregado.municipios_progressistas}</p><p style={{fontSize:11,color:'#8c93a8',margin:0,textTransform:'uppercase',fontWeight:700}}>progressistas</p></div>
        {open?<ChevronUp size={18} style={{color:'#8c93a8'}}/>:<ChevronDown size={18} style={{color:'#8c93a8'}}/>}
      </div>
    </div>

    {open&&(
    <div>
      {/* Barra estadual */}
      <div style={{marginBottom:16}}>
        <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
          <span style={{fontSize:12,fontWeight:700,color:TV_CORES.Conservador}}>Bolsonaro {pctB}%</span>
          <span style={{fontSize:11,color:'#8c93a8',fontWeight:600}}>Tocantins — 2º Turno 2022</span>
          <span style={{fontSize:12,fontWeight:700,color:TV_CORES.Progressista}}>Lula {pctL}%</span>
        </div>
        <div style={{height:10,borderRadius:6,background:`${TV_CORES.Progressista}22`,overflow:'hidden',display:'flex'}}>
          <div style={{width:`${pctB}%`,background:TV_CORES.Conservador,borderRadius:'6px 0 0 6px',transition:'width 0.6s ease'}}/>
          <div style={{width:`${pctL}%`,background:TV_CORES.Progressista,borderRadius:'0 6px 6px 0'}}/>
        </div>
      </div>

      {/* Cards de resumo (3 colunas) */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12,marginBottom:16}}>
        {[
          {label:'Municípios Conservadores',val:agregado.municipios_conservadores,cor:TV_CORES.Conservador,sub:'>60% Bolsonaro'},
          {label:'Municípios Divididos',val:agregado.municipios_divididos,cor:TV_CORES.Dividido,sub:'40–60% cada'},
          {label:'Municípios Progressistas',val:agregado.municipios_progressistas,cor:TV_CORES.Progressista,sub:'>60% Lula'},
        ].map(({label,val,cor,sub})=>(
          <Card key={label} style={{padding:'14px 16px',borderLeft:`4px solid ${cor}`}}>
            <p style={{fontSize:11,fontWeight:700,textTransform:'uppercase',color:'#8c93a8',margin:'0 0 6px',letterSpacing:'0.08em'}}>{label}</p>
            <p style={{fontSize:32,fontWeight:900,color:cor,margin:0,lineHeight:1}}>{val}</p>
            <p style={{fontSize:11,color:'#8c93a8',margin:'4px 0 0'}}>{sub}</p>
          </Card>
        ))}
      </div>

      {/* GAP de conversão */}
      {agregado.municipios_com_gap>0&&(
        <div style={{background:'#0f2a1a',border:'1px solid #15803D',borderRadius:12,padding:'16px 20px',marginBottom:16}}>
          <p style={{margin:0,color:'#D4A017',fontWeight:800,fontSize:15}}>
            {agregado.municipios_com_gap} municípios onde o eleitor votou conservador para presidente
            mas <em>não</em> votou Republicanos para deputado federal
          </p>
          <p style={{margin:'6px 0 0',color:'rgba(255,255,255,0.65)',fontSize:12}}>
            Potencial estimado de <strong style={{color:'#4ade80'}}>{agregado.potencial_votos_gap.toLocaleString('pt-BR')} votos</strong> a conquistar convertendo 5% do eleitorado conservador nessas regiões.
          </p>
          {top10_gap_conversao.length>0&&(
            <p style={{margin:'8px 0 0',color:'#8C93A8',fontSize:11}}>
              Municípios: {top10_gap_conversao.map(m=>m.nome.replace(/\w\S*/g,t=>t.charAt(0)+t.slice(1).toLowerCase())).join(', ')}
            </p>
          )}
        </div>
      )}

      {/* Gráfico de barras — Toggle Conservadores / Progressistas */}
      <Card style={{marginBottom:16}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
          <p style={{fontSize:12,fontWeight:700,textTransform:'uppercase',color:'#8C93A8',margin:0}}>
            Top 10 — {chartView==='conservadores'?'Mais Conservadores':'Mais Progressistas'}
          </p>
          <div style={{display:'flex',gap:6}}>
            {[['conservadores','Conservadores'],['progressistas','Progressistas']].map(([k,lbl])=>(
              <button key={k} onClick={()=>setChartView(k)}
                style={{padding:'4px 10px',borderRadius:6,border:'none',cursor:'pointer',fontSize:11,fontWeight:700,
                  background:chartView===k?(k==='conservadores'?TV_CORES.Conservador:TV_CORES.Progressista):'#eef0f6',
                  color:chartView===k?'#fff':'#5a6178'}}>
                {lbl}
              </button>
            ))}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={chartData} layout="vertical" margin={{left:0,right:56}} barCategoryGap="30%" barGap={3}>
            <XAxis type="number" tick={{fontSize:11,fill:'#8c93a8'}} axisLine={false} tickLine={false} domain={[0,100]} tickFormatter={v=>`${v}%`}/>
            <YAxis type="category" dataKey="nome" width={160} axisLine={false} tickLine={false}
              tick={(props)=>{
                const{x,y,payload}=props;
                const name=payload.value;
                const display=name.length>20?name.substring(0,18)+'\u2026':name;
                return <text x={x} y={y} dy={4} textAnchor="end" fill="#5a6178" fontSize={11} fontWeight={500}>{display}</text>;
              }}/>
            <Tooltip formatter={(v,n)=>[`${v}%`,n==='bols'?'Bolsonaro':'Lula']} contentStyle={{background:'#fff',border:'1px solid #dfe3ed',borderRadius:8,fontSize:13}}/>
            <Bar dataKey="bols" name="bols" fill={TV_CORES.Conservador} radius={[0,4,4,0]} barSize={13} animationDuration={800} animationEasing="ease-out" label={{position:'right',fill:TV_CORES.Conservador,fontSize:11,fontWeight:700,formatter:v=>`${v}%`}}/>
            <Bar dataKey="lula" name="lula" fill={TV_CORES.Progressista} radius={[0,4,4,0]} barSize={13} animationDuration={800} animationEasing="ease-out" label={{position:'right',fill:TV_CORES.Progressista,fontSize:11,fontWeight:700,formatter:v=>`${v}%`}}/>
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Tabela completa */}
      <Card>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:8,marginBottom:10}}>
          <p style={{fontSize:12,fontWeight:700,textTransform:'uppercase',color:'#8C93A8',margin:0}}>
            Todos os municípios ({tabelaDados.length})
          </p>
          <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
            {[['all','Todos'],['Conservador','Conservador'],['Dividido','Dividido'],['Progressista','Progressista']].map(([k,lbl])=>(
              <button key={k} onClick={()=>setFiltroClass(k)}
                style={{padding:'4px 10px',borderRadius:6,border:'none',cursor:'pointer',fontSize:11,fontWeight:700,
                  background:filtroClass===k?(k==='all'?'#1a3a7a':TV_CORES[k]||'#1a3a7a'):'#eef0f6',
                  color:filtroClass===k?'#fff':'#5a6178'}}>
                {lbl}
              </button>
            ))}
          </div>
        </div>
        <div style={{overflowX:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
            <thead>
              <tr style={{borderBottom:'2px solid #dfe3ed'}}>
                {[
                  ['#','',28],['Município','',null],
                  ['Bolsonaro','pct_bolsonaro',80],['Lula','pct_lula',60],
                  ['Margem','margem',70],['Classificação','classificacao',110],
                  ...(hasShareRep?[['Share REP','share_republicanos_dep_federal',75],['Gap?','gap_conversao',50]]:[]),
                ].map(([label,key,w],i)=>(
                  <th key={i} onClick={key?()=>toggleSort(key):undefined}
                    style={{padding:'6px 8px',textAlign:i<=1?'left':'right',color:'#8c93a8',fontWeight:700,fontSize:10,textTransform:'uppercase',cursor:key?'pointer':'default',userSelect:'none',whiteSpace:'nowrap',...(w?{width:w}:{})}}>
                    {label}{key&&<span style={{marginLeft:3,opacity:0.6}}>{sortArrow(key)}</span>}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tabelaDados.map((m,i)=>(
                <tr key={m.nome} style={{borderBottom:'1px solid var(--surface-border)',background:i%2===0?'transparent':'#fafbfc'}}>
                  <td style={{padding:'5px 8px',color:'#8c93a8',fontWeight:700,fontSize:11}}>{i+1}</td>
                  <td style={{padding:'5px 8px',fontWeight:600,color:'#1A2744',whiteSpace:'nowrap'}}>{m.nome}</td>
                  <td style={{padding:'5px 8px',textAlign:'right',fontWeight:700,color:TV_CORES.Conservador,fontVariantNumeric:'tabular-nums'}}>{m.pct_bolsonaro}%</td>
                  <td style={{padding:'5px 8px',textAlign:'right',fontWeight:700,color:TV_CORES.Progressista,fontVariantNumeric:'tabular-nums'}}>{m.pct_lula}%</td>
                  <td style={{padding:'5px 8px',textAlign:'right',fontWeight:700,color:m.margem>0?TV_CORES.Conservador:TV_CORES.Progressista,fontVariantNumeric:'tabular-nums'}}>{m.margem>0?'+':''}{m.margem}pp</td>
                  <td style={{padding:'5px 8px',textAlign:'right'}}><BadgeCl c={m.classificacao}/></td>
                  {hasShareRep&&<>
                    <td style={{padding:'5px 8px',textAlign:'right',color:'#8C93A8',fontVariantNumeric:'tabular-nums'}}>{m.share_republicanos_dep_federal>0?`${m.share_republicanos_dep_federal}%`:'—'}</td>
                    <td style={{padding:'5px 8px',textAlign:'center'}}>{m.gap_conversao?<span style={{padding:'2px 6px',borderRadius:4,background:'#15803D18',color:TV_CORES.gap,fontSize:9,fontWeight:700}}>SIM</span>:null}</td>
                  </>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
    )}
  </Card>);
};

/* ═══════════════════════════════════════════════
   KPI PANEL — Painel de Metas da Campanha
   ═══════════════════════════════════════════════ */
const KpiPanel=({kpiData})=>{
  const[open,setOpen]=useState(true);
  if(!kpiData?.kpis?.length)return null;
  const phase = kpiData.current_phase || 1;
  const phaseInfo = kpiData.phases?.[String(phase)] || {};
  const electionDate = kpiData.election_date ? new Date(kpiData.election_date+'T00:00:00') : null;
  const today = new Date();
  const daysLeft = electionDate ? Math.max(0, Math.ceil((electionDate - today) / (1000*60*60*24))) : null;

  return(
  <Card style={{marginTop:32}}>
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:10,cursor:'pointer',marginBottom:open?18:0}} onClick={()=>setOpen(o=>!o)}>
      <div style={{display:'flex',alignItems:'center',gap:12}}>
        <div style={{background:'rgba(212,160,23,0.1)',border:'1px solid rgba(212,160,23,0.2)',borderRadius:12,padding:10}}><Target size={22} style={{color:'#d4a017'}}/></div>
        <div>
          <h2 style={{fontSize:22,fontWeight:800,color:'#1A2744',margin:0}}>Metas da campanha</h2>
          <p style={{fontSize:12,color:'#8c93a8',fontWeight:700,textTransform:'uppercase',letterSpacing:'0.1em',margin:'2px 0 0'}}>
            Fase {phase}: {phaseInfo.name||''} · {phaseInfo.period||''}
          </p>
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
        const target = kpi.targets?.[String(phase)] || 0;
        const current = kpi.current || 0;
        const pct = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;
        const isOnTrack = pct >= 50;
        const isAchieved = pct >= 100;
        const barColor = isAchieved ? '#15803d' : (isOnTrack ? '#1a3a7a' : '#b91c1c');
        const statusLabel = isAchieved ? 'ATINGIDO' : (isOnTrack ? 'NO RITMO' : 'ATENÇÃO');
        const statusColor = isAchieved ? '#15803d' : (isOnTrack ? '#1a3a7a' : '#b91c1c');

        const displayCurrent = kpi.format === 'percent' ? `${current}%` : current.toLocaleString('pt-BR');
        const displayTarget = kpi.format === 'percent' ? `${target}%` : target.toLocaleString('pt-BR');

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
          {/* Progress bar */}
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
};

/* ═══════════════════════════════════════════════
   GEO-ELECTORAL PANEL (M3)
   ═══════════════════════════════════════════════ */
const CAT_COLORS={
  'ALTA PRIORIDADE':'#22c55e','OPORTUNIDADE':'#f59e0b',
  'DESENVOLVIMENTO':'#f97316','BAIXA PRIORIDADE':'#ef4444'
};
const PARTY_COLORS={
  'REPUBLICANOS':'#1e40af','PL':'#1d4ed8','PP':'#0369a1','UNIÃO':'#0891b2',
  'PT':'#dc2626','MDB':'#16a34a','PSDB':'#2563eb','PSD':'#7c3aed',
  'PDT':'#ea580c','PODE':'#0d9488','PSB':'#db2777','SOLIDARIEDADE':'#d97706',
  'AVANTE':'#65a30d','PATRIOTA':'#059669','PSC':'#4f46e5',
};

const GeoPanel=({geoData})=>{
  const[open,setOpen]=useState(true);
  const[selectedMun,setSelectedMun]=useState(null);
  const[catFilter,setCatFilter]=useState('all');
  const isMobile=useWW()<768;

  const summary=geoData?.summary||{};
  const municipios=useMemo(()=>{
    const list=geoData?.municipios||[];
    if(catFilter==='all')return list;
    return list.filter(m=>m.categoria===catFilter);
  },[geoData,catFilter]);

  // Top parties chart
  const partyChart=useMemo(()=>{
    if(!geoData?.municipios)return[];
    const totals={};
    geoData.municipios.forEach(m=>{
      (m.top_partidos||[]).forEach(p=>{
        totals[p.partido]=(totals[p.partido]||0)+p.votos;
      });
    });
    return Object.entries(totals).sort((a,b)=>b[1]-a[1]).slice(0,10).map(([p,v])=>({
      name:p,votos:v,fill:PARTY_COLORS[p]||'#475569'
    }));
  },[geoData]);

  if(!geoData?.municipios?.length)return null;

  const detail=selectedMun?geoData.municipios.find(m=>m.municipio_upper===selectedMun):null;

  return(
  <Card style={{marginTop:32}}>
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:10,cursor:'pointer',marginBottom:open?18:0}} onClick={()=>setOpen(o=>!o)}>
      <div style={{display:'flex',alignItems:'center',gap:12}}>
        <div style={{background:'rgba(21,128,61,0.08)',border:'1px solid rgba(21,128,61,0.15)',borderRadius:12,padding:10}}><MapPin size={22} style={{color:'#15803d'}}/></div>
        <div>
          <h2 style={{fontSize:22,fontWeight:800,color:'#1A2744',margin:0}}>Inteligência eleitoral — Tocantins</h2>
          <p style={{fontSize:12,color:'#8c93a8',fontWeight:700,textTransform:'uppercase',letterSpacing:'0.1em',margin:'2px 0 0'}}>
            {summary.total_municipios||0} municípios · TSE 2022 + IBGE · Dep. Federal
          </p>
        </div>
      </div>
      <div style={{display:'flex',alignItems:'center',gap:16}}>
        <div style={{textAlign:'center'}}><p style={{fontSize:20,fontWeight:800,color:'#22c55e',margin:0}}>{summary.alta_prioridade||0}</p><p style={{fontSize:11,color:'#8c93a8',margin:0,textTransform:'uppercase',fontWeight:700}}>alta prior.</p></div>
        <div style={{textAlign:'center'}}><p style={{fontSize:20,fontWeight:800,color:'#1A3A7A',margin:0}}>{summary.total_municipios||0}</p><p style={{fontSize:11,color:'#8c93a8',margin:0,textTransform:'uppercase',fontWeight:700}}>municípios</p></div>
        {open?<ChevronUp size={18} style={{color:'#8c93a8'}}/>:<ChevronDown size={18} style={{color:'#8c93a8'}}/>}
      </div>
    </div>
    {open&&(
    <div>
    {/* Summary metrics */}
    <div style={{display:'flex',gap:8,marginBottom:14,flexWrap:'wrap'}}>
      <Met icon={MapPin} label="Municípios" value={summary.total_municipios||0} accent="#22c55e"/>
      <Met icon={Target} label="Alta prior." value={summary.alta_prioridade||0} sub="score 60+" accent="#22c55e"/>
      <Met icon={Eye} label="Oportunidade" value={summary.oportunidade||0} sub="score 40-60" accent="#f59e0b"/>
      <Met icon={TrendingUp} label="Votos REP 2022" value={(summary.total_votos_republicanos_2022||0).toLocaleString('pt-BR')} accent="#1e40af"/>
      <Met icon={BarChart3} label="Share estado" value={`${summary.share_republicanos_estado||0}%`} accent="#8b5cf6"/>
    </div>

    {/* Category filters */}
    <div style={{display:'flex',gap:6,marginBottom:14,flexWrap:'wrap'}}>
      <Bt active={catFilter==='all'} color="#64748b" onClick={()=>setCatFilter('all')}>Todos ({geoData.municipios.length})</Bt>
      {Object.entries(CAT_COLORS).map(([cat,color])=>{
        const count=geoData.municipios.filter(m=>m.categoria===cat).length;
        return <Bt key={cat} active={catFilter===cat} color={color} onClick={()=>setCatFilter(cat)}>{cat.toLowerCase()} ({count})</Bt>;
      })}
    </div>

    <div style={{display:'grid',gridTemplateColumns:isMobile?'1fr':'minmax(0,1.8fr) minmax(0,1.2fr)',gap:12,marginBottom:14}}>
      {/* Ranking table */}
      <Card>
        <p style={{fontSize:12,fontWeight:700,textTransform:'uppercase',color:'#8C93A8',marginBottom:10}}>
          Ranking por potencial — {municipios.length} municípios
        </p>
        <div style={{maxHeight:400,overflowY:'auto'}}>
          <div style={{display:'grid',gridTemplateColumns:isMobile?'32px 1fr 56px':'32px 1fr 70px 70px 60px 90px',gap:4,padding:'4px 4px 6px',borderBottom:'1px solid var(--surface-border)'}}>
            <span style={{fontSize:10,color:'#8c93a8',fontWeight:700}}>#</span>
            <span style={{fontSize:10,color:'#8c93a8',fontWeight:700}}>MUNICÍPIO</span>
            {!isMobile&&<span style={{fontSize:10,color:'#8c93a8',fontWeight:700,textAlign:'right'}}>ELEITORADO</span>}
            {!isMobile&&<span style={{fontSize:10,color:'#8c93a8',fontWeight:700,textAlign:'right'}}>VOTOS REP</span>}
            <span style={{fontSize:10,color:'#8c93a8',fontWeight:700,textAlign:'right'}}>SCORE</span>
            {!isMobile&&<span style={{fontSize:10,color:'#8c93a8',fontWeight:700,textAlign:'center'}}>CATEGORIA</span>}
          </div>
          {municipios.map(m=>(
            <div key={m.municipio_upper} onClick={()=>setSelectedMun(selectedMun===m.municipio_upper?null:m.municipio_upper)}
              style={{display:'grid',gridTemplateColumns:isMobile?'32px 1fr 56px':'32px 1fr 70px 70px 60px 90px',gap:4,padding:'5px 4px',borderBottom:'1px solid var(--surface-border)',cursor:'pointer',
                background:selectedMun===m.municipio_upper?'rgba(34,197,94,0.1)':'transparent',
                borderRadius:selectedMun===m.municipio_upper?6:0}}>
              <span style={{fontSize:12,fontWeight:700,color:'#8c93a8'}}>#{m.ranking}</span>
              <span style={{fontSize:13,color:'#1A2744',fontWeight:500,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{m.municipio}</span>
              {!isMobile&&<span style={{fontSize:13,color:'#8C93A8',textAlign:'right',fontVariantNumeric:'tabular-nums'}}>{(m.eleitorado||0).toLocaleString('pt-BR')}</span>}
              {!isMobile&&<span style={{fontSize:13,color:'#1d4ed8',textAlign:'right',fontVariantNumeric:'tabular-nums'}}>{(m.votos_republicanos||0).toLocaleString('pt-BR')}</span>}
              <span style={{fontSize:13,fontWeight:700,color:CAT_COLORS[m.categoria]||'#64748b',textAlign:'right'}}>{m.score_potencial}</span>
              {!isMobile&&<span style={{fontSize:8,fontWeight:700,color:CAT_COLORS[m.categoria],textAlign:'center',textTransform:'uppercase'}}>{m.categoria.split(' ')[0]}</span>}
            </div>
          ))}
        </div>
      </Card>

      {/* Right column: party chart + detail */}
      <div style={{display:'flex',flexDirection:'column',gap:12}}>
        {/* Party distribution */}
        <Card>
          <p style={{fontSize:12,fontWeight:700,textTransform:'uppercase',color:'#8C93A8',marginBottom:10}}>Votos por partido — dep. federal 2022</p>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={partyChart} layout="vertical" margin={{left:0,right:40}}>
              <XAxis type="number" tick={{fontSize:9,fill:'#8c93a8'}} axisLine={false} tickLine={false} tickFormatter={v=>v>=1000?`${(v/1000).toFixed(0)}K`:v}/>
              <YAxis type="category" dataKey="name" tick={{fontSize:12,fill:'#5a6178',fontWeight:500}} width={90} axisLine={false} tickLine={false}/>
              <Tooltip contentStyle={{background:'#FFFFFF',border:'1px solid rgba(26,39,68,0.12)',borderRadius:8,fontSize:13,color:'#1A2744'}} formatter={v=>[v.toLocaleString('pt-BR')+' votos']}/>
              <Bar dataKey="votos" radius={[0,4,4,0]} barSize={16} animationDuration={800} animationEasing="ease-out">
                {partyChart.map((d,i)=><Cell key={i} fill={d.fill} fillOpacity={0.85}/>)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Municipality detail (on click) */}
        {detail&&(
          <Card style={{borderLeft:`3px solid ${CAT_COLORS[detail.categoria]}`}}>
            <p style={{fontSize:12,fontWeight:700,textTransform:'uppercase',color:'#8C93A8',marginBottom:10}}>{detail.municipio} — #{detail.ranking}</p>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:10}}>
              <div><span style={{fontSize:10,color:'#8c93a8'}}>Eleitorado</span><p style={{fontSize:18,fontWeight:700,color:'#1A2744',margin:0}}>{(detail.eleitorado||0).toLocaleString('pt-BR')}</p></div>
              <div><span style={{fontSize:10,color:'#8c93a8'}}>População</span><p style={{fontSize:18,fontWeight:700,color:'#8C93A8',margin:0}}>{(detail.populacao||0).toLocaleString('pt-BR')}</p></div>
              <div><span style={{fontSize:10,color:'#8c93a8'}}>Votos Republicanos</span><p style={{fontSize:18,fontWeight:700,color:'#1d4ed8',margin:0}}>{(detail.votos_republicanos||0).toLocaleString('pt-BR')}</p></div>
              <div><span style={{fontSize:10,color:'#8c93a8'}}>Share REP</span><p style={{fontSize:18,fontWeight:700,color:'#1A3A7A',margin:0}}>{detail.share_republicanos}%</p></div>
              <div><span style={{fontSize:10,color:'#8c93a8'}}>Comparecimento</span><p style={{fontSize:18,fontWeight:700,color:'#d4a017',margin:0}}>{detail.taxa_comparecimento}%</p></div>
              <div><span style={{fontSize:10,color:'#8c93a8'}}>Partido vencedor</span><p style={{fontSize:16,fontWeight:700,color:PARTY_COLORS[detail.partido_vencedor]||'#94a3b8',margin:0}}>{detail.partido_vencedor}</p></div>
            </div>
            <p style={{fontSize:12,color:'#8C93A8',fontWeight:700,textTransform:'uppercase',marginBottom:10}}>TOP CANDIDATOS 2022:</p>
            {(detail.top_candidatos||[]).slice(0,3).map((c,i)=>(
              <p key={i} style={{fontSize:13,color:'#8C93A8',margin:'2px 0'}}>{i+1}. {c.nome} ({c.partido}) — {(c.votos||0).toLocaleString('pt-BR')} votos</p>
            ))}
          </Card>
        )}
        {!detail&&(
          <Card style={{borderLeft:'3px solid #475569'}}>
            <p style={{fontSize:12,color:'#8c93a8',textAlign:'center',padding:'16px 0'}}>Clique em um município no ranking para ver os detalhes</p>
          </Card>
        )}
      </div>
    </div>

    {/* Strategic insights */}
    <Card style={{borderLeft:'3px solid #22c55e',marginBottom:14}}>
      <p style={{fontSize:12,fontWeight:700,textTransform:'uppercase',color:'#8C93A8',marginBottom:10}}>Insights geoeleitorais</p>
      <div style={{fontSize:14,color:'#8C93A8',lineHeight:1.7}}>
        <p style={{margin:'0 0 4px'}}>Base eleitoral do Republicanos no TO: {(summary.total_votos_republicanos_2022||0).toLocaleString('pt-BR')} votos em 2022 ({summary.share_republicanos_estado}% share). {summary.alta_prioridade} municipios classificados como alta prioridade.</p>
        <p style={{margin:'0 0 4px'}}>Top municipios aliados: {(summary.municipios_aliados||[]).slice(0,5).join(', ')}. Foco de campanha: consolidar base existente e expandir nos municipios de oportunidade.</p>
        {(summary.municipios_adversarios||[]).length>0&&<p style={{margin:0}}>Territorios dominados por adversarios: {summary.municipios_adversarios.slice(0,5).join(', ')}. Avaliar custo-beneficio de investir nestas regioes vs. maximizar municipios de oportunidade.</p>}
      </div>
    </Card>
    </div>
    )}
  </Card>);
};

/* ═══════════════════════════════════════════════
   ADVERSÁRIOS PANEL — Inteligência Competitiva
   ═══════════════════════════════════════════════ */
const THREAT_C={alta:{bg:'rgba(239,68,68,0.1)',c:'#ef4444'},média:{bg:'rgba(245,158,11,0.1)',c:'#f59e0b'},baixa:{bg:'rgba(100,116,139,0.1)',c:'#64748b'},interno:{bg:'rgba(139,92,246,0.1)',c:'#8b5cf6'},candidato:{bg:'rgba(26,58,122,0.1)',c:'#1a3a7a'}};
const NIVEL_ORDER={baixa:1,média:2,alta:3};
const DEST_C={Senado:'#1a3a7a',Governo:'#22c55e',Desistiu:'#64748b'};
const fmtK=n=>n>=1000?`${(n/1000).toFixed(n>=10000?0:1)}K`:String(n||0);

const AdversariosPanel=({adversariosData})=>{
  const[open,setOpen]=useState(true);

  // ── Dados dinâmicos (adversarios.json) ou fallback hardcoded ────────────
  const d=adversariosData;
  const ranking=useMemo(()=>{
    if(!d?.ranking)return[
      {ranking:1,nome:'Janad Valcari',partido:'PP',seguidores:87000,nivel_ameaca:'alta'},
      {ranking:2,nome:'Tiago Dimas',partido:'Podemos',seguidores:69000,nivel_ameaca:'alta'},
      {ranking:3,nome:'Jair Farias',partido:'União Brasil',seguidores:22000,nivel_ameaca:'alta'},
      {ranking:4,nome:'Fábio Vaz',partido:'Republicanos*',seguidores:21000,nivel_ameaca:'interno'},
      {ranking:5,nome:'Filipe Martins',partido:'PL',seguidores:19000,nivel_ameaca:'alta'},
      {ranking:5,nome:'Lucas Campelo',partido:'Republicanos*',seguidores:19000,nivel_ameaca:'interno'},
      {ranking:8,nome:'César Halum',partido:'PP',seguidores:13000,nivel_ameaca:'alta'},
      {ranking:9,nome:'Nilmar Ruiz',partido:'PL',seguidores:10000,nivel_ameaca:'média'},
      {ranking:10,nome:'Sandoval Cardoso',partido:'Podemos',seguidores:9000,nivel_ameaca:'média'},
      {ranking:11,nome:'Larissa Rosenda',partido:'PSD',seguidores:8000,nivel_ameaca:'baixa'},
      {ranking:12,nome:'Célio Moura',partido:'PT',seguidores:7000,nivel_ameaca:'média'},
      {ranking:13,nome:'Lázaro Botelho',partido:'PP',seguidores:3600,nivel_ameaca:'alta'},
    ];
    return d.ranking;
  },[d]);
  const candidato=d?.candidato||{nome:'Cel. Barbosa',partido:'Republicanos',seguidores:31000,nivel_ameaca:'candidato',is_candidato:true};
  const threats=d?.ameacas_altas||ranking.filter(r=>r.nivel_ameaca==='alta'&&r.descricao);
  const internals=d?.internos||ranking.filter(r=>r.nivel_ameaca==='interno');
  const migrations=d?.migracoes||[
    {ab:'CG',abreviacao:'CG',nome:'Carlos Gaguim',partido:'União Brasil',destino:'Senado',detalhe:'67K IG · 33K FB'},
    {ab:'AG',abreviacao:'AG',nome:'Alexandre Guimarães',partido:'MDB',destino:'Senado',detalhe:'51K IG · Pres. MDB-TO'},
    {ab:'EB',abreviacao:'EB',nome:'Eli Borges',partido:'Republicanos',destino:'Senado',detalhe:'19K IG'},
    {ab:'PD',abreviacao:'PD',nome:'Profa. Dorinha',partido:'União Brasil',destino:'Governo',detalhe:'líder nas pesquisas'},
    {ab:'VJ',abreviacao:'VJ',nome:'Vicentinho Júnior',partido:'PSDB',destino:'Governo',detalhe:'87K IG'},
    {ab:'CM',abreviacao:'CM',nome:'Celso Morais',partido:'MDB',destino:'Desistiu',detalhe:'44K IG · prefeito reeleito'},
  ];
  const recs=d?.recomendacoes||[
    {titulo:'Construir presença no norte do estado.',descricao:'Jair Farias (UB) domina o Bico do Papagaio com ~300 mil eleitores.'},
    {titulo:'Contrabalançar Janad Valcari em Palmas.',descricao:'Com 87K seguidores, ela é a principal adversária digital.'},
    {titulo:'Ser o mais votado dentro do Republicanos.',descricao:'Com 4 concorrentes internos, a vaga depende de superar Fábio Vaz e Lucas Campelo.'},
    {titulo:'Ampliar presença digital em 30–40%.',descricao:'Priorizar Reels e vídeos curtos — amplificam alcance orgânico em 3–5x no Instagram.'},
    {titulo:'Monitorar novos entrantes.',descricao:'Gleydson Nato (PRD), Kátia Chaves e Osires Damaso podem impactar o quociente eleitoral.'},
  ];
  const stats=d?.stats||{ameacas_altas:6,internos:4,saidos:6};
  const MAX=Math.max(...ranking.map(r=>r.seguidores),candidato.seguidores||0,1);

  // ── Insere candidato na posição correta para o ranking visual ────────────
  const rankingWithMe=useMemo(()=>{
    const mePos=ranking.filter(r=>r.seguidores>(candidato.seguidores||0)).length+1;
    const out=[];
    let inserted=false;
    ranking.forEach(r=>{
      if(!inserted&&r.seguidores<=(candidato.seguidores||0)){out.push({...candidato,ranking:'★',isMe:true});inserted=true;}
      out.push(r);
    });
    if(!inserted)out.push({...candidato,ranking:'★',isMe:true});
    return out;
  },[ranking,candidato]);
  return(
  <Card style={{marginTop:32}}>
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:10,cursor:'pointer',marginBottom:open?18:0}} onClick={()=>setOpen(o=>!o)}>
      <div style={{display:'flex',alignItems:'center',gap:12}}>
        <div style={{background:'rgba(26,58,122,0.06)',border:'1px solid rgba(26,58,122,0.12)',borderRadius:12,padding:10}}><Target size={22} style={{color:'#1A3A7A'}}/></div>
        <div>
          <h2 style={{fontSize:22,fontWeight:800,color:'#1A2744',margin:0}}>Inteligência Competitiva — Câmara Federal TO 2026</h2>
          <p style={{fontSize:12,color:'#8c93a8',fontWeight:700,textTransform:'uppercase',letterSpacing:'0.1em',margin:'2px 0 0'}}>8 vagas · 13+ candidatos · Levantamento {d?.data_atualizacao?fmtDt(d.data_atualizacao):'—'}</p>
        </div>
      </div>
      <div style={{display:'flex',alignItems:'center',gap:16}}>
        <div style={{display:'flex',gap:16}}>
          <div style={{textAlign:'center'}}><p style={{fontSize:20,fontWeight:700,color:'#ef4444',margin:0,fontFamily:'var(--font-mono)'}}>{stats.ameacas_altas}</p><p style={{fontSize:11,color:'#8c93a8',margin:0,textTransform:'uppercase',fontWeight:700}}>ameaças altas</p></div>
          <div style={{textAlign:'center'}}><p style={{fontSize:20,fontWeight:800,color:'#8b5cf6',margin:0}}>{stats.internos}</p><p style={{fontSize:11,color:'#8c93a8',margin:0,textTransform:'uppercase',fontWeight:700}}>internos</p></div>
          <div style={{textAlign:'center'}}><p style={{fontSize:20,fontWeight:800,color:'#22c55e',margin:0}}>{stats.saidos}</p><p style={{fontSize:11,color:'#8c93a8',margin:0,textTransform:'uppercase',fontWeight:700}}>saíram</p></div>
        </div>
        {open?<ChevronUp size={18} style={{color:'#8c93a8'}}/>:<ChevronDown size={18} style={{color:'#8c93a8'}}/>}
      </div>
    </div>
    {open&&(
    <div>
      {/* Ranking + Stats */}
      <div style={{display:'grid',gridTemplateColumns:'minmax(0,2fr) minmax(0,1fr)',gap:16,marginBottom:14}}>
        <Card>
          <p style={{fontSize:12,fontWeight:700,textTransform:'uppercase',color:'#8C93A8',letterSpacing:'0.1em',marginBottom:10}}>
            Ranking Instagram — Candidatos à Câmara
            {d?.data_atualizacao&&<span style={{fontWeight:400,color:'#8c93a8',marginLeft:8}}>· {fmtDt(d.data_atualizacao)}</span>}
          </p>
          {rankingWithMe.map((r,i)=>{
            const w=Math.max(4,Math.round((r.seguidores/MAX)*100));
            const nivelDin=r.nivel_ameaca_dinamico||r.nivel_ameaca;
            const tc=THREAT_C[nivelDin]||{bg:'#eee',c:'#888'};
            const barColor=r.isMe?'#1a3a7a':nivelDin==='alta'?'#ef4444':nivelDin==='interno'?'#8b5cf6':nivelDin==='média'?'#f59e0b':'#64748b';
            const baseOrd=NIVEL_ORDER[r.nivel_ameaca]||0;
            const dynOrd=NIVEL_ORDER[nivelDin]||0;
            const trend=!r.isMe&&r.nivel_ameaca!=='interno'&&nivelDin!=='interno'&&baseOrd!==dynOrd?(dynOrd>baseOrd?'↑':'↓'):null;
            const trendC=trend==='↑'?'#ef4444':'#22c55e';
            const scoreC=r.score_ameaca>=70?'#ef4444':r.score_ameaca>=40?'#f59e0b':'#64748b';
            return(
            <div key={i} style={{display:'flex',alignItems:'center',gap:8,marginBottom:r.isMe?0:7,background:r.isMe?'rgba(26,58,122,0.05)':'transparent',borderRadius:r.isMe?6:0,padding:r.isMe?'3px 4px':'0 4px',border:r.isMe?'1px solid rgba(26,58,122,0.15)':'none'}}>
              <span style={{width:20,fontSize:11,fontWeight:700,color:r.isMe?'#d4a017':'#8c93a8',textAlign:'right',flexShrink:0}}>{r.ranking}</span>
              <div style={{width:145,flexShrink:0}}>
                <strong style={{fontSize:12,color:r.isMe?'#1a3a7a':'#1a1d2e',display:'block',lineHeight:1.2}}>{r.nome}</strong>
                <span style={{fontSize:10,color:'#8c93a8'}}>{r.partido}{r.nivel_ameaca==='interno'?'*':''}</span>
              </div>
              <div style={{flex:1,background:'#eef0f6',borderRadius:3,height:16,overflow:'hidden'}}>
                <div style={{width:`${w}%`,height:'100%',background:barColor,borderRadius:3,display:'flex',alignItems:'center',paddingLeft:6,fontSize:10,fontWeight:700,color:'#fff',whiteSpace:'nowrap'}}>{fmtK(r.seguidores)}</div>
              </div>
              <div style={{width:76,textAlign:'right',flexShrink:0}}>
                <div style={{display:'flex',alignItems:'center',justifyContent:'flex-end',gap:3,marginBottom:r.isMe||r.score_ameaca==null?0:2}}>
                  <span style={{fontSize:9,fontWeight:700,padding:'2px 6px',borderRadius:8,background:tc.bg,color:tc.c}}>{nivelDin}</span>
                  {trend&&<span style={{fontSize:10,fontWeight:800,color:trendC,lineHeight:1}}>{trend}</span>}
                </div>
                {!r.isMe&&r.score_ameaca!=null&&(
                  <span style={{fontSize:9,fontWeight:700,color:scoreC}}>{r.score_ameaca}</span>
                )}
              </div>
            </div>);
          })}
          <p style={{fontSize:10,color:'#8c93a8',marginTop:8}}>* Concorrência interna Republicanos</p>
        </Card>
        <div style={{display:'flex',flexDirection:'column',gap:12}}>
          <Card style={{textAlign:'center',background:'linear-gradient(135deg,rgba(26,58,122,0.05),rgba(26,58,122,0.1))'}}>
            <p style={{fontSize:12,fontWeight:700,textTransform:'uppercase',color:'#8C93A8',marginBottom:10,letterSpacing:'0.1em'}}>Posição do Cel. Barbosa</p>
            <p style={{fontSize:52,fontWeight:900,color:'#1A3A7A',margin:0,lineHeight:1}}>{rankingWithMe.findIndex(r=>r.isMe)+1}º</p>
            <p style={{fontSize:12,color:'#8c93a8',marginTop:4}}>no ranking de Instagram<br/>{fmtK(candidato.seguidores)} seguidores</p>
            <div style={{display:'flex',justifyContent:'center',gap:16,marginTop:12}}>
              <div style={{textAlign:'center'}}><p style={{fontSize:18,fontWeight:800,color:'#22c55e',margin:0}}>{ranking.filter(r=>r.seguidores<(candidato.seguidores||0)).length}</p><p style={{fontSize:10,color:'#8c93a8',margin:0}}>à frente</p></div>
              <div style={{textAlign:'center'}}><p style={{fontSize:18,fontWeight:800,color:'#ef4444',margin:0}}>{ranking.filter(r=>r.seguidores>(candidato.seguidores||0)).length}</p><p style={{fontSize:10,color:'#8c93a8',margin:0}}>atrás</p></div>
              <div style={{textAlign:'center'}}><p style={{fontSize:18,fontWeight:800,color:'#8b5cf6',margin:0}}>{stats.internos}</p><p style={{fontSize:10,color:'#8c93a8',margin:0}}>internos</p></div>
            </div>
          </Card>
          <Card>
            <p style={{fontSize:12,fontWeight:700,textTransform:'uppercase',color:'#8C93A8',marginBottom:10,letterSpacing:'0.1em'}}>Vagas x Campo</p>
            {[{l:'Vagas disponíveis',v:d?.vagas||8,c:'#1a1d2e'},{l:'Candidatos relevantes',v:`${ranking.length}+`,c:'#1a1d2e'},{l:'Ameaças externas altas',v:stats.ameacas_altas,c:'#ef4444'},{l:'Concorrência interna Rep.',v:stats.internos,c:'#8b5cf6'},{l:'Saíram para majoritários',v:stats.saidos,c:'#22c55e'}].map((s,i)=>(
              <div key={i} style={{display:'flex',justifyContent:'space-between',marginBottom:6}}><span style={{fontSize:12,color:'#8C93A8'}}>{s.l}</span><strong style={{color:s.c}}>{s.v}</strong></div>
            ))}
            <div style={{background:'rgba(26,58,122,0.05)',borderRadius:8,padding:'8px 10px',marginTop:8}}>
              <p style={{fontSize:11,color:'#8C93A8',lineHeight:1.6,margin:0}}>Meta Republicanos: eleger <strong style={{color:'#1A3A7A'}}>2–3 nomes</strong>. Cel. Barbosa precisa ser o mais votado internamente para garantir a vaga.</p>
            </div>
          </Card>
        </div>
      </div>
      {/* Threats */}
      {threats.length>0&&<>
      <p style={{fontSize:12,fontWeight:700,textTransform:'uppercase',color:'#8C93A8',letterSpacing:'0.1em',marginBottom:10}}>Ameaças externas — nível alto</p>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:10,marginBottom:14}}>
        {threats.map((t,i)=>(
          <div key={i} style={{background:'var(--surface)',border:'1px solid var(--surface-border)',borderTop:'2px solid #ef4444',borderRadius:10,padding:14}}>
            <span style={{fontSize:9,fontWeight:700,padding:'2px 8px',borderRadius:12,background:'rgba(239,68,68,0.1)',color:'#ef4444',border:'1px solid rgba(239,68,68,0.2)',display:'inline-block',marginBottom:8}}>Ameaça Alta</span>
            <p style={{fontSize:13,fontWeight:700,color:'#1A2744',margin:'0 0 2px'}}>{t.nome}</p>
            <p style={{fontSize:10,color:'#8c93a8',margin:'0 0 6px'}}>{t.partido}{t.cargo_label?` · ${t.cargo_label}`:''}</p>
            <p style={{fontSize:11,color:'#1A3A7A',margin:'0 0 6px',fontWeight:600}}>Instagram: {fmtK(t.seguidores)}</p>
            <p style={{fontSize:11,color:'#8C93A8',lineHeight:1.5,margin:0}}>{t.descricao}</p>
          </div>
        ))}
      </div>
      </>}
      {/* Internal + Migrations */}
      <div style={{display:'grid',gridTemplateColumns:'minmax(0,1fr) minmax(0,1fr)',gap:14,marginBottom:14}}>
        <Card style={{borderLeft:'3px solid #8b5cf6'}}>
          <p style={{fontSize:12,fontWeight:700,textTransform:'uppercase',color:'#8C93A8',marginBottom:10,letterSpacing:'0.1em'}}>Concorrência interna — Republicanos</p>
          {internals.map((n,i)=>(
            <div key={i} style={{display:'flex',gap:10,paddingBottom:10,marginBottom:10,borderBottom:i<internals.length-1?'1px solid #eef0f6':'none'}}>
              <div style={{width:8,height:8,borderRadius:4,background:'#8b5cf6',marginTop:5,flexShrink:0}}/>
              <div><strong style={{fontSize:12,color:'#1A2744',display:'block',marginBottom:2}}>{n.nome} — {fmtK(n.seguidores)} IG</strong><p style={{fontSize:11,color:'#8C93A8',lineHeight:1.5,margin:0}}>{n.descricao}</p></div>
            </div>
          ))}
        </Card>
        <Card style={{borderLeft:'3px solid #22c55e'}}>
          <p style={{fontSize:12,fontWeight:700,textTransform:'uppercase',color:'#8C93A8',marginBottom:10,letterSpacing:'0.1em'}}>Saíram da disputa pela Câmara</p>
          {migrations.map((m,i)=>{const dc=DEST_C[m.destino]||'#64748b';return(
            <div key={i} style={{display:'flex',alignItems:'center',gap:10,paddingBottom:10,marginBottom:10,borderBottom:i<migrations.length-1?'1px solid #eef0f6':'none'}}>
              <div style={{width:34,height:34,borderRadius:'50%',background:`${dc}15`,color:dc,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:800,fontSize:12,flexShrink:0}}>{m.abreviacao||m.ab}</div>
              <div style={{flex:1}}><strong style={{fontSize:12,color:'#1A2744',display:'block'}}>{m.nome}</strong><span style={{fontSize:10,color:'#8c93a8'}}>{m.partido} · {m.detalhe||m.detail}</span></div>
              <span style={{fontSize:9,fontWeight:700,padding:'2px 8px',borderRadius:8,background:`${dc}15`,color:dc,flexShrink:0}}>{m.destino||m.dest}</span>
            </div>);})}
        </Card>
      </div>
      {/* Recommendations */}
      <Card style={{borderLeft:'3px solid #d4a017'}}>
        <p style={{fontSize:12,fontWeight:700,textTransform:'uppercase',color:'#8C93A8',marginBottom:10,letterSpacing:'0.1em'}}>Recomendações estratégicas</p>
        {recs.map((r,i)=>(
          <div key={i} style={{display:'flex',gap:12,marginBottom:i<recs.length-1?12:0}}>
            <div style={{width:26,height:26,borderRadius:'50%',background:'#1a3a7a',color:'#d4a017',fontSize:12,fontWeight:800,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,marginTop:1}}>{i+1}</div>
            <p style={{fontSize:14,color:'#8C93A8',lineHeight:1.7,margin:0}}><strong>{r.titulo||r.t}</strong> {r.descricao||r.d}</p>
          </div>
        ))}
      </Card>
    </div>
    )}
  </Card>);
};

/* ═══════════════════════════════════════════════
   MAIN APP
   ═══════════════════════════════════════════════ */
const App=({onLogout, userEmail})=>{
  const[newsRaw,setNewsRaw]=useState(null);
  const[socialData,setSocialData]=useState(null);
  const[sentimentData,setSentimentData]=useState(null);
  const[geoData,setGeoData]=useState(null);
  const[kpiData,setKpiData]=useState(null);
  const[adversariosData,setAdversariosData]=useState(null);
  const[tendenciaData,setTendenciaData]=useState(null);
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

  useEffect(()=>{(async()=>{
    setLoading(true);
    const[m,s,st,g,k,adv,tv]=await Promise.all([fetchJ(URLS.mentions),fetchJ(URLS.social),fetchJ(URLS.sentiment),fetchJ(URLS.geo),fetchJ(URLS.kpis),fetchJ(URLS.adversarios),fetchJ(URLS.tendencia)]);
    if(m)setNewsRaw(m);if(s)setSocialData(s);if(st)setSentimentData(st);if(g)setGeoData(g);if(k)setKpiData(k);if(adv)setAdversariosData(adv);if(tv)setTendenciaData(tv);else console.log('Tendência de voto 2022: dados não disponíveis');
    setLastUpdate(new Date().toLocaleString('pt-BR')+' (auto)');
    setLoading(false);
  })();},[]);

const handleRefresh=useCallback(async()=>{
    setRefreshing(true);
    const[m,s,st,g,k,adv,tv]=await Promise.all([fetchJ(URLS.mentions),fetchJ(URLS.social),fetchJ(URLS.sentiment),fetchJ(URLS.geo),fetchJ(URLS.kpis),fetchJ(URLS.adversarios),fetchJ(URLS.tendencia)]);
    if(m)setNewsRaw(m);if(s)setSocialData(s);if(st)setSentimentData(st);if(g)setGeoData(g);if(k)setKpiData(k);if(adv)setAdversariosData(adv);if(tv)setTendenciaData(tv);
    setLastUpdate(new Date().toLocaleString('pt-BR')+' (manual)');
    setRefreshing(false);
  },[]);

  const handlePwChange=useCallback(async()=>{
    if(pwNew.length<6||pwNew!==pwConfirm)return;
    setPwLoading(true);setPwError('');
    const{error}=await supabase.auth.updateUser({password:pwNew});
    if(error){setPwError(error.message);setPwLoading(false);}
    else{setPwSuccess(true);setPwLoading(false);setTimeout(()=>{setShowPwModal(false);setPwNew('');setPwConfirm('');setPwSuccess(false);},2000);}
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

  {/* ── FIXED HEADER 96px ── */}
  <header style={{position:'fixed',top:0,left:0,right:0,height:96,zIndex:200,background:'#1A2744',borderBottom:'1px solid rgba(255,255,255,0.08)',display:'flex',flexDirection:'column',justifyContent:'center',padding:'8px 16px',boxSizing:'border-box',gap:0}}>
    {/* Linha 1: logo + badge | refresh + avatar */}
    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:12}}>
      <div style={{display:'flex',alignItems:'center',gap:10,flexShrink:0}}>
        {isMobile&&<button onClick={()=>setSidebarOpen(o=>!o)} style={{background:'none',border:'none',cursor:'pointer',padding:6,display:'flex',alignItems:'center',color:'#8C93A8'}}><Menu size={20}/></button>}
        <div style={{background:'#1a3a7a',borderRadius:8,padding:'5px 6px',display:'flex'}}><ShieldAlert size={16} style={{color:'#D4A017'}}/></div>
        <span style={{fontSize:isMobile?12:14,fontWeight:900,color:'#ffffff',letterSpacing:'-0.02em',whiteSpace:'nowrap'}}>MONITOR ELEITORAL</span>
        {!isMobile&&<span style={{padding:'2px 8px',borderRadius:4,fontSize:10,fontWeight:700,background:'rgba(212,160,23,0.15)',color:'#D4A017',border:'1px solid rgba(212,160,23,0.3)',whiteSpace:'nowrap'}}>Campanha 2026</span>}
      </div>
      <div style={{display:'flex',alignItems:'center',gap:8,flexShrink:0}}>
        <button onClick={handleRefresh} disabled={refreshing} style={{display:'flex',alignItems:'center',gap:5,padding:'5px 10px',borderRadius:16,background:'transparent',border:'1px solid rgba(255,255,255,0.1)',color:'#8C93A8',fontSize:11,fontWeight:700,cursor:refreshing?'wait':'pointer',opacity:refreshing?0.6:1,transition:'all 0.18s',whiteSpace:'nowrap'}}>
          <RefreshCw size={11} style={{animation:refreshing?'spin 1s linear infinite':'none'}}/>{!isMobile&&(refreshing?'...':'Atualizar')}
        </button>
        {onLogout&&<div style={{position:'relative',flexShrink:0}}>
          <button onClick={()=>setAvatarOpen(o=>!o)} title={userEmail} style={{width:32,height:32,borderRadius:'50%',background:'#0D1B2A',border:'1px solid rgba(255,255,255,0.12)',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',color:'#D4A017',fontSize:11,fontWeight:800,outline:'none'}}>CB</button>
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
    {/* Linha 2: 4 cards de métricas (desktop only) */}
    {!isMobile&&(
    <div style={{display:'flex',justifyContent:'center',alignItems:'center',gap:32,marginTop:8}}>
      <div style={{textAlign:'center',minWidth:140}}>
        <p style={{fontSize:11,fontWeight:600,textTransform:'uppercase',letterSpacing:'0.1em',color:'rgba(255,255,255,0.5)',margin:'0 0 2px'}}>Engajamento IG</p>
        <div style={{display:'flex',alignItems:'baseline',gap:4,justifyContent:'center'}}>
          <span style={{fontSize:28,fontWeight:800,color:'#fff',lineHeight:1,fontFamily:'var(--font-mono)'}}>{hm.engCand!=null?`${hm.engCand}%`:'—'}</span>
          {hm.engDelta!==null&&<span style={{fontSize:16,fontWeight:700,color:hm.engDelta>0?'#22c55e':hm.engDelta<0?'#ef4444':'rgba(255,255,255,0.35)'}}>{hm.engDelta>0?'▲':hm.engDelta<0?'▼':'—'}</span>}
        </div>
      </div>
      <div style={{width:1,height:40,background:'rgba(255,255,255,0.12)'}}/>
      <div style={{textAlign:'center',minWidth:140}}>
        <p style={{fontSize:11,fontWeight:600,textTransform:'uppercase',letterSpacing:'0.1em',color:'rgba(255,255,255,0.5)',margin:'0 0 2px'}}>Sentimento IG</p>
        <span style={{fontSize:28,fontWeight:800,color:hm.igSentPct==null?'rgba(255,255,255,0.35)':hm.igSentPct>=50?'#22c55e':hm.igSentPct>=30?'#D4A017':'#ef4444',lineHeight:1,fontFamily:'var(--font-mono)'}}>{hm.igSentPct!=null?`${hm.igSentPct}%`:'—'}</span>
      </div>
      <div style={{width:1,height:40,background:'rgba(255,255,255,0.12)'}}/>
      <div style={{textAlign:'center',minWidth:140}}>
        <p style={{fontSize:11,fontWeight:600,textTransform:'uppercase',letterSpacing:'0.1em',color:'rgba(255,255,255,0.5)',margin:'0 0 2px'}}>Alertas</p>
        <span style={{fontSize:28,fontWeight:800,color:hm.alerts>0?'#ef4444':'#22c55e',lineHeight:1,fontFamily:'var(--font-mono)'}}>{hm.alerts}</span>
      </div>
      <div style={{width:1,height:40,background:'rgba(255,255,255,0.12)'}}/>
      <div style={{textAlign:'center',minWidth:140}}>
        <p style={{fontSize:11,fontWeight:600,textTransform:'uppercase',letterSpacing:'0.1em',color:'rgba(255,255,255,0.5)',margin:'0 0 2px'}}>Adversários</p>
        <span style={{fontSize:28,fontWeight:800,color:'rgba(255,255,255,0.65)',lineHeight:1,fontFamily:'var(--font-mono)'}}>{hm.totalAdv||'—'}</span>
      </div>
    </div>
    )}
  </header>

  {/* ── LAYOUT BODY ── */}
  <div style={{display:'flex',paddingTop:96}}>

    {/* Mobile sidebar overlay */}
    {isMobile&&sidebarOpen&&<div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.6)',zIndex:149}} onClick={()=>setSidebarOpen(false)}/>}

    {/* ── SIDEBAR ── */}
    <aside style={{position:'fixed',top:96,left:0,bottom:0,width:isMobile?(sidebarOpen?260:0):isTablet?60:260,background:'#FFFFFF',borderRight:'1px solid rgba(26,39,68,0.08)',display:'flex',flexDirection:'column',overflow:'hidden',transition:'width 0.2s ease',zIndex:150}}>
      {[
        {id:'tendencia',label:'Tendência 2022',icon:TrendingUp,sub:'Bolsonaro × Lula'},
        {id:'adversarios',label:'Inteligência',icon:Target,sub:'17 adversários'},
        {id:'kpis',label:'Metas',icon:BarChart3,sub:'Fase 1 · KPIs'},
        {id:'geo',label:'Eleitoral',icon:MapPin,sub:'139 municípios'},
        {id:'social',label:'Redes Sociais',icon:Users,sub:'18 perfis IG'},
        {id:'imprensa',label:'Imprensa',icon:Newspaper,badge:hm.alerts,sub:'32 fontes'},
      ].map(({id,label,icon:Icon,badge,sub})=>{
        const isAct=activePanel===id;
        const showLabel=!isTablet||isMobile;
        const showSub=!isMobile&&!isTablet;
        return(
          <button key={id}
            onClick={()=>{setActivePanel(id);if(isMobile)setSidebarOpen(false);}}
            onMouseEnter={e=>{if(!isAct)e.currentTarget.style.background='#F5F3EE';}}
            onMouseLeave={e=>{if(!isAct)e.currentTarget.style.background='transparent';}}
            style={{display:'flex',alignItems:'center',gap:12,padding:'16px 18px',
              background:isAct?'rgba(212,160,23,0.08)':'transparent',
              borderLeft:`4px solid ${isAct?'#D4A017':'transparent'}`,
              borderTop:'none',borderRight:'none',borderBottom:'none',
              outline:'none',cursor:'pointer',
              color:isAct?'#1A2744':'#5A6478',
              fontSize:14,fontWeight:isAct?700:500,
              fontFamily:'inherit',
              width:'100%',boxSizing:'border-box',
              transition:'background 0.15s ease',
              whiteSpace:'nowrap',overflow:'hidden',textAlign:'left',
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
      <div style={{marginTop:'auto'}}>
        <div style={{height:1,background:'rgba(26,39,68,0.06)',margin:'0 18px'}}/>
        {!isTablet&&!isMobile&&<p style={{fontSize:10,color:'#8C93A8',margin:'6px 18px 2px',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',fontWeight:500}}>Campanha 2026 · Tocantins</p>}
        <div style={{padding:'8px 18px',borderTop:'1px solid rgba(26,39,68,0.08)'}}>
          <p style={{fontSize:10,color:'rgba(26,39,68,0.3)',margin:0,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{lastUpdate||'Aguardando'}</p>
        </div>
      </div>
    </aside>

    {/* ── CONTENT AREA ── */}
    <main style={{marginLeft:isMobile?0:isTablet?60:260,padding:isMobile?'16px 12px':'24px',flex:1,minWidth:0,transition:'margin-left 0.2s ease',minHeight:'calc(100vh - 96px)'}}>

      <div key={activePanel} className="panel-fade">
      {activePanel==='tendencia'&&<TendenciaVotoPanel tendenciaData={tendenciaData}/>}
      {activePanel==='adversarios'&&<AdversariosPanel adversariosData={adversariosData}/>}
      {activePanel==='kpis'&&<KpiPanel kpiData={kpiData}/>}
      {activePanel==='geo'&&<GeoPanel geoData={geoData}/>}
      {activePanel==='social'&&<SocialPanel socialData={socialData} sentimentData={sentimentData}/>}

      {activePanel==='imprensa'&&(
      <Card>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:10,marginBottom:18}}>
        <div style={{display:'flex',alignItems:'center',gap:12}}>
          <div style={{background:'rgba(185,28,28,0.06)',border:'1px solid rgba(185,28,28,0.12)',borderRadius:12,padding:10}}><Newspaper size={22} style={{color:'#b91c1c'}}/></div>
          <div>
            <h2 style={{fontSize:22,fontWeight:800,color:'#1A2744',margin:0}}>Monitor de imprensa</h2>
            <p style={{fontSize:12,color:'#8c93a8',fontWeight:700,textTransform:'uppercase',letterSpacing:'0.1em',margin:'2px 0 0'}}>
              32 fontes · Tocantins + Brasil · Atualização 2x ao dia
            </p>
          </div>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:16}}>
          <div style={{textAlign:'center'}}><p style={{fontSize:20,fontWeight:700,color:'#ef4444',margin:0,fontFamily:'var(--font-mono)'}}>{totalM.dir}</p><p style={{fontSize:11,color:'#8c93a8',margin:0,textTransform:'uppercase',fontWeight:700}}>diretas</p></div>
          <div style={{textAlign:'center'}}><p style={{fontSize:20,fontWeight:800,color:'#1A3A7A',margin:0}}>{totalM.tot}</p><p style={{fontSize:11,color:'#8c93a8',margin:0,textTransform:'uppercase',fontWeight:700}}>menções</p></div>
        </div>
      </div>

      {/* METRICS */}
      <div style={{display:'flex',gap:8,marginBottom:16,flexWrap:'wrap'}}>
        <Met icon={User} label="Diretas" value={filtM.dir} sub="Cel. Barbosa" accent="#ef4444"/>
        <Met icon={Bookmark} label="Eleitorais" value={filtM.ele} sub="2026" accent="#6366f1"/>
        <Met icon={Building} label="PMTO" value={filtM.ins} accent="#f59e0b"/>
        <Met icon={Globe} label="Nacional" value={filtM.nac} sub="BR" accent="#3b82f6"/>
        <Met icon={MapPin} label="Local" value={filtM.loc} sub="TO" accent="#22c55e"/>
        <Met icon={Newspaper} label="Fontes" value={filtM.src} accent="#64748b"/>
      </div>

      {/* RELEVANCE FILTER */}
      <div style={{display:'flex',gap:6,marginBottom:10,flexWrap:'wrap',alignItems:'center'}}>
        <span style={{fontSize:11,fontWeight:700,color:'#8C93A8',textTransform:'uppercase',marginRight:4}}>Relevância:</span>
        {[{id:'direct',l:'Diretas ao candidato',color:'#b91c1c'},{id:'relevant',l:'Relevantes (≥0.5)',color:'#1A3A7A'},{id:'all',l:'Todas (incl. PMTO genéricas)',color:'#8c93a8'}].map(r=>
          <Bt key={r.id} active={filterRelevance===r.id} color={r.color} onClick={()=>setFilterRelevance(r.id)}>{r.l}</Bt>
        )}
      </div>

      {/* TYPE/SCOPE FILTERS */}
      <div style={{display:'flex',gap:6,marginBottom:10,flexWrap:'wrap'}}>
        {[{id:'all',l:'Todas'},{id:'direta',l:'● Diretas'},{id:'eleitoral',l:'◆ Eleitorais'},{id:'institucional',l:'○ PMTO'}].map(t=><Bt key={t.id} active={filterType===t.id} color="#1a3a7a" onClick={()=>setFilterType(t.id)}>{t.l}</Bt>)}
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

      {/* COUNT */}
      <div style={{fontSize:13,color:'#8c93a8',marginBottom:12,display:'flex',gap:16}}>
        <span>{filteredNews.length} menção(ões) {filterType!=='all'||filterScope!=='all'||selectedCluster!=='all'?'filtradas':'no total'}</span>
        {(filterType!=='all'||filterScope!=='all'||selectedCluster!=='all')&&<span style={{color:'#b91c1c'}}>Toxicidade: {filtM.tox}%</span>}
      </div>

      {/* FEED */}
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
        <input
          type="password" placeholder="Nova senha" minLength={6}
          value={pwNew} onChange={e=>{setPwNew(e.target.value);setPwError('');}}
          style={{border:`1px solid ${pwNew&&pwConfirm&&pwNew!==pwConfirm?'#B91C1C':'rgba(26,39,68,0.15)'}`,borderRadius:8,padding:12,fontSize:14,outline:'none',fontFamily:'inherit',transition:'border-color 0.15s',width:'100%',boxSizing:'border-box'}}
          onFocus={e=>e.target.style.borderColor='#D4A017'}
          onBlur={e=>e.target.style.borderColor=pwNew&&pwConfirm&&pwNew!==pwConfirm?'#B91C1C':'rgba(26,39,68,0.15)'}
        />
        <input
          type="password" placeholder="Confirmar senha"
          value={pwConfirm} onChange={e=>{setPwConfirm(e.target.value);setPwError('');}}
          style={{border:`1px solid ${pwNew&&pwConfirm&&pwNew!==pwConfirm?'#B91C1C':'rgba(26,39,68,0.15)'}`,borderRadius:8,padding:12,fontSize:14,outline:'none',fontFamily:'inherit',transition:'border-color 0.15s',width:'100%',boxSizing:'border-box'}}
          onFocus={e=>e.target.style.borderColor='#D4A017'}
          onBlur={e=>e.target.style.borderColor=pwNew&&pwConfirm&&pwNew!==pwConfirm?'#B91C1C':'rgba(26,39,68,0.15)'}
        />
        {pwNew&&pwConfirm&&pwNew!==pwConfirm&&<p style={{fontSize:12,color:'#B91C1C',margin:0}}>As senhas não coincidem.</p>}
        {pwError&&<p style={{fontSize:12,color:'#B91C1C',margin:0}}>{pwError}</p>}
        {pwSuccess&&<p style={{fontSize:12,color:'#15803D',margin:0,fontWeight:600}}>Senha alterada com sucesso!</p>}
        <div style={{display:'flex',gap:8,marginTop:4}}>
          <button
            onClick={handlePwChange}
            disabled={pwLoading||pwNew.length<6||pwNew!==pwConfirm}
            style={{flex:1,background:'#1A2744',color:'#FFFFFF',border:'none',borderRadius:8,padding:'12px 24px',fontSize:14,fontWeight:700,cursor:pwLoading||pwNew.length<6||pwNew!==pwConfirm?'not-allowed':'pointer',opacity:pwLoading||pwNew.length<6||pwNew!==pwConfirm?0.5:1,fontFamily:'inherit'}}
          >{pwLoading?'Salvando...':'Salvar'}</button>
          <button
            onClick={()=>{setShowPwModal(false);setPwNew('');setPwConfirm('');setPwError('');setPwSuccess(false);}}
            style={{padding:'12px 16px',background:'transparent',border:'none',color:'#5A6478',fontSize:14,cursor:'pointer',fontFamily:'inherit'}}
          >Cancelar</button>
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
  const [session,     setSession]     = useState(undefined); // undefined = carregando
  const [authorized,  setAuthorized]  = useState(null);      // null = verificando
  const [authChecked, setAuthChecked] = useState(false);

  // Escuta mudanças de sessão
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session) { setAuthorized(null); setAuthChecked(false); }
    });
    return () => subscription.unsubscribe();
  }, []);

  // Verifica se e-mail está na tabela allowed_users
  useEffect(() => {
    if (!session?.user?.email) return;
    setAuthChecked(false);
    supabase
      .from(ALLOWED_CHECK_TABLE)
      .select('email')
      .eq('email', session.user.email)
      .maybeSingle()
      .then(({ data }) => {
        setAuthorized(!!data);
        setAuthChecked(true);
      });
  }, [session]);

  const handleLogout = () => supabase.auth.signOut();

  // Carregando sessão inicial
  if (session === undefined) {
    return (
      <div style={{minHeight:'100vh',background:'#1a3a7a',display:'flex',alignItems:'center',justifyContent:'center'}}>
        <div style={{width:40,height:40,border:'3px solid rgba(212,160,23,0.2)',borderTop:'3px solid #d4a017',borderRadius:'50%',animation:'spin 0.8s linear infinite'}}/>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  // Não logado
  if (!session) return <LoginScreen />;

  // Logado mas ainda verificando autorização
  if (!authChecked) {
    return (
      <div style={{minHeight:'100vh',background:'#1a3a7a',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:12,fontFamily:"'DM Sans',sans-serif"}}>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <div style={{width:40,height:40,border:'3px solid rgba(212,160,23,0.2)',borderTop:'3px solid #d4a017',borderRadius:'50%',animation:'spin 0.8s linear infinite'}}/>
        <p style={{color:'rgba(255,255,255,0.4)',fontSize:12,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.15em',margin:0}}>Verificando acesso...</p>
      </div>
    );
  }

  // Logado mas não autorizado
  if (!authorized) {
    return (
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
  }

  // Autorizado — renderiza dashboard com botão de logout no header
  return <App onLogout={handleLogout} userEmail={session.user.email} />;
}

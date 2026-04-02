import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  ShieldAlert, TrendingDown, AlertTriangle, Eye, Calendar,
  ChevronDown, ChevronUp, Newspaper, Target, Radio, Clock,
  Hash, ArrowUpRight, BrainCircuit, Layers, Upload, RefreshCw,
  Database, User, Building, Globe, MapPin, Bookmark, Trash2,
  BarChart3, TrendingUp, Heart, MessageCircle, Users
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, LineChart, Line, Legend } from 'recharts';

const BASE = 'https://raw.githubusercontent.com/salescampelo/monitor-pmto/main/data';
const URLS = { mentions: `${BASE}/mention_history.json`, social: `${BASE}/social_metrics.json`, sentiment: `${BASE}/social_sentiment.json`, geo: `${BASE}/geo_electoral.json` };
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
const PW=['homenage','conquista','reconhec','entrega','inaugur','capacita','formatur','solidariedade','integração','mediação','redução','queda','valorização'];

const classify = a => {
  const t=(a.title+' '+(a.snippet||'')+' '+(a.matched_terms||[]).join(' ')).toLowerCase();
  let cl='Geral';
  for(const r of CL_RULES){if(r.kw.some(k=>t.includes(k))){cl=r.id;break;}}
  const ng=NW.filter(w=>t.includes(w)).length, ps=PW.filter(w=>t.includes(w)).length;
  let sc=Math.max(0.05,Math.min(0.95,0.5+ps*0.12-ng*0.13));
  let sn='Neutro';if(sc<=0.2)sn='Muito Negativo';else if(sc<=0.4)sn='Negativo';else if(sc>=0.7)sn='Positivo';
  let imp='Médio';if(a.mention_type==='direta'||a.mention_type==='eleitoral')imp='Alto';else if(a.scope==='BR')imp='Alto';else if(a.priority==='complementar'&&ng===0)imp='Baixo';
  return{id:a.hash_id||Math.random().toString(36).substr(2,9),date:a.detected_at?a.detected_at.split(' ')[0]:'',source:a.source_name||'?',title:a.title,sentiment:sn,score:Math.round(sc*100)/100,cluster:cl,impact:imp,keywords:a.matched_terms||[],url:a.url,mentionType:a.mention_type||'institucional',scope:a.scope||'TO',analysisNote:`[${(a.scope||'TO')==='BR'?'NACIONAL':'LOCAL'}] ${a.mention_type||'institucional'} via ${a.source_name}. Termos: ${(a.matched_terms||[]).join(', ')}.`};
};

/* ── HELPERS ── */
const CLUSTERS=[{id:'all',label:'Todas',icon:Layers,color:'#64748b'},{id:'Eleitoral',label:'Eleitoral',icon:Bookmark,color:'#6366f1'},{id:'Comando',label:'Comando',icon:User,color:'#8b5cf6'},{id:'Letalidade',label:'Letalidade',icon:AlertTriangle,color:'#ef4444'},{id:'Operações',label:'Operações',icon:Target,color:'#3b82f6'},{id:'Gestão',label:'Gestão',icon:Building,color:'#f59e0b'},{id:'Imprensa',label:'Imprensa',icon:Radio,color:'#ec4899'},{id:'Geral',label:'Geral',icon:Newspaper,color:'#64748b'}];
const sC=s=>{if(s<=0.2)return{t:'#ef4444',b:'rgba(239,68,68,0.1)'};if(s<=0.4)return{t:'#f59e0b',b:'rgba(245,158,11,0.1)'};if(s<=0.6)return{t:'#64748b',b:'rgba(100,116,139,0.1)'};return{t:'#22c55e',b:'rgba(34,197,94,0.1)'};};
const iC=i=>({Alto:'#ef4444',Médio:'#f59e0b',Baixo:'#22c55e'}[i]||'#f59e0b');
const fmt=d=>{if(!d)return'—';const x=new Date(d+'T12:00:00');return x.toLocaleDateString('pt-BR',{day:'2-digit',month:'short',year:'numeric'});};
const metrics=data=>{if(!data.length)return{tox:'0.0',tot:0,dir:0,ins:0,ele:0,nac:0,loc:0,src:0};const a=data.reduce((s,n)=>s+n.score,0)/data.length;return{tox:((1-a)*100).toFixed(1),tot:data.length,dir:data.filter(n=>n.mentionType==='direta').length,ins:data.filter(n=>n.mentionType==='institucional').length,ele:data.filter(n=>n.mentionType==='eleitoral').length,nac:data.filter(n=>n.scope==='BR').length,loc:data.filter(n=>n.scope==='TO').length,src:[...new Set(data.map(n=>n.source))].length};};

/* ── COMPONENTS ── */
const Card=({children,style})=><div style={{background:'rgba(15,23,42,0.6)',border:'1px solid rgba(51,65,85,0.5)',borderRadius:16,padding:'14px 18px',...style}}>{children}</div>;
const Met=({icon:I,label,value,sub,accent})=><Card style={{flex:1,minWidth:110}}><div style={{display:'flex',alignItems:'center',gap:5,marginBottom:8}}><I size={12} style={{color:accent}}/><span style={{fontSize:9,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.08em',color:'#64748b'}}>{label}</span></div><p style={{fontSize:24,fontWeight:800,color:accent,margin:0,lineHeight:1}}>{value}</p>{sub&&<p style={{fontSize:10,color:'#475569',marginTop:4}}>{sub}</p>}</Card>;
const Bd=({children,color,bg})=><span style={{padding:'3px 8px',borderRadius:6,fontSize:9,fontWeight:700,background:bg||`${color}20`,color}}>{children}</span>;
const Bt=({active,color,onClick,children})=><button onClick={onClick} style={{display:'flex',alignItems:'center',gap:4,padding:'6px 12px',borderRadius:10,fontSize:11,fontWeight:700,border:active?`1px solid ${color}`:'1px solid rgba(51,65,85,0.4)',background:active?`${color}15`:'rgba(15,23,42,0.4)',color:active?color:'#64748b',cursor:'pointer'}}>{children}</button>;

/* ── NEWS CARD ── */
const NC=({item,expanded,onToggle})=>{const sc=sC(item.score);const cl=CLUSTERS.find(c=>c.id===item.cluster);return(
<div style={{background:'rgba(15,23,42,0.6)',border:'1px solid rgba(51,65,85,0.4)',borderRadius:16,borderLeft:`3px solid ${cl?.color||'#64748b'}`,padding:'16px 20px'}}>
<div style={{display:'flex',justifyContent:'space-between',flexWrap:'wrap',gap:6,marginBottom:8}}>
<div style={{display:'flex',alignItems:'center',gap:6,flexWrap:'wrap'}}>
<Bd color={item.mentionType==='direta'?'#ef4444':'#94a3b8'}>{item.mentionType==='direta'?'● DIRETA':'○ INSTITUCIONAL'}</Bd>
<Bd color={item.scope==='BR'?'#818cf8':'#4ade80'}>{item.scope==='BR'?'NACIONAL':'TOCANTINS'}</Bd>
<span style={{fontSize:11,color:'#475569'}}>{item.source} · {fmt(item.date)}</span>
</div>
<div style={{display:'flex',gap:4}}><Bd color={sc.t}>{item.sentiment}</Bd><Bd color={iC(item.impact)}>{item.impact}</Bd></div>
</div>
<h4 style={{fontSize:14,fontWeight:700,color:'#e2e8f0',margin:'0 0 6px',lineHeight:1.4}}>{item.title}</h4>
{item.keywords.length>0&&<div style={{display:'flex',gap:4,flexWrap:'wrap',marginBottom:10}}>{item.keywords.slice(0,6).map(k=><span key={k} style={{fontSize:10,fontFamily:'monospace',color:'#475569'}}>#{k}</span>)}</div>}
<div style={{borderTop:'1px solid rgba(51,65,85,0.3)',paddingTop:8,display:'flex',justifyContent:'space-between'}}>
<button onClick={onToggle} style={{background:'none',border:'none',color:'#8b5cf6',fontSize:11,fontWeight:700,cursor:'pointer',display:'flex',alignItems:'center',gap:4}}><BrainCircuit size={12}/>{expanded?'Ocultar':'Análise'}{expanded?<ChevronUp size={12}/>:<ChevronDown size={12}/>}</button>
<a href={item.url} target="_blank" rel="noopener noreferrer" style={{color:'#475569',fontSize:11,textDecoration:'none',fontWeight:600,display:'flex',alignItems:'center',gap:3}}>Fonte <ArrowUpRight size={11}/></a>
</div>
{expanded&&<div style={{marginTop:10,padding:12,background:'rgba(139,92,246,0.05)',border:'1px solid rgba(139,92,246,0.15)',borderRadius:10}}><p style={{fontSize:12,color:'#c4b5fd',lineHeight:1.6,margin:0}}>{item.analysisNote}</p></div>}
</div>);};

/* ═══════════════════════════════════════════════
   SOCIAL MEDIA PANEL (M2)
   ═══════════════════════════════════════════════ */
const DCOL={positivo:'#22c55e',negativo:'#ef4444',neutro:'#64748b'};

const SocialPanel=({socialData,sentimentData})=>{
  const profiles=useMemo(()=>{
    if(!socialData||!Array.isArray(socialData))return[];
    return socialData.filter(p=>p.seguidores>0).sort((a,b)=>b.seguidores-a.seguidores);
  },[socialData]);
  const cand=profiles.find(p=>p.username==='marciobarbosa_cel');
  const rank=useMemo(()=>profiles.map((p,i)=>({...p,rank:i+1})),[profiles]);
  const candRank=rank.findIndex(p=>p.username==='marciobarbosa_cel')+1;
  const donut=useMemo(()=>{
    if(!sentimentData?.sentiment)return[];
    const s=sentimentData.sentiment;
    return[{name:'Positivo',value:s.positivo||0,color:DCOL.positivo},{name:'Negativo',value:s.negativo||0,color:DCOL.negativo},{name:'Neutro',value:s.neutro||0,color:DCOL.neutro}].filter(d=>d.value>0);
  },[sentimentData]);
  const engChart=useMemo(()=>[...profiles].sort((a,b)=>b.taxa_engajamento_pct-a.taxa_engajamento_pct).slice(0,10).map(p=>{
    const isCand = p.username==='marciobarbosa_cel';
    let color = p.taxa_engajamento_pct>=3?'#22c55e':p.taxa_engajamento_pct>=1.5?'#f59e0b':'#ef4444';
    if(isCand) color='#8b5cf6';
    return{name:'@'+p.username.substring(0,18),eng:p.taxa_engajamento_pct,fill:color,label:`${p.taxa_engajamento_pct}%`};
  }),[profiles]);

  if(!profiles.length)return null;
  return(
  <div style={{marginTop:32}}>
    <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:18}}>
      <div style={{background:'rgba(139,92,246,0.1)',border:'1px solid rgba(139,92,246,0.2)',borderRadius:12,padding:10}}>
        <Users size={22} style={{color:'#8b5cf6'}}/>
      </div>
      <div>
        <h2 style={{fontSize:18,fontWeight:800,color:'#f1f5f9',margin:0}}>Monitor de redes sociais</h2>
        <p style={{fontSize:10,color:'#475569',fontWeight:700,textTransform:'uppercase',letterSpacing:'0.1em',margin:'2px 0 0'}}>{profiles.length} perfis · Instagram · {sentimentData?.data_coleta||profiles[0]?.data_coleta||''}</p>
      </div>
    </div>

    {cand&&<Card style={{marginBottom:14,borderLeft:'3px solid #8b5cf6'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:12}}>
        <div>
          <p style={{fontSize:10,color:'#8b5cf6',fontWeight:700,textTransform:'uppercase',margin:'0 0 4px'}}>Cel. Barbosa @{cand.username}</p>
          <div style={{display:'flex',gap:24,flexWrap:'wrap'}}>
            <div><p style={{fontSize:22,fontWeight:800,color:'#f1f5f9',margin:0}}>{cand.seguidores.toLocaleString('pt-BR')}</p><p style={{fontSize:10,color:'#475569',margin:0}}>seguidores</p></div>
            <div><p style={{fontSize:22,fontWeight:800,color:'#8b5cf6',margin:0}}>{cand.taxa_engajamento_pct}%</p><p style={{fontSize:10,color:'#475569',margin:0}}>engajamento</p></div>
            <div><p style={{fontSize:22,fontWeight:800,color:'#f59e0b',margin:0}}>{cand.media_likes_recentes}</p><p style={{fontSize:10,color:'#475569',margin:0}}>likes/post</p></div>
            <div><p style={{fontSize:22,fontWeight:800,color:'#22c55e',margin:0}}>#{candRank}</p><p style={{fontSize:10,color:'#475569',margin:0}}>no ranking</p></div>
          </div>
        </div>
      </div>
    </Card>}

    <div style={{display:'grid',gridTemplateColumns:'minmax(0,1fr) minmax(0,2.5fr)',gap:12,marginBottom:14}}>
      {/* Donut sentimento */}
      <Card>
        <p style={{fontSize:10,fontWeight:700,textTransform:'uppercase',color:'#64748b',marginBottom:8}}>Sentimento dos comentários</p>
        {donut.length>0?(
          <>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart><Pie data={donut} cx="50%" cy="50%" innerRadius={40} outerRadius={65} dataKey="value" stroke="none">{donut.map((d,i)=><Cell key={i} fill={d.color}/>)}</Pie></PieChart>
          </ResponsiveContainer>
          <div style={{display:'flex',justifyContent:'center',gap:12,marginTop:4}}>
            {donut.map(d=><div key={d.name} style={{display:'flex',alignItems:'center',gap:4}}><div style={{width:8,height:8,borderRadius:2,background:d.color}}/><span style={{fontSize:10,color:'#94a3b8'}}>{d.name} {d.value}</span></div>)}
          </div>
          </>
        ):(
          <div style={{height:160,display:'flex',alignItems:'center',justifyContent:'center'}}>
            <p style={{fontSize:11,color:'#475569',textAlign:'center',lineHeight:1.6}}>Execute<br/><code style={{fontSize:10,background:'rgba(139,92,246,0.1)',padding:'2px 6px',borderRadius:4,color:'#a78bfa'}}>python instagram_monitor.py</code><br/>para gerar dados de sentimento</p>
          </div>
        )}
      </Card>

      {/* Ranking unificado: seguidores + engajamento + tendência */}
      <Card>
        <p style={{fontSize:10,fontWeight:700,textTransform:'uppercase',color:'#64748b',marginBottom:8}}>Ranking completo — seguidores e engajamento</p>
        <div style={{maxHeight:360,overflowY:'auto'}}>
          {/* Header */}
          <div style={{display:'grid',gridTemplateColumns:'28px 1fr 90px 90px 40px',gap:4,padding:'4px 4px 6px',borderBottom:'1px solid rgba(51,65,85,0.4)'}}>
            <span style={{fontSize:9,color:'#475569',fontWeight:700}}>#</span>
            <span style={{fontSize:9,color:'#475569',fontWeight:700}}>PERFIL</span>
            <span style={{fontSize:9,color:'#475569',fontWeight:700,textAlign:'right'}}>SEGUIDORES</span>
            <span style={{fontSize:9,color:'#475569',fontWeight:700,textAlign:'right'}}>ENGAJAMENTO</span>
            <span style={{fontSize:9,color:'#475569',fontWeight:700,textAlign:'center'}}>TEND.</span>
          </div>
          {/* Rows */}
          {rank.map(p=>{
            const isCand = p.username==='marciobarbosa_cel';
            // Trend: compare with previous week data (same username, earlier date)
            const prevData = profiles.length > 0 ? null : null; // Will work when historical data exists
            // For now, check if socialData has multiple entries for same username
            const allEntries = (socialData||[]).filter(x=>x.username===p.username).sort((a,b)=>(a.data_coleta||'').localeCompare(b.data_coleta||''));
            const prev = allEntries.length >= 2 ? allEntries[allEntries.length-2] : null;
            const curr = allEntries[allEntries.length-1];
            let trendColor = '#475569'; // cinza = sem dados
            let trendIcon = '→';
            if(prev && curr){
              const diff = curr.taxa_engajamento_pct - prev.taxa_engajamento_pct;
              if(diff > 0.1){trendColor='#22c55e';trendIcon='↑';}
              else if(diff < -0.1){trendColor='#ef4444';trendIcon='↓';}
              else{trendColor='#64748b';trendIcon='→';}
            }
            return(
            <div key={p.username} style={{display:'grid',gridTemplateColumns:'28px 1fr 90px 90px 40px',gap:4,padding:'5px 4px',borderBottom:'1px solid rgba(51,65,85,0.15)',background:isCand?'rgba(139,92,246,0.08)':'transparent',borderRadius:isCand?6:0}}>
              <span style={{fontSize:10,fontWeight:700,color:'#475569'}}>#{p.rank}</span>
              <span style={{fontSize:11,color:isCand?'#a78bfa':'#cbd5e1',fontWeight:isCand?700:400,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>@{p.username}</span>
              <span style={{fontSize:11,fontWeight:600,color:'#94a3b8',textAlign:'right',fontVariantNumeric:'tabular-nums'}}>{p.seguidores.toLocaleString('pt-BR')}</span>
              <span style={{fontSize:11,fontWeight:700,color:p.taxa_engajamento_pct>=3?'#22c55e':p.taxa_engajamento_pct>=1.5?'#f59e0b':'#ef4444',textAlign:'right',fontVariantNumeric:'tabular-nums'}}>{p.taxa_engajamento_pct}%</span>
              <span style={{fontSize:13,fontWeight:700,color:trendColor,textAlign:'center'}}>{trendIcon}</span>
            </div>);
          })}
        </div>
        <div style={{display:'flex',gap:12,marginTop:8,paddingTop:6,borderTop:'1px solid rgba(51,65,85,0.2)'}}>
          <span style={{fontSize:9,color:'#475569'}}>Engajamento:</span>
          <span style={{fontSize:9,color:'#22c55e'}}>■ alto (3%+)</span>
          <span style={{fontSize:9,color:'#f59e0b'}}>■ médio (1.5-3%)</span>
          <span style={{fontSize:9,color:'#ef4444'}}>■ baixo (&lt;1.5%)</span>
          <span style={{fontSize:9,color:'#475569',marginLeft:8}}>Tendência:</span>
          <span style={{fontSize:9,color:'#22c55e'}}>↑ crescente</span>
          <span style={{fontSize:9,color:'#64748b'}}>→ estável</span>
          <span style={{fontSize:9,color:'#ef4444'}}>↓ queda</span>
        </div>
      </Card>
    </div>

    {/* Top 10 engajamento (bar chart) */}
    <Card style={{marginBottom:14}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
        <p style={{fontSize:10,fontWeight:700,textTransform:'uppercase',color:'#64748b',margin:0}}>Top 10 — taxa de engajamento (%)</p>
        <div style={{display:'flex',gap:10}}>
          <span style={{fontSize:9,color:'#22c55e'}}>■ alto (3%+)</span>
          <span style={{fontSize:9,color:'#f59e0b'}}>■ médio</span>
          <span style={{fontSize:9,color:'#ef4444'}}>■ baixo</span>
          <span style={{fontSize:9,color:'#8b5cf6'}}>■ candidato</span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={engChart} layout="vertical" margin={{left:0,right:50}}>
          <XAxis type="number" tick={{fontSize:10,fill:'#475569'}} axisLine={false} tickLine={false} domain={[0,'auto']}/>
          <YAxis type="category" dataKey="name" tick={{fontSize:11,fill:'#94a3b8',fontWeight:500}} width={150} axisLine={false} tickLine={false}/>
          <Tooltip contentStyle={{background:'#1e293b',border:'1px solid #334155',borderRadius:8,fontSize:12,color:'#e2e8f0'}} formatter={v=>[`${v}%`,'Engajamento']} cursor={{fill:'rgba(139,92,246,0.05)'}}/>
          <Bar dataKey="eng" radius={[0,6,6,0]} barSize={20} label={{position:'right',fill:'#94a3b8',fontSize:11,fontWeight:600,formatter:v=>`${v}%`}}>
            {engChart.map((d,i)=><Cell key={i} fill={d.fill} fillOpacity={0.85}/>)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Card>

    {/* Evolução temporal de seguidores */}
    {(()=>{
      // Build time series: group socialData by date, pick top profiles
      const allDates = [...new Set((socialData||[]).map(x=>x.data_coleta))].sort();
      if(allDates.length < 2) return (
        <Card style={{marginBottom:14}}>
          <p style={{fontSize:10,fontWeight:700,textTransform:'uppercase',color:'#64748b',marginBottom:8}}>Evolução de seguidores (série temporal)</p>
          <div style={{padding:'20px 0',textAlign:'center'}}>
            <p style={{fontSize:12,color:'#475569'}}>Disponível a partir da 2a coleta semanal. Dados atuais: {allDates.length} coleta(s).</p>
            <p style={{fontSize:11,color:'#64748b',marginTop:4}}>O Task Scheduler roda semanalmente — o gráfico será preenchido automaticamente.</p>
          </div>
        </Card>
      );
      // Top 6 profiles by latest followers + always include candidate
      const latestDate = allDates[allDates.length-1];
      const latestProfiles = (socialData||[]).filter(x=>x.data_coleta===latestDate&&x.seguidores>0).sort((a,b)=>b.seguidores-a.seguidores);
      const topUsernames = [...new Set(['marciobarbosa_cel',...latestProfiles.slice(0,5).map(x=>x.username)])].slice(0,6);
      const COLORS_LINE = ['#8b5cf6','#22c55e','#3b82f6','#f59e0b','#ef4444','#ec4899'];
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
        <p style={{fontSize:10,fontWeight:700,textTransform:'uppercase',color:'#64748b',marginBottom:8}}>Evolução de seguidores (série temporal)</p>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={chartData} margin={{left:0,right:8,top:5}}>
            <XAxis dataKey="date" tick={{fontSize:10,fill:'#475569'}} axisLine={false} tickLine={false}/>
            <YAxis tick={{fontSize:10,fill:'#475569'}} axisLine={false} tickLine={false} tickFormatter={v=>v>=1000?`${(v/1000).toFixed(0)}K`:v}/>
            <Tooltip contentStyle={{background:'#1e293b',border:'1px solid #334155',borderRadius:8,fontSize:11,color:'#e2e8f0'}} formatter={(v,name)=>[v?.toLocaleString('pt-BR'),`@${name}`]}/>
            <Legend wrapperStyle={{fontSize:10,color:'#64748b'}} formatter={v=>`@${v}`}/>
            {topUsernames.map((u,i)=>(
              <Line key={u} type="monotone" dataKey={u} stroke={COLORS_LINE[i%6]} strokeWidth={u==='marciobarbosa_cel'?3:1.5} dot={{r:u==='marciobarbosa_cel'?4:2}} connectNulls/>
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
        <p style={{fontSize:10,fontWeight:700,textTransform:'uppercase',color:'#64748b',marginBottom:12}}>Nuvem de palavras — comentários do candidato</p>
        <div style={{display:'flex',flexWrap:'wrap',gap:'6px 10px',justifyContent:'center',padding:'8px 0',minHeight:80}}>
          {sorted.map(([word,count])=>{
            const ratio = count/maxCount;
            const size = Math.max(11,Math.round(11+ratio*22));
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
          <span style={{fontSize:9,color:'#22c55e'}}>■ positivo</span>
          <span style={{fontSize:9,color:'#94a3b8'}}>■ neutro</span>
          <span style={{fontSize:9,color:'#ef4444'}}>■ negativo</span>
          <span style={{fontSize:9,color:'#475569'}}>(tamanho = frequência)</span>
        </div>
      </Card>);
    })()}

    {/* Insights */}
    <Card style={{borderLeft:'3px solid #22c55e'}}>
      <p style={{fontSize:10,fontWeight:700,textTransform:'uppercase',color:'#22c55e',marginBottom:6}}>Insights para a campanha</p>
      <div style={{fontSize:12,color:'#94a3b8',lineHeight:1.7}}>
        {cand&&<p style={{margin:'0 0 4px'}}>Cel. Barbosa: #{candRank} em seguidores ({cand.seguidores.toLocaleString('pt-BR')}) com engajamento de {cand.taxa_engajamento_pct}% — {cand.taxa_engajamento_pct>1.5?'acima da média de políticos brasileiros (~1%)':'dentro da média'}.</p>}
        {cand&&<p style={{margin:'0 0 4px'}}>Média de {cand.media_likes_recentes} likes/post. Investir em Reels e vídeos curtos tende a amplificar o alcance orgânico em 3-5x no Instagram.</p>}
        {sentimentData?.sentiment?.total>0&&<p style={{margin:0}}>Análise de {sentimentData.sentiment.total} comentários: {sentimentData.sentiment.pct_positivo}% positivos, {sentimentData.sentiment.pct_negativo}% negativos. {sentimentData.sentiment.pct_positivo>50?'Percepção pública favorável — explorar UGC e depoimentos.':'Monitorar narrativas negativas e preparar contra-narrativas.'}</p>}
        {!sentimentData?.sentiment?.total&&<p style={{margin:0}}>Execute o scraper de comentários para gerar a análise de sentimento do público nas redes.</p>}
      </div>
    </Card>
  </div>);
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
  const[selectedMun,setSelectedMun]=useState(null);
  const[catFilter,setCatFilter]=useState('all');

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
  <div style={{marginTop:32}}>
    <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:18}}>
      <div style={{background:'rgba(34,197,94,0.1)',border:'1px solid rgba(34,197,94,0.2)',borderRadius:12,padding:10}}>
        <MapPin size={22} style={{color:'#22c55e'}}/>
      </div>
      <div>
        <h2 style={{fontSize:18,fontWeight:800,color:'#f1f5f9',margin:0}}>Inteligência eleitoral — Tocantins</h2>
        <p style={{fontSize:10,color:'#475569',fontWeight:700,textTransform:'uppercase',letterSpacing:'0.1em',margin:'2px 0 0'}}>
          {summary.total_municipios||0} municípios · TSE 2022 + IBGE · Dep. Federal
        </p>
      </div>
    </div>

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

    <div style={{display:'grid',gridTemplateColumns:'minmax(0,1.8fr) minmax(0,1.2fr)',gap:12,marginBottom:14}}>
      {/* Ranking table */}
      <Card>
        <p style={{fontSize:10,fontWeight:700,textTransform:'uppercase',color:'#64748b',marginBottom:8}}>
          Ranking por potencial — {municipios.length} municípios
        </p>
        <div style={{maxHeight:400,overflowY:'auto'}}>
          <div style={{display:'grid',gridTemplateColumns:'32px 1fr 70px 70px 60px 90px',gap:4,padding:'4px 4px 6px',borderBottom:'1px solid rgba(51,65,85,0.4)'}}>
            <span style={{fontSize:9,color:'#475569',fontWeight:700}}>#</span>
            <span style={{fontSize:9,color:'#475569',fontWeight:700}}>MUNICÍPIO</span>
            <span style={{fontSize:9,color:'#475569',fontWeight:700,textAlign:'right'}}>ELEITORADO</span>
            <span style={{fontSize:9,color:'#475569',fontWeight:700,textAlign:'right'}}>VOTOS REP</span>
            <span style={{fontSize:9,color:'#475569',fontWeight:700,textAlign:'right'}}>SCORE</span>
            <span style={{fontSize:9,color:'#475569',fontWeight:700,textAlign:'center'}}>CATEGORIA</span>
          </div>
          {municipios.map(m=>(
            <div key={m.municipio_upper} onClick={()=>setSelectedMun(selectedMun===m.municipio_upper?null:m.municipio_upper)}
              style={{display:'grid',gridTemplateColumns:'32px 1fr 70px 70px 60px 90px',gap:4,padding:'5px 4px',borderBottom:'1px solid rgba(51,65,85,0.15)',cursor:'pointer',
                background:selectedMun===m.municipio_upper?'rgba(34,197,94,0.1)':'transparent',
                borderRadius:selectedMun===m.municipio_upper?6:0}}>
              <span style={{fontSize:10,fontWeight:700,color:'#475569'}}>#{m.ranking}</span>
              <span style={{fontSize:11,color:'#e2e8f0',fontWeight:500,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{m.municipio}</span>
              <span style={{fontSize:10,color:'#94a3b8',textAlign:'right',fontVariantNumeric:'tabular-nums'}}>{(m.eleitorado||0).toLocaleString('pt-BR')}</span>
              <span style={{fontSize:10,color:'#60a5fa',textAlign:'right',fontVariantNumeric:'tabular-nums'}}>{(m.votos_republicanos||0).toLocaleString('pt-BR')}</span>
              <span style={{fontSize:11,fontWeight:700,color:CAT_COLORS[m.categoria]||'#64748b',textAlign:'right'}}>{m.score_potencial}</span>
              <span style={{fontSize:8,fontWeight:700,color:CAT_COLORS[m.categoria],textAlign:'center',textTransform:'uppercase'}}>{m.categoria.split(' ')[0]}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Right column: party chart + detail */}
      <div style={{display:'flex',flexDirection:'column',gap:12}}>
        {/* Party distribution */}
        <Card>
          <p style={{fontSize:10,fontWeight:700,textTransform:'uppercase',color:'#64748b',marginBottom:8}}>Votos por partido — dep. federal 2022</p>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={partyChart} layout="vertical" margin={{left:0,right:40}}>
              <XAxis type="number" tick={{fontSize:9,fill:'#475569'}} axisLine={false} tickLine={false} tickFormatter={v=>v>=1000?`${(v/1000).toFixed(0)}K`:v}/>
              <YAxis type="category" dataKey="name" tick={{fontSize:10,fill:'#94a3b8',fontWeight:500}} width={90} axisLine={false} tickLine={false}/>
              <Tooltip contentStyle={{background:'#1e293b',border:'1px solid #334155',borderRadius:8,fontSize:11,color:'#e2e8f0'}} formatter={v=>[v.toLocaleString('pt-BR')+' votos']}/>
              <Bar dataKey="votos" radius={[0,4,4,0]} barSize={16}>
                {partyChart.map((d,i)=><Cell key={i} fill={d.fill} fillOpacity={0.85}/>)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Municipality detail (on click) */}
        {detail&&(
          <Card style={{borderLeft:`3px solid ${CAT_COLORS[detail.categoria]}`}}>
            <p style={{fontSize:10,fontWeight:700,textTransform:'uppercase',color:CAT_COLORS[detail.categoria],marginBottom:8}}>{detail.municipio} — #{detail.ranking}</p>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:10}}>
              <div><span style={{fontSize:9,color:'#475569'}}>Eleitorado</span><p style={{fontSize:16,fontWeight:700,color:'#f1f5f9',margin:0}}>{(detail.eleitorado||0).toLocaleString('pt-BR')}</p></div>
              <div><span style={{fontSize:9,color:'#475569'}}>População</span><p style={{fontSize:16,fontWeight:700,color:'#94a3b8',margin:0}}>{(detail.populacao||0).toLocaleString('pt-BR')}</p></div>
              <div><span style={{fontSize:9,color:'#475569'}}>Votos Republicanos</span><p style={{fontSize:16,fontWeight:700,color:'#60a5fa',margin:0}}>{(detail.votos_republicanos||0).toLocaleString('pt-BR')}</p></div>
              <div><span style={{fontSize:9,color:'#475569'}}>Share REP</span><p style={{fontSize:16,fontWeight:700,color:'#8b5cf6',margin:0}}>{detail.share_republicanos}%</p></div>
              <div><span style={{fontSize:9,color:'#475569'}}>Comparecimento</span><p style={{fontSize:16,fontWeight:700,color:'#f59e0b',margin:0}}>{detail.taxa_comparecimento}%</p></div>
              <div><span style={{fontSize:9,color:'#475569'}}>Partido vencedor</span><p style={{fontSize:16,fontWeight:700,color:PARTY_COLORS[detail.partido_vencedor]||'#94a3b8',margin:0}}>{detail.partido_vencedor}</p></div>
            </div>
            <p style={{fontSize:9,color:'#475569',fontWeight:700,marginBottom:4}}>TOP CANDIDATOS 2022:</p>
            {(detail.top_candidatos||[]).slice(0,3).map((c,i)=>(
              <p key={i} style={{fontSize:11,color:'#cbd5e1',margin:'2px 0'}}>{i+1}. {c.nome} ({c.partido}) — {(c.votos||0).toLocaleString('pt-BR')} votos</p>
            ))}
          </Card>
        )}
        {!detail&&(
          <Card style={{borderLeft:'3px solid #475569'}}>
            <p style={{fontSize:12,color:'#475569',textAlign:'center',padding:'16px 0'}}>Clique em um município no ranking para ver os detalhes</p>
          </Card>
        )}
      </div>
    </div>

    {/* Strategic insights */}
    <Card style={{borderLeft:'3px solid #22c55e',marginBottom:14}}>
      <p style={{fontSize:10,fontWeight:700,textTransform:'uppercase',color:'#22c55e',marginBottom:6}}>Insights geoeleitorais</p>
      <div style={{fontSize:12,color:'#94a3b8',lineHeight:1.7}}>
        <p style={{margin:'0 0 4px'}}>Base eleitoral do Republicanos no TO: {(summary.total_votos_republicanos_2022||0).toLocaleString('pt-BR')} votos em 2022 ({summary.share_republicanos_estado}% share). {summary.alta_prioridade} municipios classificados como alta prioridade.</p>
        <p style={{margin:'0 0 4px'}}>Top municipios aliados: {(summary.municipios_aliados||[]).slice(0,5).join(', ')}. Foco de campanha: consolidar base existente e expandir nos municipios de oportunidade.</p>
        {(summary.municipios_adversarios||[]).length>0&&<p style={{margin:0}}>Territorios dominados por adversarios: {summary.municipios_adversarios.slice(0,5).join(', ')}. Avaliar custo-beneficio de investir nestas regioes vs. maximizar municipios de oportunidade.</p>}
      </div>
    </Card>
  </div>);
};

/* ═══════════════════════════════════════════════
   MAIN APP
   ═══════════════════════════════════════════════ */
const App=()=>{
  const[newsRaw,setNewsRaw]=useState(null);
  const[socialData,setSocialData]=useState(null);
  const[sentimentData,setSentimentData]=useState(null);
  const[geoData,setGeoData]=useState(null);
  const[selectedCluster,setSelectedCluster]=useState('all');
  const[expandedCards,setExpandedCards]=useState({});
  const[sortOrder,setSortOrder]=useState('date');
  const[filterType,setFilterType]=useState('all');
  const[filterScope,setFilterScope]=useState('all');
  const[lastUpdate,setLastUpdate]=useState(null);
  const[loading,setLoading]=useState(true);
  const[refreshing,setRefreshing]=useState(false);

  useEffect(()=>{(async()=>{
    setLoading(true);
    const[m,s,st,g]=await Promise.all([fetchJ(URLS.mentions),fetchJ(URLS.social),fetchJ(URLS.sentiment),fetchJ(URLS.geo)]);
    if(m)setNewsRaw(m);if(s)setSocialData(s);if(st)setSentimentData(st);if(g)setGeoData(g);
    setLastUpdate(new Date().toLocaleString('pt-BR')+' (auto)');
    setLoading(false);
  })();},[]);

  const handleRefresh=useCallback(async()=>{
    setRefreshing(true);
    const[m,s,st,g]=await Promise.all([fetchJ(URLS.mentions),fetchJ(URLS.social),fetchJ(URLS.sentiment),fetchJ(URLS.geo)]);
    if(m)setNewsRaw(m);if(s)setSocialData(s);if(st)setSentimentData(st);if(g)setGeoData(g);
    setLastUpdate(new Date().toLocaleString('pt-BR')+' (auto)');
    setRefreshing(false);
  },[]);

  useEffect(()=>{
    const drop=e=>{e.preventDefault();const f=e.dataTransfer?.files[0];if(!f?.name.endsWith('.json'))return;const r=new FileReader();r.onload=ev=>{try{const d=JSON.parse(ev.target.result);if(Array.isArray(d)&&d[0]?.username)setSocialData(d);else if(Array.isArray(d)&&d[0]?.title)setNewsRaw(d);else if(d?.sentiment)setSentimentData(d);}catch{}};r.readAsText(f);};
    const over=e=>e.preventDefault();
    window.addEventListener('drop',drop);window.addEventListener('dragover',over);
    return()=>{window.removeEventListener('drop',drop);window.removeEventListener('dragover',over);};
  },[]);

  const articles=useMemo(()=>newsRaw?.map(classify)||[],[newsRaw]);
  const filteredNews=useMemo(()=>{
    let f=articles;
    if(filterType!=='all')f=f.filter(n=>n.mentionType===filterType);
    if(filterScope!=='all')f=f.filter(n=>n.scope===filterScope);
    if(selectedCluster!=='all')f=f.filter(n=>n.cluster===selectedCluster);
    return sortOrder==='score'?[...f].sort((a,b)=>a.score-b.score):[...f].sort((a,b)=>(b.date||'').localeCompare(a.date||''));
  },[articles,selectedCluster,sortOrder,filterType,filterScope]);

  const totalM=useMemo(()=>metrics(articles),[articles]);
  const filtM=useMemo(()=>metrics(filteredNews),[filteredNews]);
  const clCounts=useMemo(()=>{
    const base=articles.filter(n=>{if(filterType!=='all'&&n.mentionType!==filterType)return false;if(filterScope!=='all'&&n.scope!==filterScope)return false;return true;});
    const c={};base.forEach(n=>{c[n.cluster]=(c[n.cluster]||0)+1;});return c;
  },[articles,filterType,filterScope]);

  if(loading)return<div style={{minHeight:'100vh',background:'#060810',color:'#64748b',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:"'SF Pro Display','Segoe UI',sans-serif"}}><p>Carregando dados...</p></div>;

  return(
  <div style={{minHeight:'100vh',background:'#060810',color:'#cbd5e1',fontFamily:"'SF Pro Display','Segoe UI',-apple-system,sans-serif",padding:'20px 16px'}}>
  <div style={{maxWidth:1200,margin:'0 auto'}}>

    {/* HEADER */}
    <header style={{background:'rgba(15,23,42,0.5)',border:'1px solid rgba(51,65,85,0.4)',borderRadius:20,padding:'22px 26px',marginBottom:18,display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:14}}>
      <div style={{display:'flex',alignItems:'center',gap:12}}>
        <div style={{background:'rgba(239,68,68,0.08)',border:'1px solid rgba(239,68,68,0.2)',borderRadius:14,padding:11}}><ShieldAlert size={24} style={{color:'#ef4444'}}/></div>
        <div>
          <h1 style={{fontSize:18,fontWeight:800,color:'#f1f5f9',margin:0}}>Monitor — Cel. Márcio A. Barbosa de Mendonça</h1>
          <p style={{fontSize:10,color:'#475569',margin:'3px 0 0',fontWeight:700,textTransform:'uppercase',letterSpacing:'0.1em'}}>32 fontes · TO + Brasil · {lastUpdate||''}</p>
        </div>
      </div>
      <div style={{display:'flex',gap:16,alignItems:'center'}}>
        <div style={{textAlign:'right'}}><p style={{fontSize:9,color:'#475569',fontWeight:700,textTransform:'uppercase',margin:'0 0 2px'}}>Toxicidade</p><p style={{fontSize:22,fontWeight:900,color:'#ef4444',margin:0}}>{totalM.tox}%</p></div>
        <div style={{width:1,height:32,background:'rgba(51,65,85,0.4)'}}/>
        <div style={{textAlign:'right'}}><p style={{fontSize:9,color:'#475569',fontWeight:700,textTransform:'uppercase',margin:'0 0 2px'}}>Menções</p><p style={{fontSize:22,fontWeight:900,color:'#f59e0b',margin:0}}>{totalM.tot}</p></div>
        <button onClick={handleRefresh} disabled={refreshing} style={{display:'flex',alignItems:'center',gap:5,padding:'7px 12px',borderRadius:10,background:'rgba(139,92,246,0.1)',border:'1px solid rgba(139,92,246,0.25)',color:'#a78bfa',fontSize:11,fontWeight:700,cursor:refreshing?'wait':'pointer',opacity:refreshing?0.6:1}}>
          <RefreshCw size={12} style={{animation:refreshing?'spin 1s linear infinite':'none'}}/>{refreshing?'Atualizando...':'Atualizar'}
        </button>
      </div>
    </header>

    {/* METRICS */}
    <div style={{display:'flex',gap:8,marginBottom:16,flexWrap:'wrap'}}>
      <Met icon={User} label="Diretas" value={filtM.dir} sub="Cel. Barbosa" accent="#ef4444"/>
      <Met icon={Bookmark} label="Eleitorais" value={filtM.ele} sub="2026" accent="#6366f1"/>
      <Met icon={Building} label="PMTO" value={filtM.ins} accent="#f59e0b"/>
      <Met icon={Globe} label="Nacional" value={filtM.nac} sub="BR" accent="#3b82f6"/>
      <Met icon={MapPin} label="Local" value={filtM.loc} sub="TO" accent="#22c55e"/>
      <Met icon={Newspaper} label="Fontes" value={filtM.src} accent="#64748b"/>
    </div>

    {/* ═══ M2: REDES SOCIAIS ═══ */}
    <SocialPanel socialData={socialData} sentimentData={sentimentData}/>

    {/* ═══ M3: INTELIGÊNCIA ELEITORAL ═══ */}
    <GeoPanel geoData={geoData}/>

    {/* FILTERS */}
    <div style={{display:'flex',gap:6,marginBottom:10,flexWrap:'wrap'}}>
      {[{id:'all',l:'Todas'},{id:'direta',l:'● Diretas'},{id:'eleitoral',l:'◆ Eleitorais'},{id:'institucional',l:'○ PMTO'}].map(t=><Bt key={t.id} active={filterType===t.id} color="#8b5cf6" onClick={()=>setFilterType(t.id)}>{t.l}</Bt>)}
      <div style={{width:1,height:28,background:'rgba(51,65,85,0.3)',margin:'0 4px'}}/>
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
    <div style={{fontSize:11,color:'#475569',marginBottom:12,display:'flex',gap:16}}>
      <span>{filteredNews.length} menção(ões) {filterType!=='all'||filterScope!=='all'||selectedCluster!=='all'?'filtradas':'no total'}</span>
      {(filterType!=='all'||filterScope!=='all'||selectedCluster!=='all')&&<span style={{color:'#ef4444'}}>Toxicidade: {filtM.tox}%</span>}
    </div>

    {/* FEED */}
    <div style={{display:'flex',flexDirection:'column',gap:10,marginBottom:8}}>
      {filteredNews.slice(0,50).map(item=><NC key={item.id} item={item} expanded={!!expandedCards[item.id]} onToggle={()=>setExpandedCards(prev=>({...prev,[item.id]:!prev[item.id]}))}/>)}
      {filteredNews.length>50&&<p style={{fontSize:11,color:'#475569',textAlign:'center'}}>Mostrando 50 de {filteredNews.length}. Use filtros para refinar.</p>}
      {filteredNews.length===0&&<Card><p style={{color:'#475569',fontSize:13,textAlign:'center'}}>Nenhuma menção para os filtros selecionados.</p></Card>}
    </div>

  </div></div>);
};

export default App;

import React, { useState, useMemo, memo } from 'react';
import PropTypes from 'prop-types';
import { Users, ChevronUp, ChevronDown } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, LineChart, Line, Legend } from 'recharts';
import { Card, Bt, useWW, PanelSkeleton } from '../components/ui.jsx';
import HelpTooltip from '../components/HelpTooltip.jsx';
import { fmtK } from '../lib/analytics.js';
import { CONFIG } from '../lib/config.js';

const brDate=d=>d&&d.length>=10?d.slice(8,10)+'/'+d.slice(5,7)+'/'+d.slice(0,4):d||'';
const DCOL = {positivo:'#22c55e',negativo:'#ef4444',neutro:'#64748b',engajado:'#3b82f6'};

const PANEL_PROFILES = new Set([
  CONFIG.CANDIDATE_USERNAME,'janad_valcari','tiagodimas','ricardoayres_to','fabiopereiravaz',
  'depjairfariasoficial','lucascampelotocantins','filipemartinsto','cesarhalum','atosgomess',
  'nilmarruiz','sandovallobocardoso','larissarosenda','celiomourato','alfredojrto',
  'dep.lazaro','osiresdamaso','sgtjorge_carneiro_',
]);

function calcDelta(entries, username) {
  if(!entries||!Array.isArray(entries))return{delta:0,direction:'stable',label:'—'};
  const data=entries
    .filter(e=>e.username===username&&e.seguidores>0)
    .sort((a,b)=>(a.data_coleta||'').localeCompare(b.data_coleta||''));
  if(data.length<2)return{delta:0,direction:'stable',label:'—'};
  const curr=data[data.length-1];
  const weekAgo=new Date(curr.data_coleta);weekAgo.setDate(weekAgo.getDate()-7);
  let prev=null,minDiff=Infinity;
  for(const e of data.slice(0,data.length-1)){
    const diff=Math.abs(new Date(e.data_coleta)-weekAgo);
    if(diff<minDiff){minDiff=diff;prev=e;}
  }
  if(!prev)return{delta:0,direction:'stable',label:'—'};
  const delta=curr.seguidores-prev.seguidores;
  const threshold=curr.seguidores*0.01;
  const direction=delta>threshold?'up':delta<-threshold?'down':'stable';
  const label=delta===0?'—':`${delta>0?'+':''}${delta.toLocaleString('pt-BR')}`;
  return{delta,direction,label};
}

function SocialPanel({socialData,sentimentData}) {
  const[open,setOpen]=useState(true);
  const isMobile=useWW()<768;

  const profiles=useMemo(()=>{
    if(!socialData||!Array.isArray(socialData))return[];
    const byUser={};
    socialData.forEach(e=>{
      if(!PANEL_PROFILES.has(e.username))return;
      if(!byUser[e.username]||e.data_coleta>byUser[e.username].data_coleta)byUser[e.username]=e;
    });
    return Object.values(byUser).filter(p=>p.seguidores>0).sort((a,b)=>b.seguidores-a.seguidores);
  },[socialData]);

  const cand=profiles.find(p=>p.username===CONFIG.CANDIDATE_USERNAME);
  const rank=useMemo(()=>profiles.map((p,i)=>({...p,rank:i+1})),[profiles]);
  const candRank=rank.findIndex(p=>p.username===CONFIG.CANDIDATE_USERNAME)+1;

  const donut=useMemo(()=>{
    if(!sentimentData?.sentiment)return[];
    const s=sentimentData.sentiment;
    return[
      {name:'Positivo',value:s.positivo||0,pct:s.pct_positivo||0,color:DCOL.positivo},
      {name:'Engajado',value:s.engajado||0,pct:s.pct_engajado||0,color:DCOL.engajado},
      {name:'Neutro',value:s.neutro||0,pct:s.pct_neutro||0,color:DCOL.neutro},
      {name:'Negativo',value:s.negativo||0,pct:s.pct_negativo||0,color:DCOL.negativo},
    ].filter(d=>d.value>0);
  },[sentimentData]);

  const engChart=useMemo(()=>[...profiles].sort((a,b)=>b.taxa_engajamento_pct-a.taxa_engajamento_pct).slice(0,10).map(p=>{
    const isCand=p.username===CONFIG.CANDIDATE_USERNAME;
    let color=p.taxa_engajamento_pct>=3?'#22c55e':p.taxa_engajamento_pct>=1.5?'#f59e0b':'#ef4444';
    if(isCand)color='#1a3a7a';
    return{name:'@'+p.username.substring(0,18),eng:p.taxa_engajamento_pct,fill:color};
  }),[profiles]);

  if(!profiles.length)return <PanelSkeleton/>;
  return(
  <Card style={{marginTop:isMobile?0:32}}>
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:10,cursor:'pointer',marginBottom:open?18:0}} onClick={()=>setOpen(o=>!o)}>
      <div style={{display:'flex',alignItems:'center',gap:12}}>
        <div style={{background:'rgba(26,58,122,0.06)',border:'1px solid rgba(26,58,122,0.12)',borderRadius:12,padding:10}}><Users size={22} style={{color:'#1A3A7A'}}/></div>
        <div>
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            <h2 style={{fontSize:isMobile?18:22,fontWeight:800,color:'#1A2744',margin:0}}>Monitor de redes sociais</h2>
            <HelpTooltip panelId="social"/>
          </div>
          <p style={{fontSize:12,color:'#8c93a8',fontWeight:700,textTransform:'uppercase',letterSpacing:'0.1em',margin:'2px 0 0'}}>{profiles.length} perfis · Instagram · {brDate(sentimentData?.data_coleta||profiles[0]?.data_coleta||'')}</p>
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

    <div style={{display:'grid',gridTemplateColumns:isMobile?'1fr':'minmax(0,1fr) minmax(0,2.5fr)',gap:12,marginBottom:14}}>
      <Card>
        <p style={{fontSize:12,fontWeight:700,textTransform:'uppercase',color:'#8C93A8',marginBottom:10}}>Sentimento dos comentários</p>
        {donut.length>0?(
          <>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart><Pie data={donut} cx="50%" cy="50%" innerRadius={70} outerRadius={110} dataKey="value" stroke="none"
              label={({cx,cy,midAngle,innerRadius,outerRadius,pct})=>{
                const R=Math.PI/180,r=innerRadius+(outerRadius-innerRadius)*0.5,x=cx+r*Math.cos(-midAngle*R),y=cy+r*Math.sin(-midAngle*R);
                return pct>5?<text x={x} y={y} fill="#fff" textAnchor="middle" dominantBaseline="central" style={{fontSize:11,fontWeight:700}}>{pct}%</text>:null;
              }} labelLine={false}>
              {donut.map((d,i)=><Cell key={i} fill={d.color}/>)}
            </Pie></PieChart>
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

      <Card>
        <p style={{fontSize:12,fontWeight:700,textTransform:'uppercase',color:'#8C93A8',marginBottom:10}}>Ranking completo — seguidores e engajamento</p>
        <div style={{maxHeight:360,overflowY:'auto'}}>
          <div style={{display:'grid',gridTemplateColumns:isMobile?'28px 1fr 90px':'28px 1fr 90px 90px 72px',gap:4,padding:'4px 4px 6px',borderBottom:'1px solid var(--surface-border)'}}>
            <span className="table-header">#</span>
            <span className="table-header">PERFIL</span>
            {!isMobile&&<span className="table-header" style={{textAlign:'right'}}>SEGUIDORES</span>}
            <span className="table-header" style={{textAlign:'right'}}>ENGAJ.</span>
            {!isMobile&&<span className="table-header" style={{textAlign:'center'}}>TEND. (7d)</span>}
          </div>
          {rank.map(p=>{
            const isCand=p.username===CONFIG.CANDIDATE_USERNAME;
            const{direction,label}=calcDelta(socialData,p.username);
            const trendColor=direction==='up'?'#15803D':direction==='down'?'#B91C1C':'#8C93A8';
            const trendIcon=direction==='up'?'↑':direction==='down'?'↓':'→';
            return(
            <div key={p.username} className="table-row" style={{display:'grid',gridTemplateColumns:isMobile?'28px 1fr 90px':'28px 1fr 90px 90px 72px',gap:4,padding:'6px 4px',borderBottom:'1px solid var(--surface-border)',background:isCand?'rgba(212,160,23,0.08)':'transparent',borderRadius:isCand?6:0}}>
              <span className="table-cell" style={{fontWeight:700,color:'#8C93A8',fontFamily:'var(--font-mono)'}}>#{p.rank}</span>
              <span className="table-cell" style={{color:isCand?'#D4A017':'#1A2744',fontWeight:isCand?700:400,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>@{p.username}</span>
              {!isMobile&&<span className="table-cell" style={{fontWeight:600,color:'#5A6478',textAlign:'right',fontFamily:'var(--font-mono)'}}>{p.seguidores.toLocaleString('pt-BR')}</span>}
              <span className="table-cell" style={{fontWeight:700,color:p.taxa_engajamento_pct>=3?'#22c55e':p.taxa_engajamento_pct>=1.5?'#f59e0b':'#ef4444',textAlign:'right',fontFamily:'var(--font-mono)'}}>{p.taxa_engajamento_pct}%</span>
              {!isMobile&&<span className="table-cell" style={{fontWeight:700,color:trendColor,textAlign:'center',fontFamily:'var(--font-mono)'}}>{trendIcon} {label}</span>}
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
      <ResponsiveContainer width="100%" height={isMobile?220:300}>
        <BarChart data={engChart} layout="vertical" margin={{left:0,right:isMobile?36:50}}>
          <XAxis type="number" tick={{fontSize:12,fill:'#8c93a8'}} axisLine={false} tickLine={false} domain={[0,'auto']}/>
          <YAxis type="category" dataKey="name" tick={{fontSize:isMobile?10:13,fill:'#5a6178',fontWeight:500}} width={isMobile?110:150} axisLine={false} tickLine={false}/>
          <Tooltip contentStyle={{background:'#FFFFFF',border:'1px solid rgba(26,39,68,0.12)',borderRadius:8,fontSize:14,color:'#1A2744'}} formatter={v=>[`${v}%`,'Engajamento']} cursor={{fill:'rgba(139,92,246,0.05)'}}/>
          <Bar dataKey="eng" radius={[0,6,6,0]} barSize={20} animationDuration={800} animationEasing="ease-out" label={{position:'right',fill:'#8C93A8',fontSize:11,fontWeight:600,formatter:v=>`${v}%`}}>
            {engChart.map((d,i)=><Cell key={i} fill={d.fill} fillOpacity={0.85}/>)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Card>

    {(()=>{
      const allDates=[...(new Set((socialData||[]).filter(x=>PANEL_PROFILES.has(x.username)).map(x=>x.data_coleta)))].sort();
      if(allDates.length<2){
        const snapDate=allDates[0]||'';
        const snap=snapDate?(socialData||[]).filter(x=>PANEL_PROFILES.has(x.username)&&x.data_coleta===snapDate&&x.seguidores>0).sort((a,b)=>b.seguidores-a.seguidores).slice(0,5):[];
        const snapMax=snap[0]?.seguidores||1;
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
                const isCand=p.username===CONFIG.CANDIDATE_USERNAME;
                return(
                <div key={p.username} style={{display:'flex',alignItems:'center',gap:8,marginBottom:6}}>
                  <span style={{width:isMobile?90:130,fontSize:11,color:isCand?'#1a3a7a':'#5a6178',fontWeight:isCand?700:400,flexShrink:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>@{p.username}</span>
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
      const latestDate=allDates[allDates.length-1];
      const latestProfiles=(socialData||[]).filter(x=>PANEL_PROFILES.has(x.username)&&x.data_coleta===latestDate&&x.seguidores>0).sort((a,b)=>b.seguidores-a.seguidores);
      const topUsernames=[...(new Set([CONFIG.CANDIDATE_USERNAME,...latestProfiles.slice(0,5).map(x=>x.username)]))].slice(0,6);
      const COLORS_LINE=['#1a3a7a','#22c55e','#3b82f6','#f59e0b','#ef4444','#ec4899'];
      const chartData=allDates.map(date=>{
        const row={date:date.substring(8,10)+'/'+date.substring(5,7)};
        topUsernames.forEach(u=>{
          const entry=(socialData||[]).find(x=>x.username===u&&x.data_coleta===date);
          row[u]=entry?entry.seguidores:null;
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
              <Line key={u} type="monotone" dataKey={u} stroke={COLORS_LINE[i%6]} strokeWidth={u===CONFIG.CANDIDATE_USERNAME?3:1.5} dot={{r:u===CONFIG.CANDIDATE_USERNAME?4:2}} connectNulls animationDuration={800} animationEasing="ease-out"/>
            ))}
          </LineChart>
        </ResponsiveContainer>
      </Card>);
    })()}

    {(()=>{
      const mensal=sentimentData?.sentiment_mensal;
      if(!mensal||!Object.keys(mensal).length)return null;
      const MESES={'-01':'Jan','-02':'Fev','-03':'Mar','-04':'Abr','-05':'Mai','-06':'Jun','-07':'Jul','-08':'Ago','-09':'Set','-10':'Out','-11':'Nov','-12':'Dez'};
      const chartData=Object.entries(mensal).sort(([a],[b])=>a.localeCompare(b)).map(([k,v])=>{
        const suffix=k.slice(4);
        return{mes:MESES[suffix]||k,positivo:v.pct_positivo||0,negativo:v.pct_negativo||0,engajado:v.pct_engajado||0,neutro:v.pct_neutro||0,total:v.total||0};
      });
      return(
      <Card style={{marginBottom:14}}>
        <p style={{fontSize:12,fontWeight:700,textTransform:'uppercase',color:'#8C93A8',marginBottom:10}}>Tendência de sentimento mensal — {brDate(sentimentData?.periodo?.de)} a {brDate(sentimentData?.periodo?.ate)}</p>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartData} margin={{top:5,right:10,left:0,bottom:5}}>
            <XAxis dataKey="mes" tick={{fontSize:11,fill:'#8c93a8'}}/>
            <YAxis tick={{fontSize:10,fill:'#8c93a8'}} unit="%" domain={[0,100]}/>
            <Tooltip formatter={(v,n)=>[`${v}%`,n]} labelFormatter={l=>{const d=chartData.find(c=>c.mes===l);return d?`${l} (${d.total} comentários)`:l;}}/>
            <Bar dataKey="positivo" stackId="a" fill={DCOL.positivo} name="Positivo" radius={[0,0,0,0]}/>
            <Bar dataKey="engajado" stackId="a" fill={DCOL.engajado} name="Engajado"/>
            <Bar dataKey="neutro" stackId="a" fill={DCOL.neutro} name="Neutro"/>
            <Bar dataKey="negativo" stackId="a" fill={DCOL.negativo} name="Negativo" radius={[3,3,0,0]}/>
            <Legend wrapperStyle={{fontSize:10}}/>
          </BarChart>
        </ResponsiveContainer>
      </Card>);
    })()}

    {(()=>{
      const comments=sentimentData?.comments_sample||[];
      if(!comments.length)return null;
      const stopwords=new Set(['de','da','do','das','dos','e','a','o','que','em','um','uma','para','com','não','nao','no','na','se','por','mais','ao','os','as','é','esse','essa','este','esta','já','ja','foi','ser','tem','seu','sua','ou','muito','como','eu','me','meu','minha','ele','ela','nos','lhe','te','ti','são','sao','mas','isso','isto','aqui','ali','voce','você','vc','pra','pro','tb','tbm']);
      const wordMap={};
      comments.forEach(c=>{
        const words=(c.text||'').toLowerCase().replace(/[^\p{L}\s]/gu,'').split(/\s+/).filter(w=>w.length>2&&!stopwords.has(w));
        words.forEach(w=>{wordMap[w]=(wordMap[w]||0)+1;});
      });
      const sorted=Object.entries(wordMap).sort((a,b)=>b[1]-a[1]).slice(0,40);
      if(!sorted.length)return null;
      const maxCount=sorted[0][1];
      const posWords=new Set(['parabéns','parabens','excelente','otimo','ótimo','apoio','merece','sucesso','top','obrigado','obrigada','deus','bom','boa','forte','guerreiro','respeito','lindo','linda','maravilhoso','sensacional','orgulho','heroi','herói','amém','amem','bênção','bencao']);
      const negWords=new Set(['corrupto','vergonha','mentiroso','lixo','nojo','pior','fora','nunca','fake','mentira']);
      return(
      <Card style={{marginBottom:14}}>
        <p style={{fontSize:12,fontWeight:700,textTransform:'uppercase',color:'#8C93A8',marginBottom:10}}>Nuvem de palavras — comentários do candidato</p>
        <div style={{display:'flex',flexWrap:'wrap',gap:'6px 10px',justifyContent:'center',padding:'8px 0',minHeight:80}}>
          {sorted.map(([word,count])=>{
            const ratio=count/maxCount;
            const size=Math.max(13,Math.round(13+ratio*24));
            let color='#94a3b8';
            if(posWords.has(word))color='#22c55e';
            else if(negWords.has(word))color='#ef4444';
            else if(ratio>0.5)color='#e2e8f0';
            return(<span key={word} style={{fontSize:size,fontWeight:ratio>0.3?600:400,color,opacity:0.6+ratio*0.4,lineHeight:1.2,cursor:'default'}} title={`${word}: ${count}x`}>{word}</span>);
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

    {(()=>{
      const advocates=sentimentData?.advogados_marca;
      if(!advocates?.length)return null;
      const maxScore=advocates[0]?.score||1;
      const SCOL={positivo:'#22c55e',engajado:'#3b82f6',neutro:'#94a3b8',negativo:'#ef4444'};
      return(
      <Card style={{marginBottom:14}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
          <p style={{fontSize:12,fontWeight:700,textTransform:'uppercase',color:'#8C93A8',margin:0}}>Top 10 seguidores por engajamento</p>
          {sentimentData?.total_comentaristas&&<span style={{fontSize:11,color:'#8c93a8'}}>de {sentimentData.total_comentaristas.toLocaleString('pt-BR')} perfis únicos</span>}
        </div>
        <div style={{overflowX:'auto'}}>
        <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
          <thead>
            <tr style={{borderBottom:'2px solid #e2e8f0',textAlign:'left'}}>
              <th style={{padding:'6px 8px',color:'#8c93a8',fontWeight:600,fontSize:11,textTransform:'uppercase'}}>#</th>
              <th style={{padding:'6px 8px',color:'#8c93a8',fontWeight:600,fontSize:11,textTransform:'uppercase'}}>Perfil</th>
              <th style={{padding:'6px 8px',color:'#8c93a8',fontWeight:600,fontSize:11,textTransform:'uppercase',textAlign:'center'}}>Comentários</th>
              <th style={{padding:'6px 8px',color:'#8c93a8',fontWeight:600,fontSize:11,textTransform:'uppercase',textAlign:'center'}}>Posts</th>
              <th style={{padding:'6px 8px',color:'#8c93a8',fontWeight:600,fontSize:11,textTransform:'uppercase',textAlign:'center'}}>Lealdade</th>
              <th style={{padding:'6px 8px',color:'#8c93a8',fontWeight:600,fontSize:11,textTransform:'uppercase',minWidth:80}}>Score</th>
              <th style={{padding:'6px 8px',color:'#8c93a8',fontWeight:600,fontSize:11,textTransform:'uppercase',textAlign:'center'}}>Período</th>
            </tr>
          </thead>
          <tbody>
            {advocates.map((a,i)=>{
              const barW=Math.max(8,Math.round(a.score/maxScore*100));
              const sColor=SCOL[a.sentimento_dominante]||'#94a3b8';
              return(
              <tr key={a.username} style={{borderBottom:'1px solid #f1f5f9',background:i%2===0?'#fafbfc':'transparent'}}>
                <td style={{padding:'8px',fontWeight:700,color:'#1a3a7a',fontSize:14}}>{i+1}</td>
                <td style={{padding:'8px'}}>
                  <a href={`https://instagram.com/${a.username}`} target="_blank" rel="noopener noreferrer" style={{display:'flex',alignItems:'center',gap:8,textDecoration:'none',color:'inherit'}}>
                    {(a.profilePicLocal||a.profilePicUrl)
                      ?<img src={a.profilePicLocal||a.profilePicUrl} alt={a.username} style={{width:32,height:32,borderRadius:'50%',objectFit:'cover',flexShrink:0,border:'2px solid #e2e8f0'}} onError={e=>{e.target.style.display='none';e.target.nextSibling.style.display='flex';}}/>
                      :null}
                    <div style={{width:32,height:32,borderRadius:'50%',background:'linear-gradient(135deg,#1a3a7a,#2a4fa0)',alignItems:'center',justifyContent:'center',color:'#fff',fontSize:11,fontWeight:700,flexShrink:0,display:(a.profilePicLocal||a.profilePicUrl)?'none':'flex'}}>{a.username.charAt(0).toUpperCase()}</div>
                    <div>
                      <div style={{display:'flex',alignItems:'center',gap:4}}>
                        <span style={{fontWeight:600,color:'#1a3a7a',fontSize:13}}>@{a.username.length>20?a.username.slice(0,18)+'…':a.username}</span>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#8c93a8" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                      </div>
                      {a.fullName&&<div style={{fontSize:10,color:'#8c93a8'}}>{a.fullName}{a.followersCount>0?` · ${a.followersCount.toLocaleString('pt-BR')} seg`:''}</div>}
                      <div style={{fontSize:10,color:sColor,fontWeight:600}}>{a.sentimento_dominante} {a.sentimento_dominante_pct}%</div>
                    </div>
                  </a>
                </td>
                <td style={{padding:'8px',textAlign:'center',fontWeight:600}}>{a.comentarios}</td>
                <td style={{padding:'8px',textAlign:'center',color:'#5a6178'}}>{a.posts_unicos}</td>
                <td style={{padding:'8px',textAlign:'center'}}>
                  <span style={{background:a.lealdade_pct>=80?'#dcfce7':a.lealdade_pct>=50?'#fef9c3':'#fee2e2',color:a.lealdade_pct>=80?'#15803d':a.lealdade_pct>=50?'#a16207':'#b91c1c',padding:'2px 8px',borderRadius:10,fontSize:11,fontWeight:700}}>{a.lealdade_pct}%</span>
                </td>
                <td style={{padding:'8px'}}>
                  <div style={{display:'flex',alignItems:'center',gap:6}}>
                    <div style={{flex:1,height:6,background:'#f1f5f9',borderRadius:3,overflow:'hidden'}}>
                      <div style={{width:`${barW}%`,height:'100%',background:'linear-gradient(90deg,#1a3a7a,#d4a017)',borderRadius:3}}/>
                    </div>
                    <span style={{fontSize:11,fontWeight:600,color:'#1a3a7a',minWidth:28}}>{a.score}</span>
                  </div>
                </td>
                <td style={{padding:'8px',textAlign:'center',fontSize:11,color:'#8c93a8',whiteSpace:'nowrap'}}>{a.primeiro_comentario?a.primeiro_comentario.slice(8,10)+'/'+a.primeiro_comentario.slice(5,7):'—'} a {a.ultimo_comentario?a.ultimo_comentario.slice(8,10)+'/'+a.ultimo_comentario.slice(5,7):'—'}</td>
              </tr>);
            })}
          </tbody>
        </table>
        </div>
        <div style={{marginTop:10,padding:'8px 10px',background:'#f8fafc',borderRadius:6,fontSize:11,color:'#5a6178',lineHeight:1.6}}>
          <strong>Score</strong> = comentários×2 + likes recebidos + posts únicos×3 · <strong>Lealdade</strong> = % de interações positivas ou engajadas · <strong>Período</strong> = primeiro ao último comentário
        </div>
      </Card>);
    })()}

    <Card style={{borderLeft:'3px solid #22c55e'}}>
      <p style={{fontSize:12,fontWeight:700,textTransform:'uppercase',color:'#8C93A8',marginBottom:10}}>Insights para a campanha</p>
      <div style={{fontSize:14,color:'#8C93A8',lineHeight:1.7}}>
        {cand&&<p style={{margin:'0 0 4px'}}>Cel. Barbosa: #{candRank} em seguidores ({cand.seguidores.toLocaleString('pt-BR')}) com engajamento de {cand.taxa_engajamento_pct}% — {cand.taxa_engajamento_pct>1.5?'acima da média de políticos brasileiros (~1%)':'dentro da média'}.</p>}
        {cand&&<p style={{margin:'0 0 4px'}}>Média de {cand.media_likes_recentes} likes/post. Investir em Reels e vídeos curtos tende a amplificar o alcance orgânico em 3-5x no Instagram.</p>}
        {sentimentData?.sentiment?.total>0&&<p style={{margin:0}}>Análise calibrada de {sentimentData.sentiment.total} comentários{sentimentData?.periodo?` (${brDate(sentimentData.periodo.de)} a ${brDate(sentimentData.periodo.ate)})`:''}: {sentimentData.sentiment.pct_positivo}% positivos, {sentimentData.sentiment.pct_engajado||0}% engajados, {sentimentData.sentiment.pct_negativo}% negativos. {sentimentData.sentiment.pct_positivo>50?'Percepção pública favorável — explorar UGC e depoimentos.':'Monitorar narrativas negativas e preparar contra-narrativas.'}</p>}
        {!sentimentData?.sentiment?.total&&<p style={{margin:0}}>Execute o scraper de comentários para gerar a análise de sentimento do público nas redes.</p>}
      </div>
    </Card>
    </div>
    )}
  </Card>);
}

export default memo(SocialPanel);

SocialPanel.propTypes = {
  socialData:    PropTypes.arrayOf(PropTypes.shape({
    username:              PropTypes.string.isRequired,
    seguidores:            PropTypes.number,
    seguindo:              PropTypes.number,
    publicacoes:           PropTypes.number,
    taxa_engajamento_pct:  PropTypes.number,
    coletado_em:           PropTypes.string,
  })),
  sentimentData: PropTypes.shape({
    sentiment:       PropTypes.object,
    score:           PropTypes.number,
    positivo_pct:    PropTypes.number,
    negativo_pct:    PropTypes.number,
    neutro_pct:      PropTypes.number,
  }),
};

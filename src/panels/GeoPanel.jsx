import React, { useState, useMemo, memo } from 'react';
import PropTypes from 'prop-types';
import { MapPin, Target, Eye, TrendingUp, BarChart3, ChevronUp, ChevronDown } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Cell, ResponsiveContainer } from 'recharts';
import { Card, Met, Bt, useWW, PanelSkeleton } from '../components/ui.jsx';
import HelpTooltip from '../components/HelpTooltip.jsx';

const CAT_COLORS = {
  'ALTA PRIORIDADE':'#22c55e','OPORTUNIDADE':'#f59e0b',
  'DESENVOLVIMENTO':'#f97316','BAIXA PRIORIDADE':'#ef4444',
};
const PARTY_COLORS = {
  'REPUBLICANOS':'#1e40af','PL':'#1d4ed8','PP':'#0369a1','UNIÃO':'#0891b2',
  'PT':'#dc2626','MDB':'#16a34a','PSDB':'#2563eb','PSD':'#7c3aed',
  'PDT':'#ea580c','PODE':'#0d9488','PSB':'#db2777','SOLIDARIEDADE':'#d97706',
  'AVANTE':'#65a30d','PATRIOTA':'#059669','PSC':'#4f46e5',
};

function GeoPanel({geoData}) {
  const[open,setOpen]=useState(true);
  const[selectedMun,setSelectedMun]=useState(null);
  const[catFilter,setCatFilter]=useState('all');
  const isMobile=useWW()<768;

  const summary=geoData?.summary||{};
  const municipios=useMemo(()=>{
    const list=geoData?.municipios||[];
    if(catFilter==='all')return list;
    return list.filter(m=>(m.categoria||'')=== catFilter);
  },[geoData,catFilter]);

  const partyChart=useMemo(()=>{
    if(!geoData?.municipios)return[];
    const totals={};
    geoData.municipios.forEach(m=>{
      (m.top_partidos||[]).forEach(p=>{
        totals[p.partido]=(totals[p.partido]||0)+p.votos;
      });
    });
    return Object.entries(totals).sort((a,b)=>b[1]-a[1]).slice(0,10).map(([p,v])=>({
      name:p,votos:v,fill:PARTY_COLORS[p]||'#475569',
    }));
  },[geoData]);

  if(!geoData?.municipios?.length)return <PanelSkeleton/>;
  const detail=selectedMun?geoData.municipios.find(m=>m.municipio_upper===selectedMun):null;

  return(
  <Card style={{marginTop:isMobile?0:32}}>
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:10,cursor:'pointer',marginBottom:open?18:0}} onClick={()=>setOpen(o=>!o)}>
      <div style={{display:'flex',alignItems:'center',gap:12}}>
        <div style={{background:'rgba(21,128,61,0.08)',border:'1px solid rgba(21,128,61,0.15)',borderRadius:12,padding:10}}><MapPin size={22} style={{color:'#15803d'}}/></div>
        <div>
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            <h2 style={{fontSize:22,fontWeight:800,color:'#1A2744',margin:0}}>Inteligência eleitoral — Tocantins</h2>
            <HelpTooltip panelId="eleitoral"/>
          </div>
          <p style={{fontSize:12,color:'#8c93a8',fontWeight:700,textTransform:'uppercase',letterSpacing:'0.1em',margin:'2px 0 0'}}>{summary.total_municipios||0} municípios · TSE 2022 + IBGE · Dep. Federal</p>
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
    <div style={{display:'flex',gap:isMobile?6:8,marginBottom:14,flexWrap:'wrap'}}>
      <Met icon={MapPin} label="Municípios" value={summary.total_municipios||0} accent="#22c55e" compact={isMobile}/>
      <Met icon={Target} label="Alta prior." value={summary.alta_prioridade||0} sub="score 60+" accent="#22c55e" compact={isMobile}/>
      <Met icon={Eye} label="Oportunidade" value={summary.oportunidade||0} sub="score 40-60" accent="#f59e0b" compact={isMobile}/>
      <Met icon={TrendingUp} label="Votos REP 2022" value={(summary.total_votos_republicanos_2022||0).toLocaleString('pt-BR')} accent="#1e40af" compact={isMobile}/>
      <Met icon={BarChart3} label="Share estado" value={`${summary.share_republicanos_estado||0}%`} accent="#8b5cf6" compact={isMobile}/>
    </div>

    <div style={{display:'flex',gap:6,marginBottom:14,flexWrap:'wrap'}}>
      <Bt active={catFilter==='all'} color="#64748b" onClick={()=>setCatFilter('all')}>Todos ({geoData.municipios.length})</Bt>
      {Object.entries(CAT_COLORS).map(([cat,color])=>{
        const count=geoData.municipios.filter(m=>(m.categoria||'')===cat).length;
        return<Bt key={cat} active={catFilter===cat} color={color} onClick={()=>setCatFilter(cat)}>{cat.toLowerCase()} ({count})</Bt>;
      })}
    </div>

    <div style={{display:'grid',gridTemplateColumns:isMobile?'1fr':'minmax(0,1.8fr) minmax(0,1.2fr)',gap:12,marginBottom:14}}>
      <Card>
        <p style={{fontSize:12,fontWeight:700,textTransform:'uppercase',color:'#8C93A8',marginBottom:10}}>Ranking por potencial — {municipios.length} municípios</p>
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
              {!isMobile&&<span style={{fontSize:8,fontWeight:700,color:CAT_COLORS[m.categoria],textAlign:'center',textTransform:'uppercase'}}>{(m.categoria||'').split(' ')[0]}</span>}
            </div>
          ))}
        </div>
      </Card>

      <div style={{display:'flex',flexDirection:'column',gap:12}}>
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
}

export default memo(GeoPanel);

GeoPanel.propTypes = {
  geoData: PropTypes.shape({
    municipios: PropTypes.arrayOf(PropTypes.shape({
      nome:             PropTypes.string.isRequired,
      populacao:        PropTypes.number,
      eleitorado:       PropTypes.number,
      categoria:        PropTypes.string,
      oportunidade_idx: PropTypes.number,
      vereadores:       PropTypes.array,
    })),
  }),
};

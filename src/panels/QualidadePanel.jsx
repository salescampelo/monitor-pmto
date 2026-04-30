import React, { useState, memo } from 'react';
import { Database, ChevronUp, ChevronDown, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import { Card, useWW, PanelSkeleton } from '../components/ui.jsx';

const fmtUpdated = d => {
  if (!d || d.length < 10) return d || '—';
  return d.slice(8,10) + '/' + d.slice(5,7) + '/' + d.slice(0,4) + d.slice(10);
};

const StatusIcon = ({status}) => {
  if (status === 'ok') return <CheckCircle2 size={14} style={{color:'#15803d'}}/>;
  if (status === 'not_run') return <span style={{color:'#8C93A8',fontSize:12}}>--</span>;
  return <XCircle size={14} style={{color:'#b91c1c'}}/>;
};

const Bar = ({value, max, color}) => {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div style={{display:'flex',alignItems:'center',gap:8,flex:1}}>
      <div style={{flex:1,height:6,background:'#eef0f6',borderRadius:3,overflow:'hidden'}}>
        <div style={{width:`${pct}%`,height:'100%',background:color,borderRadius:3,transition:'width 0.4s ease'}}/>
      </div>
      <span style={{fontSize:11,fontWeight:700,color:'#1A2744',minWidth:24,textAlign:'right'}}>{value}</span>
    </div>
  );
};

function QualidadePanel({data}) {
  const [open, setOpen] = useState(true);
  const isMobile = useWW() < 768;

  if (!data) return <PanelSkeleton/>;

  const {run_stats: run, history_summary: hist, sites_health: sites, updated_at} = data;
  const maxSource = Math.max(...Object.values(hist?.sources_30d || {1:1}), 1);
  const sortedSources = Object.entries(hist?.sources_30d || {}).sort((a,b) => b[1] - a[1]);
  const sortedSites = Object.entries(sites || {}).sort((a,b) => {
    if (a[1].layer !== b[1].layer) return a[1].layer < b[1].layer ? -1 : 1;
    return b[1].mentions_30d - a[1].mentions_30d;
  });
  const sitesWithError = sortedSites.filter(([,v]) => v.last_run_status !== 'ok' && v.last_run_status !== 'not_run');
  const sentiment = hist?.sentiment_30d || {};
  const methods = hist?.methods_30d || {};

  return (
    <Card style={{marginTop: isMobile ? 0 : 32}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',cursor:'pointer',marginBottom:open?18:0}} onClick={() => setOpen(o => !o)}>
        <div style={{display:'flex',alignItems:'center',gap:12}}>
          <div style={{background:'rgba(26,58,122,0.1)',border:'1px solid rgba(26,58,122,0.2)',borderRadius:12,padding:10}}>
            <Database size={22} style={{color:'#1a3a7a'}}/>
          </div>
          <div>
            <h2 style={{fontSize:22,fontWeight:800,color:'#1A2744',margin:0}}>Qualidade do Coletor</h2>
            <p style={{fontSize:12,color:'#8c93a8',fontWeight:700,textTransform:'uppercase',letterSpacing:'0.1em',margin:'2px 0 0'}}>
              {hist?.total || 0} total · {hist?.last_7d || 0} (7d) · {hist?.last_30d || 0} (30d) · Atualizado {fmtUpdated(updated_at)}
            </p>
          </div>
        </div>
        {open ? <ChevronUp size={18} style={{color:'#8c93a8'}}/> : <ChevronDown size={18} style={{color:'#8c93a8'}}/>}
      </div>

      {open && (
        <div style={{display:'flex',flexDirection:'column',gap:20}}>

          {sitesWithError.length > 0 && (
            <div style={{background:'rgba(185,28,28,0.06)',border:'1px solid rgba(185,28,28,0.15)',borderRadius:8,padding:12}}>
              <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:6}}>
                <AlertTriangle size={14} style={{color:'#b91c1c'}}/>
                <span style={{fontSize:12,fontWeight:700,color:'#b91c1c'}}>Sites com erro na ultima coleta</span>
              </div>
              {sitesWithError.map(([key, site]) => (
                <p key={key} style={{fontSize:12,color:'#5A6478',margin:'2px 0'}}>{site.name}: {site.last_run_status}</p>
              ))}
            </div>
          )}

          {/* Run stats */}
          <div>
            <h3 style={{fontSize:13,fontWeight:700,color:'#1A2744',margin:'0 0 10px',textTransform:'uppercase',letterSpacing:'0.05em'}}>Ultima execucao</h3>
            <div style={{display:'grid',gridTemplateColumns:isMobile?'repeat(2,1fr)':'repeat(4,1fr)',gap:8}}>
              {[
                {label:'RSS bruto',value:run?.entries_rss_raw||0,color:'#8C93A8'},
                {label:'Duplicatas',value:run?.duplicates||0,color:'#eab308'},
                {label:'Bloq. data',value:run?.blocked_date||0,color:'#f97316'},
                {label:'Bloq. identidade',value:run?.blocked_id||0,color:'#ef4444'},
                {label:'Aprovadas RSS',value:run?.approved_rss||0,color:'#15803d'},
                {label:'Scraping direto',value:run?.approved_scrape||0,color:'#1a3a7a'},
                {label:'Indiretas',value:run?.approved_indirect||0,color:'#7C3AED'},
                {label:'TOTAL NOVAS',value:run?.total_new||0,color:'#d4a017'},
              ].map(m => (
                <div key={m.label} style={{background:'rgba(26,39,68,0.03)',borderRadius:8,padding:'10px 12px',textAlign:'center'}}>
                  <p style={{fontSize:22,fontWeight:800,color:m.color,margin:0}}>{m.value}</p>
                  <p style={{fontSize:9,fontWeight:600,color:'#8C93A8',textTransform:'uppercase',margin:'4px 0 0',letterSpacing:'0.04em'}}>{m.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Sources 30d */}
          <div>
            <h3 style={{fontSize:13,fontWeight:700,color:'#1A2744',margin:'0 0 10px',textTransform:'uppercase',letterSpacing:'0.05em'}}>Mencoes por fonte (30 dias)</h3>
            <div style={{display:'flex',flexDirection:'column',gap:6}}>
              {sortedSources.map(([src, count]) => (
                <div key={src} style={{display:'flex',alignItems:'center',gap:10}}>
                  <span style={{fontSize:12,color:'#5A6478',minWidth:isMobile?100:180,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{src}</span>
                  <Bar value={count} max={maxSource} color="#1a3a7a"/>
                </div>
              ))}
            </div>
          </div>

          {/* Sentiment + Methods side by side */}
          <div style={{display:'grid',gridTemplateColumns:isMobile?'1fr':'1fr 1fr',gap:16}}>
            <div>
              <h3 style={{fontSize:13,fontWeight:700,color:'#1A2744',margin:'0 0 10px',textTransform:'uppercase',letterSpacing:'0.05em'}}>Sentimento (30d)</h3>
              {Object.entries(sentiment).sort((a,b) => b[1]-a[1]).map(([s, c]) => {
                const colors = {Positivo:'#15803d',Neutro:'#8C93A8',Negativo:'#b91c1c','Muito Negativo':'#7f1d1d'};
                return (
                  <div key={s} style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}>
                    <span style={{fontSize:11,color:'#5A6478',minWidth:80}}>{s}</span>
                    <Bar value={c} max={hist?.last_30d||1} color={colors[s]||'#8C93A8'}/>
                  </div>
                );
              })}
            </div>
            <div>
              <h3 style={{fontSize:13,fontWeight:700,color:'#1A2744',margin:'0 0 10px',textTransform:'uppercase',letterSpacing:'0.05em'}}>Metodo de coleta (30d)</h3>
              {Object.entries(methods).sort((a,b) => b[1]-a[1]).map(([m, c]) => {
                const colors = {RSS:'#1a3a7a',DIRECT_SCRAPE:'#d4a017',DIRECT_SCRAPE_INDIRECT:'#7C3AED'};
                const labels = {RSS:'Google News RSS',DIRECT_SCRAPE:'Scraping direto',DIRECT_SCRAPE_INDIRECT:'Ref. indireta'};
                return (
                  <div key={m} style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}>
                    <span style={{fontSize:11,color:'#5A6478',minWidth:100}}>{labels[m]||m}</span>
                    <Bar value={c} max={hist?.last_30d||1} color={colors[m]||'#8C93A8'}/>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Sites health table */}
          <div>
            <h3 style={{fontSize:13,fontWeight:700,color:'#1A2744',margin:'0 0 10px',textTransform:'uppercase',letterSpacing:'0.05em'}}>Saude dos sites ({sortedSites.length})</h3>
            <div style={{overflowX:'auto'}}>
              <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
                <thead>
                  <tr style={{borderBottom:'2px solid #eef0f6'}}>
                    <th style={{textAlign:'left',padding:'6px 8px',color:'#8C93A8',fontSize:10,fontWeight:700,textTransform:'uppercase'}}>Site</th>
                    <th style={{textAlign:'center',padding:'6px 8px',color:'#8C93A8',fontSize:10,fontWeight:700,textTransform:'uppercase'}}>Layer</th>
                    <th style={{textAlign:'center',padding:'6px 8px',color:'#8C93A8',fontSize:10,fontWeight:700,textTransform:'uppercase'}}>30d</th>
                    <th style={{textAlign:'center',padding:'6px 8px',color:'#8C93A8',fontSize:10,fontWeight:700,textTransform:'uppercase'}}>Ultima</th>
                    <th style={{textAlign:'center',padding:'6px 8px',color:'#8C93A8',fontSize:10,fontWeight:700,textTransform:'uppercase'}}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedSites.map(([key, site]) => (
                    <tr key={key} className="table-row" style={{borderBottom:'1px solid #eef0f6'}}>
                      <td style={{padding:'8px',color:'#1A2744',fontWeight:500}}>{site.name}</td>
                      <td style={{textAlign:'center',padding:'8px'}}>
                        <span style={{fontSize:10,fontWeight:700,color:site.layer==='A'?'#1a3a7a':'#8C93A8',background:site.layer==='A'?'rgba(26,58,122,0.1)':'rgba(140,147,168,0.1)',padding:'2px 6px',borderRadius:4}}>{site.layer}</span>
                      </td>
                      <td style={{textAlign:'center',padding:'8px',fontWeight:700,color:site.mentions_30d>0?'#1A2744':'#C4C0B6'}}>{site.mentions_30d}</td>
                      <td style={{textAlign:'center',padding:'8px',fontWeight:600,color:site.last_run_mentions>0?'#15803d':'#C4C0B6'}}>{site.last_run_mentions}</td>
                      <td style={{textAlign:'center',padding:'8px'}}><StatusIcon status={site.last_run_status}/></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Rejection reasons */}
          {run?.blocked_id_reasons && Object.keys(run.blocked_id_reasons).length > 0 && (
            <div>
              <h3 style={{fontSize:13,fontWeight:700,color:'#1A2744',margin:'0 0 10px',textTransform:'uppercase',letterSpacing:'0.05em'}}>Motivos de rejeicao (ultima coleta)</h3>
              {Object.entries(run.blocked_id_reasons).sort((a,b) => b[1]-a[1]).map(([reason, count]) => (
                <div key={reason} style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}>
                  <span style={{fontSize:11,color:'#5A6478',minWidth:isMobile?120:200}}>{reason}</span>
                  <Bar value={count} max={run.blocked_id||1} color="#ef4444"/>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

export default memo(QualidadePanel);

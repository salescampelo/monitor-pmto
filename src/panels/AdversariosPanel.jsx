import React, { useState, useMemo, memo } from 'react';
import PropTypes from 'prop-types';
import { Target, ChevronUp, ChevronDown } from 'lucide-react';
import { Card, useWW } from '../components/ui.jsx';
import HelpTooltip from '../components/HelpTooltip.jsx';
import { fmtDt, fmtK } from '../lib/analytics.js';

const THREAT_C = {
  alta:      {bg:'rgba(239,68,68,0.1)',  c:'#ef4444'},
  média:     {bg:'rgba(245,158,11,0.1)', c:'#f59e0b'},
  baixa:     {bg:'rgba(100,116,139,0.1)',c:'#64748b'},
  interno:   {bg:'rgba(139,92,246,0.1)', c:'#8b5cf6'},
  candidato: {bg:'rgba(26,58,122,0.1)',  c:'#1a3a7a'},
};
const NIVEL_ORDER = {baixa:1,média:2,alta:3};
const DEST_C = {Senado:'#1a3a7a',Governo:'#22c55e',Desistiu:'#64748b'};

function AdversariosPanel({adversariosData}) {
  const[open,setOpen]=useState(true);
  const isMobile=useWW()<768;
  const d=adversariosData;

  const ranking=useMemo(()=>{
    if(!d?.ranking)return[
      {ranking:1, nome:'Janad Valcari',       partido:'PP',            seguidores:87000,  nivel_ameaca:'alta'},
      {ranking:2, nome:'Tiago Dimas',          partido:'Podemos',       seguidores:69000,  nivel_ameaca:'alta'},
      {ranking:3, nome:'Jair Farias',          partido:'União Brasil',  seguidores:22000,  nivel_ameaca:'alta'},
      {ranking:4, nome:'Fábio Vaz',            partido:'Republicanos*', seguidores:21000,  nivel_ameaca:'interno'},
      {ranking:5, nome:'Filipe Martins',       partido:'PL',            seguidores:19000,  nivel_ameaca:'alta'},
      {ranking:5, nome:'Lucas Campelo',        partido:'Republicanos*', seguidores:19000,  nivel_ameaca:'interno'},
      {ranking:8, nome:'César Halum',          partido:'PP',            seguidores:13000,  nivel_ameaca:'alta'},
      {ranking:9, nome:'Nilmar Ruiz',          partido:'PL',            seguidores:10000,  nivel_ameaca:'média'},
      {ranking:10,nome:'Sandoval Cardoso',     partido:'Podemos',       seguidores:9000,   nivel_ameaca:'média'},
      {ranking:11,nome:'Larissa Rosenda',      partido:'PSD',           seguidores:8000,   nivel_ameaca:'baixa'},
      {ranking:12,nome:'Célio Moura',          partido:'PT',            seguidores:7000,   nivel_ameaca:'média'},
      {ranking:13,nome:'Lázaro Botelho',       partido:'PP',            seguidores:3600,   nivel_ameaca:'alta'},
    ];
    return d.ranking;
  },[d]);

  const candidato=d?.candidato||{nome:'Cel. Barbosa',partido:'Republicanos',seguidores:31000,nivel_ameaca:'candidato',is_candidato:true};
  const threats=d?.ameacas_altas||ranking.filter(r=>r.nivel_ameaca==='alta'&&r.descricao);
  const internals=d?.internos||ranking.filter(r=>r.nivel_ameaca==='interno');
  const migrations=d?.migracoes||[
    {ab:'CG',abreviacao:'CG',nome:'Carlos Gaguim',        partido:'União Brasil',  destino:'Senado', detalhe:'67K IG · 33K FB'},
    {ab:'AG',abreviacao:'AG',nome:'Alexandre Guimarães',  partido:'MDB',           destino:'Senado', detalhe:'51K IG · Pres. MDB-TO'},
    {ab:'EB',abreviacao:'EB',nome:'Eli Borges',           partido:'Republicanos',  destino:'Senado', detalhe:'19K IG'},
    {ab:'PD',abreviacao:'PD',nome:'Profa. Dorinha',       partido:'União Brasil',  destino:'Governo',detalhe:'líder nas pesquisas'},
    {ab:'VJ',abreviacao:'VJ',nome:'Vicentinho Júnior',    partido:'PSDB',          destino:'Governo',detalhe:'87K IG'},
    {ab:'CM',abreviacao:'CM',nome:'Celso Morais',         partido:'MDB',           destino:'Desistiu',detalhe:'44K IG · prefeito reeleito'},
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

  const rankingWithMe=useMemo(()=>{
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
  <Card style={{marginTop:isMobile?0:32}}>
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:10,cursor:'pointer',marginBottom:open?18:0}} onClick={()=>setOpen(o=>!o)}>
      <div style={{display:'flex',alignItems:'center',gap:12}}>
        <div style={{background:'rgba(26,58,122,0.06)',border:'1px solid rgba(26,58,122,0.12)',borderRadius:12,padding:10}}><Target size={22} style={{color:'#1A3A7A'}}/></div>
        <div>
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            <h2 style={{fontSize:isMobile?18:22,fontWeight:800,color:'#1A2744',margin:0}}>Inteligência Competitiva — Câmara Federal TO 2026</h2>
            <HelpTooltip panelId="inteligencia"/>
          </div>
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
      <div style={{display:'grid',gridTemplateColumns:isMobile?'1fr':'minmax(0,2fr) minmax(0,1fr)',gap:isMobile?10:16,marginBottom:14}}>
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
            <div key={i} style={{display:'flex',flexDirection:isMobile?'column':'row',alignItems:isMobile?'stretch':'center',gap:isMobile?4:8,marginBottom:isMobile?4:(r.isMe?0:7),background:r.isMe?'rgba(26,58,122,0.05)':'transparent',borderRadius:r.isMe?6:0,padding:isMobile?'8px 4px':(r.isMe?'3px 4px':'0 4px'),border:r.isMe?'1px solid rgba(26,58,122,0.15)':'none'}}>
              {/* Linha 1: rank + nome + badge */}
              <div style={{display:'flex',alignItems:'center',gap:8}}>
                <span style={{width:20,fontSize:11,fontWeight:700,color:r.isMe?'#d4a017':'#8c93a8',textAlign:'right',flexShrink:0}}>{r.ranking}</span>
                <div style={{flex:1,minWidth:0}}>
                  <strong style={{fontSize:12,color:r.isMe?'#1a3a7a':'#1a1d2e',display:'block',lineHeight:1.2,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{r.nome}</strong>
                  <span style={{fontSize:10,color:'#8c93a8'}}>{r.partido}{r.nivel_ameaca==='interno'?'*':''}</span>
                </div>
                <div style={{display:'flex',alignItems:'center',gap:3,flexShrink:0}}>
                  <span style={{fontSize:9,fontWeight:700,padding:'2px 6px',borderRadius:8,background:tc.bg,color:tc.c}}>{nivelDin}</span>
                  {trend&&<span style={{fontSize:10,fontWeight:800,color:trendC,lineHeight:1}}>{trend}</span>}
                </div>
              </div>
              {/* Linha 2: barra + score */}
              {isMobile?(
                <div style={{display:'flex',alignItems:'center',gap:8,paddingLeft:28}}>
                  <div style={{flex:1,background:'#eef0f6',borderRadius:3,height:14,overflow:'hidden'}}>
                    <div style={{width:`${w}%`,height:'100%',background:barColor,borderRadius:3,display:'flex',alignItems:'center',paddingLeft:6,fontSize:10,fontWeight:700,color:'#fff',whiteSpace:'nowrap'}}>{fmtK(r.seguidores)}</div>
                  </div>
                  {!r.isMe&&r.score_ameaca!=null&&<span style={{fontSize:9,fontWeight:700,color:scoreC,flexShrink:0}}>{r.score_ameaca}</span>}
                </div>
              ):(
                <>
                  <div style={{flex:1,background:'#eef0f6',borderRadius:3,height:16,overflow:'hidden'}}>
                    <div style={{width:`${w}%`,height:'100%',background:barColor,borderRadius:3,display:'flex',alignItems:'center',paddingLeft:6,fontSize:10,fontWeight:700,color:'#fff',whiteSpace:'nowrap'}}>{fmtK(r.seguidores)}</div>
                  </div>
                  <div style={{width:76,textAlign:'right',flexShrink:0}}>
                    <div style={{display:'flex',alignItems:'center',justifyContent:'flex-end',gap:3,marginBottom:r.isMe||r.score_ameaca==null?0:2}}>
                      <span style={{fontSize:9,fontWeight:700,padding:'2px 6px',borderRadius:8,background:tc.bg,color:tc.c}}>{nivelDin}</span>
                      {trend&&<span style={{fontSize:10,fontWeight:800,color:trendC,lineHeight:1}}>{trend}</span>}
                    </div>
                    {!r.isMe&&r.score_ameaca!=null&&<span style={{fontSize:9,fontWeight:700,color:scoreC}}>{r.score_ameaca}</span>}
                  </div>
                </>
              )}
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

      <div style={{display:'grid',gridTemplateColumns:isMobile?'1fr':'minmax(0,1fr) minmax(0,1fr)',gap:isMobile?10:14,marginBottom:14}}>
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
}

export default memo(AdversariosPanel);

AdversariosPanel.propTypes = {
  adversariosData: PropTypes.shape({
    ranking:       PropTypes.arrayOf(PropTypes.shape({
      nome:         PropTypes.string.isRequired,
      username:     PropTypes.string,
      partido:      PropTypes.string,
      seguidores:   PropTypes.number,
      score_ameaca: PropTypes.number,
      nivel_ameaca: PropTypes.oneOf(['alta', 'média', 'baixa', 'interno']),
      destino:      PropTypes.string,
      is_interno:   PropTypes.bool,
    })),
    atualizado_em: PropTypes.string,
  }),
};

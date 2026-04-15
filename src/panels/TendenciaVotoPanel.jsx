import React, { useState, useMemo } from 'react';
import { TrendingUp, ChevronUp, ChevronDown } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, Bt, useWW } from '../components/ui.jsx';

const TV_CORES = {Conservador:'#1A3A7A',Dividido:'#D4A017',Progressista:'#B91C1C',gap:'#15803D'};

export default function TendenciaVotoPanel({tendenciaData}) {
  const[open,setOpen]=useState(true);
  const[filtroClass,setFiltroClass]=useState('all');
  const[sortKey,setSortKey]=useState('margem');
  const[sortDir,setSortDir]=useState(-1);
  const[chartView,setChartView]=useState('conservadores');
  const isMobile=useWW()<768;
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
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:10,cursor:'pointer',marginBottom:open?18:0}} onClick={()=>setOpen(o=>!o)}>
      <div style={{display:'flex',alignItems:'center',gap:12}}>
        <div style={{background:'rgba(26,58,122,0.06)',border:'1px solid rgba(26,58,122,0.12)',borderRadius:12,padding:10}}><TrendingUp size={22} style={{color:'#1A3A7A'}}/></div>
        <div>
          <h2 style={{fontSize:isMobile?18:22,fontWeight:800,color:'#1A2744',margin:0}}>Tendência de Voto 2022</h2>
          <p style={{fontSize:isMobile?11:12,color:'#8c93a8',fontWeight:700,textTransform:'uppercase',letterSpacing:'0.1em',margin:'2px 0 0'}}>2º turno presidencial · {agregado?.total_municipios??139} municípios · Fonte: TSE</p>
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

      <div style={{display:'grid',gridTemplateColumns:isMobile?'1fr':'repeat(3,1fr)',gap:isMobile?8:12,marginBottom:16}}>
        {[
          {label:'Municípios Conservadores',val:agregado.municipios_conservadores,cor:TV_CORES.Conservador,sub:'>60% Bolsonaro'},
          {label:'Municípios Divididos',val:agregado.municipios_divididos,cor:TV_CORES.Dividido,sub:'40–60% cada'},
          {label:'Municípios Progressistas',val:agregado.municipios_progressistas,cor:TV_CORES.Progressista,sub:'>60% Lula'},
        ].map(({label,val,cor,sub})=>(
          <Card key={label} style={{padding:isMobile?'10px 12px':'14px 16px',borderLeft:`4px solid ${cor}`}}>
            <p style={{fontSize:11,fontWeight:700,textTransform:'uppercase',color:'#8c93a8',margin:'0 0 6px',letterSpacing:'0.08em'}}>{label}</p>
            <p style={{fontSize:isMobile?24:32,fontWeight:900,color:cor,margin:0,lineHeight:1}}>{val}</p>
            <p style={{fontSize:11,color:'#8c93a8',margin:'4px 0 0'}}>{sub}</p>
          </Card>
        ))}
      </div>

      {agregado.municipios_com_gap>0&&(
        <div style={{background:'#0f2a1a',border:'1px solid #15803D',borderRadius:12,padding:isMobile?'12px':'16px 20px',marginBottom:16}}>
          <p style={{margin:0,color:'#D4A017',fontWeight:800,fontSize:isMobile?13:15}}>
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
        <ResponsiveContainer width="100%" height={isMobile?260:400}>
          <BarChart data={chartData} layout="vertical" margin={{left:0,right:isMobile?30:56}} barCategoryGap="30%" barGap={3}>
            <XAxis type="number" tick={{fontSize:11,fill:'#8c93a8'}} axisLine={false} tickLine={false} domain={[0,100]} tickFormatter={v=>`${v}%`}/>
            <YAxis type="category" dataKey="nome" width={isMobile?90:160} axisLine={false} tickLine={false}
              tick={(props)=>{
                const{x,y,payload}=props;
                const name=payload.value;
                const maxLen=isMobile?12:20;
                const display=name.length>maxLen?name.substring(0,maxLen-2)+'\u2026':name;
                return<text x={x} y={y} dy={4} textAnchor="end" fill="#5a6178" fontSize={isMobile?9:11} fontWeight={500}>{display}</text>;
              }}/>
            <Tooltip formatter={(v,n)=>[`${v}%`,n==='bols'?'Bolsonaro':'Lula']} contentStyle={{background:'#fff',border:'1px solid #dfe3ed',borderRadius:8,fontSize:13}}/>
            <Bar dataKey="bols" name="bols" fill={TV_CORES.Conservador} radius={[0,4,4,0]} barSize={isMobile?10:13} animationDuration={800} animationEasing="ease-out" label={{position:'right',fill:TV_CORES.Conservador,fontSize:isMobile?9:11,fontWeight:700,formatter:v=>`${v}%`}}/>
            <Bar dataKey="lula" name="lula" fill={TV_CORES.Progressista} radius={[0,4,4,0]} barSize={isMobile?10:13} animationDuration={800} animationEasing="ease-out" label={{position:'right',fill:TV_CORES.Progressista,fontSize:isMobile?9:11,fontWeight:700,formatter:v=>`${v}%`}}/>
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <Card>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:8,marginBottom:10}}>
          <p style={{fontSize:12,fontWeight:700,textTransform:'uppercase',color:'#8C93A8',margin:0}}>Todos os municípios ({tabelaDados.length})</p>
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
                  ...(hasShareRep&&!isMobile?[['Share REP','share_republicanos_dep_federal',75],['Gap?','gap_conversao',50]]:[]),
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
                  {hasShareRep&&!isMobile&&<>
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
}

import { Layers, Bookmark, User, AlertTriangle, Target, Building, Radio, Newspaper } from 'lucide-react';

export const CLUSTERS = [
  {id:'all',      label:'Todas',      icon:Layers,        color:'#8c93a8'},
  {id:'Eleitoral',label:'Eleitoral',  icon:Bookmark,      color:'#1A3A7A'},
  {id:'Comando',  label:'Comando',    icon:User,          color:'#1A3A7A'},
  {id:'Letalidade',label:'Letalidade',icon:AlertTriangle, color:'#b91c1c'},
  {id:'Operações',label:'Operações',  icon:Target,        color:'#1d4ed8'},
  {id:'Gestão',   label:'Gestão',     icon:Building,      color:'#d4a017'},
  {id:'Imprensa', label:'Imprensa',   icon:Radio,         color:'#be185d'},
  {id:'Geral',    label:'Geral',      icon:Newspaper,     color:'#8c93a8'},
];

export const sC = s => {
  if(s<=0.2)return{t:'#7F1D1D',b:'rgba(127,29,29,0.1)'};
  if(s<=0.4)return{t:'#B91C1C',b:'rgba(185,28,28,0.1)'};
  if(s<=0.6)return{t:'#8C93A8',b:'rgba(140,147,168,0.1)'};
  return{t:'#15803D',b:'rgba(21,128,61,0.1)'};
};

export const iC = i => ({Alto:'#ef4444',Médio:'#f59e0b',Baixo:'#22c55e'}[i]||'#f59e0b');

export const fmt = d => {
  if(!d)return'—';
  const x=new Date(d+'T12:00:00');
  return x.toLocaleDateString('pt-BR',{day:'2-digit',month:'short',year:'numeric'});
};

export const fmtDt = d => {
  if(!d)return'—';
  const[dt,hr]=d.split(' ');
  if(!dt)return'—';
  const[y,m,day]=dt.split('-');
  return`${day}/${m}/${y}${hr?' '+hr:''}`;
};

export const fmtK = n => n>=1000?`${(n/1000).toFixed(n>=10000?0:1)}K`:String(n||0);

export const metrics = data => {
  if(!data.length)return{tox:'0.0',tot:0,dir:0,ins:0,ele:0,nac:0,loc:0,src:0};
  const a=data.reduce((s,n)=>s+n.score,0)/data.length;
  return{
    tox:((1-a)*100).toFixed(1),
    tot:data.length,
    dir:data.filter(n=>n.mentionType==='direta').length,
    ins:data.filter(n=>n.mentionType==='institucional').length,
    ele:data.filter(n=>n.mentionType==='eleitoral').length,
    nac:data.filter(n=>n.scope==='BR').length,
    loc:data.filter(n=>n.scope==='TO').length,
    src:[...new Set(data.map(n=>n.source))].length,
  };
};

export const calcHeaderMetrics = (articles, adversariosRaw, socialData, sentimentData) => {
  const CANDIDATO = 'marciobarbosa_cel';
  const allSocial = Array.isArray(socialData) ? socialData : [];
  const latestDate = allSocial.reduce((mx,x)=>x.data_coleta>mx?x.data_coleta:mx,'');
  const snap = latestDate ? allSocial.filter(x=>x.data_coleta===latestDate) : allSocial;
  const candEntry = snap.find(x=>x.username===CANDIDATO);
  const engCand = candEntry?.taxa_engajamento_pct??null;
  const others = snap.filter(x=>x.username!==CANDIDATO&&x.taxa_engajamento_pct!=null);
  const engAvg = others.length ? Math.round((others.reduce((s,x)=>s+x.taxa_engajamento_pct,0)/others.length)*10)/10 : null;
  const engDelta = engCand!=null&&engAvg!=null ? Math.round((engCand-engAvg)*10)/10 : null;
  const igSentPct = sentimentData?.sentiment?.pct_positivo??null;
  const igSentNeg = sentimentData?.sentiment?.pct_negativo??null;
  const igSentDate = sentimentData?.data_coleta??null;
  const now=Date.now(), ms48=48*60*60*1000;
  const dt = a => { try{return new Date(a.date+'T12:00:00').getTime();}catch{return 0;} };
  const alerts = (articles||[]).filter(a=>dt(a)>=now-ms48&&a.relevance>=0.8).length;
  const totalAdv = adversariosRaw?.ranking?.length??0;
  return{engCand,engDelta,engAvg,igSentPct,igSentNeg,igSentDate,alerts,totalAdv};
};

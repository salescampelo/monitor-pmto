export const CL_RULES = [
  { id:'Eleitoral', kw:['pré-candidat','pre-candidat','candidato','candidatura','deputado','eleição','eleições','eleitoral','desincompatibilização','pleito','campanha'] },
  { id:'Comando',   kw:['comandante','comando','barbosa','márcio','marcio','cel.','coronel','mendonça','mendonca','passagem de comando','exoneração','nomeação'] },
  { id:'Letalidade',kw:['letalidade','intervenção policial','morte','morto','óbito','confronto','tiroteio','baleado','homicídio','resistência'] },
  { id:'Operações', kw:['operação','apreensão','prisão','preso','mandado','flagrante','tráfico','droga','arma','fuzil'] },
  { id:'Gestão',    kw:['promoção','formação','curso','concurso','efetivo','déficit','irregularidade','denúncia','mpe','tce','anuário'] },
  { id:'Imprensa',  kw:['imprensa','blog','jornalista','gabinete do ódio','censura','nota oficial'] },
];
export const NW = ['morte','morto','denúncia','irregularidade','ilegal','ódio','censura','destruí','ferido','violência','abuso','crise','homicídio','tiroteio','baleado'];
export const PW = ['homenage','homenagem','conquista','reconhec','reconhecimento','entrega','inaugur','capacita','formatur','solidariedade','integração','mediação','redução','queda','valorização','destaque','especial','podcast','entrevista','legado','liderança','convite','participação','presença','prestígio','elogio','condecoração','medalha','resultado','avanço'];

export const classify = a => {
  const t=(a.title+' '+(a.snippet||'')+' '+(a.matched_terms||[]).join(' ')).toLowerCase();
  let cl='Geral';
  for(const r of CL_RULES){if(r.kw.some(k=>t.includes(k))){cl=r.id;break;}}
  const ng=NW.filter(w=>t.includes(w)).length, ps=PW.filter(w=>t.includes(w)).length;
  let sc=Math.max(0.05,Math.min(0.95,0.5+ps*0.12-ng*0.13));
  let sn='Neutro';if(sc<=0.2)sn='Muito Negativo';else if(sc<=0.4)sn='Negativo';else if(sc>=0.7)sn='Positivo';
  let imp='Médio';if(a.mention_type==='direta'||a.mention_type==='eleitoral')imp='Alto';else if(a.scope==='BR')imp='Alto';else if(a.priority==='complementar'&&ng===0)imp='Baixo';
  return{id:a.hash_id||Math.random().toString(36).substr(2,9),date:a.detected_at?a.detected_at.split(' ')[0]:'',source:a.source_name||'?',title:a.title,sentiment:sn,score:Math.round(sc*100)/100,cluster:cl,impact:imp,keywords:a.matched_terms||[],url:a.url,mentionType:a.mention_type||'institucional',scope:a.scope||'TO',relevance:a.relevance_score||0,relevanceLabel:a.relevance_label||'',collectionMethod:a.collection_method||'RSS',indirectTerm:a.indirect_term||'',hostileSource:!!a.hostile_source,siteKey:a.site_key||'',analysisNote:`[${(a.scope||'TO')==='BR'?'NACIONAL':'LOCAL'}] ${a.mention_type||'institucional'} via ${a.source_name}. Termos: ${(a.matched_terms||[]).join(', ')}.${a.relevance_label?` Relevância: ${a.relevance_label} (${a.relevance_score})`:''}${a.indirect_term?` Ref. indireta: ${a.indirect_term}`:''}`};
};

import React from 'react';
import PropTypes from 'prop-types';

export default function PwModal({pw,setPw,handlePwChange,PW_INITIAL}) {
  if(!pw.show)return null;
  const mismatch=pw.new&&pw.confirm&&pw.new!==pw.confirm;
  const borderErr='#B91C1C', borderNorm='rgba(26,39,68,0.15)';
  const score=[/[a-z]/.test(pw.new),/[A-Z]/.test(pw.new),/\d/.test(pw.new),/[^a-zA-Z0-9]/.test(pw.new),pw.new.length>=8].filter(Boolean).length;
  const strength=[null,'fraca','fraca','média','forte','forte'][score];
  const strengthColor=['','#ef4444','#ef4444','#f59e0b','#22c55e','#22c55e'][score];
  return(
  <div style={{position:'fixed',inset:0,zIndex:500,background:'rgba(0,0,0,0.5)',display:'flex',alignItems:'center',justifyContent:'center',padding:20}}>
  <div style={{background:'#FFFFFF',borderRadius:16,padding:32,maxWidth:400,width:'100%',boxShadow:'0 8px 32px rgba(0,0,0,0.2)'}}>
    <h2 style={{fontSize:18,fontWeight:700,color:'#1A2744',margin:'0 0 20px'}}>Alterar senha</h2>
    <div style={{display:'flex',flexDirection:'column',gap:12}}>
      <div>
        <input type="password" placeholder="Nova senha (mín. 8 caracteres)" value={pw.new}
          onChange={e=>setPw(p=>({...p,new:e.target.value,error:''}))}
          style={{border:`1px solid ${mismatch?borderErr:borderNorm}`,borderRadius:8,padding:12,fontSize:14,outline:'none',fontFamily:'inherit',transition:'border-color 0.15s',width:'100%',boxSizing:'border-box'}}
          onFocus={e=>e.target.style.borderColor='#D4A017'} onBlur={e=>e.target.style.borderColor=mismatch?borderErr:borderNorm}/>
        {pw.new&&(
          <div style={{marginTop:6,display:'flex',alignItems:'center',gap:8}}>
            <div style={{flex:1,height:4,borderRadius:4,background:'rgba(26,39,68,0.08)',overflow:'hidden'}}>
              <div style={{width:`${(score/5)*100}%`,height:'100%',background:strengthColor,borderRadius:4,transition:'width 0.3s,background 0.3s'}}/>
            </div>
            <span style={{fontSize:11,fontWeight:700,color:strengthColor,minWidth:36}}>{strength}</span>
          </div>
        )}
      </div>
      <input type="password" placeholder="Confirmar senha" value={pw.confirm}
        onChange={e=>setPw(p=>({...p,confirm:e.target.value,error:''}))}
        style={{border:`1px solid ${mismatch?borderErr:borderNorm}`,borderRadius:8,padding:12,fontSize:14,outline:'none',fontFamily:'inherit',transition:'border-color 0.15s',width:'100%',boxSizing:'border-box'}}
        onFocus={e=>e.target.style.borderColor='#D4A017'} onBlur={e=>e.target.style.borderColor=mismatch?borderErr:borderNorm}/>
      {mismatch&&<p style={{fontSize:12,color:'#B91C1C',margin:0}}>As senhas não coincidem.</p>}
      {pw.error&&<p style={{fontSize:12,color:'#B91C1C',margin:0}}>{pw.error}</p>}
      {pw.success&&<p style={{fontSize:12,color:'#15803D',margin:0,fontWeight:600}}>Senha alterada com sucesso!</p>}
      <div style={{display:'flex',gap:8,marginTop:4}}>
        <button onClick={handlePwChange} disabled={pw.loading||pw.new.length<6||pw.new!==pw.confirm||score<2}
          style={{flex:1,background:'#1A2744',color:'#FFFFFF',border:'none',borderRadius:8,padding:'12px 24px',fontSize:14,fontWeight:700,cursor:'pointer',opacity:pw.loading||pw.new.length<6||pw.new!==pw.confirm||score<2?0.5:1,fontFamily:'inherit'}}>
          {pw.loading?'Salvando...':'Salvar'}
        </button>
        <button onClick={()=>setPw(PW_INITIAL)}
          style={{padding:'12px 16px',background:'transparent',border:'none',color:'#5A6478',fontSize:14,cursor:'pointer',fontFamily:'inherit'}}>
          Cancelar
        </button>
      </div>
    </div>
  </div>
  </div>
  );
}

PwModal.propTypes = {
  pw: PropTypes.shape({
    show:    PropTypes.bool,
    new:     PropTypes.string,
    confirm: PropTypes.string,
    error:   PropTypes.string,
    success: PropTypes.bool,
    loading: PropTypes.bool,
  }).isRequired,
  setPw:        PropTypes.func.isRequired,
  handlePwChange: PropTypes.func.isRequired,
  PW_INITIAL:   PropTypes.object.isRequired,
};

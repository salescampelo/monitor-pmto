import React, { useState, useEffect } from 'react';
import { CONFIG } from '../lib/config.js';

const SocialMonitor = () => {
  const [socialData, setSocialData] = useState([]);

  useEffect(() => {
    fetch('/social_metrics.json')
      .then(res => res.json())
      .then(data => {
        const latest = Object.values(data.reduce((acc, c) => { acc[c.username] = c; return acc; }, {}));
        setSocialData(latest.sort((a, b) => b.seguidores - a.seguidores));
      })
      .catch(err => console.error("Erro JSON:", err));
  }, []);

  return (
    <div style={{ background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(51,65,85,0.4)', borderRadius: 20, padding: 24, marginTop: 24 }}>
      <h2 style={{ fontSize: 18, fontWeight: 800, color: '#f1f5f9', marginBottom: 16 }}>Radar de Redes Sociais</h2>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', color: '#cbd5e1' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(51,65,85,0.4)', fontSize: 11, color: '#64748b' }}>
              <th style={{ padding: 12, textAlign: 'left' }}>PERFIL</th>
              <th style={{ padding: 12, textAlign: 'right' }}>SEGUIDORES</th>
              <th style={{ padding: 12, textAlign: 'right' }}>ENGAJAMENTO</th>
            </tr>
          </thead>
          <tbody>
            {socialData.map((p, i) => (
              <tr key={i} style={{ borderBottom: '1px solid rgba(51,65,85,0.1)', background: p.username === CONFIG.CANDIDATE_USERNAME ? 'rgba(59,130,246,0.1)' : 'transparent' }}>
                <td style={{ padding: 12 }}>{i+1}º @{p.username}</td>
                <td style={{ padding: 12, textAlign: 'right' }}>{p.seguidores.toLocaleString('pt-BR')}</td>
                <td style={{ padding: 12, textAlign: 'right', color: '#4ade80' }}>{p.taxa_engajamento_pct}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SocialMonitor;
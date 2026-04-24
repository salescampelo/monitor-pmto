import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase.js';
import HelpTooltip from '../components/HelpTooltip.jsx';

const ACTION_STYLE = {
  login:          { bg: '#dcfce7', color: '#166534' },
  logout:         { bg: '#fee2e2', color: '#991b1b' },
  panel_view:     { bg: '#dbeafe', color: '#1e40af' },
  password_change:{ bg: '#fef9c3', color: '#854d0e' },
};

const actionStyle = (action) =>
  ACTION_STYLE[action] || { bg: '#f1f5f9', color: '#475569' };

export default function AuditoriaPanel() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const { data, error: err } = await supabase
          .from('access_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(100);
        if (err) throw err;
        setLogs(data || []);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return (
    <div style={{ padding: 32, display: 'flex', alignItems: 'center', gap: 10, color: '#64748b', fontSize: 14 }}>
      <div style={{ width: 18, height: 18, border: '2px solid #e2e8f0', borderTopColor: '#1A2744', borderRadius: '50%', animation: 'spin 0.8s linear infinite', flexShrink: 0 }}/>
      Carregando logs de auditoria...
    </div>
  );

  if (error) return (
    <div style={{ margin: 24, padding: 16, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, color: '#b91c1c', fontSize: 13 }}>
      <strong>Erro ao carregar logs:</strong> {error}
    </div>
  );

  return (
    <div style={{ padding: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: '#1A2744', margin: 0 }}>Auditoria de Acessos</h2>
            <HelpTooltip panelId="auditoria"/>
          </div>
          <p style={{ fontSize: 12, color: '#8C93A8', margin: '4px 0 0', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.08em' }}>
            Visível apenas para administradores
          </p>
        </div>
        <span style={{ fontSize: 13, color: '#64748b', background: '#f1f5f9', padding: '4px 10px', borderRadius: 6 }}>
          {logs.length} registro{logs.length !== 1 ? 's' : ''}
        </span>
      </div>

      {logs.length === 0 ? (
        <div style={{ padding: 32, textAlign: 'center', color: '#8C93A8', fontSize: 14 }}>
          Nenhum log de acesso registrado ainda.
        </div>
      ) : (
        <div style={{ background: '#fff', borderRadius: 8, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  {['Data/Hora', 'Usuário', 'Ação', 'Detalhe'].map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#475569', borderBottom: '1px solid #e2e8f0', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {logs.map((log, i) => {
                  const { bg, color } = actionStyle(log.action);
                  return (
                    <tr key={log.id || i} style={{ borderBottom: '1px solid #f1f5f9' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                      onMouseLeave={e => e.currentTarget.style.background = ''}>
                      <td style={{ padding: '10px 16px', color: '#64748b', whiteSpace: 'nowrap', fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                        {new Date(log.created_at).toLocaleString('pt-BR', {
                          day: '2-digit', month: '2-digit', year: 'numeric',
                          hour: '2-digit', minute: '2-digit',
                        })}
                      </td>
                      <td style={{ padding: '10px 16px', color: '#334155', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {log.user_email || '—'}
                      </td>
                      <td style={{ padding: '10px 16px' }}>
                        <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', background: bg, color }}>
                          {log.action}
                        </span>
                      </td>
                      <td style={{ padding: '10px 16px', color: '#64748b', maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={log.detail || ''}>
                        {log.detail || '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

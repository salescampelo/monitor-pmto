import { useState } from 'react';
import { HelpCircle, X } from 'lucide-react';

const PANEL_DESCRIPTIONS = {
  tendencia: {
    title: 'Tendência de Voto',
    description: 'Classificação dos 139 municípios do TO com base no 2º turno presidencial de 2022. Identifica territórios conservadores, divididos e progressistas para direcionar esforços de campanha.',
  },
  inteligencia: {
    title: 'Inteligência Competitiva',
    description: 'Ranking dos principais adversários na disputa por vagas de Deputado Federal. Score de ameaça calculado com base em votos anteriores, presença digital e sobreposição de eleitorado.',
  },
  metas: {
    title: 'Metas da Campanha',
    description: 'Acompanhamento dos KPIs estratégicos por fase. Indicadores de seguidores, engajamento, cobertura territorial e projeção de votos com metas definidas no plano de campanha.',
  },
  eleitoral: {
    title: 'Dados Eleitorais',
    description: 'Base de 139 municípios com população, eleitorado e potencial de votos. Priorização automática para alocação de recursos e agenda de visitas.',
  },
  campo: {
    title: 'Mapa de Campo',
    description: 'Visualização da capilaridade territorial. Coordenadores regionais, lideranças mapeadas e histórico de visitas por município.',
  },
  social: {
    title: 'Redes Sociais',
    description: 'Métricas de Instagram do candidato e adversários. Evolução de seguidores, taxa de engajamento e análise de sentimento dos comentários.',
  },
  imprensa: {
    title: 'Monitor de Imprensa',
    description: 'Menções ao candidato em veículos de notícias. Classificação por relevância, tipo de cobertura e sentimento detectado automaticamente.',
  },
  auditoria: {
    title: 'Auditoria',
    description: 'Registro de acessos ao sistema. Histórico de logins e ações para controle de segurança.',
  },
};

export default function HelpTooltip({ panelId }) {
  const [isOpen, setIsOpen] = useState(false);
  const info = PANEL_DESCRIPTIONS[panelId];

  if (!info) return null;

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label={`Ajuda sobre ${info.title}`}
        aria-expanded={isOpen}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '4px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '50%',
          transition: 'background 0.2s',
        }}
        onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.05)'}
        onMouseLeave={e => e.currentTarget.style.background = 'none'}
      >
        <HelpCircle size={18} color="#64748b" aria-hidden="true" />
      </button>

      {isOpen && (
        <>
          <div
            onClick={() => setIsOpen(false)}
            style={{ position: 'fixed', inset: 0, zIndex: 40 }}
            aria-hidden="true"
          />
          <div
            role="tooltip"
            style={{
              position: 'absolute',
              top: '100%',
              right: 0,
              marginTop: '8px',
              width: '280px',
              background: '#FFFFFF',
              borderRadius: '8px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
              border: '1px solid #E2E8F0',
              padding: '16px',
              zIndex: 50,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
              <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#1E293B', margin: 0 }}>
                {info.title}
              </h4>
              <button
                onClick={() => setIsOpen(false)}
                aria-label="Fechar ajuda"
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', display: 'flex' }}
              >
                <X size={16} color="#94A3B8" aria-hidden="true" />
              </button>
            </div>
            <p style={{ fontSize: '13px', color: '#64748B', lineHeight: '1.5', margin: 0 }}>
              {info.description}
            </p>
          </div>
        </>
      )}
    </div>
  );
}

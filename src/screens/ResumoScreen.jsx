import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './ResumoScreen.css';

// Serviços de integração com a API (Back-End)
import { obterDashboardGeral, obterDashboardMes } from '../services/visitaService';

/**
 * CONSTANTES DE TEMA
 * @description Centraliza as cores do design system do componente para facilitar a manutenção de UI e garantir consistência.
 */
const THEME = {
  BG_DARK: '#121212', CARD_DARK: '#1E1E1E', YELLOW: '#FFD500', WHITE: '#FFFFFF',
  GRAY_TEXT: '#A0A0A0', SUCCESS: '#28a745', MISSAO: '#FF4500', OFERTA: '#17a2b8'
};

/**
 * COMPONENTE: ResumoScreen
 * @description Tela de consolidação de resultados (Fechamento do Dia).
 * Exibe a performance diária e o impacto acumulado no mês, incluindo a posição do Ranking.
 */
const ResumoScreen = () => {
  const navigate = useNavigate();
  
  // =========================================================================
  // 1. STATE MANAGEMENT (Gerenciamento de Estado)
  // =========================================================================
  const [isLoading, setIsLoading] = useState(true);
  const [dadosHoje, setDadosHoje] = useState(null);
  const [dadosMes, setDadosMes] = useState(null);

  // =========================================================================
  // 2. LIFECYCLE HOOKS (Efeitos de Ciclo de Vida do React)
  // =========================================================================

  /**
   * Hook disparado na montagem da tela. 
   * Busca em paralelo o desempenho do dia atual e o acumulado do mês.
   */
  useEffect(() => {
    const carregarResumos = async () => {
      try {
        setIsLoading(true);
        
        // Recupera a identidade do usuário logado direto do cache seguro do navegador
        const setorLogado = localStorage.getItem('setorAtivo') || '---';

        // O Promise.all garante que ambas as requisições ocorram simultaneamente,
        // reduzindo o tempo de espera do usuário e otimizando o tráfego de rede.
        const [resumoHoje, resumoMensal] = await Promise.all([
          obterDashboardGeral(setorLogado),
          obterDashboardMes(setorLogado)
        ]);
        
        setDadosHoje(resumoHoje);
        setDadosMes(resumoMensal);
      } catch (error) {
        console.error("Erro Crítico ao puxar resumo corporativo:", error);
      } finally {
        setIsLoading(false);
      }
    };
    carregarResumos();
  }, []);

  // =========================================================================
  // 3. FUNÇÕES DE NAVEGAÇÃO E CONTROLE
  // =========================================================================

  /**
   * Encerra o dia de trabalho limpando a pilha de navegação e retornando ao painel de Login.
   */
  const handleFecharResumo = () => {
    // O parâmetro 'replace: true' destrói o histórico de navegação anterior.
    // Isso é uma prática de segurança para impedir que o usuário volte ao painel 
    // usando a seta de "voltar" do navegador após encerrar a sessão.
    navigate('/Login', { replace: true });
  };

  // =========================================================================
  // 4. MICRO-COMPONENTES (Componentes de UI Reutilizáveis)
  // =========================================================================

  /**
   * @component ProgressRing
   * @description Renderiza um anel de progresso circular para exibição das metas diárias.
   */
  const ProgressRing = ({ valor, total, cor, label, icone }) => {
    const percent = total > 0 ? Math.round((valor / total) * 100) : 0;
    return (
      <div className="ringContainer">
        <div className="ringCircle" style={{ borderColor: cor }}>
            <span className="ringIcon">{icone}</span>
            <span className="ringValue">{valor || 0}</span>
        </div>
        <span className="ringLabel">{label}</span>
        <span className="ringPercent" style={{ color: cor }}>{percent}% da Meta</span>
      </div>
    );
  };

  /**
   * @component StatCard
   * @description Renderiza um cartão estatístico retangular flexível para o consolidado do mês.
   */
  const StatCard = ({ titulo, valor, icone, corIcone }) => (
    <div className="statCard">
      <div className="iconContainer" style={{ backgroundColor: corIcone + '20' }}>
        <span className="statIcon" style={{ color: corIcone }}>{icone}</span>
      </div>
      <div className="statTextWrapper">
        <span className="statValue">{valor || 0}</span>
        <span className="statTitle" title={titulo}>{titulo}</span>
      </div>
    </div>
  );

  // =========================================================================
  // 5. RENDERIZAÇÃO PRINCIPAL (UI)
  // =========================================================================

  // Feedback visual (Spinner) exibido enquanto aguarda as Promises da API resolverem
  if (isLoading) {
    return (
      <div className="resumoContainer loadingContainer">
        <span className="loadingSpinner" style={{ color: THEME.YELLOW }}>⏳</span>
        <span style={{ color: THEME.GRAY_TEXT, marginTop: 15 }}>A calcular os resultados...</span>
      </div>
    );
  }

  return (
    <div className="resumoContainer">
      <div className="scrollArea">
        
        {/* CABEÇALHO */}
        <div className="header">
          <h1 className="headerTitle">Resumo da Jornada</h1>
          <span className="headerDate">TRABALHO FINALIZADO</span>
        </div>

        {/* SESSÃO 1: RESULTADOS DO DIA */}
        <h2 className="sectionTitle">🚀 Desempenho de Hoje</h2>
        <div className="todayCard">
            <div className="visitasRow">
                <span className="visitasLabel">Visitas Realizadas:</span>
                <span className="visitasValue">
                    {dadosHoje?.pdvsVisitados || 0} <span className="visitasTotal">clientes</span>
                </span>
            </div>
            <div className="ringsRow">
                <ProgressRing valor={dadosHoje?.tasksTotal} total={35} cor={THEME.YELLOW} label="Tasks" icone="📋" />
                <ProgressRing valor={dadosHoje?.ofertasTotal} total={10} cor={THEME.OFERTA} label="Ofertas" icone="🏷️" />
                <ProgressRing valor={dadosHoje?.missoesTotal} total={10} cor={THEME.MISSAO} label="Missões" icone="🎯" />
            </div>
        </div>

        {/* SESSÃO 2: ACUMULADO DO MÊS (HUB MANUAL + APP VISITADO) */}
        <h2 className="sectionTitle">🏆 Conquistas do Mês</h2>
        <span className="sectionSubtitle">Visão geral do seu impacto individual.</span>

        <div className="statsGrid">
            {/* 🔥 FALLBACK MAPPING: Compatibilidade retroativa com variáveis antigas e novas da API Java */}
            <StatCard icone="📅" corIcone={THEME.YELLOW} valor={dadosMes?.diasReais || dadosMes?.diasTrabalhados || 0} titulo="Dias Trabalhados" />
            <StatCard icone="✅" corIcone={THEME.SUCCESS} valor={dadosMes?.totalResolvidos || dadosMes?.problemasResolvidos || 0} titulo="Problemas Resolvidos" />
            <StatCard icone="⚡" corIcone={THEME.OFERTA} valor={dadosMes?.totalTasks || dadosMes?.totalTasksMes || 0} titulo="Total de Tasks" />
            <StatCard icone="🏅" corIcone={THEME.MISSAO} valor={dadosMes?.textoRanking || dadosMes?.ranking || "Calculando..."} titulo="Seu Ranking Atual" />
        </div>
        
        <div className="footerSpacing" />
      </div>
      
      {/* FOOTER FIXO (BOTÃO DE ENCERRAMENTO) */}
      <div className="fixedFooter">
        <button className="closeButton" onClick={handleFecharResumo}>
            <span className="closeButtonText">ENCERRAR DIA</span>
        </button>
      </div>
    </div>
  );
};

export default ResumoScreen;
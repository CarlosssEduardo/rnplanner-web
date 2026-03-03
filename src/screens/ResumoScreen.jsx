import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './ResumoScreen.css';

// Mantendo os seus imports de serviço 100% originais
import { obterDashboardGeral, obterDashboardMes } from '../services/visitaService';

const THEME = {
  BG_DARK: '#121212', CARD_DARK: '#1E1E1E', YELLOW: '#FFD500', WHITE: '#FFFFFF',
  GRAY_TEXT: '#A0A0A0', SUCCESS: '#28a745', MISSAO: '#FF4500', OFERTA: '#17a2b8'
};

const ResumoScreen = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  
  // Estados para guardar os dados que vêm do Java
  const [dadosHoje, setDadosHoje] = useState(null);
  const [dadosMes, setDadosMes] = useState(null);

  useEffect(() => {
    const carregarResumos = async () => {
      try {
        setIsLoading(true);
        
        // 🔥 A MÁGICA: Pega o setor logado no seu aparelho
        const setorLogado = localStorage.getItem('setorAtivo') || '---';

        // 🔥 Agora enviamos o setor como "RG" para o Java saber quem é você!
        const [resumoHoje, resumoMensal] = await Promise.all([
          obterDashboardGeral(setorLogado),
          obterDashboardMes(setorLogado)
        ]);
        
        setDadosHoje(resumoHoje);
        setDadosMes(resumoMensal);
      } catch (error) {
        console.error("Erro ao puxar resumo", error);
      } finally {
        setIsLoading(false);
      }
    };
    carregarResumos();
  }, []);

  const handleFecharResumo = () => {
    // Substitui a limpeza de pilha do RN e volta à Home
    navigate('/Login', { replace: true });
  };

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
        <div className="header">
          <h1 className="headerTitle">Resumo da Jornada</h1>
          <span className="headerDate">TRABALHO FINALIZADO</span>
        </div>

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

        <h2 className="sectionTitle">🏆 Conquistas do Mês</h2>
        <span className="sectionSubtitle">Visão geral do seu impacto individual..</span>

        <div className="statsGrid">
            <StatCard icone="📅" corIcone={THEME.YELLOW} valor={dadosMes?.diasTrabalhados} titulo="Dias Trabalhados" />
            <StatCard icone="✅" corIcone={THEME.SUCCESS} valor={dadosMes?.problemasResolvidos} titulo="Problemas Resolvidos" />
            <StatCard icone="⚡" corIcone={THEME.OFERTA} valor={dadosMes?.totalTasksMes} titulo="Total de Tasks" />
            {/* 🔥 Ranking dinâmico vindo direto do Java */}
            <StatCard icone="🏅" corIcone={THEME.MISSAO} valor={dadosMes?.ranking || "Calculando..."} titulo="Seu Ranking Atual" />
        </div>
        
        <div className="footerSpacing" />
      </div>
      
      <div className="fixedFooter">
        <button className="closeButton" onClick={handleFecharResumo}>
            <span className="closeButtonText">ENCERRAR DIA</span>
        </button>
      </div>
    </div>
  );
};

export default ResumoScreen;
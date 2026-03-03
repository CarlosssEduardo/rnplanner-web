import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './HomeScreen.css';
import { listarPdvs } from '../services/pdvService';
import { obterDashboardGeral, obterPendenciasGlobais, consultarRastreio } from '../services/visitaService';

const getDiaAtual = () => {
  const dias = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
  return dias[new Date().getDay()];
};

const HomeScreen = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const setorLogado = localStorage.getItem('setorAtivo') || '---';
  
  // ==========================================
  // ESTADOS PRINCIPAIS
  // ==========================================
  const [pdvs, setPdvs] = useState([]);
  const [dashboard, setDashboard] = useState({ 
    pdvsVisitados: 0, tasksTotal: 0, ofertasTotal: 0, missoesTotal: 0, pdvsVisitadosIds: [] 
  });
  const [pendenciasGlobais, setPendenciasGlobais] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [jornadaAtiva, setJornadaAtiva] = useState(() => localStorage.getItem('jornadaAtiva') === 'true');

  // Filtros Globais e Abas
  const [diaSelecionado, setDiaSelecionado] = useState(getDiaAtual());
  const [buscaPesquisa, setBuscaPesquisa] = useState('');
  const [buscaPendencia, setBuscaPendencia] = useState('');
  const [filtroConcluidas, setFiltroConcluidas] = useState('PENDENTES');
  const [filtroPendenciasGlobal, setFiltroPendenciasGlobal] = useState('PENDENTE');

  // Controle de Modais Originais
  const [modalFiltroVisible, setModalFiltroVisible] = useState(false);
  const [modalEntregasVisible, setModalEntregasVisible] = useState(false);
  const [modalPendenciasVisible, setModalPendenciasVisible] = useState(false);
  const [modalReabrir, setModalReabrir] = useState({ visible: false, pdv: null });
  const [modalFinalizar, setModalFinalizar] = useState(false);

  // Estados do Rastreio (Entregas)
  const [pesquisaRastreio, setPesquisaRastreio] = useState('');
  const [dadosRastreio, setDadosRastreio] = useState(null);
  const [isLoadingRastreio, setIsLoadingRastreio] = useState(false);
  const [buscouRastreio, setBuscouRastreio] = useState(false);

  // 🔥 ESTADOS: LANÇAMENTO MANUAL E ALERTA PREMIUM (TOAST)
  const [modalManualVisible, setModalManualVisible] = useState(false);
  const [formManual, setFormManual] = useState({ tasks: '', ofertas: '', missoes: '', pendencia: '' });
  const [isSavingManual, setIsSavingManual] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });

  const DIAS_SEMANA = ['Todos', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

  // ==========================================
  // EFEITOS DE CICLO DE VIDA E UTILIDADES
  // ==========================================
  useEffect(() => {
    localStorage.setItem('jornadaAtiva', jornadaAtiva);
    if (jornadaAtiva) carregarDados();
  }, [jornadaAtiva]);

  useEffect(() => {
    document.title = `RN Planner - Setor ${setorLogado}`;
  }, [setorLogado]);

  useEffect(() => {
    const setorSalvo = localStorage.getItem('setorAtivo');
    if (!setorSalvo) navigate('/', { replace: true });
  }, [navigate]);

  useEffect(() => {
    if (location.state?.openPendencias) {
      abrirPainelPendencias();
      if (location.state?.abaPendencia) setFiltroPendenciasGlobal(location.state.abaPendencia);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  // Função para chamar o Alerta Bonitão
  const showToast = (message, type = 'success') => {
    setToast({ visible: true, message, type });
    setTimeout(() => setToast({ visible: false, message: '', type: 'success' }), 4000);
  };

  // ==========================================
  // FUNÇÕES DE CARREGAMENTO E AÇÕES DA ROTA
  // ==========================================
  const carregarDados = async () => {
    try {
      setIsLoading(true);
      const [dadosPdvs, dadosDash, dadosPendencias] = await Promise.all([
        listarPdvs(setorLogado), 
        obterDashboardGeral(setorLogado),
        obterPendenciasGlobais().catch(() => [])
      ]);
      setPdvs(dadosPdvs);
      setDashboard(dadosDash);
      setPendenciasGlobais(dadosPendencias || []);
    } catch (error) {
      console.error("Erro de sincronização:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePressPdv = (pdv) => {
    const isConcluido = (dashboard.pdvsVisitadosIds || []).map(String).includes(String(pdv.id)); 
    if (isConcluido) {
      setModalReabrir({ visible: true, pdv: pdv });
    } else {
      navigate('/visita', { state: { pdvId: pdv.id, pdvNome: pdv.nome } });
    }
  };

  const confirmarReabertura = () => {
    if (modalReabrir.pdv) {
        navigate('/visita', { state: { pdvId: modalReabrir.pdv.id, pdvNome: modalReabrir.pdv.nome } });
        setModalReabrir({ visible: false, pdv: null });
    }
  };

  const confirmarFinalizacaoJornada = () => {
    setJornadaAtiva(false);
    setModalFinalizar(false);
    navigate('/resumo');
  };

  // 🔥 SALVAR LANÇAMENTO MANUAL (AVULSO)
  const handleSalvarManual = async () => {
    setIsSavingManual(true);
    try {
      // ⚠️ ATENÇÃO: COLOQUE A URL DO SEU BACK-END NO AZURE AQUI!
      // Se for testar na sua máquina, mude para: http://localhost:8080
      const BASE_URL = 'http://localhost:8080'; 

      if (formManual.tasks || formManual.ofertas || formManual.missoes) {
        await fetch(`${BASE_URL}/lancamento-manual/salvar`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            setor: setorLogado,
            tasks: Number(formManual.tasks) || 0,
            ofertas: Number(formManual.ofertas) || 0,
            missoes: Number(formManual.missoes) || 0
          })
        });
      }

      if (formManual.pendencia.trim() !== '') {
        await fetch(`${BASE_URL}/pendencias-manuais/salvar`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            setor: setorLogado,
            texto: formManual.pendencia
          })
        });
      }

      setFormManual({ tasks: '', ofertas: '', missoes: '', pendencia: '' });
      setModalManualVisible(false);
      carregarDados(); 
      showToast("Lançamento avulso registrado com sucesso! 🚀", "success");
    } catch (error) {
      console.error(error);
      showToast("Erro ao salvar! Verifique se o Back-end está online.", "error");
    } finally {
      setIsSavingManual(false);
    }
  };

  // ==========================================
  // LÓGICA DE RASTREIO
  // ==========================================
  const abrirModalEntregas = () => {
    setPesquisaRastreio('');
    setDadosRastreio(null);
    setBuscouRastreio(false);
    setModalEntregasVisible(true);
  };

  const fecharModalEntregas = () => {
    setModalEntregasVisible(false);
    setPesquisaRastreio('');
    setDadosRastreio(null);
  };

  const handleBuscarEntrega = async () => {
    if (!pesquisaRastreio.trim()) return;
    
    setIsLoadingRastreio(true);
    setBuscouRastreio(true);
    setDadosRastreio(null);

    try {
      const resultado = await consultarRastreio(pesquisaRastreio.trim());
      if (resultado) {
        setDadosRastreio({
          pdvId: resultado.pdvId,
          nomePdv: resultado.nomePdv,
          motorista: resultado.motorista || "Não Identificado",
          status: resultado.status,
          horario: resultado.horario || "Indisponível" 
        });
      } else {
        setDadosRastreio(null);
      }
    } catch (error) {
      console.error("Erro ao buscar carga:", error);
    } finally {
      setIsLoadingRastreio(false);
    }
  };

  // ==========================================
  // FUNÇÕES DO PAINEL DE PENDÊNCIAS
  // ==========================================
  const abrirPainelPendencias = async () => {
    setModalPendenciasVisible(true);
    try {
      const dadosPend = await obterPendenciasGlobais();
      setPendenciasGlobais(dadosPend || []);
    } catch (error) {
      console.error("Erro ao buscar pendências:", error);
    }
  };

  const pendenciasFiltradasEBusca = (pendenciasGlobais || []).filter(p => {
    const matchStatus = p.status === filtroPendenciasGlobal;
    const nomeSeguro = p.pdvNome ? p.pdvNome.toLowerCase() : '';
    const textoSeguro = p.texto ? p.texto.toLowerCase() : '';
    const buscaSegura = buscaPendencia ? buscaPendencia.toLowerCase() : '';
    return matchStatus && (nomeSeguro.includes(buscaSegura) || textoSeguro.includes(buscaSegura));
  });

  // ==========================================
  // CÁLCULOS E FILTROS DE LISTA
  // ==========================================
  const pdvsFiltrados = pdvs.filter(pdv => {
    const diaDoPdv = pdv.diaSemana || pdv.rota || '';
    const matchDia = diaSelecionado === 'Todos' || diaDoPdv.toLowerCase().includes(diaSelecionado.toLowerCase());
    const termo = buscaPesquisa.toLowerCase();
    const matchBusca = pdv.nome.toLowerCase().includes(termo) || String(pdv.id).includes(termo);
    const pdvsConcluidosIds = (dashboard.pdvsVisitadosIds || []).map(String);
    const isConcluido = pdvsConcluidosIds.includes(String(pdv.id)); 
    const matchConcluidas = filtroConcluidas === 'PENDENTES' ? !isConcluido : isConcluido;
    return matchDia && matchBusca && matchConcluidas;
  });

  const totalVisitasRota = pdvs.filter(pdv => {
    const diaDoPdv = pdv.diaSemana || pdv.rota || '';
    return diaSelecionado === 'Todos' || diaDoPdv.toLowerCase().includes(diaSelecionado.toLowerCase());
  }).length;

  // ==========================================
  // RENDERIZAÇÃO DE COMPONENTES VISUAIS
  // ==========================================

  // 🔥 A NOVA BARRA GLOBAL (PORCENTAGEM E EXPLOSÃO)
  const renderGlobalProgressBar = (atual, meta) => {
    const metaReal = meta > 0 ? meta : 1;
    const progressoPercent = Math.round((atual / metaReal) * 100);
    const bateuMeta = progressoPercent >= 100;
    // Trava a largura do preenchimento em 100% pra não vazar a tela
    const widthVisual = Math.min(progressoPercent, 100);

    return (
      <div className="metaContainer" style={{ marginBottom: '20px' }}>
        <div className="metaHeader">
          <span className="metaLabel" style={{ color: '#FFD500', fontSize: '15px', textTransform: 'uppercase' }}>
            🔥 Progresso Global de Vendas
          </span>
          <span className="metaText" style={{ color: '#FFD500', fontSize: '20px', fontWeight: '900', textShadow: bateuMeta ? '0px 0px 10px #FF4500' : 'none' }}>
            {progressoPercent}% {bateuMeta && '💥🚀'}
          </span>
        </div>
        <div className={`progressBarBackground ${bateuMeta ? 'barraExplosao' : ''}`} style={{ height: '14px', backgroundColor: '#222', border: bateuMeta ? '1px solid #FFD500' : 'none' }}>
          <div
            className="progressBarFill"
            style={{
              width: `${widthVisual}%`,
              background: bateuMeta ? 'linear-gradient(90deg, #FFD500, #FF4500)' : 'linear-gradient(90deg, #B8860B, #FFD500)'
            }}
          ></div>
        </div>
      </div>
    );
  };

  const renderProgressBar = (atual, meta, corHex, label) => {
    const metaReal = meta > 0 ? meta : 1; 
    const progresso = Math.min((atual / metaReal) * 100, 100);
    const bateuMeta = atual >= metaReal;
    return (
      <div className="metaContainer">
        <div className="metaHeader">
          <span className="metaLabel">{label}</span>
          <span className={`metaText ${bateuMeta ? 'successText' : ''}`}>
            {atual} / {metaReal} {bateuMeta && '🏆'}
          </span>
        </div>
        <div className="progressBarBackground">
          <div className="progressBarFill" style={{ width: `${progresso}%`, backgroundColor: bateuMeta ? '#28a745' : corHex }}></div>
        </div>
      </div>
    );
  };

  const renderColmeiaBackground = () => (
    <div className="bgColmeiaContainer">
      <div className="honeycombHex" style={{ top: '-20px', left: '-40px' }}></div>
      <div className="honeycombHex" style={{ top: '80px', right: '-50px' }}></div>
      <div className="honeycombHex" style={{ top: '220px', left: '20px' }}></div>
      <div className="honeycombHex" style={{ top: '350px', right: '-20px' }}></div>
    </div>
  );

  const renderModalRastreio = () => {
    if (!modalEntregasVisible) return null;
    return (
      <div className="modalOverlayPro">
        <div className="modalFiltroContent">
          <div className="modalHeader">
            <h3 className="modalTitle">Janela de Entrega 🚚</h3>
            <button onClick={fecharModalEntregas} className="closeModalText">FECHAR ❌</button>
          </div>

          <div className="novaPendenciaRow">
            <input 
              type="number" 
              className="novaPendenciaInput" 
              placeholder="ID do PDV (ex: 55107)" 
              value={pesquisaRastreio} 
              onChange={(e) => setPesquisaRastreio(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleBuscarEntrega()}
            />
            <button className="btnAddPendencia btnBuscaRastreio" onClick={handleBuscarEntrega} disabled={isLoadingRastreio}>
              {isLoadingRastreio ? '...' : 'BUSCAR'}
            </button>
          </div>

          {buscouRastreio && !isLoadingRastreio && dadosRastreio && (
            <div className="rastreioCardClean">
              <div className="rastreioPdvHeaderClean">
                <span className="rastreioPdvNomeClean">{dadosRastreio.nomePdv}</span>
                <span className="rastreioPdvIdClean">#{dadosRastreio.pdvId}</span>
              </div>

              <div className="rastreioStatusBox">
                {dadosRastreio.status === 'CONCLUDED' ? (
                  <><span className="rastreioStatusText statusGreen">✅ ENTREGUE</span>
                  <span className="rastreioSubStatus">A mercadoria já foi entregue no local.</span></>
                ) : dadosRastreio.status === 'IN_TREATMENT' ? (
                  <><span className="rastreioStatusText statusTratamento">🛠️ EM TRATAMENTO</span>
                  <span className="rastreioSubStatus">Aguardando resolução pela central.</span></>
                ) : dadosRastreio.status === 'RESCHEDULED' ? (
                  <><span className="rastreioStatusText statusDanger">🔄 REPROGRAMADA</span>
                  <span className="rastreioSubStatus">A entrega foi adiada para outra data.</span></>
                ) : (
                  <><span className="rastreioStatusText statusOrange">⏳ JANELA PENDENTE</span>
                  <span className="rastreioSubStatus">Caminhão a caminho. Aguarde no local.</span></>
                )}
              </div>

              <div className="rastreioInfoRowMotorista">
                <span className="rastreioLabelClean">Motorista Responsável</span>
                <span className="rastreioDriverClean">{dadosRastreio.motorista}</span>
              </div>

              <div className="rastreioInfoRowMotorista" style={{marginTop: '10px'}}>
                <span className="rastreioLabelClean">⏰ Status do Horário / Fila</span>
                <span className="rastreioDriverClean">{dadosRastreio.horario}</span>
              </div>
            </div>
          )}

          {buscouRastreio && !isLoadingRastreio && !dadosRastreio && (
            <div className="rastreioCardClean rastreioErroCard">
              <span className="rastreioStatusText statusDanger" style={{textAlign: 'center', width: '100%'}}>Nenhuma carga encontrada!</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  // ==========================================
  // RENDERIZAÇÃO PRINCIPAL (MAIN RETURN)
  // ==========================================
  return (
    <div className="home-safe-area">
      
      {/* HEADER */}
      <div className="headerArea">
        {renderColmeiaBackground()}
        
        <div className="headerContentWrapper">
            <h1 className="headerTitle">Minha Rota - Setor {setorLogado}</h1>
            
            {!jornadaAtiva ? (
              <div className="iniciarJornadaCard">
                <span className="iniciarJornadaIcon">🌅</span>
                <div className="iniciarJornadaTextos">
                  <h3 className="iniciarJornadaTitle">Bom dia, RN!</h3>
                  <p className="iniciarJornadaDesc">Pronto para iniciar?</p>
                </div>
                <button className="iniciarJornadaBtn" onClick={() => setJornadaAtiva(true)}>
                    <span className="iniciarJornadaBtnText">▶ INICIAR</span>
                </button>
              </div>
            ) : (
              <div className="activeHeaderContainer">
                <h2 className="headerSubtitle">Resumo do Dia</h2>
                
                {!isLoading && (
                  <div className="dashboard-card-glass">
                    
                    {/* 🔥 BARRA GLOBAL (PORCENTAGEM) INJETADA AQUI */}
                    {renderGlobalProgressBar(
                      (dashboard.tasksTotal + dashboard.ofertasTotal + dashboard.missoesTotal), 
                      55
                    )}

                    <hr style={{ borderColor: 'rgba(255,255,255,0.1)', margin: '15px 0' }}/>

                    {renderProgressBar((dashboard.pdvsVisitadosIds || []).length, totalVisitasRota, '#28a745', '📍 Visitas do Dia')}
                    {renderProgressBar(dashboard.tasksTotal, 35, '#FFD500', '📋 Tasks')}
                    {renderProgressBar(dashboard.ofertasTotal, 10, '#17a2b8', '🏷️ Ofertas')}
                    {renderProgressBar(dashboard.missoesTotal, 10, '#FF4500', '🎯 Missões')}
                  </div>
                )}

                <button className="btnLancamentoManual" onClick={() => setModalManualVisible(true)}>
                    ➕ LANÇAMENTO AVULSO NA RUA
                </button>

                <div className="botoes3Row">
                  <button className="btnAcaoAmarelo" onClick={abrirPainelPendencias}>
                      <span className="btnAcaoTextAmarelo">📌 PENDÊNCIAS</span>
                  </button>
                  <button className="btnAcaoAzul" onClick={abrirModalEntregas}>
                      <span className="btnAcaoTextAzul">🚚 ENTREGAS</span>
                  </button>
                  <button className="btnAcaoVermelho" onClick={() => setModalFinalizar(true)}>
                      <span className="btnAcaoTextVermelho">⏹ FINALIZAR</span>
                  </button>
                </div>
              </div>
            )}
        </div>
      </div>

      {/* CONTEÚDO DA LISTA DE PDVS */}
      {!jornadaAtiva ? (
        <div className="inactiveContainer">
          <span className="inactiveEmoji">😴</span>
          <h2 className="inactiveTitle">Rota em Repouso</h2>
          <p className="inactiveDesc">Inicie a sua jornada no topo do ecrã.</p>
        </div>
      ) : (
        <div className="mainContent">
          
          <div className="searchBarContainer">
            <button className="fakeSearchBar" onClick={() => setModalFiltroVisible(true)}>
              <span className="fakeSearchIcon">🔍</span>
              <span className="fakeSearchPlaceholder">Buscar PDV ou Filtrar ({diaSelecionado})...</span>
            </button>
          </div>

          <div className="quickFilterRow">
            <button className={`quickFilterBtn ${filtroConcluidas === 'PENDENTES' ? 'quickFilterBtnActive' : ''}`} onClick={() => setFiltroConcluidas('PENDENTES')}>
                <span className={`quickFilterText ${filtroConcluidas === 'PENDENTES' ? 'quickFilterTextActive' : ''}`}>⏳ Pendentes</span>
            </button>
            <button className={`quickFilterBtn ${filtroConcluidas === 'CONCLUIDAS' ? 'quickFilterBtnActive' : ''}`} onClick={() => setFiltroConcluidas('CONCLUIDAS')}>
                <span className={`quickFilterText ${filtroConcluidas === 'CONCLUIDAS' ? 'quickFilterTextActive' : ''}`}>✅ Concluídas</span>
            </button>
          </div>

          <div className="listContainer">
            {pdvsFiltrados.map(pdv => {
                const isConcluido = (dashboard.pdvsVisitadosIds || []).map(String).includes(String(pdv.id)); 
                return (
                    <div key={pdv.id} className={`cardPdv ${isConcluido ? 'cardPdvConcluido' : ''}`} onClick={() => handlePressPdv(pdv)}>
                        <div className="cardHeader">
                            <span className="cardTitle">{pdv.nome}</span>
                            <span className="codigoText">#{pdv.id}</span>
                        </div>
                        <div className="cardBody">
                            <span className="addressText">📅 Rota: {pdv.diaSemana || pdv.rota}</span>
                        </div>
                        <div className="cardFooter">
                            {isConcluido ? (
                                <span className="actionText actionTextConcluido">✅ REABRIR VISITA ↻</span>
                            ) : (
                                <button className="btnIniciarVisitaDestaque">INICIAR VISITA →</button>
                            )}
                        </div>
                    </div>
                );
            })}
            {pdvsFiltrados.length === 0 && <p className="emptyPendenciasText">Nenhum PDV encontrado.</p>}
          </div>
        </div>
      )}

      {/* RENDERIZAÇÃO DOS MODAIS ORGANIZADOS */}
      {renderModalRastreio()}

      {/* MODAL FILTROS DA ROTA */}
      {modalFiltroVisible && (
          <div className="modalOverlayPro">
              <div className="modalFiltroContent">
                  <div className="modalHeader">
                      <h3 className="modalTitle">Filtrar Clientes</h3>
                      <button onClick={() => setModalFiltroVisible(false)} className="closeModalText">FECHAR ❌</button>
                  </div>
                  <span className="labelFiltro">Buscar por Nome ou ID:</span>
                  <input type="text" className="searchInputModal" placeholder="Ex: Mercantil ou #55391..." value={buscaPesquisa} onChange={(e) => setBuscaPesquisa(e.target.value)} autoFocus />
                  <span className="labelFiltro">Filtrar por Dia da Rota:</span>
                  <div className="diasGrid">
                      {DIAS_SEMANA.map((dia) => (
                          <button key={dia} className={`diaBadge ${diaSelecionado === dia ? 'diaBadgeActive' : ''}`} onClick={() => setDiaSelecionado(dia)}>{dia}</button>
                      ))}
                  </div>
                  <button className="aplicarFiltroButton" onClick={() => setModalFiltroVisible(false)}>VER RESULTADOS</button>
              </div>
          </div>
      )}

      {/* MODAL PENDÊNCIAS */}
      {modalPendenciasVisible && (
          <div className="modalOverlayPro">
              <div className="modalFiltroContent modalPendenciasContent">
                  <div className="modalHeader">
                      <div>
                          <h3 className="modalTitle">Painel de Pendências</h3>
                          <span className="subTitlePendencias">Gestão global de acordos.</span>
                      </div>
                      <button onClick={() => setModalPendenciasVisible(false)} className="closeModalText">FECHAR ❌</button>
                  </div>
                  <input type="text" className="searchInputModal" placeholder="Buscar por cliente ou problema..." value={buscaPendencia} onChange={(e) => setBuscaPendencia(e.target.value)} />
                  <div className="abasPendencias">
                      <button className={`abaBtn ${filtroPendenciasGlobal === 'PENDENTE' ? 'abaBtnAtiva' : ''}`} onClick={() => setFiltroPendenciasGlobal('PENDENTE')}>⏳ PENDENTES</button>
                      <button className={`abaBtn ${filtroPendenciasGlobal === 'RESOLVIDO' ? 'abaBtnAtiva' : ''}`} onClick={() => setFiltroPendenciasGlobal('RESOLVIDO')}>✅ RESOLVIDAS</button>
                  </div>
                  <div className="scrollPendencias">
                      {pendenciasFiltradasEBusca.length === 0 ? (
                          <p className="emptyPendenciasText">Nenhuma pendência encontrada com este filtro.</p>
                      ) : (
                          pendenciasFiltradasEBusca.map((pendencia, index) => (
                              <div key={index} className="pendenciaCardGlobal">
                                  <div className="pendenciaPdvInfo">
                                      <span className="pendenciaPdvName">{pendencia.pdvNome}</span>
                                      <span className="pendenciaPdvId">#{pendencia.pdvId}</span>
                                  </div>
                                  <div className="pendenciaTextoBox">
                                      <div className={`statusIndicatorGlobal ${pendencia.status === 'RESOLVIDO' ? 'statusResolvido' : 'statusPendente'}`}></div>
                                      <span className={`pendenciaTexto ${pendencia.status === 'RESOLVIDO' ? 'pendenciaTextoRiscado' : ''}`}>{pendencia.texto}</span>
                                  </div>
                                  <button className="irParaPdvBtnAmarelo" onClick={() => { setModalPendenciasVisible(false); navigate('/visita', { state: { pdvId: pendencia.pdvId, pdvNome: pendencia.pdvNome, modo: 'PENDENCIAS_ONLY' } }); }}>
                                      ABRIR VISITA ➔
                                  </button>
                              </div>
                          ))
                      )}
                  </div>
              </div>
          </div>
      )}

      {/* AVISOS NATIVOS */}
      {modalReabrir.visible && (
        <div className="modalOverlayPro"><div className="modalBoxPro"><div className="modalHeaderPro"><h3>Visita Finalizada ✅</h3></div><div className="modalBodyPro"><p>Deseja reabrir a visita?</p></div><div className="modalFooterPro"><button className="btnModalCancel" onClick={() => setModalReabrir({ visible: false, pdv: null })}>CANCELAR</button><button className="btnModalConfirm" onClick={confirmarReabertura}>SIM</button></div></div></div>
      )}

      {modalFinalizar && (
        <div className="modalOverlayPro"><div className="modalBoxPro"><div className="modalHeaderPro"><h3>Encerrar Rota? ⏹️</h3></div><div className="modalBodyPro"><p>Deseja finalizar a sua jornada e ver o Resumo do Dia?</p></div><div className="modalFooterPro"><button className="btnModalCancel" onClick={() => setModalFinalizar(false)}>VOLTAR</button><button className="btnModalConfirm" onClick={confirmarFinalizacaoJornada}>FINALIZAR</button></div></div></div>
      )}

      {/* 🔥 MODAL DE LANÇAMENTO MANUAL */}
      {modalManualVisible && (
          <div className="modalOverlayPro">
              <div className="modalFiltroContent" style={{ paddingBottom: '30px' }}>
                  <div className="modalHeader">
                      <h3 className="modalTitle">Lançamento Avulso ✍️</h3>
                      <button onClick={() => setModalManualVisible(false)} className="closeModalText">FECHAR ❌</button>
                  </div>
                  <p style={{ color: '#666', fontSize: '14px', marginBottom: '15px' }}>
                    Anote vendas e pendências feitas fora da rota oficial. Elas somarão na sua barra de progresso!
                  </p>
                  
                  <div className="inputGroupAvulso">
                    <label>📋 Tasks Executadas:</label>
                    <input type="number" placeholder="0" value={formManual.tasks} onChange={(e) => setFormManual({...formManual, tasks: e.target.value})} />
                  </div>
                  
                  <div className="inputGroupAvulso">
                    <label>🏷️ Ofertas Vendidas:</label>
                    <input type="number" placeholder="0" value={formManual.ofertas} onChange={(e) => setFormManual({...formManual, ofertas: e.target.value})} />
                  </div>

                  <div className="inputGroupAvulso">
                    <label>🎯 Missões Concluídas:</label>
                    <input type="number" placeholder="0" value={formManual.missoes} onChange={(e) => setFormManual({...formManual, missoes: e.target.value})} />
                  </div>

                  <div style={{ marginTop: '20px' }}>
                    <label className="labelFiltro" style={{ color: '#000' }}>⚠️ Nova Pendência Avulsa:</label>
                    <textarea 
                        className="textAreaAvulso" 
                        rows="3" 
                        placeholder="Ex: Falar com supervisor sobre material..."
                        value={formManual.pendencia}
                        onChange={(e) => setFormManual({...formManual, pendencia: e.target.value})}
                    />
                  </div>

                  <button 
                      className="btnSalvarAvulso" 
                      onClick={handleSalvarManual} 
                      disabled={isSavingManual}
                  >
                      {isSavingManual ? 'SALVANDO...' : 'SALVAR NA NUVEM ☁️'}
                  </button>
              </div>
          </div>
      )}

      {/* 🔥 O NOSSO ALERTA PREMIUM (TOAST) */}
      {toast.visible && (
        <div className={`toastGlobalPro ${toast.type === 'success' ? 'toastSuccess' : 'toastError'}`}>
          <span style={{ fontSize: '20px' }}>{toast.type === 'success' ? '✅' : '❌'}</span>
          <p className="toastText">{toast.message}</p>
        </div>
      )}

    </div>
  );
};

export default HomeScreen;
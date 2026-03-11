import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './HomeScreen.css';
import { listarPdvs } from '../services/pdvService';
import { 
  obterDashboardGeral, 
  obterPendenciasGlobais, 
  consultarRastreio, 
  resolverPendenciaManual, 
  deletarPendenciaManual 
} from '../services/visitaService';

const getDiaAtual = () => {
  const dias = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
  return dias[new Date().getDay()];
};

const HomeScreen = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const setorLogado = localStorage.getItem('setorAtivo') || '---';
  
  const [pdvs, setPdvs] = useState([]);
  const [dashboard, setDashboard] = useState({ 
    pdvsVisitados: 0, 
    tasksTotal: 0, 
    ofertasTotal: 0, 
    missoesTotal: 0, 
    pdvsVisitadosIds: [],
    tasksCompraTotal: 0, 
    tasksCervejaTotal: 0, 
    tasksNabTotal: 0, 
    tasksMktTotal: 0,
    compradoresTotal: 0,
    positivacaoTotal: 0, 
    metaTasksDia: 37,
    metaMissoesDia: 10,
    metaOfertasDia: 10,
    metaCompradorDia: 1,
    metaTasksCompraDia: 10,
    metaTasksCervejaDia: 9,
    metaTasksNabDia: 9,
    metaTasksMktDia: 9,
    metaPositivacaoDia: 9 
  });
  const [pendenciasGlobais, setPendenciasGlobais] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [jornadaAtiva, setJornadaAtiva] = useState(() => localStorage.getItem('jornadaAtiva') === 'true');

  const [buscaPesquisa, setBuscaPesquisa] = useState('');
  const [buscaPendencia, setBuscaPendencia] = useState('');
  const [filtroConcluidas, setFiltroConcluidas] = useState('PENDENTES');
  const [filtroPendenciasGlobal, setFiltroPendenciasGlobal] = useState('PENDENTE');

  const [modalFiltroVisible, setModalFiltroVisible] = useState(false);
  const [modalEntregasVisible, setModalEntregasVisible] = useState(false);
  const [modalPendenciasVisible, setModalPendenciasVisible] = useState(false);
  const [modalReabrir, setModalReabrir] = useState({ visible: false, pdv: null });
  const [modalFinalizar, setModalFinalizar] = useState(false);

  const [pesquisaRastreio, setPesquisaRastreio] = useState('');
  const [dadosRastreio, setDadosRastreio] = useState(null);
  const [isLoadingRastreio, setIsLoadingRastreio] = useState(false);
  const [buscouRastreio, setBuscouRastreio] = useState(false);

  const [modalManualVisible, setModalManualVisible] = useState(false);
  const [formManual, setFormManual] = useState({ 
    ofertas: 0, missoes: 0, pendencia: '',
    compra: 0, cerveja: 0, nab: 0, mkt: 0, comprador: 0 
  });
  const [isSavingManual, setIsSavingManual] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });

  const formatarTextoPendencia = (texto) => {
    try {
      const parsed = JSON.parse(texto);
      if (Array.isArray(parsed)) {
        const itensPendentes = parsed.filter(p => p.status !== 'RESOLVIDO');
        if (itensPendentes.length > 0) {
          return itensPendentes.map(p => `• ${p.texto}`).join("  |  ");
        } else {
          return "✅ Todos os itens resolvidos!";
        }
      }
      return parsed.texto || texto;
    } catch (e) {
      return texto;
    }
  };

  const renderContadorHub = (titulo, valor, campo, cor) => (
    <div className="contadorCard" style={{ borderLeft: `6px solid ${cor}`, marginBottom: '12px', width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span className="contadorTitle">{titulo}</span>
      <div className="contadorControls" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button className="btnControl" onClick={() => setFormManual({...formManual, [campo]: Math.max(0, (Number(valor) || 0) - 1)})}>-</button>
        <input type="number" className="contadorInput" value={valor} style={{ width: '50px', textAlign: 'center' }} readOnly />
        <button className="btnControl" style={{ backgroundColor: cor, color: "#FFF" }} onClick={() => setFormManual({...formManual, [campo]: (Number(valor) || 0) + 1})}>+</button>
      </div>
    </div>
  );

  useEffect(() => {
    localStorage.setItem('jornadaAtiva', jornadaAtiva);
    if (jornadaAtiva) carregarDados();
  }, [jornadaAtiva]);

  useEffect(() => {
    document.title = `RN Planner - Setor ${setorLogado}`;
    const setorSalvo = localStorage.getItem('setorAtivo');
    if (!setorSalvo) navigate('/', { replace: true });
  }, [navigate, setorLogado]);

  useEffect(() => {
    if (location.state?.openPendencias) {
      abrirPainelPendencias();
      if (location.state?.abaPendencia) setFiltroPendenciasGlobal(location.state.abaPendencia);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  const showToast = (message, type = 'success') => {
    setToast({ visible: true, message, type });
    setTimeout(() => setToast({ visible: false, message: '', type: 'success' }), 4000);
  };

  const carregarDados = async () => {
    try {
      setIsLoading(true);
      const [dadosPdvs, dadosDash, dadosPendencias] = await Promise.all([
        listarPdvs(setorLogado), 
        obterDashboardGeral(setorLogado),
        obterPendenciasGlobais().catch(() => [])
      ]);
      setPdvs(dadosPdvs);
      if (dadosDash) setDashboard(dadosDash);
      setPendenciasGlobais(dadosPendencias || []);
    } catch (error) {
      console.error("Erro de sincronização:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // 🔥 SOLUÇÃO: Passar o idUnico para o backend encontrar a chave primária
  const handlePressPdv = (pdv) => {
    const isConcluido = (dashboard.pdvsVisitadosIds || []).map(String).includes(String(pdv.idUnico)) || 
                        (dashboard.pdvsVisitadosIds || []).map(String).includes(String(pdv.id)); 
    if (isConcluido) {
      setModalReabrir({ visible: true, pdv: pdv });
    } else {
      navigate('/visita', { state: { pdvId: pdv.idUnico || pdv.id, pdvNome: pdv.nome } });
    }
  };

  // 🔥 SOLUÇÃO: Passar o idUnico aqui também
  const confirmarReabertura = () => {
    if (modalReabrir.pdv) {
        navigate('/visita', { state: { pdvId: modalReabrir.pdv.idUnico || modalReabrir.pdv.id, pdvNome: modalReabrir.pdv.nome } });
        setModalReabrir({ visible: false, pdv: null });
    }
  };

  const confirmarFinalizacaoJornada = () => {
    setJornadaAtiva(false);
    setModalFinalizar(false);
    navigate('/resumo');
  };

  const handleAcaoManual = async (idCompleto, acao) => {
    const idNumeric = typeof idCompleto === 'string' ? idCompleto.replace('MANUAL-', '') : idCompleto;
    try {
      if (acao === 'resolver') {
        await resolverPendenciaManual(idNumeric);
        showToast("Registro marcado como resolvido! ✅", "success");
      } else {
        await deletarPendenciaManual(idNumeric);
        showToast("Registro removido com sucesso! 🗑️", "success");
      }
      const dadosPend = await obterPendenciasGlobais();
      setPendenciasGlobais(dadosPend || []);
    } catch (error) {
      console.error(error);
      showToast("Erro ao processar a ação.", "error");
    }
  };

  const handleSalvarManual = async () => {
    setIsSavingManual(true);
    try {
      const BASE_URL = 'https://rnplanner-api-ekc2hratcvgqhgc5.brazilsouth-01.azurewebsites.net'; 
      const payload = {
        setor: setorLogado,
        ofertas: Number(formManual.ofertas) || 0,
        missoes: Number(formManual.missoes) || 0,
        tasksCompra: Number(formManual.compra) || 0,
        tasksCerveja: Number(formManual.cerveja) || 0,
        tasksNab: Number(formManual.nab) || 0,
        tasksMkt: Number(formManual.mkt) || 0,
        comprador: formManual.comprador > 0
      };

      payload.tasks = payload.tasksCompra + payload.tasksCerveja + payload.tasksNab + payload.tasksMkt;

      if (payload.tasks > 0 || payload.ofertas > 0 || payload.missoes > 0 || payload.comprador) {
        await fetch(`${BASE_URL}/lancamento-manual/salvar`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }

      if (formManual.pendencia.trim() !== '') {
        await fetch(`${BASE_URL}/pendencias-manuais/salvar`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ setor: setorLogado, texto: formManual.pendencia })
        });
      }

      setFormManual({ compra: 0, cerveja: 0, nab: 0, mkt: 0, ofertas: 0, missoes: 0, pendencia: '', comprador: 0 });
      setModalManualVisible(false);
      carregarDados(); 
      showToast("Hub de Execução atualizado com sucesso! 🚀", "success");
    } catch (error) {
      console.error(error);
      showToast("Erro ao salvar! Verifique se o Back-end está online.", "error");
    } finally {
      setIsSavingManual(false);
    }
  };

  const abrirModalEntregas = () => { setPesquisaRastreio(''); setDadosRastreio(null); setBuscouRastreio(false); setModalEntregasVisible(true); };
  const fecharModalEntregas = () => { setModalEntregasVisible(false); setPesquisaRastreio(''); setDadosRastreio(null); };

  const handleBuscarEntrega = async () => {
    if (!pesquisaRastreio.trim()) return;
    setIsLoadingRastreio(true); setBuscouRastreio(true); setDadosRastreio(null);
    try {
      const resultado = await consultarRastreio(pesquisaRastreio.trim());
      if (resultado) {
        setDadosRastreio({
          pdvId: resultado.pdvId, nomePdv: resultado.nomePdv, motorista: resultado.motorista || "Não Identificado",
          status: resultado.status, horario: resultado.horario || "Indisponível" 
        });
      }
    } catch (error) { console.error("Erro ao buscar carga:", error); } 
    finally { setIsLoadingRastreio(false); }
  };

  const abrirPainelPendencias = async () => {
    setModalPendenciasVisible(true);
    try {
      const dadosPend = await obterPendenciasGlobais();
      setPendenciasGlobais(dadosPend || []);
    } catch (error) { console.error("Erro ao buscar pendências:", error); }
  };

  const pendenciasFiltradasEBusca = (pendenciasGlobais || []).filter(p => {
    const matchStatus = p.status === filtroPendenciasGlobal;
    const nomeSeguro = p.pdvNome ? p.pdvNome.toLowerCase() : '';
    const textoSeguro = p.texto ? p.texto.toLowerCase() : '';
    const buscaSegura = buscaPendencia ? buscaPendencia.toLowerCase() : '';
    return matchStatus && (nomeSeguro.includes(buscaSegura) || textoSeguro.includes(buscaSegura));
  });

  // 🔥 SOLUÇÃO: Verificação ajustada do ID para os filtros e para pintar de verde
  const pdvsFiltrados = pdvs.filter(pdv => {
    const termo = buscaPesquisa.toLowerCase();
    const matchBusca = pdv.nome.toLowerCase().includes(termo) || String(pdv.id).includes(termo);
    const pdvsConcluidosIds = (dashboard.pdvsVisitadosIds || []).map(String);
    const isConcluido = pdvsConcluidosIds.includes(String(pdv.idUnico)) || pdvsConcluidosIds.includes(String(pdv.id)); 
    const matchConcluidas = filtroConcluidas === 'PENDENTES' ? !isConcluido : isConcluido;
    return matchBusca && matchConcluidas;
  });

  const renderGlobalProgressBar = (atual, meta) => {
    const metaReal = meta > 0 ? meta : 1;
    const progressoPercent = Math.round((atual / metaReal) * 100);
    const bateuMeta = progressoPercent >= 100;
    const widthVisual = Math.min(progressoPercent, 100);

    return (
      <div className="metaContainer" style={{ marginBottom: '20px' }}>
        <div className="metaHeader">
          <span className="metaLabel" style={{ color: '#FFD500', fontSize: '15px', textTransform: 'uppercase' }}>🔥 Performance de Execução</span>
          <span className="metaText" style={{ color: '#FFD500', fontSize: '20px', fontWeight: '900', textShadow: bateuMeta ? '0px 0px 10px #FF4500' : 'none' }}>
            {progressoPercent}% {bateuMeta && '💥🚀'}
          </span>
        </div>
        <div className={`progressBarBackground ${bateuMeta ? 'barraExplosao' : ''}`} style={{ height: '14px', backgroundColor: '#222', border: bateuMeta ? '1px solid #FFD500' : 'none' }}>
          <div className="progressBarFill" style={{ width: `${widthVisual}%`, background: bateuMeta ? 'linear-gradient(90deg, #FFD500, #FF4500)' : 'linear-gradient(90deg, #B8860B, #FFD500)' }}></div>
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
          <span className="metaLabel" style={{ color: '#FFF' }}>{label}</span>
          <span className={`metaText ${bateuMeta ? 'successText' : ''}`} style={{ color: '#FFF' }}>
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

  return (
    <div className="home-safe-area">
      <div className="headerArea">
        {renderColmeiaBackground()}
        <div className="headerContentWrapper">
            
            <h1 className="headerTitle">Minha Rota - Setor {setorLogado}</h1>
            
            {!jornadaAtiva ? (
              <div className="iniciarJornadaCard">
                <span className="iniciarJornadaIcon">🌅</span>
                <div className="iniciarJornadaTextos"><h3 className="iniciarJornadaTitle">Bom dia, RN!</h3><p className="iniciarJornadaDesc">Pronto para iniciar?</p></div>
                <button className="iniciarJornadaBtn" onClick={() => setJornadaAtiva(true)}><span className="iniciarJornadaBtnText">▶ INICIAR</span></button>
              </div>
            ) : (
              <div className="activeHeaderContainer">
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <h2 className="headerSubtitle" style={{ marginBottom: 0 }}>Resumo do Dia</h2>
                  
                  {(dashboard.pdvsVisitadosIds || []).length > 0 && (
                    <span style={{ backgroundColor: '#28a745', color: '#FFF', padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}>
                      ✅ {(dashboard.pdvsVisitadosIds || []).length} Visita(s)
                    </span>
                  )}
                </div>

                {!isLoading && (
                  <div className="dashboard-card-glass">
                    
                    {renderGlobalProgressBar(
                      (dashboard.tasksTotal + dashboard.ofertasTotal + dashboard.missoesTotal + (dashboard.compradoresTotal || 0) + (dashboard.positivacaoTotal || 0)), 
                      (dashboard.metaTasksDia + dashboard.metaMissoesDia + dashboard.metaOfertasDia + dashboard.metaCompradorDia + dashboard.metaPositivacaoDia)
                    )}

                    <hr style={{ borderColor: 'rgba(255,255,255,0.1)', margin: '15px 0' }}/>
                    
                    {renderProgressBar(dashboard.tasksTotal, dashboard.metaTasksDia, '#FFD500', '📋 Tasks Totais')}
                    {renderProgressBar(dashboard.ofertasTotal, dashboard.metaOfertasDia, '#17a2b8', '🏷️ Ofertas')}
                    {renderProgressBar(dashboard.missoesTotal, dashboard.metaMissoesDia, '#FF4500', '🎯 Missões')}
                    
                    {renderProgressBar(dashboard.positivacaoTotal || 0, dashboard.metaPositivacaoDia, '#28a745', '✅ Meta Positivação')}

                    <hr style={{ borderColor: 'rgba(255,255,255,0.1)', margin: '15px 0' }}/>
                    <h3 style={{color: '#FFF', fontSize: '14px', marginBottom: '12px'}}>Subdivisão das Tasks</h3>
                    
                    {renderProgressBar(dashboard.tasksCompraTotal, dashboard.metaTasksCompraDia, '#FFD500', '🛒 Compras')}
                    {renderProgressBar(dashboard.tasksCervejaTotal, dashboard.metaTasksCervejaDia, '#FFD500', '🍺 Cerveja')}
                    {renderProgressBar(dashboard.tasksNabTotal, dashboard.metaTasksNabDia, '#FFD500', '🥤 NAB')}
                    {renderProgressBar(dashboard.tasksMktTotal, dashboard.metaTasksMktDia, '#FFD500', '📺 MKT')}
                    
                    {renderProgressBar(dashboard.compradoresTotal || 0, dashboard.metaCompradorDia, '#28a745', '🛍️ Comprador')}

                  </div>
                )}
                <button className="btnLancamentoManual" onClick={() => setModalManualVisible(true)}>➕ Hub de Execução</button>
                <div className="botoes3Row">
                  <button className="btnAcaoAmarelo" onClick={abrirPainelPendencias}><span className="btnAcaoTextAmarelo">📌 PENDÊNCIAS</span></button>
                  <button className="btnAcaoAzul" onClick={abrirModalEntregas}><span className="btnAcaoTextAzul">🚚 ENTREGAS</span></button>
                  <button className="btnAcaoVermelho" onClick={() => setModalFinalizar(true)}><span className="btnAcaoTextVermelho">⏹ FINALIZAR</span></button>
                </div>
              </div>
            )}
        </div>
      </div>

      {jornadaAtiva && pdvs.length > 0 && (
        <div className="mainContent">
          <div className="searchBarContainer">
            <button className="fakeSearchBar" onClick={() => setModalFiltroVisible(true)}>
              <span className="fakeSearchIcon">🔍</span>
              <span className="fakeSearchPlaceholder">Buscar PDV por Nome ou ID...</span>
            </button>
          </div>

          <div className="quickFilterRow">
            <button className={`quickFilterBtn ${filtroConcluidas === 'PENDENTES' ? 'quickFilterBtnActive' : ''}`} onClick={() => setFiltroConcluidas('PENDENTES')}><span className={`quickFilterText ${filtroConcluidas === 'PENDENTES' ? 'quickFilterTextActive' : ''}`}>⏳ Pendentes</span></button>
            <button className={`quickFilterBtn ${filtroConcluidas === 'CONCLUIDAS' ? 'quickFilterBtnActive' : ''}`} onClick={() => setFiltroConcluidas('CONCLUIDAS')}><span className={`quickFilterText ${filtroConcluidas === 'CONCLUIDAS' ? 'quickFilterTextActive' : ''}`}>✅ Concluídas</span></button>
          </div>

          <div className="listContainer">
            {pdvsFiltrados.map(pdv => {
                // 🔥 SOLUÇÃO: Verificação ajustada na hora de pintar o botão
                const isConcluido = (dashboard.pdvsVisitadosIds || []).map(String).includes(String(pdv.idUnico)) || 
                                    (dashboard.pdvsVisitadosIds || []).map(String).includes(String(pdv.id)); 
                return (
                    <div key={pdv.id} className={`cardPdv ${isConcluido ? 'cardPdvConcluido' : ''}`} style={pdv.rkg && pdv.rkg <= 5 ? { borderLeft: '6px solid #0d6efd' } : {}} onClick={() => handlePressPdv(pdv)}>
                        <div className="cardHeader"><span className="cardTitle">{pdv.nome}</span><span className="codigoText">#{pdv.id}</span></div>
                        <div className="cardBody">
                            <span className="addressText">📅 Rota: {pdv.diaSemana || pdv.rota}</span>
                            {(pdv.metaTasks !== undefined && pdv.metaTasks !== null) && (
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '10px' }}>
                                    <span style={{ fontSize: '11px', background: '#F4F5F7', padding: '4px 6px', borderRadius: '4px', fontWeight: 'bold', color: '#333' }}>📋 {pdv.metaTasks} Tasks</span>
                                    <span style={{ fontSize: '11px', background: '#F4F5F7', padding: '4px 6px', borderRadius: '4px', fontWeight: 'bold', color: '#333' }}>🎯 {pdv.metaMissoes} Miss</span>
                                    <span style={{ fontSize: '11px', background: '#F4F5F7', padding: '4px 6px', borderRadius: '4px', fontWeight: 'bold', color: '#333' }}>🏷️ {pdv.metaOfertas} Ofer</span>
                                    <span style={{ fontSize: '11px', background: pdv.score5?.toUpperCase() === 'SIM' ? '#d4edda' : '#f8d7da', color: pdv.score5?.toUpperCase() === 'SIM' ? '#155724' : '#721c24', padding: '4px 6px', borderRadius: '4px', fontWeight: 'bold' }}>⭐ SC5: {pdv.score5?.toUpperCase()}</span>
                                    <span style={{ fontSize: '11px', background: pdv.comprador?.toUpperCase() === 'SIM' ? '#d4edda' : '#f8d7da', color: pdv.comprador?.toUpperCase() === 'SIM' ? '#155724' : '#721c24', padding: '4px 6px', borderRadius: '4px', fontWeight: 'bold' }}>🛒 Comp: {pdv.comprador?.toUpperCase()}</span>
                                </div>
                            )}
                        </div>
                        <div className="cardFooter">{isConcluido ? (<span className="actionText actionTextConcluido">✅ REABRIR VISITA ↻</span>) : (<button className="btnIniciarVisitaDestaque">INICIAR VISITA →</button>)}</div>
                    </div>
                );
            })}
            {pdvsFiltrados.length === 0 && <p className="emptyPendenciasText">Nenhum PDV encontrado.</p>}
          </div>
        </div>
      )}

      {modalFiltroVisible && (
          <div className="modalOverlayPro">
              <div className="modalFiltroContent">
                  <div className="modalHeader">
                      <h3 className="modalTitle">Buscar Clientes</h3>
                      <button onClick={() => setModalFiltroVisible(false)} className="closeModalText">FECHAR ❌</button>
                  </div>
                  <span className="labelFiltro">Buscar por Nome ou ID:</span>
                  <input type="text" className="searchInputModal" placeholder="Ex: Mercantil ou #55391..." value={buscaPesquisa} onChange={(e) => setBuscaPesquisa(e.target.value)} autoFocus />
                  <button className="aplicarFiltroButton" onClick={() => setModalFiltroVisible(false)}>APLICAR BUSCA</button>
              </div>
          </div>
      )}

      {modalEntregasVisible && (
        <div className="modalOverlayPro">
          <div className="modalFiltroContent">
            <div className="modalHeader">
              <h3 className="modalTitle">Janela de Entrega 🚚</h3>
              <button onClick={fecharModalEntregas} className="closeModalText">FECHAR ❌</button>
            </div>
            <div className="novaPendenciaRow">
              <input type="number" className="novaPendenciaInput" placeholder="ID do PDV (ex: 55107)" value={pesquisaRastreio} onChange={(e) => setPesquisaRastreio(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleBuscarEntrega()} />
              <button className="btnAddPendencia btnBuscaRastreio" onClick={handleBuscarEntrega} disabled={isLoadingRastreio}>{isLoadingRastreio ? '...' : 'BUSCAR'}</button>
            </div>
            {buscouRastreio && !isLoadingRastreio && dadosRastreio && (
              <div className="rastreioCardClean">
                <div className="rastreioPdvHeaderClean"><span className="rastreioPdvNomeClean">{dadosRastreio.nomePdv}</span><span className="rastreioPdvIdClean">#{dadosRastreio.pdvId}</span></div>
                <div className="rastreioStatusBox">
                  {dadosRastreio.status === 'CONCLUDED' ? (<><span className="rastreioStatusText statusGreen">✅ ENTREGUE</span><span className="rastreioSubStatus">A mercadoria já foi entregue no local.</span></>) : dadosRastreio.status === 'IN_TREATMENT' ? (<><span className="rastreioStatusText statusTratamento">🛠️ EM TRATAMENTO</span><span className="rastreioSubStatus">Aguardando resolução pela central.</span></>) : dadosRastreio.status === 'RESCHEDULED' ? (<><span className="rastreioStatusText statusDanger">🔄 REPROGRAMADA</span><span className="rastreioSubStatus">A entrega foi adiada para outra data.</span></>) : (<><span className="rastreioStatusText statusOrange">⏳ JANELA PENDENTE</span><span className="rastreioSubStatus">Caminhão a caminho. Aguarde no local.</span></>)}
                </div>
                <div className="rastreioInfoRowMotorista"><span className="rastreioLabelClean">Motorista Responsável</span><span className="rastreioDriverClean">{dadosRastreio.motorista}</span></div>
                <div className="rastreioInfoRowMotorista" style={{marginTop: '10px'}}><span className="rastreioLabelClean">⏰ Status do Horário / Fila</span><span className="rastreioDriverClean">{dadosRastreio.horario}</span></div>
              </div>
            )}
            {buscouRastreio && !isLoadingRastreio && !dadosRastreio && (
              <div className="rastreioCardClean rastreioErroCard"><span className="rastreioStatusText statusDanger" style={{textAlign: 'center', width: '100%'}}>Nenhuma carga encontrada!</span></div>
            )}
          </div>
        </div>
      )}

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
                                      {pendencia.pdvId !== 0 && <span className="pendenciaPdvId">#{pendencia.pdvId}</span>}
                                  </div>
                                  <div className="pendenciaTextoBox">
                                      <div className={`statusIndicatorGlobal ${pendencia.status === 'RESOLVIDO' ? 'statusResolvido' : 'statusPendente'}`}></div>
                                      <span className={`pendenciaTexto ${pendencia.status === 'RESOLVIDO' ? 'pendenciaTextoRiscado' : ''}`}>
                                        {formatarTextoPendencia(pendencia.texto, pendencia.status)}
                                      </span>
                                  </div>
                                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '10px' }}>
                                    {pendencia.pdvId === 0 ? (
                                        <>
                                            <button className="btnAcaoVermelho" style={{ padding: '8px 12px', fontSize: '12px', minWidth: 'auto' }} onClick={() => handleAcaoManual(pendencia.id, 'deletar')}>🗑️ APAGAR</button>
                                            <button className="btnIniciarVisitaDestaque" style={{ padding: '8px 12px', fontSize: '12px', minWidth: 'auto' }} onClick={() => handleAcaoManual(pendencia.id, 'resolver')}>✅ RESOLVER</button>
                                        </>
                                    ) : (
                                        <button className="irParaPdvBtnAmarelo" onClick={() => { setModalPendenciasVisible(false); navigate('/visita', { state: { pdvId: pendencia.pdvId, pdvNome: pendencia.pdvNome, modo: 'PENDENCIAS_ONLY', visitaId: pendencia.id } }); }}>
                                          ABRIR VISITA ➔
                                        </button>
                                    )}
                                  </div>
                              </div>
                          ))
                      )}
                  </div>
              </div>
          </div>
      )}

      {modalManualVisible && (
          <div className="modalOverlayPro">
              <div className="modalFiltroContent" style={{ paddingBottom: '30px', maxWidth: '90%', width: '400px' }}>
                  <div className="modalHeader">
                      <h3 className="modalTitle">Hub de Execução ✍️</h3>
                      <button onClick={() => setModalManualVisible(false)} className="closeModalText">FECHAR ❌</button>
                  </div>
                  <p style={{ color: '#666', fontSize: '13px', marginBottom: '20px' }}>
                    Registo manual de Subdivisões, Ofertas e Missões.
                  </p>
                  
                  <div style={{ maxHeight: '60vh', overflowY: 'auto', paddingRight: '5px', display: 'flex', flexDirection: 'column' }}>
                    <h4 style={{ fontSize: '14px', marginBottom: '15px', color: '#000', borderBottom: '1px solid #eee', paddingBottom: '5px' }}>📋 Tasks do Dia</h4>
                    
                    {renderContadorHub("🛒 Compra", formManual.compra, "compra", "#000")}
                    {renderContadorHub("🍺 Cerveja", formManual.cerveja, "cerveja", "#000")}
                    {renderContadorHub("🥤 NAB", formManual.nab, "nab", "#000")}
                    {renderContadorHub("📺 MKT", formManual.mkt, "mkt", "#000")}

                    <h4 style={{ fontSize: '14px', margin: '20px 0 15px', color: '#000', borderBottom: '1px solid #eee', paddingBottom: '5px' }}>🚀 Mercado</h4>
                    {renderContadorHub("🏷️ Ofertas de Pontos", formManual.ofertas, "ofertas", "#17a2b8")}
                    {renderContadorHub("🎯 Missões", formManual.missoes, "missoes", "#FF4500")}

                    <h4 style={{ fontSize: '14px', margin: '20px 0 15px', color: '#000', borderBottom: '1px solid #eee', paddingBottom: '5px' }}>🛒 Conversão</h4>
                    {renderContadorHub("🛒 Comprador", formManual.comprador, "comprador", "#28a745")}     

                    <div style={{ marginTop: '20px' }}>
                      <label className="labelFiltro" style={{ color: '#000', fontWeight: 'bold' }}>⚠️ Novo Registro de Pendência:</label>
                      <textarea className="textAreaAvulso" rows="3" placeholder="Ex: Verificar material de ponto de venda..." value={formManual.pendencia} onChange={(e) => setFormManual({...formManual, pendencia: e.target.value})} />
                    </div>
                  </div>

                  <button className="btnSalvarPendência" onClick={handleSalvarManual} disabled={isSavingManual}>
                      {isSavingManual ? 'SALVANDO...' : 'SALVAR NA NUVEM ☁️'}
                  </button>
              </div>
          </div>
      )}

      {modalReabrir.visible && (
        <div className="modalOverlayPro"><div className="modalBoxPro"><div className="modalHeaderPro"><h3>Visita Finalizada ✅</h3></div><div className="modalBodyPro"><p>Deseja reabrir a visita?</p></div><div className="modalFooterPro"><button className="btnModalCancel" onClick={() => setModalReabrir({ visible: false, pdv: null })}>CANCELAR</button><button className="btnModalConfirm" onClick={confirmarReabertura}>SIM</button></div></div></div>
      )}

      {modalFinalizar && (
        <div className="modalOverlayPro"><div className="modalBoxPro"><div className="modalHeaderPro"><h3>Encerrar Rota? ⏹️</h3></div><div className="modalBodyPro"><p>Deseja finalizar a sua jornada e ver o Resumo do Dia?</p></div><div className="modalFooterPro"><button className="btnModalCancel" onClick={() => setModalFinalizar(false)}>VOLTAR</button><button className="btnModalConfirm" onClick={confirmarFinalizacaoJornada}>FINALIZAR</button></div></div></div>
      )}

      {toast.visible && (
        <div className={`toastGlobalPro ${toast.type === 'success' ? 'toastSuccess' : 'toastError'}`}><span style={{ fontSize: '20px' }}>{toast.type === 'success' ? '✅' : '❌'}</span><p className="toastText">{toast.message}</p></div>
      )}

    </div>
  );
};

export default HomeScreen;

import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./VisitaScreen.css";
import {
  iniciarVisita,
  finalizarVisita,
  obterItensPendentes,
  obterVisitaPorId,
} from "../services/visitaService";

/**
 * CONSTANTES DE TEMA (DESIGN SYSTEM)
 * @description Centraliza as cores do app para os contadores e botões.
 * Atualizado para a nova identidade visual Azul/Ciano.
 */
const COLORS = {
  PRIMARY: "#1c9ebe", /* 🔥 ATUALIZADO: A sua nova cor principal! */
  BLACK: "#000000",
  WHITE: "#FFFFFF",
  GRAY_TEXT: "#6c757d",
  SUCCESS: "#28a745",
  MISSAO_COLOR: "#FF4500",
  OFERTA_COLOR: "#17a2b8",
  POSITIVACAO_COLOR: "#9c27b0" 
};

/**
 * COMPONENTE: VisitaScreen
 * @description Tela principal de execução (Atendimento).
 * Permite duplo uso: Fluxo normal de Check-in no PDV e Fluxo de Edição de Acordos/Pendências.
 */
const VisitaScreen = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // =========================================================================
  // 1. STATE MANAGEMENT (Gerenciamento de Estado)
  // =========================================================================

  // Extração de parâmetros de navegação (Contexto da Rota)
  const { pdvId, pdvNome, modo, visitaId } = location.state || {};
  
  // Flag que define se a tela está no modo "Apenas Edição de Pendências"
  const isModoPendencias = modo === "PENDENCIAS_ONLY";

  // Controle de Ciclo de Vida da API
  const [visita, setVisita] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Payload do Formulário (Indicadores Numéricos)
  const [qtdTasksCompra, setQtdTasksCompra] = useState(0);
  const [qtdTasksCerveja, setQtdTasksCerveja] = useState(0);
  const [qtdTasksNab, setQtdTasksNab] = useState(0);
  const [qtdTasksMkt, setQtdTasksMkt] = useState(0);
  const [qtdOfertas, setQtdOfertas] = useState(0);
  const [qtdMissoes, setQtdMissoes] = useState(0);
  const [qtdPositivacao, setQtdPositivacao] = useState(0);
  
  // Controle Booleano (Conversão)
  const [virouComprador, setVirouComprador] = useState(false);

  // Gestor de Acordos e Problemas (Array de JSON)
  const [pendencias, setPendencias] = useState([]);
  const [novaPendencia, setNovaPendencia] = useState("");

  // Gestor Centralizado de Modais (Evita criar múltiplos modais no HTML)
  const [modal, setModal] = useState({
    visible: false, title: "", message: "", onConfirm: null, type: "confirm",
  });

  // =========================================================================
  // 2. LIFECYCLE HOOKS (Efeitos de Ciclo de Vida)
  // =========================================================================

  /**
   * Hook de Inicialização.
   * Valida o contexto da navegação e busca os dados no Back-End.
   * Previne a criação de visitas duplicadas graças ao princípio de Idempotência da API.
   */
  useEffect(() => {
    const arrancarVisita = async () => {
      // Blindagem: Impede o carregamento se a tela for acessada sem parâmetros
      if (!pdvId && !visitaId) return;

      try {
        setIsLoading(true);
        let dadosVisita;

        // Roteamento inteligente da requisição baseado no modo da tela
        if (isModoPendencias && visitaId) {
          dadosVisita = await obterVisitaPorId(visitaId);
        } else if (pdvId) {
          dadosVisita = await iniciarVisita(pdvId);
        } else {
          return;
        }

        setVisita(dadosVisita);
        
        // Hidratação do Estado: Preenche a tela com os dados vindos do banco
        setQtdTasksCompra(dadosVisita.qtdTasksCompra || 0);
        setQtdTasksCerveja(dadosVisita.qtdTasksCerveja || 0);
        setQtdTasksNab(dadosVisita.qtdTasksNab || 0);
        setQtdTasksMkt(dadosVisita.qtdTasksMkt || 0);
        setVirouComprador(dadosVisita.virouComprador || false);
        setQtdOfertas(dadosVisita.qtdOfertas || 0);
        setQtdMissoes(dadosVisita.qtdMissoes || 0);
        setQtdPositivacao(dadosVisita.qtdPositivacao || 0); 

        // Retrocompatibilidade / Parser de Segurança: 
        // Tenta converter a string do banco em um array JSON. Se falhar (dados legados),
        // converte a string simples no novo formato de objeto.
        if (dadosVisita.observacao) {
          try {
            const listaSalva = JSON.parse(dadosVisita.observacao);
            setPendencias(Array.isArray(listaSalva) ? listaSalva : []);
          } catch (e) {
            if (dadosVisita.observacao.trim()) {
              setPendencias([{ id: Date.now().toString(), texto: dadosVisita.observacao, status: "PENDENTE" }]);
            }
          }
        }
      } catch (error) {
        setModal({ visible: true, title: "Erro Crítico", message: "Falha ao carregar dados do servidor.", type: "alert", onConfirm: () => navigate(-1) });
      } finally {
        setIsLoading(false);
      }
    };
    
    arrancarVisita();
  }, [pdvId, visitaId, navigate, isModoPendencias]);

  // =========================================================================
  // 3. CORE LOGIC (Regras de Negócio e Submissão)
  // =========================================================================

  /**
   * Apresenta o sumário da visita para o vendedor aprovar antes de enviar ao servidor.
   */
  const handleFinalizar = () => {
    if (isModoPendencias) {
      setModal({ visible: true, title: "Salvar Alterações?", message: "Os acordos e pendências deste PDV serão atualizados.", onConfirm: executarFinalizacao, type: "confirm" });
    } else {
      const total = qtdTasksCompra + qtdTasksCerveja + qtdTasksNab + qtdTasksMkt;
      const resumo = `📋 Total Tasks: ${total}\n🏷️ Ofertas: ${qtdOfertas}\n🎯 Missões: ${qtdMissoes}\n✅ Positivação: ${qtdPositivacao}\n🛒 Comprador: ${virouComprador ? 'SIM' : 'NÃO'}`;
      setModal({ visible: true, title: "Finalizar Atendimento?", message: `Confirma os dados da visita no PDV?\n\n${resumo}`, onConfirm: executarFinalizacao, type: "confirm" });
    }
  };

  /**
   * Consolida os dados e dispara o PUT para o Back-End.
   */
  const executarFinalizacao = async () => {
    try {
      setIsSaving(true);
      
      // Converte o array interativo do React de volta para uma String JSON sólida
      const obs = pendencias.length > 0 ? JSON.stringify(pendencias) : "";
      const totalTasks = qtdTasksCompra + qtdTasksCerveja + qtdTasksNab + qtdTasksMkt;

      await finalizarVisita(
        visita.id, obs, totalTasks, qtdOfertas, qtdMissoes,
        qtdTasksCompra, qtdTasksCerveja, qtdTasksNab, qtdTasksMkt, virouComprador, qtdPositivacao
      );

      // Feedback e redirecionamento de sucesso
      setModal({
        visible: true,
        title: isModoPendencias ? "Alterações Salvas!" : "Visita Finalizada! ✅",
        message: isModoPendencias ? "Os acordos foram atualizados com sucesso." : "Atendimento registado com sucesso.",
        onConfirm: () => {
          if (isModoPendencias) navigate("/home", { state: { openPendencias: true } });
          else navigate(-1); // Retorna à Home
        },
        type: "alert",
      });
    } catch (error) {
      setModal({ visible: true, title: "Erro", message: "Não foi possível salvar os dados na nuvem.", type: "alert" });
    } finally {
      setIsSaving(false);
    }
  };

  // =========================================================================
  // 4. MÉTODOS AUXILIARES (Gestão do Array de Pendências)
  // =========================================================================

  const adicionarPendencia = () => {
    if (!novaPendencia.trim()) return;
    const nova = { id: Date.now().toString(), texto: novaPendencia, status: "PENDENTE" };
    setPendencias([nova, ...pendencias]);
    setNovaPendencia("");
  };

  const alternarStatusPendencia = (id) => {
    setPendencias(pendencias.map((p) => p.id === id ? { ...p, status: p.status === "PENDENTE" ? "RESOLVIDO" : "PENDENTE" } : p));
  };

  const removerPendencia = (id) => {
    setModal({ visible: true, title: "Apagar Acordo?", message: "Tem certeza que deseja remover este item?", onConfirm: () => { setPendencias(pendencias.filter((p) => p.id !== id)); setModal({ visible: false }); }, type: "confirm" });
  };

  // =========================================================================
  // 5. MICRO-COMPONENTES (UI)
  // =========================================================================

  /**
   * @component renderContadorPro
   * @description Componente factory (fábrica) que gera os cartões de contagem numérica.
   */
  const renderContadorPro = (titulo, valor, setValor, cor) => (
    <div className="contadorCard" style={{ borderLeft: `6px solid ${cor}` }}>
      <span className="contadorTitle">{titulo}</span>
      <div className="contadorControls">
        <button className="btnControl" onClick={() => setValor(Math.max(0, valor - 1))}>-</button>
        <input
          type="number"
          className="contadorInput"
          value={valor === 0 ? "" : valor}
          placeholder="0"
          onChange={(e) => setValor(e.target.value === "" ? 0 : parseInt(e.target.value))}
          onFocus={(e) => e.target.select()} // Melhora de usabilidade UX (Seleciona tudo ao tocar)
        />
        <button className="btnControl" style={{ backgroundColor: cor, color: "#FFF" }} onClick={() => setValor(valor + 1)}>+</button>
      </div>
    </div>
  );

  // =========================================================================
  // 6. RENDERIZAÇÃO PRINCIPAL (JSX)
  // =========================================================================

  if (isLoading)
    return (
      <div className="centerContainer">
        <span className="loadingSpinnerVisita">⏳</span>
        <span className="loadingText">A carregar...</span>
      </div>
    );

  // Trava de Regra de Negócio: Impede que o vendedor desmarque um cliente que já é comprador fiel no ERP.
  const clienteJaEComprador = visita?.pdv?.comprador === "SIM";

  return (
    <div className="safeAreaVisita">
      
      {/* RENDERIZAÇÃO DO MODAL GLOBAL */}
      {modal.visible && (
        <div className="modalOverlayPro">
          <div className="modalBoxPro">
            <div className="modalHeaderPro"><h3>{modal.title}</h3></div>
            <div className="modalBodyPro"><p style={{ whiteSpace: "pre-line" }}>{modal.message}</p></div>
            <div className="modalFooterPro">
              {modal.type === "confirm" && (<button className="btnModalCancel" onClick={() => setModal({ ...modal, visible: false })}>CANCELAR</button>)}
              <button className="btnModalConfirm" onClick={() => { if (modal.onConfirm) modal.onConfirm(); else setModal({ ...modal, visible: false }); }}>OK</button>
            </div>
          </div>
        </div>
      )}

      {/* CABEÇALHO DA ROTA */}
      <div className="headerVisita">
        <button onClick={() => navigate(-1)} className="backButton"><span className="backButtonText">⬅ VOLTAR</span></button>
        <span className="headerTitleVisita">{isModoPendencias ? "Gestão de Acordos" : "Atendimento"}</span>
      </div>

      <div className="contentVisita">
        <div className="pdvHeaderVisita">
          <span className="pdvNameVisita">{pdvNome}</span>
          <span className="pdvIdVisita">ID: #{pdvId || visita?.pdv?.id}</span>
        </div>

        {/* SESSÃO DE ATENDIMENTO (Oculto se for apenas modo pendências) */}
        {!isModoPendencias && (
          <>
            <div className="sectionVisita">
              <h2 className="sectionTitleVisita">🛒 Subdivisão de Tasks</h2>
              {renderContadorPro("🛒 Compra", qtdTasksCompra, setQtdTasksCompra, COLORS.BLACK)}
              {renderContadorPro("🍺 Cerveja", qtdTasksCerveja, setQtdTasksCerveja, COLORS.BLACK)}
              {renderContadorPro("🥤 NAB", qtdTasksNab, setQtdTasksNab, COLORS.BLACK)}
              {renderContadorPro("📺 MKT", qtdTasksMkt, setQtdTasksMkt, COLORS.BLACK)}
            </div>

            <div className="sectionVisita">
              <h2 className="sectionTitleVisita">🚀 Ações de Mercado</h2>
              {renderContadorPro("🏷️ Ofertas", qtdOfertas, setQtdOfertas, COLORS.OFERTA_COLOR)}
              {renderContadorPro("🎯 Missões", qtdMissoes, setQtdMissoes, COLORS.MISSAO_COLOR)}
              {renderContadorPro("✅ Positivação", qtdPositivacao, setQtdPositivacao, COLORS.POSITIVACAO_COLOR)}
            </div>

            {!clienteJaEComprador && (
                <div className="contadorCard" style={{ borderLeft: `6px solid ${COLORS.SUCCESS}`, marginBottom: '30px' }}>
                <span className="contadorTitle">🛒 Virou Comprador Hoje?</span>
                <input 
                    type="checkbox" 
                    checked={virouComprador} 
                    onChange={(e) => setVirouComprador(e.target.checked)} 
                    style={{ width: '24px', height: '24px', accentColor: COLORS.SUCCESS, marginRight: '10px' }}
                />
                </div>
            )}
          </>
        )}

        {/* SESSÃO DE PROBLEMAS E ACORDOS */}
        <div className="sectionVisita">
          <div className="notebookTitleRow">
            <span className="notebookIcon">📌</span>
            <span className="sectionTitleFuturistic">PENDÊNCIAS & ACORDOS</span>
          </div>
          <span className="sectionSubTitleVisita">Acompanhe o que precisa ser resolvido no cliente.</span>

          <div className="novaPendenciaRow">
            <input type="text" className="novaPendenciaInput" placeholder="Ex: Verificar boleto..." value={novaPendencia} onChange={(e) => setNovaPendencia(e.target.value)} onKeyDown={(e) => e.key === "Enter" && adicionarPendencia()} />
            <button className="btnAddPendencia" onClick={adicionarPendencia}><span className="btnAddPendenciaText">ADD</span></button>
          </div>

          <div className="pendenciasList">
            {pendencias.map((pend) => (
              <div key={pend.id} className={`pendenciaCard ${pend.status === "RESOLVIDO" ? "pendenciaCardResolvido" : ""}`}>
                <div className="pendenciaContent" onClick={() => alternarStatusPendencia(pend.id)}>
                  <div className={`statusIndicator ${pend.status === "RESOLVIDO" ? "statusResolvido" : "statusPendente"}`} />
                  <div className="pendenciaTextWrapper">
                    <span className={`pendenciaTexto ${pend.status === "RESOLVIDO" ? "pendenciaTextoResolvido" : ""}`}>{pend.texto}</span>
                    <span className="pendenciaStatusLabel">{pend.status === "PENDENTE" ? "⏳ Pendente" : "✅ Resolvido"}</span>
                  </div>
                </div>
                <button className="btnApagarPendencia" onClick={() => removerPendencia(pend.id)}><span className="btnApagarTexto">🗑️</span></button>
              </div>
            ))}
            {pendencias.length === 0 && (<span className="emptyPendencias">Nenhum acordo registado neste PDV.</span>)}
          </div>
        </div>

        {/* BOTÃO DE SUBMISSÃO */}
        <button className={`finishButton ${isSaving ? "finishButtonDisabled" : ""}`} onClick={handleFinalizar} disabled={isSaving}>
          {isSaving ? "A SALVAR..." : isModoPendencias ? "SALVAR ALTERAÇÕES" : "FINALIZAR VISITA"}
        </button>
      </div>
    </div>
  );
};

export default VisitaScreen;
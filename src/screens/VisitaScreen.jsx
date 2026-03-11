import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./VisitaScreen.css";
import {
  iniciarVisita,
  finalizarVisita,
  obterItensPendentes,
  obterVisitaPorId,
} from "../services/visitaService";

const COLORS = {
  YELLOW: "#FFD500",
  BLACK: "#000000",
  WHITE: "#FFFFFF",
  GRAY_TEXT: "#6c757d",
  SUCCESS: "#28a745",
  MISSAO_COLOR: "#FF4500",
  OFERTA_COLOR: "#17a2b8",
};

const VisitaScreen = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const { pdvId, pdvNome, modo, visitaId } = location.state || {};
  const isModoPendencias = modo === "PENDENCIAS_ONLY";

  const [visita, setVisita] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Estados
  const [qtdTasksCompra, setQtdTasksCompra] = useState(0);
  const [qtdTasksCerveja, setQtdTasksCerveja] = useState(0);
  const [qtdTasksNab, setQtdTasksNab] = useState(0);
  const [qtdTasksMkt, setQtdTasksMkt] = useState(0);
  const [virouComprador, setVirouComprador] = useState(false);
  const [qtdOfertas, setQtdOfertas] = useState(0);
  const [qtdMissoes, setQtdMissoes] = useState(0);
  
  // 🔥 NOVO: Estado para a Positivação na tela
  const [qtdPositivacao, setQtdPositivacao] = useState(0);

  const [pendencias, setPendencias] = useState([]);
  const [novaPendencia, setNovaPendencia] = useState("");

  const [modal, setModal] = useState({
    visible: false, title: "", message: "", onConfirm: null, type: "confirm",
  });

  useEffect(() => {
    const arrancarVisita = async () => {
      if (!pdvId && !visitaId) return;

      try {
        setIsLoading(true);
        let dadosVisita;

        if (isModoPendencias && visitaId) {
          dadosVisita = await obterVisitaPorId(visitaId);
        } else if (pdvId) {
          dadosVisita = await iniciarVisita(pdvId);
        } else {
          return;
        }

        setVisita(dadosVisita);
        
        // 🔥 MEMÓRIA ATIVADA: Agora preenche com o que veio do banco!
        setQtdTasksCompra(dadosVisita.qtdTasksCompra || 0);
        setQtdTasksCerveja(dadosVisita.qtdTasksCerveja || 0);
        setQtdTasksNab(dadosVisita.qtdTasksNab || 0);
        setQtdTasksMkt(dadosVisita.qtdTasksMkt || 0);
        setVirouComprador(dadosVisita.virouComprador || false);
        setQtdOfertas(dadosVisita.qtdOfertas || 0);
        setQtdMissoes(dadosVisita.qtdMissoes || 0);
        setQtdPositivacao(dadosVisita.qtdPositivacao || 0); // Puxa a positivação salva

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
        setModal({ visible: true, title: "Erro", message: "Falha ao carregar dados.", type: "alert", onConfirm: () => navigate(-1) });
      } finally {
        setIsLoading(false);
      }
    };
    arrancarVisita();
  }, [pdvId, visitaId, navigate, isModoPendencias]);

  const handleFinalizar = () => {
    if (isModoPendencias) {
      setModal({ visible: true, title: "Salvar Alterações?", message: "Os acordos e pendências deste PDV serão atualizados.", onConfirm: executarFinalizacao, type: "confirm" });
    } else {
      const total = qtdTasksCompra + qtdTasksCerveja + qtdTasksNab + qtdTasksMkt;
      const resumo = `📋 Total Tasks: ${total}\n🏷️ Ofertas: ${qtdOfertas}\n🎯 Missões: ${qtdMissoes}\n✅ Positivação: ${qtdPositivacao}\n🛒 Comprador: ${virouComprador ? 'SIM' : 'NÃO'}`;
      setModal({ visible: true, title: "Finalizar Atendimento?", message: `Confirma os dados da visita no PDV?\n\n${resumo}`, onConfirm: executarFinalizacao, type: "confirm" });
    }
  };

  const executarFinalizacao = async () => {
    try {
      setIsSaving(true);
      const obs = pendencias.length > 0 ? JSON.stringify(pendencias) : "";
      const totalTasks = qtdTasksCompra + qtdTasksCerveja + qtdTasksNab + qtdTasksMkt;

      // 🔥 Chama a função passando todas as gavetas (incluindo Positivação)
      await finalizarVisita(
        visita.id, obs, totalTasks, qtdOfertas, qtdMissoes,
        qtdTasksCompra, qtdTasksCerveja, qtdTasksNab, qtdTasksMkt, virouComprador, qtdPositivacao
      );

      setModal({
        visible: true,
        title: isModoPendencias ? "Alterações Salvas!" : "Visita Finalizada! ✅",
        message: isModoPendencias ? "Os acordos foram atualizados com sucesso." : "Atendimento registado com sucesso.",
        onConfirm: () => {
          if (isModoPendencias) navigate("/home", { state: { openPendencias: true } });
          else navigate(-1);
        },
        type: "alert",
      });
    } catch (error) {
      setModal({ visible: true, title: "Erro", message: "Não foi possível salvar os dados.", type: "alert" });
    } finally {
      setIsSaving(false);
    }
  };

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
          onFocus={(e) => e.target.select()}
        />
        <button className="btnControl" style={{ backgroundColor: cor, color: "#FFF" }} onClick={() => setValor(valor + 1)}>+</button>
      </div>
    </div>
  );

  if (isLoading)
    return (
      <div className="centerContainer">
        <span className="loadingSpinnerVisita">⏳</span>
        <span className="loadingText">A carregar...</span>
      </div>
    );

  // 🔥 LÓGICA INTELIGENTE: Descobre se o cliente já é comprador de acordo com a base de dados
  const clienteJaEComprador = visita?.pdv?.comprador === "SIM";

  return (
    <div className="safeAreaVisita">
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

      <div className="headerVisita">
        <button onClick={() => navigate(-1)} className="backButton"><span className="backButtonText">⬅ VOLTAR</span></button>
        <span className="headerTitleVisita">{isModoPendencias ? "Gestão de Acordos" : "Atendimento"}</span>
      </div>

      <div className="contentVisita">
        <div className="pdvHeaderVisita">
          <span className="pdvNameVisita">{pdvNome}</span>
          <span className="pdvIdVisita">ID: #{pdvId || visita?.pdv?.id}</span>
        </div>

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
              {/* 🔥 NOVO: Campo de Positivação */}
              {renderContadorPro("✅ Positivação", qtdPositivacao, setQtdPositivacao, COLORS.SUCCESS)}
            </div>

            {/* 🔥 LÓGICA DO COMPRADOR: Só aparece se o PDV for "NÃO" no banco */}
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

        <button className={`finishButton ${isSaving ? "finishButtonDisabled" : ""}`} onClick={handleFinalizar} disabled={isSaving}>
          {isSaving ? "A SALVAR..." : isModoPendencias ? "SALVAR ALTERAÇÕES" : "FINALIZAR VISITA"}
        </button>
      </div>
    </div>
  );
};

export default VisitaScreen;
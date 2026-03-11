import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./VisitaScreen.css";
import { iniciarVisita, finalizarVisita, obterItensPendentes, obterVisitaPorId } from "../services/visitaService";

const COLORS = {
  YELLOW: "#FFD500", BLACK: "#000000", WHITE: "#FFFFFF",
  GRAY_TEXT: "#6c757d", SUCCESS: "#28a745", MISSAO_COLOR: "#FF4500", OFERTA_COLOR: "#17a2b8",
};

const VisitaScreen = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { pdvId, pdvNome, modo, visitaId } = location.state || {};
  const isModoPendencias = modo === "PENDENCIAS_ONLY";

  const [visita, setVisita] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // 🔥 NOVOS ESTADOS PARA AS SUBDIVISÕES
  const [qtdTasksCompra, setQtdTasksCompra] = useState(0);
  const [qtdTasksCerveja, setQtdTasksCerveja] = useState(0);
  const [qtdTasksNab, setQtdTasksNab] = useState(0);
  const [qtdTasksMkt, setQtdTasksMkt] = useState(0);
  const [virouComprador, setVirouComprador] = useState(false);

  const [qtdOfertas, setQtdOfertas] = useState(0);
  const [qtdMissoes, setQtdMissoes] = useState(0);

  const [novaPendencia, setNovaPendencia] = useState("");
  const [pendencias, setPendencias] = useState([]);

  useEffect(() => {
    const carregarDados = async () => {
      try {
        if (isModoPendencias && visitaId) {
          const visitaData = await obterVisitaPorId(visitaId);
          setVisita(visitaData);
          const pendenciasAntigas = await obterItensPendentes(visitaId);
          const formatadas = pendenciasAntigas.map((p, index) => ({
            id: index,
            texto: p,
            status: visitaData.pendenciaStatus || "PENDENTE"
          }));
          setPendencias(formatadas);
        } else if (pdvId) {
          const novaVisita = await iniciarVisita(pdvId);
          setVisita(novaVisita);
        }
      } catch (error) {
        console.error("Erro ao carregar visita:", error);
      } finally {
        setIsLoading(false);
      }
    };
    carregarDados();
  }, [pdvId, isModoPendencias, visitaId]);

  const adicionarPendencia = () => {
    if (novaPendencia.trim() === "") return;
    setPendencias([...pendencias, { id: Date.now(), texto: novaPendencia, status: "PENDENTE" }]);
    setNovaPendencia("");
  };

  const removerPendencia = (id) => {
    setPendencias(pendencias.filter((p) => p.id !== id));
  };

  const toggleStatusPendencia = (id) => {
    setPendencias(pendencias.map((p) =>
      p.id === id ? { ...p, status: p.status === "PENDENTE" ? "RESOLVIDO" : "PENDENTE" } : p
    ));
  };

  const handleFinalizar = async () => {
    if (!visita) return;
    setIsSaving(true);
    try {
      const jsonObservacao = pendencias.length > 0 ? JSON.stringify(pendencias) : "";
      
      // 🔥 O TOTAL DE TASKS AGORA É A SOMA DAS 4 CAIXINHAS!
      const totalTasks = qtdTasksCompra + qtdTasksCerveja + qtdTasksNab + qtdTasksMkt;

      await finalizarVisita(
        visita.id, 
        jsonObservacao, 
        totalTasks, 
        qtdOfertas, 
        qtdMissoes,
        qtdTasksCompra,
        qtdTasksCerveja,
        qtdTasksNab,
        qtdTasksMkt,
        virouComprador
      );
      
      navigate("/", { state: { atualizado: true } });
    } catch (error) {
      console.error("Erro ao finalizar visita:", error);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="safeAreaVisita centerContainer">
        <div className="loadingSpinnerVisita">⏳</div>
        <p style={{ marginTop: 20, fontWeight: "bold" }}>Preparando Atendimento...</p>
      </div>
    );
  }

  return (
    <div className="safeAreaVisita">
      <div className="headerVisita">
        <button className="backButton" onClick={() => navigate(-1)}>
          <span className="backButtonText">⬅ VOLTAR</span>
        </button>
        <h1 className="headerTitleVisita">
          {isModoPendencias ? "Acordos" : "Atendimento"}
        </h1>
      </div>

      <div className="contentVisita">
        <div className="pdvHeaderVisita">
          <h2 className="pdvNameVisita">{pdvNome || visita?.pdv?.nome || "Cliente"}</h2>
          <span className="pdvIdVisita">ID: {pdvId || visita?.pdv?.id}</span>
        </div>

        {!isModoPendencias && (
          <div className="executionSection">
            <h3 className="sectionTitleVisita">Execução de Tarefas 🎯</h3>
            
            {/* 🔥 AS 4 NOVAS GAVETAS DE TASKS */}
            <div className="counterGrid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div className="counterCard" style={{ borderTop: `4px solid ${COLORS.YELLOW}` }}>
                <span className="counterLabel">Compra</span>
                <input type="number" className="counterInput" min="0" value={qtdTasksCompra} onChange={(e) => setQtdTasksCompra(Number(e.target.value))} />
              </div>
              <div className="counterCard" style={{ borderTop: `4px solid ${COLORS.YELLOW}` }}>
                <span className="counterLabel">Cerveja</span>
                <input type="number" className="counterInput" min="0" value={qtdTasksCerveja} onChange={(e) => setQtdTasksCerveja(Number(e.target.value))} />
              </div>
              <div className="counterCard" style={{ borderTop: `4px solid ${COLORS.YELLOW}` }}>
                <span className="counterLabel">NAB</span>
                <input type="number" className="counterInput" min="0" value={qtdTasksNab} onChange={(e) => setQtdTasksNab(Number(e.target.value))} />
              </div>
              <div className="counterCard" style={{ borderTop: `4px solid ${COLORS.YELLOW}` }}>
                <span className="counterLabel">MKT</span>
                <input type="number" className="counterInput" min="0" value={qtdTasksMkt} onChange={(e) => setQtdTasksMkt(Number(e.target.value))} />
              </div>
            </div>

            <h3 className="sectionTitleVisita" style={{ marginTop: '20px' }}>Ações de Mercado 🚀</h3>
            <div className="counterGrid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div className="counterCard" style={{ borderTop: `4px solid ${COLORS.OFERTA_COLOR}` }}>
                <span className="counterLabel">Ofertas</span>
                <input type="number" className="counterInput" min="0" value={qtdOfertas} onChange={(e) => setQtdOfertas(Number(e.target.value))} />
              </div>
              <div className="counterCard" style={{ borderTop: `4px solid ${COLORS.MISSAO_COLOR}` }}>
                <span className="counterLabel">Missões</span>
                <input type="number" className="counterInput" min="0" value={qtdMissoes} onChange={(e) => setQtdMissoes(Number(e.target.value))} />
              </div>
            </div>

            {/* 🔥 NOVO: CHECKBOX DE COMPRADOR */}
            <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#FFF', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }}>
              <span style={{ fontWeight: 'bold', fontSize: '16px' }}>🛒 Virou Comprador Hoje?</span>
              <input 
                type="checkbox" 
                checked={virouComprador} 
                onChange={(e) => setVirouComprador(e.target.checked)} 
                style={{ width: '24px', height: '24px', accentColor: COLORS.SUCCESS }}
              />
            </div>
          </div>
        )}

        <div className="pendenciasSection">
          <h3 className="sectionTitleVisita">Acordos / Observações 📝</h3>
          <div className="addPendenciaRow">
            <input
              className="pendenciaInput"
              placeholder="Digite o acordo fechado..."
              value={novaPendencia}
              onChange={(e) => setNovaPendencia(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && adicionarPendencia()}
            />
            <button className="btnAdd" onClick={adicionarPendencia}>
              +
            </button>
          </div>

          <div className="pendenciasList">
            {pendencias.map((pend) => (
              <div key={pend.id} className="pendenciaItem">
                <div className="pendenciaContent" onClick={() => toggleStatusPendencia(pend.id)}>
                  <div className={`pendenciaCheckbox ${pend.status === "RESOLVIDO" ? "pendenciaCheckboxChecked" : ""}`} />
                  <div className="pendenciaTextWrapper">
                    <span className={`pendenciaTexto ${pend.status === "RESOLVIDO" ? "pendenciaTextoResolvido" : ""}`}>
                      {pend.texto}
                    </span>
                    <span className="pendenciaStatusLabel">
                      {pend.status === "PENDENTE" ? "⏳ Pendente" : "✅ Resolvido"}
                    </span>
                  </div>
                </div>
                <button className="btnApagarPendencia" onClick={() => removerPendencia(pend.id)}>
                  <span className="btnApagarTexto">🗑️</span>
                </button>
              </div>
            ))}
            {pendencias.length === 0 && (
              <span className="emptyPendencias">Nenhum acordo registado neste PDV.</span>
            )}
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
import api from './api';

// 🔥 A URL Central do seu Servidor na Azure (Evita o erro de BASE_URL is not defined)
const BASE_URL = 'https://rnplanner-api-ekc2hratcvgqhgc5.brazilsouth-01.azurewebsites.net';

export const iniciarVisita = async (pdvId) => {
  const response = await api.post(`/visitas/iniciar/${pdvId}`);
  return response.data;
};

export const finalizarVisita = async (visitaId, anotacao, tasks, ofertas, missoes) => {
  const response = await api.put(`/visitas/${visitaId}/finalizar`, {
    anotacao,
    qtdTasks: tasks,
    qtdOfertas: ofertas,
    qtdMissoes: missoes
  });
  return response.data;
};

// 🔥 FUNÇÃO BLINDADA E CONECTADA AO NOVO CONTROLLER (VisitasController)
export const obterDashboardGeral = async (setorParam) => {
  try {
    const setor = setorParam || localStorage.getItem('setorAtivo');
    
    // Rota alinhada com o @GetMapping("/dashboard/{setor}") do Back-end
    const response = await fetch(`${BASE_URL}/visitas/dashboard/${setor}`);
    
    if (!response.ok) return { pdvsVisitadosIds: [], tasksTotal: 0, ofertasTotal: 0, missoesTotal: 0 };
    return await response.json();
  } catch (error) {
    console.error("Erro ao buscar dashboard geral:", error);
    return { pdvsVisitadosIds: [], tasksTotal: 0, ofertasTotal: 0, missoesTotal: 0 };
  }
};

// 🔥 O ERRO 404 MORRE AQUI: Rota alinhada e recebendo o setor de forma segura
export const obterDashboardMes = async (setorParam) => {
  try {
    const setor = setorParam || localStorage.getItem('setorAtivo');
    
    const response = await fetch(`${BASE_URL}/visitas/dashboard/mes/${setor}`);
    if (!response.ok) throw new Error("Erro ao buscar o dashboard do mês");
    return await response.json();
  } catch (error) {
    console.error("Erro no obterDashboardMes:", error);
    return null;
  }
};

// 🔥 FUNÇÃO BLINDADA: O Java agora exige o setor nas pendências para não misturar!
export const obterPendenciasGlobais = async (setorParam) => {
  try {
    const setor = setorParam || localStorage.getItem('setorAtivo');
    const response = await api.get(`/visitas/pendencias/${setor}`);
    return response.data;
  } catch (error) {
    console.error("Erro ao buscar pendências:", error);
    return [];
  }
};

// 🔥 Busca do Rastreio de Entregas
export const consultarRastreio = async (pdvId) => {
  try {
    const response = await fetch(`${BASE_URL}/entregas/rastreio/${pdvId}`);
    
    if (!response.ok) {
      return null; // Se o PDV não tiver carga, retorna nulo
    }
    
    return await response.json();
  } catch (error) {
    console.error("Erro na busca de rastreio:", error);
    throw error;
  }
};

// Resolve a anotação manual
export const resolverPendenciaManual = async (id) => {
  await fetch(`${BASE_URL}/pendencias-manuais/resolver/${id}`, {
    method: 'PUT'
  });
};

// Apaga a anotação manual
export const deletarPendenciaManual = async (id) => {
  await fetch(`${BASE_URL}/pendencias-manuais/deletar/${id}`, {
    method: 'DELETE'
  });
};
import api from './api';

// 🔥 A URL Central do seu Servidor na Azure (Evita o erro de BASE_URL is not defined)
const BASE_URL = 'https://rnplanner-api-ekc2hratcvgqhgc5.brazilsouth-01.azurewebsites.net';

export const salvarNoHub = async (dados) => {
  try {
    const response = await api.post('/lancamento-manual/salvar', dados);
    return response.data;
  } catch (error) {
    console.error("Erro ao salvar no Hub:", error);
    throw error;
  }
};

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

export const obterDashboardGeral = async (setorParam) => {
  try {
    const setor = setorParam || localStorage.getItem('setorAtivo');
    
    // Mudamos de /visitas/dashboard para /dashboard/resumo-do-dia/setor/
    const response = await fetch(`${BASE_URL}/dashboard/resumo-do-dia/setor/${setor}`);
    
    if (!response.ok) return { pdvsVisitadosIds: [], tasksTotal: 0, ofertasTotal: 0, missoesTotal: 0 };
    return await response.json();
  } catch (error) {
    console.error("Erro ao buscar dashboard geral:", error);
    return { pdvsVisitadosIds: [], tasksTotal: 0, ofertasTotal: 0, missoesTotal: 0 };
  }
};

// 🔥 CORREÇÃO: Alinhado com o @GetMapping("/resumo-mensal/setor/{setor}")
export const obterDashboardMes = async (setorParam) => {
  try {
    const setor = setorParam || localStorage.getItem('setorAtivo');
    
    const response = await fetch(`${BASE_URL}/dashboard/resumo-mensal/setor/${setor}`);
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

export const obterVisitaPorId = async (id) => {
  const response = await api.get(`/visitas/${id}`);
  return response.data;
};

// Adicione esta exportação no seu arquivo de serviços
export const obterItensPendentes = async (visitaId) => {
  try {
    const response = await api.get(`/visitas/${visitaId}/itens-pendentes`);
    return response.data; // O Java vai devolver ['Boleto', 'Verificar TCC']
  } catch (error) {
    console.error("Erro ao buscar itens da pendência:", error);
    return [];
  }
};
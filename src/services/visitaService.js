import api from './api';

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

// 🔥 ATUALIZADO: Agora enviamos as subdivisões e o status de comprador para o Java!
export const finalizarVisita = async (visitaId, anotacao, tasks, ofertas, missoes, compra, cerveja, nab, mkt, comprador) => {
  const response = await api.put(`/visitas/${visitaId}/finalizar`, {
    anotacao,
    qtdTasks: tasks,
    qtdOfertas: ofertas,
    qtdMissoes: missoes,
    qtdTasksCompra: compra,
    qtdTasksCerveja: cerveja,
    qtdTasksNab: nab,
    qtdTasksMkt: mkt,
    virouComprador: comprador
  });
  return response.data;
};

export const obterDashboardGeral = async (setorParam) => {
  try {
    const setor = setorParam || localStorage.getItem('setorAtivo');
    const response = await fetch(`${BASE_URL}/dashboard/resumo-do-dia/setor/${setor}`);
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.error("Erro ao buscar dashboard:", error);
    return null;
  }
};

export const obterDashboardMes = async (setorParam) => {
  try {
    const setor = setorParam || localStorage.getItem('setorAtivo');
    const response = await fetch(`${BASE_URL}/dashboard/resumo-mensal/setor/${setor}`);
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.error("Erro ao buscar dashboard mensal:", error);
    return null;
  }
};

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

export const consultarRastreio = async (pdvId) => {
  try {
    const response = await fetch(`${BASE_URL}/entregas/rastreio/${pdvId}`);
    if (!response.ok) return null; 
    return await response.json();
  } catch (error) {
    console.error("Erro na busca de rastreio:", error);
    throw error;
  }
};

export const resolverPendenciaManual = async (id) => {
  await fetch(`${BASE_URL}/pendencias-manuais/resolver/${id}`, { method: 'PUT' });
};

export const deletarPendenciaManual = async (id) => {
  await fetch(`${BASE_URL}/pendencias-manuais/deletar/${id}`, { method: 'DELETE' });
};

export const obterVisitaPorId = async (id) => {
  const response = await api.get(`/visitas/${id}`);
  return response.data;
};

export const obterItensPendentes = async (visitaId) => {
  const response = await api.get(`/visitas/${visitaId}/itens-pendentes`);
  return response.data;
};
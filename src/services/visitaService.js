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

export const finalizarVisita = async (
  id, anotacao, qtdTasks, qtdOfertas, qtdMissoes,
  qtdTasksCompra, qtdTasksCerveja, qtdTasksNab, qtdTasksMkt,
  virouComprador, qtdPositivacao
) => {
  // Ajuste a URL abaixo se a sua for diferente, mas o "body" tem de ser exatamente este!
  const BASE_URL = 'https://rnplanner-api-ekc2hratcvgqhgc5.brazilsouth-01.azurewebsites.net';
  
  const response = await fetch(`${BASE_URL}/visitas/${id}/finalizar`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      anotacao: anotacao,
      qtdTasks: qtdTasks,
      qtdOfertas: qtdOfertas,
      qtdMissoes: qtdMissoes,
      qtdTasksCompra: qtdTasksCompra,
      qtdTasksCerveja: qtdTasksCerveja,
      qtdTasksNab: qtdTasksNab,
      qtdTasksMkt: qtdTasksMkt,
      virouComprador: virouComprador,
      qtdPositivacao: qtdPositivacao // 🔥 AGORA SIM ELE MANDA A POSITIVAÇÃO!
    })
  });
  return await response.json();
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
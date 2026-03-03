import api from './api';

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

// 🔥 FUNÇÃO BLINDADA: Com Auto-Preenchimento para não zerar o Resumo!
export const obterDashboardGeral = async (setorParam) => {
  try {
    // Se a tela mandar o setor, ele usa. Se não mandar (ex: Tela de Resumo), ele busca no cache do celular!
    const setor = setorParam || localStorage.getItem('setorAtivo');
    
    // Envia o setor na URL para o Java filtrar
    const response = await fetch(`https://rnplanner-api-ekc2hratcvgqhgc5.brazilsouth-01.azurewebsites.net/visitas/dashboard/${setor}`);
    if (!response.ok) return { pdvsVisitadosIds: [], tasksTotal: 0, ofertasTotal: 0, missoesTotal: 0 };
    return await response.json();
  } catch (error) {
    console.error("Erro ao buscar dashboard:", error);
    return { pdvsVisitadosIds: [], tasksTotal: 0, ofertasTotal: 0, missoesTotal: 0 };
  }
};

export const obterDashboardMes = async () => {
  const response = await api.get('/visitas/dashboard/mes');
  return response.data;
};

// 🔥 FUNÇÃO BLINDADA: O Java agora exige o setor nas pendências para não misturar!
export const obterPendenciasGlobais = async (setorParam) => {
  try {
    const setor = setorParam || localStorage.getItem('setorAtivo');
    // Adicionamos o /${setor} na URL para bater com a segurança do Java
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
    // Usando o seu IP oficial para o celular não se perder
    const response = await fetch(`https://rnplanner-api-ekc2hratcvgqhgc5.brazilsouth-01.azurewebsites.net/entregas/rastreio/${pdvId}`);
    
    if (!response.ok) {
      return null; // Se o PDV não tiver carga, retorna nulo
    }
    
    return await response.json();
  } catch (error) {
    console.error("Erro na busca de rastreio:", error);
    throw error;
  }
};
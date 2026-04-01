import api from './api';

/**
 * SERVIÇO: Task Service (Gestão de Tarefas)
 * @description Isola a camada de comunicação HTTP (Axios) relacionada à execução de Tasks no PDV.
 * Controla o CRUD de tarefas específicas de cada visita.
 */

// =========================================================================
// 1. REQUISIÇÕES (Endpoints)
// =========================================================================

/**
 * Registra uma nova tarefa (Task) associada a uma Visita em andamento.
 * * @param {number|string} visitaId - ID da visita atual.
 * @param {Object} task - Payload contendo os detalhes da task (ex: tipo, foto, status).
 * @returns {Promise<Object|null>} Retorna os dados da task criada ou null em caso de erro.
 */
export const criarTask = async (visitaId, task) => {
  try {
    const response = await api.post(`/tasks/visita/${visitaId}`, task);
    return response.data;
  } catch (error) {
    console.error(`Erro ao criar task na visita ${visitaId}:`, error);
    // Retorna null para que a tela saiba que falhou e possa mostrar um Toast de erro
    return null; 
  }
};

/**
 * Altera o status de uma tarefa específica para "Concluída".
 * * @param {number|string} taskId - ID único da tarefa.
 * @returns {Promise<Object|null>} Retorna a task atualizada ou null em caso de falha.
 */
export const concluirTask = async (taskId) => {
  try {
    // O envio de um objeto vazio {} no PUT é intencional, pois a rota só precisa do ID para mudar o status
    const response = await api.put(`/tasks/${taskId}/concluir`, {});
    return response.data;
  } catch (error) {
    console.error(`Erro ao concluir a task ${taskId}:`, error);
    return null;
  }
};

/**
 * Recupera a lista completa de tarefas planejadas/executadas em uma Visita.
 * * @param {number|string} visitaId - ID da visita atual.
 * @returns {Promise<Array>} Retorna um array de tasks ou um array vazio [] para proteger a UI.
 */
export const listarTasksPorVisita = async (visitaId) => {
  try {
    const response = await api.get(`/tasks/visita/${visitaId}`);
    return response.data;
  } catch (error) {
    // 🛡️ BLINDAGEM DE UX:
    // Se a rede cair, devolvemos [] para que o (tasks.map) do React não quebre a tela inteira.
    console.error(`Erro ao listar tasks da visita ${visitaId}:`, error);
    return [];
  }
};
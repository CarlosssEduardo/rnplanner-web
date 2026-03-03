import api from './api';

export const criarTask = async (visitaId, task) => {
  const response = await api.post(`/tasks/visita/${visitaId}`, task);
  return response.data;
};

export const concluirTask = async (taskId) => {
  const response = await api.put(`/tasks/${taskId}/concluir`, {});
  return response.data;
};

export const listarTasksPorVisita = async (visitaId) => {
  const response = await api.get(`/tasks/visita/${visitaId}`);
  return response.data;
};
import api from './api';

export const criarPdv = async (pdv) => {
  const response = await api.post('/pdvs', pdv);
  return response.data;
};

// 🔥 Agora a função pede a rota do setor específico
export const listarPdvs = async (setor) => {
  try {
    const response = await fetch(`https://rnplanner-api.azurewebsites.net/pdvs/setor/${setor}`);
    if (!response.ok) return [];
    return await response.json();
  } catch (error) {
    console.error("Erro ao buscar PDVs:", error);
    return [];
  }
};
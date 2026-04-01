import api from './api';

/**
 * SERVIÇO: PDV Service (Gestão de Clientes)
 * @description Isola a camada de comunicação HTTP (Axios) relacionada aos Pontos de Venda.
 * Segue o princípio de Separação de Responsabilidades (SoC), mantendo os componentes React limpos.
 */

// =========================================================================
// 1. REQUISIÇÕES (Endpoints)
// =========================================================================

/**
 * Cria um novo Ponto de Venda no banco de dados.
 * * @param {Object} pdv - Objeto (Payload) contendo os dados do cliente.
 * @returns {Promise<Object>} Retorna o PDV recém-criado com seu ID gerado pelo banco.
 */
export const criarPdv = async (pdv) => {
  const response = await api.post('/pdvs', pdv);
  return response.data;
};

/**
 * Recupera a carteira de clientes atribuída a um setor específico.
 * * @param {string} setor - Número do setor logado (Ex: "303").
 * @returns {Promise<Array>} Retorna uma lista de PDVs ou um Array vazio em caso de falha.
 */
export const listarPdvs = async (setor) => {
  try {
    // Utiliza a instância global 'api' (que já resolve a URL dinamicamente via .env)
    const response = await api.get(`/pdvs/setor/${setor}`);
    return response.data;
    
  } catch (error) {
    // 🛡️ BLINDAGEM DE FRONT-END (Fallback):
    // Se a API cair ou demorar, registramos o erro silenciosamente no console 
    // e retornamos um Array Vazio []. Isso garante que a função `.map()` 
    // lá no HomeScreen.jsx não estoure a famosa tela branca de erro do React!
    console.error("Erro ao buscar a carteira de PDVs do setor:", error);
    return [];
  }
};
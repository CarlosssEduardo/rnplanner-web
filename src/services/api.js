import axios from 'axios';

/**
 * CONFIGURAÇÃO GLOBAL DA API (HTTP Client)
 * @description Instância customizada do Axios para orquestrar todas as requisições ao Back-End (Spring Boot).
 * Centraliza a URL base e as regras de timeout, garantindo que o Front-End seja escalável e seguro.
 */

// =========================================================================
// 1. RESOLUÇÃO DE AMBIENTE (Environment Strategy)
// =========================================================================
/**
 * Define dinamicamente para onde o aplicativo vai apontar:
 * - Em Desenvolvimento (PC): Busca a variável VITE_API_URL do arquivo .env (ex: http://localhost:8080).
 * - Em Produção (Vercel/Netlify): Assume automaticamente o servidor oficial hospedado na Azure.
 */
const URL_DINAMICA = import.meta.env.VITE_API_URL || 'https://rnplanner-api-ekc2hratcvgqhgc5.brazilsouth-01.azurewebsites.net';

// =========================================================================
// 2. CRIAÇÃO DA INSTÂNCIA
// =========================================================================
const api = axios.create({
  baseURL: URL_DINAMICA,
  
  // Blindagem de UX (User Experience): 
  // Se a internet do vendedor oscilar ou o servidor demorar mais de 5 segundos para responder,
  // a requisição é abortada (Timeout). Isso evita que a tela fique congelada infinitamente.
  timeout: 5000,
  
});

export default api;
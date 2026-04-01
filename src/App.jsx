import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// =========================================================================
// IMPORTAÇÃO DAS TELAS (Views/Pages)
// =========================================================================
import LoginScreen from './screens/LoginScreen';
import HomeScreen from './screens/HomeScreen';
import VisitaScreen from './screens/VisitaScreen';
import ResumoScreen from './screens/ResumoScreen';

/**
 * COMPONENTE RAIZ: App
 * @description Ponto de entrada oficial da aplicação React.
 * Orquestra o sistema de roteamento (Navegação Web) utilizando a biblioteca react-router-dom.
 */
export default function App() {
  return (
    /* O BrowserRouter encapsula a árvore do app para manipular a API de Histórico do HTML5 */
    <BrowserRouter>
      <Routes>
        
        {/* =========================================================================
            1. ROTAS DE REDIRECIONAMENTO E FALLBACK
            ========================================================================= */}
        {/* UX/Segurança: Se o usuário acessar a raiz ("/") vazia, é ejetado para o Login.
          O parâmetro 'replace' destrói essa transição no histórico do navegador para evitar loops 
          quando o usuário apertar o botão "Voltar".
        */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        
        {/* =========================================================================
            2. ROTAS OFICIAIS DO SISTEMA
            ========================================================================= */}
        <Route path="/login" element={<LoginScreen />} />
        <Route path="/home" element={<HomeScreen />} />
        <Route path="/visita" element={<VisitaScreen />} />
        <Route path="/resumo" element={<ResumoScreen />} />

        {/* =========================================================================
            3. ROTA CURINGA (Tratamento de Erro 404)
            ========================================================================= */}
        {/* Blindagem Front-End: O asterisco (*) captura qualquer URL que não foi mapeada acima. 
          Se o vendedor tentar inventar uma rota, o sistema força ele a voltar pro Login em segurança.
        */}
        <Route path="*" element={<Navigate to="/login" replace />} />

      </Routes>
    </BrowserRouter>
  );
}
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Importando as nossas telas (Certifique-se de que elas estão na pasta correta, ex: src/screens/)
import LoginScreen from './screens/LoginScreen';
import HomeScreen from './screens/HomeScreen';
import VisitaScreen from './screens/VisitaScreen';
import ResumoScreen from './screens/ResumoScreen';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rota padrão: Se entrar no site sem nada, joga para o Login */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        
        {/* As nossas 4 rotas oficiais */}
        <Route path="/login" element={<LoginScreen />} />
        <Route path="/home" element={<HomeScreen />} />
        <Route path="/visita" element={<VisitaScreen />} />
        <Route path="/resumo" element={<ResumoScreen />} />
      </Routes>
    </BrowserRouter>
  );
}
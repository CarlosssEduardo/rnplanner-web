import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './LoginScreen.css';

/**
 * COMPONENTE: LoginScreen
 * @description Porta de entrada do sistema (Gatekeeper).
 * Responsável por autenticar o vendedor validando a existência do setor
 * no banco de dados e gerenciando a sessão inicial no cache do navegador.
 */
const LoginScreen = () => {
  const navigate = useNavigate();

  // =========================================================================
  // 1. STATE MANAGEMENT (Gerenciamento de Estado)
  // =========================================================================
  
  const [setor, setSetor] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Controle de feedback visual para o usuário (Toast de Erro)
  const [erroMsg, setErroMsg] = useState('');

  // =========================================================================
  // 2. FUNÇÕES AUXILIARES (Helpers)
  // =========================================================================

  /**
   * Exibe uma notificação temporária de erro na tela.
   * O timeout garante que a mensagem desapareça automaticamente, limpando a UI.
   *
   * @param {string} mensagem - O texto descritivo do erro.
   */
  const mostrarErro = (mensagem) => {
    setErroMsg(mensagem);
    setTimeout(() => {
      setErroMsg('');
    }, 4000);
  };

  // =========================================================================
  // 3. CORE LOGIC (Regra de Negócio e Autenticação)
  // =========================================================================

  /**
   * Valida o input do usuário e consulta o Back-End para liberar o acesso.
   * Atua como uma camada de segurança primária (Catraca).
   */
  const handleLogin = async () => {
    // Blindagem 1: Impede requisições de rede inúteis se o campo estiver vazio ou só com espaços
    if (!setor.trim()) {
      mostrarErro("Atenção, RN! Digite o número do seu setor.");
      return;
    }

    setIsLoading(true);

    try {
      // Resolve dinamicamente a URL da API (Local vs Nuvem/Produção)
      const BASE_URL = import.meta.env.VITE_API_URL;
      
      // Consulta o endpoint de verificação de segurança no Spring Boot
      const response = await fetch(`${BASE_URL}/pdvs/verificar/${setor.trim()}`);
      
      // Blindagem 2: Verifica se o servidor caiu (Erro 500) ou a rota não existe (Erro 404)
      if (!response.ok) {
        mostrarErro("Erro na comunicação com o servidor.");
        setIsLoading(false);
        return;
      }

      // Converte a resposta booleana (true/false) vinda do Java
      const setorExiste = await response.json();

      // Blindagem 3: Validação de Regra de Negócio (Setor não cadastrado na base)
      if (!setorExiste) {
        mostrarErro(`Acesso Negado: O Setor ${setor} não foi encontrado no banco de dados!`);
        setIsLoading(false);
        return;
      }

      // =========================================================================
      // SUCESSO: Liberação de Catraca
      // =========================================================================
      // Salva o setor autenticado no cache (LocalStorage) para ser usado globalmente pelas outras telas
      localStorage.setItem('setorAtivo', setor.trim());
      
      // Redireciona o usuário para o Dashboard Operacional
      navigate('/home');

    } catch (error) {
      // Blindagem 4: Captura falhas de CORS ou falta de internet no aparelho
      console.error("Erro ao consultar o Java:", error);
      mostrarErro("Erro de comunicação com o Quartel General (JAVA).");
      setIsLoading(false);
    }
  };

  // =========================================================================
  // 4. RENDERIZAÇÃO (UI)
  // =========================================================================
  
  return (
    <div className="loginSafeArea">
      
      {/* Toast Flutuante de Erro (Renderização Condicional) */}
      {erroMsg && (
        <div className="toastErroLogin">
          <span className="toastIcon">⚠️</span>
          <span className="toastText">{erroMsg}</span>
        </div>
      )}

      {/* Elementos Visuais de Fundo */}
      <div className="bgHexagon" style={{ top: -50, left: -50 }}></div>
      <div className="bgHexagon" style={{ top: 150, right: -80 }}></div>
      <div className="bgHexagon" style={{ bottom: 200, left: -40 }}></div>

      <div className="loginContainer">
        
        <div className="logoSection">
          <div className="hexagonBorder">
            <div className="hexagonInner">
              <span className="projectIcon">🎯</span>
            </div>
          </div>

          <div className="titleRow">
            <span className="titleBees">RN</span>
            <span className="titleForce">PLANNER</span>
          </div>
        </div>

        <div className="bottomWrapper">
          <div className="bottomCard">
            <h1 className="welcomeText">Bem-vindo ao Planejamento do RN</h1>
            <p className="instructionText boldText">ACESSAR MEU PLANNER</p>

            <div className="inputActionRow">
              <input 
                type="text" 
                inputMode="numeric" 
                pattern="[0-9]*"
                className="loginInputSetor" 
                placeholder="Nº do Setor" 
                value={setor}
                onChange={(e) => setSetor(e.target.value)}
                // Gatilho de usabilidade: Permite logar apertando 'Enter' no teclado
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                disabled={isLoading}
              />
              <button className="goButton" onClick={handleLogin} disabled={isLoading}>
                {isLoading ? '⏳' : '➜'}
              </button>
            </div>
          </div>

          <div className="footerSection">
            <span className="versionText">Versão 1.0.0 - Desenvolvido por Carlos Eduardo</span>
          </div>
        </div>

      </div>
    </div>
  );
};

export default LoginScreen;
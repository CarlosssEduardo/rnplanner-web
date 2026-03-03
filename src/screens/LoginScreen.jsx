import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './LoginScreen.css';

const LoginScreen = () => {
  const navigate = useNavigate();
  const [setor, setSetor] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // 🔥 NOVO: Estado para controlar a mensagem de erro bonita
  const [erroMsg, setErroMsg] = useState('');

  // Função que exibe o erro e apaga sozinho depois de 4 segundos
  const mostrarErro = (mensagem) => {
    setErroMsg(mensagem);
    setTimeout(() => {
      setErroMsg('');
    }, 4000);
  };

  const handleLogin = async () => {
    if (!setor.trim()) {
      mostrarErro("Atenção, Rn! Digite o número do seu setor.");
      return;
    }

    setIsLoading(true);

    try {
      // 🔥 O SEGURANÇA NA PORTA: Pergunta pro Java se esse setor existe (retorna true ou false)
      const response = await fetch(`https://rnplanner-api-ekc2hratcvgqhgc5.brazilsouth-01.azurewebsites.net/pdvs/verificar/${setor.trim()}`);
      
      if (!response.ok) {
        mostrarErro("Erro na comunicação com o servidor.");
        setIsLoading(false);
        return;
      }

      // Converte a resposta do Java (que vai ser true ou false)
      const setorExiste = await response.json();

      if (!setorExiste) {
        // 🔥 Se for falso, barra o intruso e mostra o Toast!
        mostrarErro(`Acesso Negado: O Setor ${setor} não foi encontrado no banco de dados!`);
        setIsLoading(false);
        return;
      }

      // Se passou pela barreira, o setor é real! Salva e libera a entrada.
      localStorage.setItem('setorAtivo', setor.trim());
      navigate('/home');

    } catch (error) {
      console.error("Erro ao consultar o Java:", error);
      mostrarErro("Erro de comunicação com o Quartel General (JAVA).");
      setIsLoading(false);
    }
  };

  return (
    <div className="loginSafeArea">
      
      {/* 🔥 NOVO: O Toast Flutuante de Erro */}
      {erroMsg && (
        <div className="toastErroLogin">
          <span className="toastIcon">⚠️</span>
          <span className="toastText">{erroMsg}</span>
        </div>
      )}

      <div className="bgHexagon" style={{ top: -50, left: -50 }}></div>
      <div className="bgHexagon" style={{ top: 150, right: -80 }}></div>
      <div className="bgHexagon" style={{ bottom: 200, left: -40 }}></div>

      <div className="loginContainer">
        
        <div className="logoSection">
          <div className="hexagonBorder">
            <div className="hexagonInner">
              <span className="beeEmoji">🐝</span>
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
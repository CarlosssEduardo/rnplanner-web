# 📱 RN Planner - Web Mobile App (PWA)

![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![JavaScript](https://img.shields.io/badge/javascript-%23323330.svg?style=for-the-badge&logo=javascript&logoColor=%23F7DF1E)
![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white)
![Azure](https://img.shields.io/badge/azure-%230072C6.svg?style=for-the-badge&logo=microsoftazure&logoColor=white)

> **Aplicativo Web Mobile (PWA) focado na operação de campo, funcionando como um "Hub de Execução" para Representantes de Negócios.**

## 📖 Sobre o Projeto

O Front-End Mobile do **RN Planner** foi desenvolvido para ser utilizado diretamente no Ponto de Venda (PDV). Ele digitaliza a rotina comercial, eliminando anotações em papel e planilhas, e traz previsibilidade para a remuneração variável da equipe (meta de 100.000 pontos). 

Projetado com a abordagem *Mobile-First*, ele atua como um aplicativo instalável no celular (PWA), garantindo uma experiência nativa e fluida mesmo em ambientes com conexões de internet instáveis (como o interior de supermercados).

---

## 🚀 Tecnologias e Arquitetura

* **Biblioteca UI:** React.js
* **Build Tool:** Vite (para *Hot Module Replacement* ultrarrápido)
* **Linguagem:** JavaScript (ES6+) e JSX
* **Roteamento:** React Router DOM
* **Integração HTTP:** Axios (consumindo a API Java RESTful)
* **Estilização:** CSS3 (Custom Modules & UI Components)
* **Performance & Cache:** Arquitetura PWA (Progressive Web App)
* **Deploy:** Microsoft Azure (Static Web Apps)

---

## ⚡ Funcionalidades Principais

* **Dashboard de Produtividade:** Barra de progresso dinâmica que calcula automaticamente o atingimento da meta mensal (Tasks, Ofertas e Missões).
* **Gestão de Visitas e Roteiro:** Interface otimizada para "check-in" no PDV, mostrando histórico de compras e nível de serviço.
* **Painel de Pendências (Acordos):** Sistema de gestão de pendências do cliente (ex: entrega de materiais, tratativas financeiras). Implementação de filtros inteligentes para ocultar itens "RESOLVIDOS" e focar no que é urgente.
* **Resiliência de Dados:** Tratamento de estado assíncrono e cacheamento estratégico para evitar bloqueios na tela de execução B2B.

---

## 🛠️ Como executar localmente

### Pré-requisitos
* Node.js instalado (v16 ou superior)
* NPM ou Yarn

### Passos para rodar:

1. **Clone este repositório:**
   ```bash
   git clone https://github.com/CarlosssEduardo/rnplanner-web.git
/**
 * Módulo de Autenticação - Portal Goulart Educa
 * Gestão centralizada de sessão e controlo de acessos
 */
const Auth = {
  STORAGE_KEY: "goulart_user_session",

  // Regista o utilizador e guarda os dados no LocalStorage
  login: function(email, password) {
    let nameFromEmail = email ? email.split('@')[0] : "Estudante";
    nameFromEmail = nameFromEmail.replace(/[._-]/g, ' ');
    const formattedName = nameFromEmail.replace(/\b\w/g, l => l.toUpperCase());

    const sessionData = {
      isLoggedIn: true,
      userName: formattedName || "Estudante Goulart",
      userClass: "3º Ano - Ensino Médio (Turma A)",
      email: email,
      loginTime: new Date().toISOString()
    };

    // Guarda nos dois formatos para garantir retrocompatibilidade
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(sessionData));
    localStorage.setItem("userLoggedIn", "true");
    localStorage.setItem("userName", formattedName);
    return true;
  },

  // Termina a sessão e redireciona para o login
  logout: function() {
    localStorage.removeItem(this.STORAGE_KEY);
    localStorage.removeItem("userLoggedIn");
    localStorage.removeItem("userName");
    window.location.href = "index.html";
  },

  // Verifica se existe uma sessão ativa válida
  isLoggedIn: function() {
    const session = localStorage.getItem(this.STORAGE_KEY);
    if (session) {
      try {
        const data = JSON.parse(session);
        if (data && data.isLoggedIn === true) return true;
      } catch (e) {
        // Fallback em caso de erro no parse do JSON
      }
    }
    return localStorage.getItem("userLoggedIn") === "true";
  },

  // Obtém os dados do utilizador atualmente ligado
  getUser: function() {
    const session = localStorage.getItem(this.STORAGE_KEY);
    if (session) {
      try {
        return JSON.parse(session);
      } catch (e) {
        // Fallback
      }
    }
    return {
      userName: localStorage.getItem("userName") || "Estudante Goulart",
      userClass: "3º Ano - Ensino Médio (Turma A)"
    };
  },

  // Proteção de Rota: Redireciona para o login se não estiver autenticado
  requireAuth: function() {
    if (!this.isLoggedIn()) {
      window.location.href = "index.html";
    }
  },

  // Atualiza o nome e a turma no cabeçalho das páginas internas
  loadProfile: function() {
    const user = this.getUser();
    const nameEl = document.getElementById("userName");
    const classEl = document.getElementById("userClass");

    if (nameEl) nameEl.textContent = user.userName || "Estudante";
    if (classEl) classEl.textContent = user.userClass || "3º Ano - Ensino Médio";
  }
};
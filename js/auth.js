const Auth = {
  login(email, password) {
    // Simulação de chamada à API baseada no schema.sql
    if (email === "aluno@goulart.com" && password === "123456") {
      const user = {
        id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
        nome: "Carlos Eduardo Silva",
        email: email,
        matricula: "2026001",
        turma: "3º Ano B",
        papel: "aluno"
      };
      localStorage.setItem('@GoulartEduca:user', JSON.stringify(user));
      window.location.href = 'dashboard.html';
      return true;
    }
    return false;
  },

  logout() {
    localStorage.removeItem('@GoulartEduca:user');
    window.location.href = 'index.html';
  },

  getUser() {
    const user = localStorage.getItem('@GoulartEduca:user');
    return user ? JSON.parse(user) : null;
  },

  requireAuth() {
    if (!this.getUser()) {
      window.location.href = 'index.html';
    }
  },
  
  loadProfile() {
    const user = this.getUser();
    if (user) {
      document.getElementById('userName').innerText = user.nome;
      document.getElementById('userClass').innerText = `${user.turma} • Matrícula: ${user.matricula}`;
    }
  }
};
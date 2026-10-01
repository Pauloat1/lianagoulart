document.addEventListener('DOMContentLoaded', () => {
  let selectedRole = 'aluno'; // Perfil padrão inicial

  const roleButtons = document.querySelectorAll('.role-btn');
  const loginForm = document.getElementById('login-form');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const togglePasswordBtn = document.getElementById('toggle-password-btn');
  const alertMessage = document.getElementById('alert-message');
  const forgotPasswordLink = document.getElementById('forgot-password-link');

  // Carregar e-mail salvo se houver opção "Lembrar-me" anterior
  const savedEmail = localStorage.getItem('rememberedEmail');
  if (savedEmail) {
    emailInput.value = savedEmail;
    document.getElementById('remember-me').checked = true;
  }

  /**
   * 1. Seleção do Perfil de Acesso
   */
  roleButtons.forEach(button => {
    button.addEventListener('click', () => {
      roleButtons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');
      selectedRole = button.getAttribute('data-role');
      
      // Limpa alertas ao trocar de perfil
      hideAlert();
    });
  });

  /**
   * 2. Alternar visibilidade da Senha
   */
  if (togglePasswordBtn && passwordInput) {
    togglePasswordBtn.addEventListener('click', () => {
      const isPassword = passwordInput.getAttribute('type') === 'password';
      passwordInput.setAttribute('type', isPassword ? 'text' : 'password');
      togglePasswordBtn.textContent = isPassword ? '🙈' : '👁️';
    });
  }

  /**
   * 3. Submissão do Formulário de Login
   */
  if (loginForm) {
    loginForm.addEventListener('submit', (event) => {
      event.preventDefault();

      const rawEmail = emailInput.value.trim();
      const rawPassword = passwordInput.value;
      const rememberMe = document.getElementById('remember-me').checked;

      // Sanitização básica contra scripts maliciosos
      const cleanEmail = sanitizeInput(rawEmail);

      // Validação básica dos campos
      if (!validateEmail(cleanEmail)) {
        showAlert('Por favor, informe um endereço de e-mail válido.', 'danger');
        return;
      }

      if (rawPassword.length < 6) {
        showAlert('A senha deve conter no mínimo 6 caracteres.', 'danger');
        return;
      }

      // Processamento de autenticação
      showAlert('Autenticando, aguarde...', 'success');

      // Salvar informações no localStorage para persistência do sistema
      localStorage.setItem('userRole', selectedRole);
      localStorage.setItem('userEmail', cleanEmail);
      localStorage.setItem('isLoggedIn', 'true');

      if (rememberMe) {
        localStorage.setItem('rememberedEmail', cleanEmail);
      } else {
        localStorage.removeItem('rememberedEmail');
      }

      // Simulação de delay de rede antes de redirecionar
      setTimeout(() => {
        // Redireciona para o dashboard principal ou página de horários
        window.location.href = 'dashboard.html';
      }, 800);
    });
  }

  /**
   * 4. Recuperação de Senha
   */
  if (forgotPasswordLink) {
    forgotPasswordLink.addEventListener('click', (e) => {
      e.preventDefault();
      const email = emailInput.value.trim();

      if (!email || !validateEmail(email)) {
        showAlert('Digite o seu e-mail no campo acima para instrução de recuperação.', 'danger');
        emailInput.focus();
      } else {
        showAlert(`Enviamos um link de redefinição para ${sanitizeInput(email)}.`, 'success');
      }
    });
  }

  // Métodos Utilitários
  function showAlert(msg, type) {
    alertMessage.textContent = msg;
    alertMessage.className = `alert-box alert-${type}`;
    alertMessage.style.display = 'block';
  }

  function hideAlert() {
    alertMessage.style.display = 'none';
  }

  function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  }

  function sanitizeInput(str) {
    const temp = document.createElement('div');
    temp.textContent = str;
    return temp.innerHTML;
  }
});
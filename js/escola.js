document.addEventListener('DOMContentLoaded', () => {
  initNoticeSearch();
});

/**
 * Filtro em tempo real para os avisos do mural
 */
function initNoticeSearch() {
  const searchInput = document.getElementById('notice-search');
  const noticeContainer = document.getElementById('notice-container');

  if (!searchInput || !noticeContainer) return;

  searchInput.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase().trim();
    const notices = noticeContainer.getElementsByTagName('article');

    Array.from(notices).forEach((notice) => {
      const title = notice.querySelector('h4')?.textContent.toLowerCase() || '';
      const text = notice.querySelector('p')?.textContent.toLowerCase() || '';

      if (title.includes(query) || text.includes(query)) {
        notice.style.display = 'block';
      } else {
        notice.style.display = 'none';
      }
    });
  });
}

/**
 * Simulação de download seguro de documentos da secretaria
 * @param {string} fileName Nome do arquivo a ser baixado
 */
function downloadDocument(fileName) {
  // Sanitiza a string para evitar inserção indevida
  const cleanFileName = sanitizeInput(fileName);
  
  // Cria um feedback visual simples para o usuário
  alert(`Iniciando download seguro do documento: ${cleanFileName}`);
  
  // Exemplo de criação dinâmica de link para download em ambiente de produção
  const fakeLink = document.createElement('a');
  fakeLink.href = `#download-${encodeURIComponent(cleanFileName)}`;
  fakeLink.setAttribute('download', cleanFileName);
  document.body.appendChild(fakeLink);
  // fakeLink.click();
  document.body.removeChild(fakeLink);
}

/**
 * Função de sanitização simples contra XSS
 */
function sanitizeInput(str) {
  const temp = document.createElement('div');
  temp.textContent = str;
  return temp.innerHTML;
}
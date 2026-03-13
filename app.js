/* ============================================================
   GRÊMIO FÊNIX — PAINEL ADMINISTRATIVO
   JavaScript Principal — LocalStorage + Chart.js
   ============================================================ */

'use strict';

// ============================================================
// ESTADO GLOBAL
// ============================================================
const STATE = {
  entradas:  [],
  gastos:    [],
  membros:   [],
  eventos:   [],
  sugestoes: [],
  decisoes:  [],
  galeria:   []
};

// ============================================================
// PERSISTÊNCIA (LocalStorage)
// ============================================================
function salvar() {
  localStorage.setItem('gremio_fenix_data', JSON.stringify(STATE));
}

function carregar() {
  const raw = localStorage.getItem('gremio_fenix_data');
  if (raw) {
    try {
      const data = JSON.parse(raw);
      Object.assign(STATE, data);
    } catch (e) {
      console.error('Erro ao carregar dados:', e);
    }
  }
}

// ============================================================
// TOAST NOTIFICATION
// ============================================================
let toastTimer = null;

function showToast(msg, type = 'success') {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.className = `toast show ${type}`;
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.className = 'toast';
  }, 3200);
}

// ============================================================
// NAVEGAÇÃO
// ============================================================
function showSection(id, el) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

  const section = document.getElementById('section-' + id);
  if (section) section.classList.add('active');
  if (el) el.classList.add('active');

  const titles = {
    dashboard: 'Dashboard',
    financeiro: 'Financeiro',
    membros: 'Membros do Grêmio',
    agenda: 'Agenda do Grêmio',
    sugestoes: 'Sugestões',
    decisoes: 'Decisões do Grêmio',
    galeria: 'Galeria de Ações',
    backup: 'Backup de Dados'
  };
  document.getElementById('topbarTitle').textContent = titles[id] || 'Painel';
  // Atualiza seção específ ica ao abrir
  if (id === 'dashboard')  renderDashboard();
  if (id === 'financeiro') { renderFinanceiro(); renderChart(); }
  if (id === 'membros')    renderMembros();
  if (id === 'agenda')     renderEventos();
  if (id === 'sugestoes')  renderSugestoes();
  if (id === 'decisoes')   renderDecisoes();
  if (id === 'galeria')    renderGaleria();
  if (id === 'backup')     renderBackupResumo();

  closeSidebar();
}

function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebarOverlay');
  sidebar.classList.toggle('open');
  overlay.classList.toggle('active');
}

function closeSidebar() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebarOverlay');
  sidebar.classList.remove('open');
  overlay.classList.remove('active');
}

// ============================================================
// UTILITÁRIOS
// ============================================================
function formatBRL(val) {
  return 'R$ ' + Number(val).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}

function getMonthAbbr(dateStr) {
  const months = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
  if (!dateStr) return '';
  const [, m] = dateStr.split('-');
  return months[parseInt(m, 10) - 1] || '';
}

function today() {
  return new Date().toISOString().split('T')[0];
}

function nowDatetime() {
  return new Date().toLocaleString('pt-BR');
}

function calcSaldo() {
  const totalEntradas = STATE.entradas.reduce((s, e) => s + Number(e.valor), 0);
  const totalGastos   = STATE.gastos.reduce((s, g) => s + Number(g.valor), 0);
  return totalEntradas - totalGastos;
}

function calcTotalEntradas() {
  return STATE.entradas.reduce((s, e) => s + Number(e.valor), 0);
}

function calcTotalGastos() {
  return STATE.gastos.reduce((s, g) => s + Number(g.valor), 0);
}

// ============================================================
// DASHBOARD
// ============================================================
function renderDashboard() {
  const saldo = calcSaldo();
  const movs  = STATE.entradas.length + STATE.gastos.length;
  const mems  = STATE.membros.length;
  const evts  = STATE.eventos.length;

  document.getElementById('dashSaldo').textContent        = formatBRL(saldo);
  document.getElementById('dashMovimentacoes').textContent = movs;
  document.getElementById('dashMembros').textContent       = mems;
  document.getElementById('dashEventos').textContent       = evts;

  // Últimas movimentações (5 mais recentes)
  const allMovs = [
    ...STATE.entradas.map(e => ({ ...e, tipo: 'entrada' })),
    ...STATE.gastos.map(g => ({ ...g, tipo: 'gasto' }))
  ].sort((a, b) => (b.data || '').localeCompare(a.data || '')).slice(0, 5);

  const ulMov = document.getElementById('dashUltimasMovimentacoes');
  if (allMovs.length === 0) {
    ulMov.innerHTML = '<p class="empty-msg">Nenhuma movimentação registrada.</p>';
  } else {
    ulMov.innerHTML = allMovs.map(m => `
      <div class="mini-item">
        <span class="mini-date">${formatDate(m.data)}</span>
        <span class="mini-desc">${escHtml(m.descricao)}</span>
        <span class="${m.tipo === 'entrada' ? 'mini-val-pos' : 'mini-val-neg'}">
          ${m.tipo === 'entrada' ? '+' : '-'}${formatBRL(m.valor)}
        </span>
      </div>`).join('');
  }

  // Próximos eventos (3 mais próximos)
  const hoje = today();
  const proxEvts = [...STATE.eventos]
    .filter(e => e.data >= hoje)
    .sort((a, b) => a.data.localeCompare(b.data))
    .slice(0, 3);

  const ulEvt = document.getElementById('dashProximosEventos');
  if (proxEvts.length === 0) {
    ulEvt.innerHTML = '<p class="empty-msg">Nenhum evento próximo.</p>';
  } else {
    ulEvt.innerHTML = proxEvts.map(e => `
      <div class="mini-item">
        <span class="mini-date">${formatDate(e.data)}</span>
        <span class="mini-desc">${escHtml(e.nome)}</span>
      </div>`).join('');
  }

  // Últimas decisões (3 mais recentes)
  const ulDec = document.getElementById('dashUltimasDecisoes');
  const ultDecs = [...STATE.decisoes].reverse().slice(0, 3);
  if (ultDecs.length === 0) {
    ulDec.innerHTML = '<p class="empty-msg">Nenhuma decisão publicada.</p>';
  } else {
    ulDec.innerHTML = ultDecs.map(d => `
      <div class="mini-item">
        <span class="mini-date">${d.dataHora.split(' ')[0]}</span>
        <span class="mini-desc">${escHtml(d.titulo)}</span>
        <span class="mini-val-neu">&#9654;</span>
      </div>`).join('');
  }
}

// ============================================================
// FINANCEIRO
// ============================================================
function adicionarEntrada() {
  const data  = document.getElementById('entradaData').value;
  const valor = parseFloat(document.getElementById('entradaValor').value);
  const desc  = document.getElementById('entradaDesc').value.trim();

  if (!data || isNaN(valor) || valor <= 0 || !desc) {
    showToast('Preencha todos os campos corretamente.', 'error');
    return;
  }

  STATE.entradas.push({ id: Date.now(), data, valor, descricao: desc });
  salvar();
  renderFinanceiro();
  renderChart();
  renderDashboard();

  document.getElementById('entradaData').value  = '';
  document.getElementById('entradaValor').value = '';
  document.getElementById('entradaDesc').value  = '';

  showToast('Entrada registrada com sucesso!', 'success');
}

function adicionarGasto() {
  const data  = document.getElementById('gastoData').value;
  const valor = parseFloat(document.getElementById('gastoValor').value);
  const desc  = document.getElementById('gastoDesc').value.trim();

  if (!data || isNaN(valor) || valor <= 0 || !desc) {
    showToast('Preencha todos os campos corretamente.', 'error');
    return;
  }

  STATE.gastos.push({ id: Date.now(), data, valor, descricao: desc });
  salvar();
  renderFinanceiro();
  renderChart();
  renderDashboard();

  document.getElementById('gastoData').value  = '';
  document.getElementById('gastoValor').value = '';
  document.getElementById('gastoDesc').value  = '';

  showToast('Gasto registrado com sucesso!', 'success');
}

function deletarEntrada(id) {
  STATE.entradas = STATE.entradas.filter(e => e.id !== id);
  salvar();
  renderFinanceiro();
  renderChart();
  renderDashboard();
  showToast('Entrada removida.', 'warning');
}

function deletarGasto(id) {
  STATE.gastos = STATE.gastos.filter(g => g.id !== id);
  salvar();
  renderFinanceiro();
  renderChart();
  renderDashboard();
  showToast('Gasto removido.', 'warning');
}

function renderFinanceiro() {
  const saldo         = calcSaldo();
  const totalEntradas = calcTotalEntradas();
  const totalGastos   = calcTotalGastos();

  document.getElementById('finSaldo').textContent        = formatBRL(saldo);
  document.getElementById('finTotalEntradas').textContent = formatBRL(totalEntradas);
  document.getElementById('finTotalGastos').textContent   = formatBRL(totalGastos);

  // Lista entradas
  const listaE = document.getElementById('listaEntradas');
  const sortedE = [...STATE.entradas].sort((a, b) => b.data.localeCompare(a.data));
  if (sortedE.length === 0) {
    listaE.innerHTML = '<p class="empty-msg">Nenhuma entrada registrada.</p>';
  } else {
    listaE.innerHTML = sortedE.map(e => `
      <div class="transaction-item">
        <div class="transaction-info">
          <div class="transaction-desc">${escHtml(e.descricao)}</div>
          <div class="transaction-date">${formatDate(e.data)}</div>
        </div>
        <div class="transaction-right">
          <span class="transaction-val-pos">+${formatBRL(e.valor)}</span>
          <button class="btn-delete" onclick="deletarEntrada(${e.id})">&#10005;</button>
        </div>
      </div>`).join('');
  }

  // Lista gastos
  const listaG = document.getElementById('listaGastos');
  const sortedG = [...STATE.gastos].sort((a, b) => b.data.localeCompare(a.data));
  if (sortedG.length === 0) {
    listaG.innerHTML = '<p class="empty-msg">Nenhum gasto registrado.</p>';
  } else {
    listaG.innerHTML = sortedG.map(g => `
      <div class="transaction-item">
        <div class="transaction-info">
          <div class="transaction-desc">${escHtml(g.descricao)}</div>
          <div class="transaction-date">${formatDate(g.data)}</div>
        </div>
        <div class="transaction-right">
          <span class="transaction-val-neg">-${formatBRL(g.valor)}</span>
          <button class="btn-delete" onclick="deletarGasto(${g.id})">&#10005;</button>
        </div>
      </div>`).join('');
  }
}

// ============================================================
// GRÁFICO FINANCEIRO (Chart.js)
// ============================================================
let finChartInstance = null;

function renderChart() {
  const ctx = document.getElementById('finChart');
  if (!ctx) return;

  // Agrupa por mês
  const meses = {};

  STATE.entradas.forEach(e => {
    const key = e.data ? e.data.substring(0, 7) : 'N/A';
    if (!meses[key]) meses[key] = { entradas: 0, gastos: 0 };
    meses[key].entradas += Number(e.valor);
  });

  STATE.gastos.forEach(g => {
    const key = g.data ? g.data.substring(0, 7) : 'N/A';
    if (!meses[key]) meses[key] = { entradas: 0, gastos: 0 };
    meses[key].gastos += Number(g.valor);
  });

  const sortedKeys = Object.keys(meses).sort();
  const labels     = sortedKeys.map(k => {
    const [y, m] = k.split('-');
    const months = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
    return `${months[parseInt(m,10)-1] || m}/${y ? y.slice(2) : ''}`;
  });

  const dataEntradas = sortedKeys.map(k => meses[k].entradas);
  const dataGastos   = sortedKeys.map(k => meses[k].gastos);

  // Calcula saldo acumulado
  let saldoAcum = 0;
  const dataSaldo = sortedKeys.map(k => {
    saldoAcum += meses[k].entradas - meses[k].gastos;
    return saldoAcum;
  });

  // Se não há dados, mostra gráfico vazio
  const hasData = sortedKeys.length > 0;

  const finalLabels   = hasData ? labels   : ['Sem dados'];
  const finalEntradas = hasData ? dataEntradas : [0];
  const finalGastos   = hasData ? dataGastos   : [0];
  const finalSaldo    = hasData ? dataSaldo    : [0];

  if (finChartInstance) {
    finChartInstance.data.labels                   = finalLabels;
    finChartInstance.data.datasets[0].data         = finalEntradas;
    finChartInstance.data.datasets[1].data         = finalGastos;
    finChartInstance.data.datasets[2].data         = finalSaldo;
    finChartInstance.update();
    return;
  }

  finChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: finalLabels,
      datasets: [
        {
          label: 'Entradas',
          data: finalEntradas,
          backgroundColor: 'rgba(76, 175, 80, 0.75)',
          borderColor: '#4CAF50',
          borderWidth: 2,
          borderRadius: 6,
          order: 2
        },
        {
          label: 'Gastos',
          data: finalGastos,
          backgroundColor: 'rgba(198, 40, 40, 0.75)',
          borderColor: '#C62828',
          borderWidth: 2,
          borderRadius: 6,
          order: 2
        },
        {
          label: 'Saldo',
          data: finalSaldo,
          type: 'line',
          borderColor: '#FFD166',
          backgroundColor: 'rgba(255, 209, 102, 0.1)',
          borderWidth: 2.5,
          pointBackgroundColor: '#FFD166',
          pointRadius: 5,
          pointHoverRadius: 7,
          fill: true,
          tension: 0.4,
          order: 1
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: {
          labels: {
            color: '#A0A0A0',
            font: { family: 'Inter', size: 12 },
            padding: 20
          }
        },
        tooltip: {
          backgroundColor: '#1A1A1A',
          borderColor: 'rgba(255,209,102,0.35)',
          borderWidth: 1,
          titleColor: '#FFD166',
          bodyColor: '#F0F0F0',
          callbacks: {
            label: ctx => ` ${ctx.dataset.label}: R$ ${ctx.parsed.y.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
          }
        }
      },
      scales: {
        x: {
          ticks: { color: '#666666', font: { family: 'Inter', size: 11 } },
          grid:  { color: 'rgba(255,255,255,0.04)' }
        },
        y: {
          ticks: {
            color: '#666666',
            font: { family: 'Inter', size: 11 },
            callback: v => 'R$ ' + v.toLocaleString('pt-BR')
          },
          grid: { color: 'rgba(255,255,255,0.06)' }
        }
      }
    }
  });
}

// ============================================================
// MEMBROS
// ============================================================
function adicionarMembro() {
  const fileInput = document.getElementById('membroFoto');
  const nome  = document.getElementById('membroNome').value.trim();
  const cargo = document.getElementById('membroCargo').value.trim();

  if (!nome || !cargo) {
    showToast('Preencha nome e cargo do membro.', 'error');
    return;
  }

  if (!fileInput.files || fileInput.files.length === 0) {
    showToast('Selecione uma foto para o membro.', 'error');
    return;
  }

  const file = fileInput.files[0];
  const reader = new FileReader();

  reader.onload = function(e) {
    const fotoBase64 = e.target.result;
    STATE.membros.push({ id: Date.now(), nome, cargo, foto: fotoBase64 });
    salvar();
    renderMembros();
    renderDashboard();

    fileInput.value = '';
    document.getElementById('membroNome').value  = '';
    document.getElementById('membroCargo').value = '';

    showToast('Membro cadastrado com sucesso!', 'success');
  };

  reader.readAsDataURL(file);
}

function deletarMembro(id) {
  STATE.membros = STATE.membros.filter(m => m.id !== id);
  salvar();
  renderMembros();
  renderDashboard();
  showToast('Membro removido.', 'warning');
}

function renderMembros() {
  const lista = document.getElementById('listaMembros');
  const total = document.getElementById('totalMembros');
  total.textContent = STATE.membros.length;

  if (STATE.membros.length === 0) {
    lista.innerHTML = '<p class="empty-msg">Nenhum membro cadastrado.</p>';
    return;
  }

  lista.innerHTML = STATE.membros.map(m => {
    const initials = m.nome.split(' ').map(p => p[0]).join('').substring(0, 2).toUpperCase();
    const avatarContent = m.foto 
      ? `<img src="${m.foto}" alt="${escHtml(m.nome)}" class="member-avatar-img" />`
      : `<span class="member-avatar-text">${escHtml(initials)}</span>`;
    return `
      <div class="member-card">
        <button class="btn-delete member-delete" onclick="deletarMembro(${m.id})">&#10005;</button>
        <div class="member-avatar">${avatarContent}</div>
        <div class="member-name">${escHtml(m.nome)}</div>
        <div class="member-role">${escHtml(m.cargo)}</div>
      </div>`;
  }).join('');
}

// ============================================================
// AGENDA
// ============================================================
function adicionarEvento() {
  const data  = document.getElementById('eventoData').value;
  const nome  = document.getElementById('eventoNome').value.trim();
  const local = document.getElementById('eventoLocal').value.trim();

  if (!data || !nome) {
    showToast('Preencha data e nome do evento.', 'error');
    return;
  }

  STATE.eventos.push({ id: Date.now(), data, nome, local });
  salvar();
  renderEventos();
  renderDashboard();

  document.getElementById('eventoData').value  = '';
  document.getElementById('eventoNome').value  = '';
  document.getElementById('eventoLocal').value = '';

  showToast('Evento adicionado com sucesso!', 'success');
}

function deletarEvento(id) {
  STATE.eventos = STATE.eventos.filter(e => e.id !== id);
  salvar();
  renderEventos();
  renderDashboard();
  showToast('Evento removido.', 'warning');
}

function renderEventos() {
  const lista = document.getElementById('listaEventos');
  const sorted = [...STATE.eventos].sort((a, b) => a.data.localeCompare(b.data));

  if (sorted.length === 0) {
    lista.innerHTML = '<p class="empty-msg">Nenhum evento cadastrado.</p>';
    return;
  }

  lista.innerHTML = sorted.map(e => {
    const [y, m, d] = e.data.split('-');
    const months = ['JAN','FEV','MAR','ABR','MAI','JUN','JUL','AGO','SET','OUT','NOV','DEZ'];
    const monthStr = months[parseInt(m, 10) - 1] || m;
    return `
      <div class="event-item">
        <div class="event-date-badge">
          <span class="event-date-day">${d}</span>
          <span class="event-date-month">${monthStr}</span>
        </div>
        <div class="event-info">
          <div class="event-name">${escHtml(e.nome)}</div>
          ${e.local ? `<div class="event-local">&#128205; ${escHtml(e.local)}</div>` : ''}
        </div>
        <button class="btn-delete" onclick="deletarEvento(${e.id})">&#10005;</button>
      </div>`;
  }).join('');
}

// ============================================================
// SUGESTÕES
// ============================================================
function enviarSugestao() {
  const nome  = document.getElementById('sugestaoNome').value.trim() || 'Anônimo';
  const texto = document.getElementById('sugestaoTexto').value.trim();

  if (!texto) {
    showToast('Escreva uma sugestão antes de enviar.', 'error');
    return;
  }

  STATE.sugestoes.push({ id: Date.now(), nome, texto, dataHora: nowDatetime() });
  salvar();
  renderSugestoes();

  document.getElementById('sugestaoNome').value  = '';
  document.getElementById('sugestaoTexto').value = '';

  showToast('Sugestão enviada com sucesso!', 'success');
}

function deletarSugestao(id) {
  STATE.sugestoes = STATE.sugestoes.filter(s => s.id !== id);
  salvar();
  renderSugestoes();
  showToast('Sugestão removida.', 'warning');
}

function renderSugestoes() {
  const lista = document.getElementById('listaSugestoes');
  const total = document.getElementById('totalSugestoes');
  total.textContent = STATE.sugestoes.length;

  if (STATE.sugestoes.length === 0) {
    lista.innerHTML = '<p class="empty-msg">Nenhuma sugestão recebida.</p>';
    return;
  }

  lista.innerHTML = [...STATE.sugestoes].reverse().map(s => `
    <div class="suggestion-item">
      <div class="suggestion-header">
        <span class="suggestion-author">&#128100; ${escHtml(s.nome)}</span>
        <div style="display:flex;align-items:center;gap:10px;">
          <span class="suggestion-date">${s.dataHora}</span>
          <button class="btn-delete" onclick="deletarSugestao(${s.id})">&#10005;</button>
        </div>
      </div>
      <div class="suggestion-text">${escHtml(s.texto)}</div>
    </div>`).join('');
}

// ============================================================
// DECISÕES
// ============================================================
function publicarDecisao() {
  const titulo = document.getElementById('decisaoTitulo').value.trim();
  const texto  = document.getElementById('decisaoTexto').value.trim();

  if (!titulo || !texto) {
    showToast('Preencha título e texto da decisão.', 'error');
    return;
  }

  STATE.decisoes.push({ id: Date.now(), titulo, texto, dataHora: nowDatetime() });
  salvar();
  renderDecisoes();
  renderDashboard();

  document.getElementById('decisaoTitulo').value = '';
  document.getElementById('decisaoTexto').value  = '';

  showToast('Decisão publicada com sucesso!', 'success');
}

function deletarDecisao(id) {
  STATE.decisoes = STATE.decisoes.filter(d => d.id !== id);
  salvar();
  renderDecisoes();
  renderDashboard();
  showToast('Decisão removida.', 'warning');
}

function renderDecisoes() {
  const lista = document.getElementById('listaDecisoes');
  const total = document.getElementById('totalDecisoes');
  total.textContent = STATE.decisoes.length;

  if (STATE.decisoes.length === 0) {
    lista.innerHTML = '<p class="empty-msg">Nenhuma decisão publicada.</p>';
    return;
  }

  lista.innerHTML = [...STATE.decisoes].reverse().map(d => `
    <div class="decision-item">
      <div class="decision-header">
        <span class="decision-title">${escHtml(d.titulo)}</span>
        <div style="display:flex;align-items:center;gap:10px;">
          <span class="decision-date">${d.dataHora}</span>
          <button class="btn-delete" onclick="deletarDecisao(${d.id})">&#10005;</button>
        </div>
      </div>
      <div class="decision-text">${escHtml(d.texto)}</div>
    </div>`).join('');
}

// ============================================================
// GALERIA DE ACOES
// ============================================================
function adicionarFotoGaleria() {
  const fileInput = document.getElementById('galeriaFoto');
  const evento    = document.getElementById('galeriaEvento').value.trim();
  const data      = document.getElementById('galeriaData').value;

  if (!fileInput.files || fileInput.files.length === 0) {
    showToast('Selecione uma foto.', 'error');
    return;
  }
  if (!evento) {
    showToast('Digite o nome do evento.', 'error');
    return;
  }
  if (!data) {
    showToast('Selecione a data do evento.', 'error');
    return;
  }

  const file = fileInput.files[0];
  const reader = new FileReader();

  reader.onload = function(e) {
    const base64 = e.target.result;
    STATE.galeria.push({
      id: Date.now(),
      foto: base64,
      evento: evento,
      data: data
    });
    salvar();
    renderGaleria();

    fileInput.value = '';
    document.getElementById('galeriaEvento').value = '';
    document.getElementById('galeriaData').value = today();

    showToast('Foto adicionada com sucesso!', 'success');
  };

  reader.readAsDataURL(file);
}

function deletarFotoGaleria(id) {
  STATE.galeria = STATE.galeria.filter(f => f.id !== id);
  salvar();
  renderGaleria();
  showToast('Foto removida.', 'warning');
}

function renderGaleria() {
  const grid = document.getElementById('galeriaGrid');
  const total = document.getElementById('totalFotos');
  total.textContent = STATE.galeria.length;

  if (STATE.galeria.length === 0) {
    grid.innerHTML = '<p class="empty-msg">Nenhuma foto cadastrada.</p>';
    return;
  }

  grid.innerHTML = [...STATE.galeria].reverse().map(f => `
    <div class="galeria-card">
      <button class="galeria-delete" onclick="deletarFotoGaleria(${f.id})">&#10005;</button>
      <div class="galeria-img-container">
        <img src="${f.foto}" alt="${escHtml(f.evento)}" class="galeria-img" />
      </div>
      <div class="galeria-info">
        <div class="galeria-evento">${escHtml(f.evento)}</div>
        <div class="galeria-data">${formatDate(f.data)}</div>
      </div>
    </div>`).join('');
}

// ============================================================
// BACKUP
// ============================================================
function exportarBackup() {
  const data = {
    versao: '1.0',
    exportadoEm: nowDatetime(),
    gremiofenix: STATE
  };
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `gremio_fenix_backup_${today()}.json`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('Backup exportado com sucesso!', 'success');
}

function importarBackup(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const data = JSON.parse(e.target.result);
      const imported = data.gremiofenix || data;

      if (imported.entradas  !== undefined) STATE.entradas  = imported.entradas;
      if (imported.gastos    !== undefined) STATE.gastos    = imported.gastos;
      if (imported.membros   !== undefined) STATE.membros   = imported.membros;
      if (imported.eventos   !== undefined) STATE.eventos   = imported.eventos;
      if (imported.sugestoes !== undefined) STATE.sugestoes = imported.sugestoes;
      if (imported.decisoes  !== undefined) STATE.decisoes  = imported.decisoes;
      if (imported.galeria   !== undefined) STATE.galeria   = imported.galeria;

      salvar();
      renderDashboard();
      renderBackupResumo();
      showToast('Backup importado com sucesso!', 'success');
    } catch (err) {
      showToast('Erro ao importar: arquivo inválido.', 'error');
    }
  };
  reader.readAsText(file);
  event.target.value = '';
}

function limparDados() {
  if (!confirm('Tem certeza que deseja apagar TODOS os dados? Esta ação não pode ser desfeita.')) return;
  STATE.entradas  = [];
  STATE.gastos    = [];
  STATE.membros   = [];
  STATE.eventos   = [];
  STATE.sugestoes = [];
  STATE.decisoes  = [];
  STATE.galeria   = [];
  salvar();
  renderDashboard();
  renderBackupResumo();
  if (finChartInstance) {
    finChartInstance.destroy();
    finChartInstance = null;
  }
  showToast('Todos os dados foram apagados.', 'warning');
}

function renderBackupResumo() {
  const resumo = document.getElementById('backupResumo');
  const saldo  = calcSaldo();
  const items  = [
    { label: 'Entradas',      value: STATE.entradas.length  },
    { label: 'Gastos',        value: STATE.gastos.length    },
    { label: 'Membros',       value: STATE.membros.length   },
    { label: 'Eventos',       value: STATE.eventos.length   },
    { label: 'Sugestões',     value: STATE.sugestoes.length },
    { label: 'Decisões',      value: STATE.decisoes.length  },
    { label: 'Fotos Galeria', value: STATE.galeria.length   },
    { label: 'Saldo Atual',   value: formatBRL(saldo)       }
  ];
  resumo.innerHTML = items.map(i => `
    <div class="backup-stat">
      <span class="backup-stat-label">${i.label}</span>
      <span class="backup-stat-value">${i.value}</span>
    </div>`).join('');
}

// ============================================================
// SEGURANÇA: Escape HTML
// ============================================================
function escHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// ============================================================
// DATA/HORA NO TOPBAR
// ============================================================
function atualizarData() {
  const el = document.getElementById('topbarDate');
  if (!el) return;
  const now = new Date();
  const dias = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
  const dia  = dias[now.getDay()];
  const data = now.toLocaleDateString('pt-BR');
  const hora = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  el.textContent = `${dia}, ${data} — ${hora}`;
}

// ============================================================
// INICIALIZAÇÃO
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  carregar();
  renderDashboard();
  atualizarData();
  setInterval(atualizarData, 30000);

  // Define datas padrão nos campos de data
  const hoje = today();
  ['entradaData', 'gastoData', 'eventoData', 'galeriaData'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = hoje;
  });
});

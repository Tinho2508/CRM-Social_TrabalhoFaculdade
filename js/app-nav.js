/* Part of app - navigation, sync, search, keyboard, visao 360, gemini, export */

app = Object.assign(app, {

  /* Navigation */
  navigate(page) {
    this.currentPage = page;
    document.getElementById('page-title').textContent = PAGE_NAMES[page] || page;
    var items = document.querySelectorAll('.nav-item');
    for (var i = 0; i < items.length; i++) items[i].classList.remove('active');
    var ai = document.querySelector('.nav-item[data-page="' + page + '"]');
    if (ai) ai.classList.add('active');
    this.closeSidebar();
    this.pageState[page] = this.pageState[page] || { search: '', page: 1 };
    this.render();
  },

  toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('open');
    document.getElementById('sidebar-overlay').classList.toggle('open');
  },

  closeSidebar() {
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('sidebar-overlay').classList.remove('open');
  },

  render() {
    var content = document.getElementById('content');
    var pages = {
      dashboard: this.renderDashboard.bind(this),
      familias: this.renderFamilias.bind(this),
      doacoes: this.renderDoacoes.bind(this),
      campanhas: this.renderCampanhas.bind(this),
      voluntarios: this.renderVoluntarios.bind(this),
      captacao: this.renderCaptacao.bind(this),
      financeiro: this.renderFinanceiro.bind(this),
      agenda: this.renderAgenda.bind(this),
      ocorrencias: this.renderOcorrencias.bind(this),
      relatorios: this.renderRelatorios.bind(this),
      sync: this.renderSync.bind(this)
    };
    content.innerHTML = pages[this.currentPage] ? pages[this.currentPage]() :
      '<div class="card"><div class="card-header">Em construcao</div></div>';
    document.getElementById('date-badge').textContent = new Date().toLocaleDateString('pt-BR', {
      weekday: 'short', day: '2-digit', month: 'short'
    });
  },

  updateBadges() {
    var doacoes = this.getTable('doacoes');
    var voluntarios = this.getTable('voluntarios');
    var agenda = this.getTable('agenda');
    var pendentes = doacoes.filter(function(d) { return d.status === 'Pendente'; }).length;
    var novosVol = voluntarios.filter(function(v) { return v.status === 'Disponivel'; }).length;
    var atrasadas = agenda.filter(function(a) { return a.status === 'Agendado' && a.data < ui.today(); }).length;
    this.setBadge('badge-familias', 0);
    this.setBadge('badge-doacoes', pendentes);
    this.setBadge('badge-voluntarios', novosVol);
    this.setBadge('badge-agenda', atrasadas);
  },

  setBadge(id, n) {
    var el = document.getElementById(id);
    if (!el) return;
    if (n > 0) { el.style.display = 'inline'; el.textContent = n; }
    else { el.style.display = 'none'; }
  },

  /* Sync */
  async sincronizar() {
    if (!window.supabaseClient) return;
    var dot = document.getElementById('status-dot');
    var txt = document.getElementById('status-text');
    if (dot) { dot.className = 'status-dot syncing'; txt.textContent = 'Sincronizando...'; }
    try {
      var total = 0;
      var client = window.supabaseClient;
      for (var i = 0; i < CONFIG.TABELAS.length; i++) {
        var table = CONFIG.TABELAS[i];
        try {
          var localData = await db.getAll(table);
          var res = await client.from(table).select('*');
          if (res.error) { console.warn('Skip ' + table + ':', res.error.message); continue; }
          var remoteData = res.data || [];
          if (remoteData.length > 0) {
            var merged = ui.mergeData(localData, remoteData);
            merged = ui.deduplicateRecords(table, merged);
            var dIds = await db.getDeletedIds();
            var dft = dIds.filter(function(d) { return d.table === table; }).map(function(d) { return d.id; });
            if (dft.length && merged.length) merged = merged.filter(function(r) { return dft.indexOf(r.id) < 0; });
            if (dft.length && window.supabaseClient) {
              try {
                await client.from(table).delete().in('id', dft);
                await db.clearDeletedIdsByTable(table);
                var allowed = CONFIG.ALLOWED_COLS[table] || null;
                var clean = merged.map(function(r) {
                  var o = {};
                  for (var k in r) {
                    if (!r.hasOwnProperty(k)) continue;
                    if (k && k.trim().length > 0 && !/^Col\d+$/.test(k)) {
                      if (allowed) { if (allowed.indexOf(k) >= 0) o[k] = r[k]; }
                      else o[k] = r[k];
                    }
                  }
                  return ui.sanitizeRow(o);
                });
                if (clean.length) await client.from(table).upsert(clean, { onConflict: 'id' });
              } catch(e) { console.error('Sync: erro ao deletar/atualizar', e); }
            }
            await db.setTable(table, merged);
            this.cacheData[table] = merged;
            total += merged.length;
          } else if (localData.length > 0) {
            var dIds2 = await db.getDeletedIds();
            var dft2 = dIds2.filter(function(d) { return d.table === table; }).map(function(d) { return d.id; });
            if (dft2.length && localData.length) localData = localData.filter(function(r) { return dft2.indexOf(r.id) < 0; });
            if (dft2.length && window.supabaseClient) {
              try { await client.from(table).delete().in('id', dft2); await db.clearDeletedIdsByTable(table); }
              catch(e) { console.error('Sync: erro ao deletar', e); }
            }
            if (localData.length) {
              var allowed = CONFIG.ALLOWED_COLS[table] || null;
              var clean = localData.map(function(r) {
                var o = {};
                for (var k in r) {
                  if (!r.hasOwnProperty(k)) continue;
                  if (k && k.trim().length > 0 && !/^Col\d+$/.test(k)) {
                    if (allowed) { if (allowed.indexOf(k) >= 0) o[k] = r[k]; } else o[k] = r[k];
                  }
                }
                return ui.sanitizeRow(o);
              });
              if (clean.length) { var upRes = await client.from(table).upsert(clean, { onConflict: 'id' }); if (!upRes.error) total += localData.length; }
            }
          }
        } catch(e) { console.error('Sync error ' + table, e); }
      }
      if (dot) { dot.className = 'status-dot online'; txt.textContent = 'Online (' + total + ')'; }
    } catch(e) {
      var d2 = document.getElementById('status-dot');
      if (d2) { d2.className = 'status-dot'; document.getElementById('status-text').textContent = 'Offline'; }
      console.error('Sync error:', e);
    }
  },

  async enviarTabela(tabela) {
    if (!window.supabaseClient) return;
    try {
      var client = window.supabaseClient;
      var rows = await db.getAll(tabela);
      if (!rows.length) return;
      var allowed = CONFIG.ALLOWED_COLS[tabela] || null;
      var clean = rows.map(function(r) {
        var o = {};
        for (var k in r) {
          if (!r.hasOwnProperty(k)) continue;
          if (k && k.trim().length > 0 && !/^Col\d+$/.test(k)) {
            if (allowed) { if (allowed.indexOf(k) >= 0) o[k] = r[k]; } else o[k] = r[k];
          }
        }
        return ui.sanitizeRow(o);
      });
      var res = await client.from(tabela).upsert(clean, { onConflict: 'id' });
      if (res.error) { ui.toast('Erro sync ' + tabela + ': ' + (res.error.message || JSON.stringify(res.error)), 'error'); }
    } catch(e) { ui.toast('Erro sync ' + tabela + ': ' + (e.message || JSON.stringify(e)), 'error'); }
  },

  iniciarRealtime() {
    if (!window.supabaseClient) return;
    try {
      if (this._realtimeChannel) { try { this._realtimeChannel.unsubscribe(); } catch(e) {} }
      var client = window.supabaseClient;
      var self = this;
      this._realtimeChannel = client.channel('crm-ong-realtime');
      CONFIG.TABELAS.forEach(function(table) {
        self._realtimeChannel.on('postgres_changes', { event: '*', schema: 'public', table: table }, function() {
          self.refreshCache().then(function() { self.render(); self.updateBadges(); });
        });
      });
      this._realtimeChannel.subscribe();
    } catch(e) { console.error('Realtime error:', e); }
  },

  /* Quick Search */
  openQuickSearch() {
    document.getElementById('quick-search-overlay').classList.add('open');
    var inp = document.getElementById('quick-search-input');
    inp.value = ''; inp.focus();
    document.getElementById('quick-search-results').innerHTML = '';
  },

  closeQuickSearch() {
    document.getElementById('quick-search-overlay').classList.remove('open');
  },

  doQuickSearch(q) {
    var el = document.getElementById('quick-search-results');
    if (!q || q.length < 2) { el.innerHTML = ''; return; }
    q = ui.normalizar(q);
    var html = '';
    var familias = this.getTable('familias');
    var doacoes = this.getTable('doacoes');
    var voluntarios = this.getTable('voluntarios');
    familias.forEach(function(f) {
      if (ui.normalizar(f.nome).indexOf(q) >= 0 || ui.normalizar(f.responsavel || '').indexOf(q) >= 0) {
        html += '<div class="qs-item" onclick="app.closeQuickSearch();app.navigate(\'familias\')">' +
          '<div class="qs-icon familia">&#x1F46A;</div>' +
          '<div><div class="qs-text">' + ui.escHtml(f.nome) + '</div>' +
          '<div class="qs-sub">' + ui.escHtml(f.responsavel || '') + (f.cidade ? ' - ' + ui.escHtml(f.cidade) : '') + '</div></div></div>';
      }
    });
    doacoes.forEach(function(d) {
      if (ui.normalizar(d.familia).indexOf(q) >= 0) {
        html += '<div class="qs-item" onclick="app.closeQuickSearch();app.navigate(\'doacoes\')">' +
          '<div class="qs-icon doacao">&#x1F48E;</div>' +
          '<div><div class="qs-text">' + ui.escHtml(d.familia) + ' - ' + ui.escHtml(d.tipo || '') + '</div>' +
          '<div class="qs-sub">' + ui.fmtBRL(d.valor) + ' | ' + ui.statusBadge(d.status || 'Pendente') + '</div></div></div>';
      }
    });
    voluntarios.forEach(function(v) {
      if (ui.normalizar(v.nome).indexOf(q) >= 0 || ui.normalizar(v.area_interesse || '').indexOf(q) >= 0) {
        html += '<div class="qs-item" onclick="app.closeQuickSearch();app.navigate(\'voluntarios\')">' +
          '<div class="qs-icon voluntario">&#x1F465;</div>' +
          '<div><div class="qs-text">' + ui.escHtml(v.nome) + '</div>' +
          '<div class="qs-sub">' + ui.escHtml(v.area_interesse || '') + ' | ' + ui.statusBadge(v.status || 'Disponivel') + '</div></div></div>';
      }
    });
    el.innerHTML = html || '<div style="padding:24px;text-align:center;color:var(--text-muted)">Nenhum resultado</div>';
  },

  /* Keyboard shortcuts */
  setupKeyboard() {
    var self = this;
    document.addEventListener('keydown', function(e) {
      if (e.ctrlKey && e.key === 'k') { e.preventDefault(); self.openQuickSearch(); }
      if (e.key === 'Escape') {
        self.closeQuickSearch(); ui.fecharModal('modal-visita360'); ui.closeConfirm();
        var modals = document.querySelectorAll('.modal-overlay.open');
        for (var i = 0; i < modals.length; i++) modals[i].classList.remove('open');
      }
    });
  },

  /* Visao 360 (formerly Client 360) */
  abrirVisao360(nome) {
    var familias = this.getTable('familias');
    var doacoes = this.getTable('doacoes');
    var agenda = this.getTable('agenda');
    var ocorrencias = this.getTable('ocorrencias');

    var fam = familias.filter(function(f) { return f.nome === nome; })[0] || { nome: nome };
    var dacs = doacoes.filter(function(d) { return d.familia === nome; });
    var ags = agenda.filter(function(a) { return a.familia === nome; });
    var ocrs = ocorrencias.filter(function(o) { return o.familia === nome; });

    document.getElementById('v360-title').textContent = fam.nome + ' - Visao 360';
    var tel = fam.telefone || '';
    var wpp = fam.whatsapp || tel;
    var wppBtn = wpp ? ' <a href="https://wa.me/55' + wpp.replace(/\D/g, '') + '" target="_blank" class="whatsapp-btn">&#x1F4DE; WhatsApp</a>' : '';
    var totalDoacoes = dacs.reduce(function(s, d) { return s + (parseFloat(d.valor) || 0); }, 0);
    var ocrAbertas = ocrs.filter(function(o) { return o.status !== 'Resolvida' && o.status !== 'Arquivada'; }).length;

    var html = '<div style="margin-bottom:20px"><div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap">' +
      '<div><h3 style="font-size:18px;color:var(--primary)">' + ui.escHtml(fam.nome) + wppBtn + '</h3>' +
      ((fam.responsavel || fam.cpf || fam.email) ? '<p style="font-size:13px;color:var(--text-muted);margin-top:4px">' +
        ui.escHtml(fam.responsavel || '') + (fam.cpf ? ' | ' + ui.escHtml(fam.cpf) : '') +
        (fam.email ? ' | ' + ui.escHtml(fam.email) : '') + (fam.cidade ? ' | ' + ui.escHtml(fam.cidade) + '/' + ui.escHtml(fam.estado || '') : '') + '</p>' : '') + '</div>' +
      '<div style="text-align:right"><div style="font-size:12px;color:var(--text-muted)">Total em doacoes</div>' +
      '<div style="font-size:24px;font-weight:800;color:var(--primary)">' + ui.fmtBRL(totalDoacoes) + '</div></div></div></div>';

    html += '<div class="v360-tabs">' +
      '<div class="v360-tab active" onclick="app.mostrarTab360(\'doacoes\',\'' + ui.escJs(nome) + '\')">Doacoes (' + dacs.length + ')</div>' +
      '<div class="v360-tab" onclick="app.mostrarTab360(\'ocorrencias\',\'' + ui.escJs(nome) + '\')">Ocorrencias (' + ocrs.length + (ocrAbertas ? ' <span class="badge badge-danger" style="font-size:10px">' + ocrAbertas + '</span>' : '') + ')</div>' +
      '<div class="v360-tab" onclick="app.mostrarTab360(\'agenda\',\'' + ui.escJs(nome) + '\')">Agenda (' + ags.length + ')</div>' +
      '</div><div id="v360-content">' + this._renderV360Doacoes(dacs) + '</div>';

    document.getElementById('v360-body').innerHTML = html;
    ui.abrirModal('modal-visita360');
  },

  mostrarTab360(tab, nome) {
    var tabs = document.querySelectorAll('.v360-tab');
    for (var i = 0; i < tabs.length; i++) { tabs[i].classList.remove('active'); if (tabs[i].textContent.toLowerCase().indexOf(tab) === 0) tabs[i].classList.add('active'); }
    var content = document.getElementById('v360-content');
    if (tab === 'doacoes') content.innerHTML = this._renderV360Doacoes(this.getTable('doacoes').filter(function(d) { return d.familia === nome; }));
    else if (tab === 'ocorrencias') content.innerHTML = this._renderV360Ocorrencias(this.getTable('ocorrencias').filter(function(o) { return o.familia === nome; }));
    else if (tab === 'agenda') content.innerHTML = this._renderV360Agenda(this.getTable('agenda').filter(function(a) { return a.familia === nome; }));
  },

  _renderV360Doacoes(items) {
    if (!items.length) return '<p style="color:var(--text-muted);padding:16px;text-align:center">Nenhuma doacao</p>';
    var h = '<table><thead><tr><th>Tipo</th><th>Valor</th><th>Data</th><th>Campanha</th><th>Status</th></tr></thead><tbody>';
    for (var i = 0; i < items.length; i++) {
      var d = items[i];
      h += '<tr><td>' + ui.escHtml(d.tipo || '') + '</td><td>' + ui.fmtBRL(d.valor) + '</td><td>' + ui.fmtDate(d.data) + '</td><td>' + ui.escHtml(d.campanha || '') + '</td><td>' + ui.statusBadge(d.status || 'Recebida') + '</td></tr>';
    }
    return h + '</tbody></table>';
  },

  _renderV360Ocorrencias(items) {
    if (!items.length) return '<p style="color:var(--text-muted);padding:16px;text-align:center">Nenhuma ocorrencia</p>';
    var h = '<table><thead><tr><th>Data</th><th>Tipo</th><th>Prioridade</th><th>Status</th></tr></thead><tbody>';
    for (var i = 0; i < items.length; i++) {
      var o = items[i];
      h += '<tr><td>' + ui.fmtDate(o.data) + '</td><td>' + ui.escHtml(o.tipo) + '</td><td>' + ui.statusBadge(o.prioridade || 'Media') + '</td><td>' + ui.statusBadge(o.status || 'Registrada') + '</td></tr>';
    }
    return h + '</tbody></table>';
  },

  _renderV360Agenda(items) {
    if (!items.length) return '<p style="color:var(--text-muted);padding:16px;text-align:center">Nenhum agendamento</p>';
    var h = '<div class="timeline">';
    for (var i = 0; i < items.length; i++) {
      var a = items[i];
      h += '<div class="timeline-item"><div class="timeline-date">' + ui.fmtDate(a.data) + ' ' + ui.escHtml(a.hora || '') + '</div>' +
        '<div class="timeline-content"><b>' + ui.escHtml(a.tipo) + '</b> - ' + ui.escHtml(a.descricao || '') +
        (a.status !== 'Agendado' ? ' ' + ui.statusBadge(a.status) : '') + '</div></div>';
    }
    return h + '</div>';
  },

  /* Gemini AI */
  _geminiOpen: false,

  toggleGemini() {
    var bar = document.getElementById('gemini-bar');
    this._geminiOpen = !this._geminiOpen;
    bar.classList.toggle('gemini-closed', !this._geminiOpen);
    if (this._geminiOpen) document.getElementById('gemini-input').focus();
  },

  async geminiCommand() {
    var input = document.getElementById('gemini-input');
    var text = input.value.trim();
    if (!text) return;
    input.value = '';
    var history = document.getElementById('gemini-history');
    var status = document.getElementById('gemini-status');
    history.innerHTML += '<div class="gemini-msg user">' + ui.escHtml(text) + '</div>';
    status.textContent = 'Processando...';
    try {
      var url = localStorage.getItem('gemini_worker_url') || CONFIG.GEMINI_WORKER_URL;
      var ctx = '';
      CONFIG.TABELAS.forEach(function(t) { ctx += t + ': ' + (app.getTable(t).length) + ' registros. '; });
      var res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: text,
          context: 'CRM ONG - ' + ctx + '\nComando: ' + text
        })
      });
      var data = await res.json();
      var reply = data.text || data.response || data.message || JSON.stringify(data);
      history.innerHTML += '<div class="gemini-msg bot">' + reply + '</div>';
      status.textContent = 'Pronto';
    } catch(e) {
      history.innerHTML += '<div class="gemini-msg error">Erro: ' + e.message + '</div>';
      status.textContent = 'Erro';
    }
    history.scrollTop = history.scrollHeight;
  },

  geminiStartVoice() {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      ui.toast('Reconhecimento de voz nao disponivel neste navegador', 'error'); return;
    }
    var recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.lang = 'pt-BR';
    recognition.onresult = function(e) {
      document.getElementById('gemini-input').value = e.results[0][0].transcript;
      app.geminiCommand();
    };
    recognition.start();
  },

  /* Excel Export */
  exportarExcel(table) {
    var data = this.getTable(table);
    if (!data.length) { ui.toast('Nenhum dado para exportar', 'warning'); return; }
    var ws = XLSX.utils.json_to_sheet(data);
    var wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, table);
    XLSX.writeFile(wb, table + '_' + ui.today() + '.xlsx');
    ui.toast('Exportado: ' + table + '.xlsx');
  }
});

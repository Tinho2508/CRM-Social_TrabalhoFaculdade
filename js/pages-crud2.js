/* Pages: Captacao, Financeiro, Agenda, Ocorrencias, Relatorios, Sync */

app = Object.assign(app, {

  /* ========== CAPTACAO DE RECURSOS ========== */
  renderCaptacao() {
    var ps = this.pageState.captacao || {};
    var selYear = ps.year || '', selMonth = ps.month || '';
    var now = new Date();
    var years = [{ v: '', l: 'Todos' }];
    for (var y = now.getFullYear() - 10; y <= now.getFullYear() + 5; y++) years.push(y);
    var months = [{ v: '', l: 'Todos' }];
    for (var m = 1; m <= 12; m++) months.push({ v: String(m).padStart(2, '0'), l: new Date(2000, m - 1, 1).toLocaleDateString('pt-BR', { month: 'short' }) });

    var filters = '<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:12px;padding:8px 12px;background:var(--gray-100);border-radius:8px"><span style="font-size:12px;color:var(--text-muted)">Filtrar:</span>' +
      '<select onchange="app.pageState.captacao=app.pageState.captacao||{};app.pageState.captacao.year=this.value;app.pageState.captacao.page=1;app.render()" style="padding:4px 8px;border:1px solid var(--border);border-radius:6px;font-size:13px">' + ui.renderOptions(years, selYear) + '</select>' +
      '<select onchange="app.pageState.captacao=app.pageState.captacao||{};app.pageState.captacao.month=this.value;app.pageState.captacao.page=1;app.render()" style="padding:4px 8px;border:1px solid var(--border);border-radius:6px;font-size:13px">' + ui.renderOptions(months, selMonth) + '</select>' +
      (selYear ? '<button class="btn btn-xs btn-outline" onclick="app.pageState.captacao={};app.render()">Limpar</button>' : '') + '</div>';

    var allData = this.getTable('captacao');
    var filtered = allData;
    if (selYear) filtered = filtered.filter(function(p) { return ui.dateMatchesYM(p.data, selYear, selMonth); });
    var totalValor = filtered.reduce(function(s, p) { return s + (parseFloat(p.valor) || 0); }, 0);
    var summary = '<div style="display:flex;gap:16px;margin-bottom:16px;flex-wrap:wrap">' +
      '<div style="background:var(--card);padding:16px 20px;border-radius:var(--radius);flex:1;box-shadow:var(--shadow);border-left:4px solid var(--primary)">' +
      '<div style="font-size:12px;color:var(--text-muted);font-weight:600">Total Captado</div><div style="font-size:24px;font-weight:800;color:var(--primary)">' + ui.fmtBRL(totalValor) + '</div></div>' +
      '<div style="background:var(--card);padding:16px 20px;border-radius:var(--radius);flex:1;box-shadow:var(--shadow);border-left:4px solid var(--secondary)">' +
      '<div style="font-size:12px;color:var(--text-muted);font-weight:600">Registros</div><div style="font-size:24px;font-weight:800;color:var(--primary)">' + filtered.length + '</div></div></div>';

    window._captacaoFiltered = filtered;
    return filters + summary + this.createCRUD({
      title: 'captacao', data: function() { return window._captacaoFiltered || app.getTable('captacao'); },
      columns: [
        { label: 'Doador', field: 'doador' }, { label: 'Valor', render: function(p) { return ui.fmtBRL(p.valor); } },
        { label: 'Tipo', field: 'tipo' }, { label: 'Campanha', field: 'campanha' },
        { label: 'Data', render: function(p) { return ui.fmtDate(p.data); } },
        { label: 'Status', render: function(p) { return ui.statusBadge(p.status || 'Recebida'); } }
      ],
      searchFields: ['doador', 'tipo', 'campanha', 'forma_pagamento'],
      modalHtml: this._modalCaptacao.bind(this),
      onAdd: 'app.abrirFormCaptacao', onEdit: 'app.editarCaptacao', onDelete: 'app.deletarCaptacao',
      extraBtns: function() { return '<button class="btn btn-outline btn-sm" onclick="app.exportarExcel(\'captacao\')">Excel</button><button class="btn btn-secondary btn-sm" onclick="app.distribuirDados()">Gerar Familias e Doacoes</button>'; }
    });
  },

  _modalCaptacao() {
    var v = this.editItem.captacao || {};
    return '<div id="modal-captacao" class="modal-overlay"><div class="modal"><div class="modal-header"><div class="modal-title">' + (v.id ? 'Editar' : 'Nova') + ' Captacao</div><button class="modal-close" onclick="ui.fecharModal(\'modal-captacao\')">&times;</button></div>' +
      '<div class="modal-body"><div class="form-grid">' +
      '<div class="form-group full"><label class="form-label required">Doador</label><input class="form-input" id="cap-doador" value="' + ui.escHtml(v.doador || '') + '"></div>' +
      '<div class="form-group"><label class="form-label">Valor (R$)</label><input type="number" step="0.01" class="form-input" id="cap-valor" value="' + (v.valor != null ? v.valor : '') + '"></div>' +
      '<div class="form-group"><label class="form-label">Tipo</label><select class="form-select" id="cap-tipo">' + ui.renderOptions(CONFIG.TIPOS_DOACAO, v.tipo || 'Dinheiro') + '</select></div>' +
      '<div class="form-group"><label class="form-label">Campanha</label><input class="form-input" id="cap-campanha" value="' + ui.escHtml(v.campanha || '') + '"></div>' +
      '<div class="form-group"><label class="form-label">Data</label><input type="date" class="form-input" id="cap-data" value="' + (v.data || ui.today()) + '"></div>' +
      '<div class="form-group"><label class="form-label">Forma Pagamento</label><input class="form-input" id="cap-forma" value="' + ui.escHtml(v.forma_pagamento || '') + '" placeholder="Pix, dinheiro, cartao"></div>' +
      '<div class="form-group"><label class="form-label">Status</label><select class="form-select" id="cap-status">' + ui.renderOptions(CONFIG.STATUS_DOACAO, v.status || 'Recebida') + '</select></div>' +
      '<div class="form-group full"><label class="form-label">Observacoes</label><textarea class="form-textarea" id="cap-obs" rows="3">' + ui.escHtml(v.observacoes || '') + '</textarea></div>' +
      '</div></div><div class="modal-footer"><button class="btn btn-outline" onclick="ui.fecharModal(\'modal-captacao\')">Cancelar</button><button class="btn btn-primary" onclick="app.salvarCaptacao()">Salvar</button></div></div></div>';
  },

  abrirFormCaptacao(id) {
    this.editItem.captacao = id ? this.getTable('captacao').find(function(p) { return p.id === id; }) : null;
    var self = this;
    setTimeout(function() {
      var v = self.editItem.captacao || {};
      document.getElementById('cap-doador').value = v.doador || '';
      document.getElementById('cap-valor').value = v.valor != null ? v.valor : '';
      document.getElementById('cap-tipo').value = v.tipo || 'Dinheiro';
      document.getElementById('cap-campanha').value = v.campanha || '';
      document.getElementById('cap-data').value = v.data || ui.today();
      document.getElementById('cap-forma').value = v.forma_pagamento || '';
      document.getElementById('cap-status').value = v.status || 'Recebida';
      document.getElementById('cap-obs').value = v.observacoes || '';
      ui.abrirModal('modal-captacao');
    }, 0);
  },

  editarCaptacao(id) { this.abrirFormCaptacao(id); },

  salvarCaptacao() {
    var captacao = this.getTable('captacao');
    var v = this.editItem.captacao || {};
    var obj = { id: v.id || ui.nextId(), doador: document.getElementById('cap-doador').value.trim(), valor: parseFloat(document.getElementById('cap-valor').value) || 0,
      tipo: document.getElementById('cap-tipo').value, campanha: document.getElementById('cap-campanha').value, data: document.getElementById('cap-data').value,
      forma_pagamento: document.getElementById('cap-forma').value, status: document.getElementById('cap-status').value,
      observacoes: document.getElementById('cap-obs').value, criado_em: v.criado_em || ui.today() };
    if (!obj.doador) { ui.toast('Doador obrigatorio', 'error'); return; }
    var self = this;
    if (v.id) { var idx = captacao.findIndex(function(p) { return p.id === obj.id; }); if (idx >= 0) captacao[idx] = obj; }
    else { captacao.push(obj); }
    db.setTable('captacao', captacao).then(function() {
      self.cacheData.captacao = captacao; ui.fecharModal('modal-captacao');
      ui.toast(v.id ? 'Atualizada!' : 'Cadastrada!'); self.editItem.captacao = null; self.render(); self.enviarTabela('captacao');
    });
  },

  deletarCaptacao(id) {
    var self = this;
    ui.confirm('Excluir', 'Tem certeza?', function() {
      var captacao = self.getTable('captacao').filter(function(p) { return p.id !== id; });
      db.setTable('captacao', captacao).then(async function() {
        self.cacheData.captacao = captacao; await db.addDeletedId('captacao', id);
        if (window.supabaseClient) { try { var res = await window.supabaseClient.from('captacao').delete().eq('id', id); if (res.error) throw res.error; } catch(e) { ui.toast('Erro: ' + e.message, 'error'); } }
        ui.toast('Removida'); self.render(); self.enviarTabela('captacao');
      });
    });
  },

  /* ========== FINANCEIRO ========== */
  renderFinanceiro() {
    var ps = this.pageState.financeiro || {};
    var selYear = ps.year || '', selMonth = ps.month || '', selTipo = ps.tipo || '';
    var now = new Date();
    var years = [{ v: '', l: 'Todos' }];
    for (var y = now.getFullYear() - 10; y <= now.getFullYear() + 5; y++) years.push(y);
    var months = [{ v: '', l: 'Todos' }];
    for (var m = 1; m <= 12; m++) months.push({ v: String(m).padStart(2, '0'), l: new Date(2000, m - 1, 1).toLocaleDateString('pt-BR', { month: 'short' }) });

    var filters = '<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:12px;padding:8px 12px;background:var(--gray-100);border-radius:8px"><span style="font-size:12px;color:var(--text-muted)">Filtrar:</span>' +
      '<select onchange="app.pageState.financeiro=app.pageState.financeiro||{};app.pageState.financeiro.year=this.value;app.pageState.financeiro.page=1;app.render()" style="padding:4px 8px;border:1px solid var(--border);border-radius:6px;font-size:13px">' + ui.renderOptions(years, selYear) + '</select>' +
      '<select onchange="app.pageState.financeiro=app.pageState.financeiro||{};app.pageState.financeiro.month=this.value;app.pageState.financeiro.page=1;app.render()" style="padding:4px 8px;border:1px solid var(--border);border-radius:6px;font-size:13px">' + ui.renderOptions(months, selMonth) + '</select>' +
      '<select onchange="app.pageState.financeiro=app.pageState.financeiro||{};app.pageState.financeiro.tipo=this.value;app.pageState.financeiro.page=1;app.render()" style="padding:4px 8px;border:1px solid var(--border);border-radius:6px;font-size:13px">' +
      '<option value="">Todos</option><option value="Receita"' + (selTipo === 'Receita' ? ' selected' : '') + '>Receitas</option><option value="Despesa"' + (selTipo === 'Despesa' ? ' selected' : '') + '>Despesas</option></select>' +
      (selYear || selTipo ? '<button class="btn btn-xs btn-outline" onclick="app.pageState.financeiro={};app.render()">Limpar</button>' : '') + '</div>';

    var allData = this.getTable('financeiro');
    var filtered = allData;
    if (selYear) filtered = filtered.filter(function(f) { return ui.dateMatchesYM(f.data, selYear, selMonth); });
    if (selTipo) filtered = filtered.filter(function(f) { return f.tipo === selTipo; });

    var receitas = filtered.filter(function(f) { return f.tipo === 'Receita'; });
    var despesas = filtered.filter(function(f) { return f.tipo === 'Despesa'; });
    var totalRec = receitas.reduce(function(s, f) { return s + (parseFloat(f.valor) || 0); }, 0);
    var totalDesp = despesas.reduce(function(s, f) { return s + (parseFloat(f.valor) || 0); }, 0);
    var saldo = totalRec - totalDesp;
    var saldoColor = saldo >= 0 ? 'var(--primary)' : 'var(--danger)';

    var summary = '<div style="display:flex;gap:16px;margin-bottom:16px;flex-wrap:wrap">' +
      '<div style="background:var(--card);padding:16px 20px;border-radius:var(--radius);flex:1;box-shadow:var(--shadow);border-left:4px solid var(--success)">' +
      '<div style="font-size:12px;color:var(--text-muted);font-weight:600">Receitas</div><div style="font-size:24px;font-weight:800;color:var(--success)">' + ui.fmtBRL(totalRec) + '</div></div>' +
      '<div style="background:var(--card);padding:16px 20px;border-radius:var(--radius);flex:1;box-shadow:var(--shadow);border-left:4px solid var(--danger)">' +
      '<div style="font-size:12px;color:var(--text-muted);font-weight:600">Despesas</div><div style="font-size:24px;font-weight:800;color:var(--danger)">' + ui.fmtBRL(totalDesp) + '</div></div>' +
      '<div style="background:var(--card);padding:16px 20px;border-radius:var(--radius);flex:1;box-shadow:var(--shadow);border-left:4px solid ' + saldoColor + '">' +
      '<div style="font-size:12px;color:var(--text-muted);font-weight:600">Saldo</div><div style="font-size:24px;font-weight:800;color:' + saldoColor + '">' + ui.fmtBRL(saldo) + '</div></div></div>';

    window._financeiroFiltered = filtered;
    return filters + summary + this.createCRUD({
      title: 'financeiro', data: function() { return window._financeiroFiltered || app.getTable('financeiro'); },
      columns: [
        { label: 'Descricao', field: 'descricao' },
        { label: 'Tipo', render: function(f) { return '<span class="badge badge-' + (f.tipo === 'Receita' ? 'success' : 'danger') + '">' + ui.escHtml(f.tipo) + '</span>'; } },
        { label: 'Categoria', field: 'categoria' }, { label: 'Valor', render: function(f) { return ui.fmtBRL(f.valor); } },
        { label: 'Data', render: function(f) { return ui.fmtDate(f.data); } },
        { label: 'Status', render: function(f) { return ui.statusBadge(f.status || 'Pendente'); } }
      ],
      searchFields: ['descricao', 'categoria', 'forma_pagamento'],
      modalHtml: this._modalFinanceiro.bind(this),
      onAdd: 'app.abrirFormFinanceiro', onEdit: 'app.editarFinanceiro', onDelete: 'app.deletarFinanceiro',
      extraBtns: function() { return '<button class="btn btn-outline btn-sm" onclick="app.exportarExcel(\'financeiro\')">Excel</button>'; }
    });
  },

  _modalFinanceiro() {
    var v = this.editItem.financeiro || {};
    return '<div id="modal-financeiro" class="modal-overlay"><div class="modal"><div class="modal-header"><div class="modal-title">' + (v.id ? 'Editar' : 'Novo') + ' Registro Financeiro</div><button class="modal-close" onclick="ui.fecharModal(\'modal-financeiro\')">&times;</button></div>' +
      '<div class="modal-body"><div class="form-grid">' +
      '<div class="form-group full"><label class="form-label required">Descricao</label><input class="form-input" id="fin-desc" value="' + ui.escHtml(v.descricao || '') + '"></div>' +
      '<div class="form-group"><label class="form-label required">Tipo</label><select class="form-select" id="fin-tipo"><option value="Receita"' + (v.tipo === 'Receita' ? ' selected' : '') + '>Receita</option><option value="Despesa"' + (v.tipo === 'Despesa' ? ' selected' : '') + '>Despesa</option></select></div>' +
      '<div class="form-group"><label class="form-label">Categoria</label><select class="form-select" id="fin-categoria"><option value="">Selecione</option>' + ui.renderOptions(CONFIG.CATEGORIAS_FINANCEIRAS, v.categoria || '') + '</select></div>' +
      '<div class="form-group"><label class="form-label">Valor (R$)</label><input type="number" step="0.01" class="form-input" id="fin-valor" value="' + (v.valor != null ? v.valor : '') + '"></div>' +
      '<div class="form-group"><label class="form-label">Data</label><input type="date" class="form-input" id="fin-data" value="' + (v.data || ui.today()) + '"></div>' +
      '<div class="form-group"><label class="form-label">Forma Pagamento</label><input class="form-input" id="fin-forma" value="' + ui.escHtml(v.forma_pagamento || '') + '"></div>' +
      '<div class="form-group"><label class="form-label">Status</label><select class="form-select" id="fin-status">' + ui.renderOptions(CONFIG.STATUS_FINANCEIRO, v.status || 'Pendente') + '</select></div>' +
      '<div class="form-group full"><label class="form-label">Observacoes</label><textarea class="form-textarea" id="fin-obs" rows="3">' + ui.escHtml(v.observacoes || '') + '</textarea></div>' +
      '</div></div><div class="modal-footer"><button class="btn btn-outline" onclick="ui.fecharModal(\'modal-financeiro\')">Cancelar</button><button class="btn btn-primary" onclick="app.salvarFinanceiro()">Salvar</button></div></div></div>';
  },

  abrirFormFinanceiro(id) {
    this.editItem.financeiro = id ? this.getTable('financeiro').find(function(f) { return f.id === id; }) : null;
    var self = this;
    setTimeout(function() {
      var v = self.editItem.financeiro || {};
      document.getElementById('fin-desc').value = v.descricao || '';
      document.getElementById('fin-tipo').value = v.tipo || 'Receita';
      document.getElementById('fin-categoria').value = v.categoria || '';
      document.getElementById('fin-valor').value = v.valor != null ? v.valor : '';
      document.getElementById('fin-data').value = v.data || ui.today();
      document.getElementById('fin-forma').value = v.forma_pagamento || '';
      document.getElementById('fin-status').value = v.status || 'Pendente';
      document.getElementById('fin-obs').value = v.observacoes || '';
      ui.abrirModal('modal-financeiro');
    }, 0);
  },

  editarFinanceiro(id) { this.abrirFormFinanceiro(id); },

  salvarFinanceiro() {
    var financeiro = this.getTable('financeiro');
    var v = this.editItem.financeiro || {};
    var obj = { id: v.id || ui.nextId(), descricao: document.getElementById('fin-desc').value.trim(), tipo: document.getElementById('fin-tipo').value,
      categoria: document.getElementById('fin-categoria').value, valor: parseFloat(document.getElementById('fin-valor').value) || 0,
      data: document.getElementById('fin-data').value, forma_pagamento: document.getElementById('fin-forma').value,
      status: document.getElementById('fin-status').value, observacoes: document.getElementById('fin-obs').value,
      criado_em: v.criado_em || ui.today() };
    if (!obj.descricao) { ui.toast('Descricao obrigatoria', 'error'); return; }
    var self = this;
    if (v.id) { var idx = financeiro.findIndex(function(f) { return f.id === obj.id; }); if (idx >= 0) financeiro[idx] = obj; }
    else { financeiro.push(obj); }
    db.setTable('financeiro', financeiro).then(function() {
      self.cacheData.financeiro = financeiro; ui.fecharModal('modal-financeiro');
      ui.toast(v.id ? 'Atualizado!' : 'Cadastrado!'); self.editItem.financeiro = null; self.render(); self.enviarTabela('financeiro');
    });
  },

  deletarFinanceiro(id) {
    var self = this;
    ui.confirm('Excluir', 'Tem certeza?', function() {
      var financeiro = self.getTable('financeiro').filter(function(f) { return f.id !== id; });
      db.setTable('financeiro', financeiro).then(async function() {
        self.cacheData.financeiro = financeiro; await db.addDeletedId('financeiro', id);
        if (window.supabaseClient) { try { var res = await window.supabaseClient.from('financeiro').delete().eq('id', id); if (res.error) throw res.error; } catch(e) { ui.toast('Erro: ' + e.message, 'error'); } }
        ui.toast('Removido'); self.render(); self.enviarTabela('financeiro');
      });
    });
  },

  /* ========== AGENDA ========== */
  renderAgenda() {
    var ps = this.pageState.agenda || {};
    var selDate = ps.date || ui.today();
    var nav = '<div style="display:flex;gap:8px;align-items:center;margin-bottom:16px;flex-wrap:wrap">' +
      '<button class="btn btn-outline btn-sm" onclick="app._agendaNav(-1)">&laquo; Anterior</button>' +
      '<input type="date" class="form-input" style="width:auto" id="agenda-date" value="' + selDate + '" onchange="app.pageState.agenda=app.pageState.agenda||{};app.pageState.agenda.date=this.value;app.render()">' +
      '<button class="btn btn-outline btn-sm" onclick="app._agendaNav(1)">Proximo &raquo;</button>' +
      '<button class="btn btn-xs btn-outline" onclick="app.pageState.agenda={};app.render()">Hoje</button></div>';

    var allData = this.getTable('agenda');
    var dayItems = allData.filter(function(a) { return a.data === selDate; });
    dayItems.sort(function(a, b) { return (a.hora || '') > (b.hora || '') ? 1 : -1; });

    var timelineH = dayItems.length ? dayItems.map(function(a) {
      var wpp = a.telefone ? ' <a href="https://wa.me/55' + a.telefone.replace(/\D/g, '') + '" target="_blank" class="whatsapp-btn">&#x1F4DE; WhatsApp</a>' : '';
      return '<div class="timeline-item" style="cursor:pointer" onclick="app.editarAgenda(\'' + a.id + '\')">' +
        '<div class="timeline-date">' + ui.escHtml(a.hora || '00:00') + '</div>' +
        '<div class="timeline-content"><b>' + ui.escHtml(a.tipo) + '</b>' + wpp + '<br>' +
        (a.familia ? '<span style="color:var(--primary);font-weight:500">' + ui.escHtml(a.familia) + '</span> - ' : '') +
        ui.escHtml(a.descricao || '') + (a.status !== 'Agendado' ? ' ' + ui.statusBadge(a.status) : '') + '</div></div>';
    }).join('') : '<p style="color:var(--text-muted);text-align:center;padding:24px">Nenhum agendamento</p>';

    var dayName = new Date(selDate + 'T00:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
    return nav + '<div class="card"><div class="card-header"><div class="card-title">' + dayName + '</div><button class="btn btn-primary btn-sm" onclick="app.abrirFormAgenda()">+ Novo</button></div>' +
      '<div style="padding:20px"><div class="timeline">' + timelineH + '</div></div></div>';
  },

  _agendaNav(delta) {
    var ps = this.pageState.agenda || {};
    var cur = ps.date || ui.today();
    var d = new Date(cur + 'T00:00:00');
    d.setDate(d.getDate() + delta);
    var newDate = d.toISOString().split('T')[0];
    this.pageState.agenda = this.pageState.agenda || {};
    this.pageState.agenda.date = newDate;
    this.render();
  },

  _modalAgenda() {
    var v = this.editItem.agenda || {};
    var tipos = ['Visita', 'Reuniao', 'Entrevista', 'Entrega', 'Ligacao', 'Evento', 'Outro'];
    return '<div id="modal-agenda" class="modal-overlay"><div class="modal"><div class="modal-header"><div class="modal-title">' + (v.id ? 'Editar' : 'Novo') + ' Agendamento</div><button class="modal-close" onclick="ui.fecharModal(\'modal-agenda\')">&times;</button></div>' +
      '<div class="modal-body"><div class="form-grid">' +
      '<div class="form-group"><label class="form-label required">Data</label><input type="date" class="form-input" id="age-data" value="' + (v.data || ui.today()) + '"></div>' +
      '<div class="form-group"><label class="form-label">Hora</label><input type="time" class="form-input" id="age-hora" value="' + (v.hora || '') + '"></div>' +
      '<div class="form-group"><label class="form-label required">Tipo</label><select class="form-select" id="age-tipo">' + tipos.map(function(t) { return '<option' + (v.tipo === t ? ' selected' : '') + '>' + t + '</option>'; }).join('') + '</select></div>' +
      '<div class="form-group"><label class="form-label">Familia</label><input class="form-input" id="age-familia" value="' + ui.escHtml(v.familia || '') + '" list="familias-list2"><datalist id="familias-list2">' +
      this.getTable('familias').map(function(f) { return '<option value="' + ui.escHtml(f.nome) + '">'; }).join('') + '</datalist></div>' +
      '<div class="form-group"><label class="form-label">Contato</label><input class="form-input" id="age-contato" value="' + ui.escHtml(v.contato || '') + '"></div>' +
      '<div class="form-group"><label class="form-label">Telefone</label><input class="form-input" id="age-tel" value="' + ui.escHtml(v.telefone || '') + '"></div>' +
      '<div class="form-group"><label class="form-label">Status</label><select class="form-select" id="age-status">' + ui.renderOptions(CONFIG.STATUS_AGENDA, v.status || 'Agendado') + '</select></div>' +
      '<div class="form-group full"><label class="form-label">Descricao</label><textarea class="form-textarea" id="age-desc" rows="3">' + ui.escHtml(v.descricao || '') + '</textarea></div>' +
      '</div></div><div class="modal-footer"><button class="btn btn-outline" onclick="ui.fecharModal(\'modal-agenda\')">Cancelar</button><button class="btn btn-primary" onclick="app.salvarAgenda()">Salvar</button></div></div></div>';
  },

  abrirFormAgenda(id) {
    this.editItem.agenda = id ? this.getTable('agenda').find(function(a) { return a.id === id; }) : null;
    var ps = this.pageState.agenda || {};
    var self = this;
    setTimeout(function() {
      var v = self.editItem.agenda || {};
      document.getElementById('age-data').value = v.data || ps.date || ui.today();
      document.getElementById('age-hora').value = v.hora || '';
      document.getElementById('age-tipo').value = v.tipo || 'Visita';
      document.getElementById('age-familia').value = v.familia || '';
      document.getElementById('age-contato').value = v.contato || '';
      document.getElementById('age-tel').value = v.telefone || '';
      document.getElementById('age-status').value = v.status || 'Agendado';
      document.getElementById('age-desc').value = v.descricao || '';
      ui.abrirModal('modal-agenda');
    }, 0);
  },

  editarAgenda(id) { this.abrirFormAgenda(id); },

  salvarAgenda() {
    var agenda = this.getTable('agenda');
    var v = this.editItem.agenda || {};
    var obj = { id: v.id || ui.nextId(), data: document.getElementById('age-data').value, hora: document.getElementById('age-hora').value,
      tipo: document.getElementById('age-tipo').value, familia: document.getElementById('age-familia').value,
      contato: document.getElementById('age-contato').value, telefone: document.getElementById('age-tel').value,
      status: document.getElementById('age-status').value, descricao: document.getElementById('age-desc').value,
      criado_em: v.criado_em || ui.today() };
    if (!obj.data || !obj.tipo) { ui.toast('Data e tipo obrigatorios', 'error'); return; }
    var self = this;
    if (v.id) { var idx = agenda.findIndex(function(a) { return a.id === obj.id; }); if (idx >= 0) agenda[idx] = obj; }
    else { agenda.push(obj); }
    db.setTable('agenda', agenda).then(function() {
      self.cacheData.agenda = agenda; ui.fecharModal('modal-agenda');
      ui.toast(v.id ? 'Atualizado!' : 'Cadastrado!'); self.editItem.agenda = null; self.render(); self.updateBadges(); self.enviarTabela('agenda');
    });
  },

  deletarAgenda(id) {
    var self = this;
    ui.confirm('Excluir', 'Tem certeza?', function() {
      var agenda = self.getTable('agenda').filter(function(a) { return a.id !== id; });
      db.setTable('agenda', agenda).then(async function() {
        self.cacheData.agenda = agenda; await db.addDeletedId('agenda', id);
        if (window.supabaseClient) { try { var res = await window.supabaseClient.from('agenda').delete().eq('id', id); if (res.error) throw res.error; } catch(e) { ui.toast('Erro: ' + e.message, 'error'); } }
        ui.toast('Removido'); self.render(); self.enviarTabela('agenda');
      });
    });
  },

  /* ========== OCORRENCIAS ========== */
  renderOcorrencias() {
    return this.createCRUD({
      title: 'ocorrencias', data: function() { return app.getTable('ocorrencias'); },
      columns: [
        { label: 'Data', render: function(o) { return ui.fmtDate(o.data); } },
        { label: 'Familia', field: 'familia' }, { label: 'Tipo', field: 'tipo' },
        { label: 'Prioridade', render: function(o) { return ui.statusBadge(o.prioridade || 'Media'); } },
        { label: 'Status', render: function(o) { return ui.statusBadge(o.status || 'Registrada'); } }
      ],
      searchFields: ['familia', 'tipo', 'descricao'],
      modalHtml: this._modalOcorrencia.bind(this),
      onAdd: 'app.abrirFormOcorrencia', onEdit: 'app.editarOcorrencia', onDelete: 'app.deletarOcorrencia'
    });
  },

  _modalOcorrencia() {
    var v = this.editItem.ocorrencia || {};
    return '<div id="modal-ocorrencia" class="modal-overlay"><div class="modal"><div class="modal-header"><div class="modal-title">' + (v.id ? 'Editar' : 'Nova') + ' Ocorrencia</div><button class="modal-close" onclick="ui.fecharModal(\'modal-ocorrencia\')">&times;</button></div>' +
      '<div class="modal-body"><div class="form-grid">' +
      '<div class="form-group full"><label class="form-label required">Familia</label><input class="form-input" id="ocr-familia" value="' + ui.escHtml(v.familia || '') + '" list="familias-list3"><datalist id="familias-list3">' +
      this.getTable('familias').map(function(f) { return '<option value="' + ui.escHtml(f.nome) + '">'; }).join('') + '</datalist></div>' +
      '<div class="form-group"><label class="form-label">Data</label><input type="date" class="form-input" id="ocr-data" value="' + (v.data || ui.today()) + '"></div>' +
      '<div class="form-group"><label class="form-label required">Tipo</label><select class="form-select" id="ocr-tipo"><option value="">Selecione</option>' + ui.renderOptions(CONFIG.TIPOS_OCORRENCIA, v.tipo || '') + '</select></div>' +
      '<div class="form-group"><label class="form-label">Prioridade</label><select class="form-select" id="ocr-prioridade">' +
      '<option value="Baixa"' + (v.prioridade === 'Baixa' ? ' selected' : '') + '>Baixa</option><option value="Media"' + (v.prioridade === 'Media' || !v.prioridade ? ' selected' : '') + '>Media</option>' +
      '<option value="Alta"' + (v.prioridade === 'Alta' ? ' selected' : '') + '>Alta</option><option value="Urgente"' + (v.prioridade === 'Urgente' ? ' selected' : '') + '>Urgente</option></select></div>' +
      '<div class="form-group full"><label class="form-label">Descricao</label><textarea class="form-textarea" id="ocr-desc" rows="3">' + ui.escHtml(v.descricao || '') + '</textarea></div>' +
      '<div class="form-group full"><label class="form-label">Encaminhamento</label><textarea class="form-textarea" id="ocr-enc" rows="3">' + ui.escHtml(v.encaminhamento || '') + '</textarea></div>' +
      '<div class="form-group"><label class="form-label">Status</label><select class="form-select" id="ocr-status">' + ui.renderOptions(CONFIG.STATUS_OCORRENCIA, v.status || 'Registrada') + '</select></div>' +
      '<div class="form-group full"><label class="form-label">Observacoes</label><textarea class="form-textarea" id="ocr-obs" rows="3">' + ui.escHtml(v.observacoes || '') + '</textarea></div>' +
      '</div></div><div class="modal-footer"><button class="btn btn-outline" onclick="ui.fecharModal(\'modal-ocorrencia\')">Cancelar</button><button class="btn btn-primary" onclick="app.salvarOcorrencia()">Salvar</button></div></div></div>';
  },

  abrirFormOcorrencia(id) {
    this.editItem.ocorrencia = id ? this.getTable('ocorrencias').find(function(o) { return o.id === id; }) : null;
    var self = this;
    setTimeout(function() {
      var v = self.editItem.ocorrencia || {};
      document.getElementById('ocr-familia').value = v.familia || '';
      document.getElementById('ocr-data').value = v.data || ui.today();
      document.getElementById('ocr-tipo').value = v.tipo || '';
      document.getElementById('ocr-prioridade').value = v.prioridade || 'Media';
      document.getElementById('ocr-desc').value = v.descricao || '';
      document.getElementById('ocr-enc').value = v.encaminhamento || '';
      document.getElementById('ocr-status').value = v.status || 'Registrada';
      document.getElementById('ocr-obs').value = v.observacoes || '';
      ui.abrirModal('modal-ocorrencia');
    }, 0);
  },

  editarOcorrencia(id) { this.abrirFormOcorrencia(id); },

  salvarOcorrencia() {
    var ocorrencias = this.getTable('ocorrencias');
    var v = this.editItem.ocorrencia || {};
    var obj = { id: v.id || ui.nextId(), data: document.getElementById('ocr-data').value, familia: document.getElementById('ocr-familia').value.trim(),
      tipo: document.getElementById('ocr-tipo').value, descricao: document.getElementById('ocr-desc').value,
      prioridade: document.getElementById('ocr-prioridade').value, encaminhamento: document.getElementById('ocr-enc').value,
      status: document.getElementById('ocr-status').value, observacoes: document.getElementById('ocr-obs').value,
      criado_em: v.criado_em || ui.today() };
    if (!obj.familia || !obj.tipo) { ui.toast('Familia e tipo obrigatorios', 'error'); return; }
    var self = this;
    if (v.id) { var idx = ocorrencias.findIndex(function(o) { return o.id === obj.id; }); if (idx >= 0) ocorrencias[idx] = obj; }
    else { ocorrencias.push(obj); }
    db.setTable('ocorrencias', ocorrencias).then(function() {
      self.cacheData.ocorrencias = ocorrencias; ui.fecharModal('modal-ocorrencia');
      ui.toast(v.id ? 'Atualizada!' : 'Registrada!'); self.editItem.ocorrencia = null; self.render(); self.enviarTabela('ocorrencias');
    });
  },

  deletarOcorrencia(id) {
    var self = this;
    ui.confirm('Excluir', 'Tem certeza?', function() {
      var ocorrencias = self.getTable('ocorrencias').filter(function(o) { return o.id !== id; });
      db.setTable('ocorrencias', ocorrencias).then(async function() {
        self.cacheData.ocorrencias = ocorrencias; await db.addDeletedId('ocorrencias', id);
        if (window.supabaseClient) { try { var res = await window.supabaseClient.from('ocorrencias').delete().eq('id', id); if (res.error) throw res.error; } catch(e) { ui.toast('Erro: ' + e.message, 'error'); } }
        ui.toast('Removida'); self.render(); self.enviarTabela('ocorrencias');
      });
    });
  },

  /* ========== RELATORIOS ========== */
  renderRelatorios() {
    var f = this.getTable('familias'), d = this.getTable('doacoes'), v = this.getTable('voluntarios'),
        cap = this.getTable('captacao'), fin = this.getTable('financeiro'), o = this.getTable('ocorrencias'),
        c = this.getTable('campanhas'), a = this.getTable('agenda');

    var totalDoacoes = d.reduce(function(s, x) { return s + (parseFloat(x.valor) || 0); }, 0);
    var totalCaptacao = cap.reduce(function(s, x) { return s + (parseFloat(x.valor) || 0); }, 0);
    var totalRec = fin.filter(function(x) { return x.tipo === 'Receita'; }).reduce(function(s, x) { return s + (parseFloat(x.valor) || 0); }, 0);
    var totalDesp = fin.filter(function(x) { return x.tipo === 'Despesa'; }).reduce(function(s, x) { return s + (parseFloat(x.valor) || 0); }, 0);
    var ocrPendentes = o.filter(function(x) { return x.status !== 'Resolvida' && x.status !== 'Arquivada'; }).length;
    var campAtivas = c.filter(function(x) { return x.status === 'Ativa'; }).length;
    var agendamentosHoje = a.filter(function(x) { return x.data === ui.today(); }).length;

    return '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:20px;margin-bottom:24px">' +
      '<div class="card"><div class="card-header"><div class="card-title">Visao Geral</div></div><div style="padding:20px">' +
      '<table><tbody>' +
      '<tr><td>Familias Cadastradas</td><td style="text-align:right;font-weight:700">' + f.length + '</td></tr>' +
      '<tr><td>Voluntarios</td><td style="text-align:right;font-weight:700">' + v.length + '</td></tr>' +
      '<tr><td>Voluntarios Ativos</td><td style="text-align:right;font-weight:700;color:var(--success)">' + v.filter(function(x) { return x.status === 'Ativo' || x.status === 'Disponivel'; }).length + '</td></tr>' +
      '<tr><td>Campanhas Ativas</td><td style="text-align:right;font-weight:700;color:var(--success)">' + campAtivas + '</td></tr>' +
      '<tr><td>Ocorrencias Pendentes</td><td style="text-align:right;font-weight:700;color:var(--danger)">' + ocrPendentes + '</td></tr>' +
      '<tr><td>Agendamentos Hoje</td><td style="text-align:right;font-weight:700">' + agendamentosHoje + '</td></tr>' +
      '</tbody></table></div></div>' +
      '<div class="card"><div class="card-header"><div class="card-title">Financeiro</div></div><div style="padding:20px">' +
      '<table><tbody>' +
      '<tr><td>Total Doacoes</td><td style="text-align:right;font-weight:700;color:var(--primary)">' + ui.fmtBRL(totalDoacoes) + '</td></tr>' +
      '<tr><td>Total Captacao</td><td style="text-align:right;font-weight:700;color:var(--primary)">' + ui.fmtBRL(totalCaptacao) + '</td></tr>' +
      '<tr><td>Receitas</td><td style="text-align:right;font-weight:700;color:var(--success)">' + ui.fmtBRL(totalRec) + '</td></tr>' +
      '<tr><td>Despesas</td><td style="text-align:right;font-weight:700;color:var(--danger)">' + ui.fmtBRL(totalDesp) + '</td></tr>' +
      '<tr><td>Saldo</td><td style="text-align:right;font-weight:700;color:' + (totalRec - totalDesp >= 0 ? 'var(--success)' : 'var(--danger)') + '">' + ui.fmtBRL(totalRec - totalDesp) + '</td></tr>' +
      '</tbody></table></div></div>' +
      '<div class="card"><div class="card-header"><div class="card-title">Impacto Social</div></div><div style="padding:20px">' +
      '<div style="font-size:36px;font-weight:800;color:var(--primary);text-align:center">' + f.length + '</div><div style="text-align:center;font-size:13px;color:var(--text-muted)">familias atendidas</div>' +
      '<div style="display:flex;justify-content:space-around;margin-top:20px;text-align:center">' +
      '<div><div style="font-size:24px;font-weight:700;color:var(--secondary)">' + d.length + '</div><div style="font-size:11px;color:var(--text-muted)">doacoes</div></div>' +
      '<div><div style="font-size:24px;font-weight:700;color:var(--secondary)">' + o.length + '</div><div style="font-size:11px;color:var(--text-muted)">ocorrencias</div></div>' +
      '<div><div style="font-size:24px;font-weight:700;color:var(--secondary)">' + a.length + '</div><div style="font-size:11px;color:var(--text-muted)">agendamentos</div></div></div></div></div>' +
      '<div style="text-align:center;padding:20px;color:var(--text-muted);font-size:13px">' +
      'Use os botoes de exportacao (Excel) nas paginas de Captacao e Financeiro para gerar relatorios detalhados.' +
      '<br><br><button class="btn btn-outline btn-sm" onclick="app.exportarExcel(\'familias\')">Exportar Familias</button> ' +
      '<button class="btn btn-outline btn-sm" onclick="app.exportarExcel(\'doacoes\')">Exportar Doacoes</button> ' +
      '<button class="btn btn-outline btn-sm" onclick="app.exportarExcel(\'voluntarios\')">Exportar Voluntarios</button></div>';
  },

  /* ========== SYNC ========== */
  renderSync() {
    var info = '<div class="card"><div class="card-header"><div class="card-title">Sincronizacao</div></div><div style="padding:20px">' +
      '<p style="font-size:14px;color:var(--text-muted);margin-bottom:16px">Gerencie a sincronizacao dos dados entre o navegador (IndexedDB) e o servidor (Supabase).</p>' +
      '<div style="display:flex;flex-wrap:wrap;gap:12px;margin-bottom:20px">' +
      '<button class="btn btn-primary" onclick="app.sincronizar()">&#x1F504; Sincronizar Agora</button>' +
      '<button class="btn btn-secondary" onclick="app.enviarTabela(\'familias\')">Enviar Familias</button>' +
      '<button class="btn btn-secondary" onclick="app.enviarTabela(\'doacoes\')">Enviar Doacoes</button>' +
      '<button class="btn btn-secondary" onclick="app.enviarTabela(\'voluntarios\')">Enviar Voluntarios</button>' +
      '<button class="btn btn-secondary" onclick="app.enviarTabela(\'campanhas\')">Enviar Campanhas</button>' +
      '<button class="btn btn-secondary" onclick="app.enviarTabela(\'captacao\')">Enviar Captacao</button>' +
      '<button class="btn btn-secondary" onclick="app.enviarTabela(\'financeiro\')">Enviar Financeiro</button>' +
      '<button class="btn btn-secondary" onclick="app.enviarTabela(\'agenda\')">Enviar Agenda</button>' +
      '<button class="btn btn-secondary" onclick="app.enviarTabela(\'ocorrencias\')">Enviar Ocorrencias</button></div>' +
      '<div class="card"><div class="card-header"><div class="card-title">Registros Locais</div></div><div class="table-wrapper"><table><thead><tr><th>Tabela</th><th>Registros</th></tr></thead><tbody>' +
      CONFIG.TABELAS.map(function(t) { return '<tr><td>' + t + '</td><td>' + (app.getTable(t).length) + '</td></tr>'; }).join('') +
      '</tbody></table></div></div></div></div>';
    return info;
  }
});

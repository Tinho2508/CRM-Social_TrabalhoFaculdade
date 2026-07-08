/* Pages: Dashboard, Familias, Doacoes, Campanhas, Voluntarios */

app = Object.assign(app, {

  /* ========== DASHBOARD ========== */
  renderDashboard() {
    var ds = this.pageState.dashboard || {};
    var selYear = ds.year || '';
    var selMonth = ds.month || '';
    var now = new Date();
    var years = [{ v: '', l: 'Todos' }];
    for (var y = now.getFullYear() - 10; y <= now.getFullYear() + 5; y++) years.push(y);
    var months = [{ v: '', l: 'Todos' }];
    for (var m = 1; m <= 12; m++) months.push({ v: String(m).padStart(2, '0'), l: new Date(2000, m - 1, 1).toLocaleDateString('pt-BR', { month: 'short' }) });

    var f = this.getTable('familias'), d = this.getTable('doacoes'), v = this.getTable('voluntarios'),
        cap = this.getTable('captacao'), o = this.getTable('ocorrencias'), c = this.getTable('campanhas');

    var doacoesMes = d.filter(function(x) { return ui.dateMatchesYM(x.data, String(now.getFullYear()), String(now.getMonth() + 1).padStart(2, '0')); });
    var totalDoacoesMes = doacoesMes.reduce(function(s, x) { return s + (parseFloat(x.valor) || 0); }, 0);
    var voluntariosAtivos = v.filter(function(x) { return x.status === 'Ativo' || x.status === 'Disponivel'; });
    var campanhasAtivas = c.filter(function(x) { return x.status === 'Ativa'; });
    var ocorrenciasAbertas = o.filter(function(x) { return x.status !== 'Resolvida' && x.status !== 'Arquivada'; });
    var famMes = f.filter(function(x) { return ui.dateMatchesYM(x.criado_em, String(now.getFullYear()), String(now.getMonth() + 1).padStart(2, '0')); }).length;

    var filterHtml = '<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:12px;padding:8px 12px;background:var(--gray-100);border-radius:8px">' +
      '<span style="font-size:12px;color:var(--text-muted)">Filtrar:</span>' +
      '<select onchange="app.pageState.dashboard=app.pageState.dashboard||{};app.pageState.dashboard.year=this.value;app.render()" style="padding:4px 8px;border:1px solid var(--border);border-radius:6px;font-size:13px">' +
      ui.renderOptions(years, selYear) + '</select>' +
      '<select onchange="app.pageState.dashboard=app.pageState.dashboard||{};app.pageState.dashboard.month=this.value;app.render()" style="padding:4px 8px;border:1px solid var(--border);border-radius:6px;font-size:13px">' +
      ui.renderOptions(months, selMonth) + '</select>' +
      (selYear ? '<button class="btn btn-xs btn-outline" onclick="app.pageState.dashboard={};app.render()">Limpar</button>' : '') + '</div>';

    var kpis = '<div class="kpi-grid">' +
      '<div class="kpi-card" onclick="app.navigate(\'familias\')"><div class="kpi-label">Familias</div><div class="kpi-value">' + f.length + '</div><div class="kpi-sub">' + famMes + ' novas este mes</div></div>' +
      '<div class="kpi-card" onclick="app.navigate(\'doacoes\')"><div class="kpi-label">Doacoes no Mes</div><div class="kpi-value">' + doacoesMes.length + '</div><div class="kpi-sub">Total: ' + ui.fmtBRL(totalDoacoesMes) + '</div></div>' +
      '<div class="kpi-card" style="border-left-color:var(--info)" onclick="app.navigate(\'voluntarios\')"><div class="kpi-label">Voluntarios</div><div class="kpi-value">' + voluntariosAtivos.length + '</div><div class="kpi-sub">' + v.length + ' cadastrados</div></div>' +
      '<div class="kpi-card" style="border-left-color:var(--success)" onclick="app.navigate(\'campanhas\')"><div class="kpi-label">Campanhas Ativas</div><div class="kpi-value">' + campanhasAtivas.length + '</div><div class="kpi-sub">' + c.length + ' total</div></div>' +
      '<div class="kpi-card" style="border-left-color:var(--warning)" onclick="app.navigate(\'captacao\')"><div class="kpi-label">Captacao Mes</div><div class="kpi-value">' + ui.fmtBRL(totalDoacoesMes) + '</div><div class="kpi-sub">Recursos captados</div></div>' +
      '<div class="kpi-card" style="border-left-color:var(--danger)" onclick="app.navigate(\'ocorrencias\')"><div class="kpi-label">Ocorrencias</div><div class="kpi-value">' + ocorrenciasAbertas.length + '</div><div class="kpi-sub">' + o.length + ' registradas</div></div></div>';

    var filtered = cap;
    if (selYear) filtered = filtered.filter(function(x) { return ui.dateMatchesYM(x.data, selYear, selMonth); });
    var totalCaptado = filtered.reduce(function(s, x) { return s + (parseFloat(x.valor) || 0); }, 0);

    var doacoesPorTipo = {};
    filtered.forEach(function(x) { var t = x.tipo || 'Outros'; doacoesPorTipo[t] = (doacoesPorTipo[t] || 0) + (parseFloat(x.valor) || 0); });
    var tipos = Object.keys(doacoesPorTipo).sort(function(a, b) { return doacoesPorTipo[b] - doacoesPorTipo[a]; });
    var maxTipo = Math.max.apply(null, Object.values(doacoesPorTipo).concat([1]));

    var topDoadores = {};
    filtered.forEach(function(x) { if (x.doador) topDoadores[x.doador] = (topDoadores[x.doador] || 0) + (parseFloat(x.valor) || 0); });
    var topDonors = Object.entries(topDoadores).sort(function(a, b) { return b[1] - a[1]; }).slice(0, 8);

    var tipoH = tipos.length ? tipos.map(function(t) {
      var v = doacoesPorTipo[t];
      return '<div style="margin-bottom:8px"><div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:2px"><span>' + ui.escHtml(t) + '</span><span>' + ui.fmtBRL(v) + '</span></div>' +
        '<div class="progress-bar"><div class="progress-fill" style="width:' + ((v / maxTipo) * 100) + '%;background:linear-gradient(90deg,var(--primary),var(--secondary))"></div></div></div>';
    }).join('') : '<p style="color:var(--text-muted);text-align:center;padding:16px">Sem dados</p>';

    var topH = topDonors.length ? topDonors.map(function(t, i) {
      return '<tr><td style="font-weight:600">' + (i + 1) + '</td><td style="cursor:pointer;color:var(--primary)" onclick="app.navigate(\'captacao\')">' + ui.escHtml(t[0]) + '</td><td>' + ui.fmtBRL(t[1]) + '</td></tr>';
    }).join('') : '<tr><td colspan="3" style="text-align:center;color:var(--text-muted)">Sem dados</td></tr>';

    var ocorrenciasPendentes = o.filter(function(x) { return x.status === 'Registrada' || x.status === 'Em Andamento'; }).slice(0, 5);
    var ocorrH = ocorrenciasPendentes.length ? ocorrenciasPendentes.map(function(x) {
      return '<tr><td>' + ui.fmtDate(x.data) + '</td><td style="cursor:pointer;color:var(--primary)" onclick="app.abrirVisao360(\'' + ui.escJs(x.familia) + '\')">' + ui.escHtml(x.familia) + '</td><td>' + ui.escHtml(x.tipo) + '</td><td>' + ui.statusBadge(x.prioridade || 'Media') + '</td></tr>';
    }).join('') : '<tr><td colspan="4" style="text-align:center;color:var(--text-muted)">Nenhuma pendente</td></tr>';

    var evolH = this._renderEvolucao(filtered);

    return filterHtml + kpis +
      '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:24px;margin-bottom:24px">' +
      '<div class="card"><div class="card-header"><div class="card-title">Captacao por Tipo</div></div><div style="padding:20px">' + tipoH + '</div></div>' +
      '<div class="card"><div class="card-header"><div class="card-title">Evolucao Mensal</div></div><div style="padding:20px;max-height:320px;overflow-y:auto">' + evolH + '</div></div></div>' +
      '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:24px">' +
      '<div class="card"><div class="card-header"><div class="card-title">Top Doadores</div></div><div class="table-wrapper"><table><thead><tr><th>#</th><th>Doador</th><th>Total</th></tr></thead><tbody>' + topH + '</tbody></table></div></div>' +
      '<div class="card"><div class="card-header"><div class="card-title">&#x26A0; Ocorrencias Pendentes</div></div><div class="table-wrapper"><table><thead><tr><th>Data</th><th>Familia</th><th>Tipo</th><th>Prioridade</th></tr></thead><tbody>' + ocorrH + '</tbody></table></div></div></div>';
  },

  _renderEvolucao(filtered) {
    var evol = {};
    filtered.forEach(function(x) { var ym = ui.toDateYM(x.data); if (ym.length >= 7) evol[ym] = (evol[ym] || 0) + (parseFloat(x.valor) || 0); });
    var months = Object.keys(evol).sort();
    if (months.length > 12) months = months.slice(-12);
    var maxE = Math.max.apply(null, months.map(function(m) { return evol[m]; }).concat([1]));
    if (!months.length) return '<p style="color:var(--text-muted);text-align:center;padding:16px">Sem dados</p>';
    return months.map(function(m) {
      var v = evol[m];
      return '<div style="margin-bottom:6px"><div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:2px"><span>' + m + '</span><span>' + ui.fmtBRL(v) + '</span></div>' +
        '<div class="progress-bar"><div class="progress-fill" style="width:' + ((v / maxE) * 100) + '%;background:linear-gradient(90deg,var(--primary),var(--secondary))"></div></div></div>';
    }).join('');
  },

  /* ========== FAMILIAS ========== */
  renderFamilias() {
    var extraBtns = function() { return '<button class="btn btn-secondary btn-sm" onclick="app.distribuirDados()">Distribuir da Captacao</button>'; };
    return this.createCRUD({
      title: 'familias', data: function() { return app.getTable('familias'); },
      columns: [
        { label: 'Nome', field: 'nome' }, { label: 'Responsavel', field: 'responsavel' },
        { label: 'Telefone', field: 'telefone' }, { label: 'Cidade', field: 'cidade' },
        { label: 'Membros', field: 'membros' },
        { label: 'Situacao', render: function(f) { return ui.statusBadge(f.situacao || 'Ativa'); } }
      ],
      searchFields: ['nome', 'responsavel', 'cpf', 'telefone', 'email', 'cidade'],
      modalHtml: this._modalFamilia.bind(this),
      onAdd: 'app.abrirFormFamilia', onEdit: 'app.editarFamilia', onDelete: 'app.deletarFamilia',
      extraBtns: extraBtns
    });
  },

  _modalFamilia() {
    var v = this.editItem.familia || {};
    return '<div id="modal-familia" class="modal-overlay"><div class="modal"><div class="modal-header"><div class="modal-title">' + (v.id ? 'Editar' : 'Nova') + ' Familia</div><button class="modal-close" onclick="ui.fecharModal(\'modal-familia\')">&times;</button></div>' +
      '<div class="modal-body"><div class="form-grid">' +
      '<div class="form-group full"><label class="form-label required">Nome da Familia</label><input class="form-input" id="fam-nome" value="' + ui.escHtml(v.nome || '') + '"></div>' +
      '<div class="form-group"><label class="form-label">Responsavel</label><input class="form-input" id="fam-resp" value="' + ui.escHtml(v.responsavel || '') + '"></div>' +
      '<div class="form-group"><label class="form-label">CPF</label><input class="form-input" id="fam-cpf" value="' + ui.escHtml(v.cpf || '') + '"></div>' +
      '<div class="form-group"><label class="form-label">Telefone</label><input class="form-input" id="fam-tel" value="' + ui.escHtml(v.telefone || '') + '"></div>' +
      '<div class="form-group"><label class="form-label">WhatsApp</label><input class="form-input" id="fam-wpp" value="' + ui.escHtml(v.whatsapp || '') + '"></div>' +
      '<div class="form-group"><label class="form-label">E-mail</label><input class="form-input" id="fam-email" value="' + ui.escHtml(v.email || '') + '"></div>' +
      '<div class="form-group"><label class="form-label">Endereco</label><input class="form-input" id="fam-end" value="' + ui.escHtml(v.endereco || '') + '"></div>' +
      '<div class="form-group"><label class="form-label">Cidade</label><input class="form-input" id="fam-cidade" value="' + ui.escHtml(v.cidade || '') + '"></div>' +
      '<div class="form-group"><label class="form-label">Estado</label><input class="form-input" id="fam-uf" value="' + ui.escHtml(v.estado || '') + '"></div>' +
      '<div class="form-group"><label class="form-label">Membros</label><input type="number" class="form-input" id="fam-membros" value="' + (v.membros != null ? v.membros : '') + '"></div>' +
      '<div class="form-group"><label class="form-label">Renda Familiar</label><input type="number" step="0.01" class="form-input" id="fam-renda" value="' + (v.renda_familiar != null ? v.renda_familiar : '') + '"></div>' +
      '<div class="form-group"><label class="form-label">Situacao</label><select class="form-select" id="fam-situacao">' + ui.renderOptions(CONFIG.STATUS_FAMILIA, v.situacao || 'Ativa') + '</select></div>' +
      '<div class="form-group full"><label class="form-label">Observacoes</label><textarea class="form-textarea" id="fam-obs" rows="3">' + ui.escHtml(v.observacoes || '') + '</textarea></div>' +
      '</div></div><div class="modal-footer"><button class="btn btn-outline" onclick="ui.fecharModal(\'modal-familia\')">Cancelar</button><button class="btn btn-primary" onclick="app.salvarFamilia()">Salvar</button></div></div></div>';
  },

  abrirFormFamilia(id) {
    this.editItem.familia = id ? this.getTable('familias').find(function(f) { return f.id === id; }) : null;
    var self = this;
    setTimeout(function() {
      var v = self.editItem.familia || {};
      document.getElementById('fam-nome').value = v.nome || '';
      document.getElementById('fam-resp').value = v.responsavel || '';
      document.getElementById('fam-cpf').value = v.cpf || '';
      document.getElementById('fam-tel').value = v.telefone || '';
      document.getElementById('fam-wpp').value = v.whatsapp || '';
      document.getElementById('fam-email').value = v.email || '';
      document.getElementById('fam-end').value = v.endereco || '';
      document.getElementById('fam-cidade').value = v.cidade || '';
      document.getElementById('fam-uf').value = v.estado || '';
      document.getElementById('fam-membros').value = v.membros != null ? v.membros : '';
      document.getElementById('fam-renda').value = v.renda_familiar != null ? v.renda_familiar : '';
      document.getElementById('fam-situacao').value = v.situacao || 'Ativa';
      document.getElementById('fam-obs').value = v.observacoes || '';
      ui.abrirModal('modal-familia');
    }, 0);
  },

  editarFamilia(id) { this.abrirFormFamilia(id); },

  salvarFamilia() {
    var familias = this.getTable('familias');
    var v = this.editItem.familia || {};
    var obj = { id: v.id || ui.nextId(), nome: document.getElementById('fam-nome').value.trim(), responsavel: document.getElementById('fam-resp').value,
      cpf: document.getElementById('fam-cpf').value, telefone: document.getElementById('fam-tel').value, whatsapp: document.getElementById('fam-wpp').value,
      email: document.getElementById('fam-email').value, endereco: document.getElementById('fam-end').value, cidade: document.getElementById('fam-cidade').value,
      estado: document.getElementById('fam-uf').value, membros: parseInt(document.getElementById('fam-membros').value) || 0,
      renda_familiar: parseFloat(document.getElementById('fam-renda').value) || 0, situacao: document.getElementById('fam-situacao').value,
      observacoes: document.getElementById('fam-obs').value, criado_em: v.criado_em || ui.today() };
    if (!obj.nome) { ui.toast('Nome obrigatorio', 'error'); return; }
    var self = this;
    if (v.id) { var idx = familias.findIndex(function(f) { return f.id === obj.id; }); if (idx >= 0) familias[idx] = obj; }
    else { familias.push(obj); }
    db.setTable('familias', familias).then(function() {
      self.cacheData.familias = familias; ui.fecharModal('modal-familia');
      ui.toast(v.id ? 'Atualizada!' : 'Cadastrada!'); self.editItem.familia = null; self.render(); self.enviarTabela('familias');
    });
  },

  deletarFamilia(id) {
    var self = this;
    ui.confirm('Excluir', 'Tem certeza?', function() {
      var familias = self.getTable('familias').filter(function(f) { return f.id !== id; });
      db.setTable('familias', familias).then(async function() {
        self.cacheData.familias = familias; await db.addDeletedId('familias', id);
        if (window.supabaseClient) { try { var res = await window.supabaseClient.from('familias').delete().eq('id', id); if (res.error) throw res.error; } catch(e) { ui.toast('Erro: ' + e.message, 'error'); } }
        ui.toast('Removida'); self.render(); self.enviarTabela('familias');
      });
    });
  },

  distribuirDados() {
    var captacao = this.getTable('captacao');
    var familias = this.getTable('familias');
    var doacoes = this.getTable('doacoes');
    var famAdd = 0, doacAdd = 0;
    captacao.forEach(function(p) {
      var nomeVal = p.doador || '';
      if (nomeVal) {
        var nomeNorm = nomeVal.toString().trim().toLowerCase();
        if (!familias.find(function(f) { return (f.nome || '').toString().trim().toLowerCase() === nomeNorm; }) && nomeNorm.length > 0 && !/^\d+\.?\d*$/.test(nomeNorm)) {
          familias.push({ id: ui.nextId(), nome: nomeVal.trim(), responsavel: '', cpf: '', telefone: '', whatsapp: '', email: '', endereco: '', cidade: '', estado: '', membros: 0, renda_familiar: 0, situacao: 'Ativa', observacoes: '', criado_em: ui.today() });
          famAdd++;
        }
      }
      if (nomeVal && p.valor) {
        if (!doacoes.find(function(d) { return d.familia === nomeVal.trim() && d.valor === parseFloat(p.valor) && d.data === p.data; })) {
          doacoes.push({ id: ui.nextId(), familia: nomeVal.trim(), tipo: p.tipo || 'Dinheiro', quantidade: '', valor: parseFloat(p.valor) || 0, data: p.data || ui.today(), campanha: p.campanha || '', doador: nomeVal.trim(), status: 'Recebida', observacoes: '', criado_em: ui.today() });
          doacAdd++;
        }
      }
    });
    var self = this;
    var proms = [];
    if (famAdd) proms.push(db.setTable('familias', familias).then(function() { self.cacheData.familias = familias; }));
    if (doacAdd) proms.push(db.setTable('doacoes', doacoes).then(function() { self.cacheData.doacoes = doacoes; }));
    Promise.all(proms).then(function() {
      ui.toast(famAdd + ' familias e ' + doacAdd + ' doacoes geradas!'); self.render();
      if (famAdd) self.enviarTabela('familias'); if (doacAdd) self.enviarTabela('doacoes');
    });
  },

  /* ========== DOACOES ========== */
  renderDoacoes() {
    return this.createCRUD({
      title: 'doacoes', data: function() { return app.getTable('doacoes'); },
      columns: [
        { label: 'Familia', field: 'familia' }, { label: 'Tipo', field: 'tipo' },
        { label: 'Valor', render: function(d) { return ui.fmtBRL(d.valor); } },
        { label: 'Data', render: function(d) { return ui.fmtDate(d.data); } },
        { label: 'Campanha', field: 'campanha' },
        { label: 'Status', render: function(d) { return ui.statusBadge(d.status || 'Recebida'); } }
      ],
      searchFields: ['familia', 'tipo', 'doador', 'campanha'],
      modalHtml: this._modalDoacao.bind(this),
      onAdd: 'app.abrirFormDoacao', onEdit: 'app.editarDoacao', onDelete: 'app.deletarDoacao'
    });
  },

  _modalDoacao() {
    var v = this.editItem.doacao || {};
    return '<div id="modal-doacao" class="modal-overlay"><div class="modal"><div class="modal-header"><div class="modal-title">' + (v.id ? 'Editar' : 'Nova') + ' Doacao</div><button class="modal-close" onclick="ui.fecharModal(\'modal-doacao\')">&times;</button></div>' +
      '<div class="modal-body"><div class="form-grid">' +
      '<div class="form-group full"><label class="form-label required">Familia / Doador</label><input class="form-input" id="doa-familia" value="' + ui.escHtml(v.familia || '') + '" list="familias-list"><datalist id="familias-list">' +
      this.getTable('familias').map(function(f) { return '<option value="' + ui.escHtml(f.nome) + '">'; }).join('') + '</datalist></div>' +
      '<div class="form-group"><label class="form-label required">Tipo</label><select class="form-select" id="doa-tipo">' + ui.renderOptions(CONFIG.TIPOS_DOACAO, v.tipo || 'Dinheiro') + '</select></div>' +
      '<div class="form-group"><label class="form-label">Quantidade</label><input class="form-input" id="doa-qtd" value="' + ui.escHtml(v.quantidade || '') + '"></div>' +
      '<div class="form-group"><label class="form-label">Valor (R$)</label><input type="number" step="0.01" class="form-input" id="doa-valor" value="' + (v.valor != null ? v.valor : '') + '"></div>' +
      '<div class="form-group"><label class="form-label">Data</label><input type="date" class="form-input" id="doa-data" value="' + (v.data || ui.today()) + '"></div>' +
      '<div class="form-group"><label class="form-label">Campanha</label><input class="form-input" id="doa-campanha" value="' + ui.escHtml(v.campanha || '') + '"></div>' +
      '<div class="form-group"><label class="form-label">Doador (se diferente)</label><input class="form-input" id="doa-doador" value="' + ui.escHtml(v.doador || '') + '"></div>' +
      '<div class="form-group"><label class="form-label">Status</label><select class="form-select" id="doa-status">' + ui.renderOptions(CONFIG.STATUS_DOACAO, v.status || 'Recebida') + '</select></div>' +
      '<div class="form-group full"><label class="form-label">Observacoes</label><textarea class="form-textarea" id="doa-obs" rows="3">' + ui.escHtml(v.observacoes || '') + '</textarea></div>' +
      '</div></div><div class="modal-footer"><button class="btn btn-outline" onclick="ui.fecharModal(\'modal-doacao\')">Cancelar</button><button class="btn btn-primary" onclick="app.salvarDoacao()">Salvar</button></div></div></div>';
  },

  abrirFormDoacao(id) {
    this.editItem.doacao = id ? this.getTable('doacoes').find(function(d) { return d.id === id; }) : null;
    var self = this;
    setTimeout(function() {
      var v = self.editItem.doacao || {};
      document.getElementById('doa-familia').value = v.familia || '';
      document.getElementById('doa-tipo').value = v.tipo || 'Dinheiro';
      document.getElementById('doa-qtd').value = v.quantidade || '';
      document.getElementById('doa-valor').value = v.valor != null ? v.valor : '';
      document.getElementById('doa-data').value = v.data || ui.today();
      document.getElementById('doa-campanha').value = v.campanha || '';
      document.getElementById('doa-doador').value = v.doador || '';
      document.getElementById('doa-status').value = v.status || 'Recebida';
      document.getElementById('doa-obs').value = v.observacoes || '';
      ui.abrirModal('modal-doacao');
    }, 0);
  },

  editarDoacao(id) { this.abrirFormDoacao(id); },

  salvarDoacao() {
    var doacoes = this.getTable('doacoes');
    var v = this.editItem.doacao || {};
    var obj = { id: v.id || ui.nextId(), familia: document.getElementById('doa-familia').value.trim(), tipo: document.getElementById('doa-tipo').value,
      quantidade: document.getElementById('doa-qtd').value, valor: parseFloat(document.getElementById('doa-valor').value) || 0,
      data: document.getElementById('doa-data').value, campanha: document.getElementById('doa-campanha').value,
      doador: document.getElementById('doa-doador').value, status: document.getElementById('doa-status').value,
      observacoes: document.getElementById('doa-obs').value, criado_em: v.criado_em || ui.today() };
    if (!obj.familia) { ui.toast('Familia obrigatoria', 'error'); return; }
    var self = this;
    if (v.id) { var idx = doacoes.findIndex(function(d) { return d.id === obj.id; }); if (idx >= 0) doacoes[idx] = obj; }
    else { doacoes.push(obj); }
    db.setTable('doacoes', doacoes).then(function() {
      self.cacheData.doacoes = doacoes; ui.fecharModal('modal-doacao');
      ui.toast(v.id ? 'Atualizada!' : 'Cadastrada!'); self.editItem.doacao = null; self.render();
      self.updateBadges(); self.enviarTabela('doacoes');
    });
  },

  deletarDoacao(id) {
    var self = this;
    ui.confirm('Excluir', 'Tem certeza?', function() {
      var doacoes = self.getTable('doacoes').filter(function(d) { return d.id !== id; });
      db.setTable('doacoes', doacoes).then(async function() {
        self.cacheData.doacoes = doacoes; await db.addDeletedId('doacoes', id);
        if (window.supabaseClient) { try { var res = await window.supabaseClient.from('doacoes').delete().eq('id', id); if (res.error) throw res.error; } catch(e) { ui.toast('Erro: ' + e.message, 'error'); } }
        ui.toast('Removida'); self.render(); self.enviarTabela('doacoes');
      });
    });
  },

  /* ========== CAMPANHAS ========== */
  renderCampanhas() {
    return this.createCRUD({
      title: 'campanhas', data: function() { return app.getTable('campanhas'); },
      columns: [
        { label: 'Nome', field: 'nome' }, { label: 'Area', field: 'area_atuacao' },
        { label: 'Meta', render: function(c) { return ui.fmtBRL(c.meta); } },
        { label: 'Arrecadado', render: function(c) { return ui.fmtBRL(c.arrecadado); } },
        { label: 'Inicio', render: function(c) { return ui.fmtDate(c.data_inicio); } },
        { label: 'Fim', render: function(c) { return ui.fmtDate(c.data_fim); } },
        { label: 'Status', render: function(c) { return ui.statusBadge(c.status || 'Planejamento'); } }
      ],
      searchFields: ['nome', 'descricao', 'area_atuacao', 'tipo'],
      modalHtml: this._modalCampanha.bind(this),
      onAdd: 'app.abrirFormCampanha', onEdit: 'app.editarCampanha', onDelete: 'app.deletarCampanha'
    });
  },

  _modalCampanha() {
    var v = this.editItem.campanha || {};
    return '<div id="modal-campanha" class="modal-overlay"><div class="modal"><div class="modal-header"><div class="modal-title">' + (v.id ? 'Editar' : 'Nova') + ' Campanha</div><button class="modal-close" onclick="ui.fecharModal(\'modal-campanha\')">&times;</button></div>' +
      '<div class="modal-body"><div class="form-grid">' +
      '<div class="form-group full"><label class="form-label required">Nome</label><input class="form-input" id="camp-nome" value="' + ui.escHtml(v.nome || '') + '"></div>' +
      '<div class="form-group full"><label class="form-label">Descricao</label><textarea class="form-textarea" id="camp-desc" rows="3">' + ui.escHtml(v.descricao || '') + '</textarea></div>' +
      '<div class="form-group"><label class="form-label">Tipo</label><input class="form-input" id="camp-tipo" value="' + ui.escHtml(v.tipo || '') + '"></div>' +
      '<div class="form-group"><label class="form-label">Area</label><select class="form-select" id="camp-area">' + ui.renderOptions(CONFIG.AREAS_ATUACAO, v.area_atuacao || '') + '</select></div>' +
      '<div class="form-group"><label class="form-label">Meta (R$)</label><input type="number" step="0.01" class="form-input" id="camp-meta" value="' + (v.meta != null ? v.meta : '') + '"></div>' +
      '<div class="form-group"><label class="form-label">Arrecadado (R$)</label><input type="number" step="0.01" class="form-input" id="camp-arr" value="' + (v.arrecadado != null ? v.arrecadado : '') + '"></div>' +
      '<div class="form-group"><label class="form-label">Data Inicio</label><input type="date" class="form-input" id="camp-inicio" value="' + (v.data_inicio || '') + '"></div>' +
      '<div class="form-group"><label class="form-label">Data Fim</label><input type="date" class="form-input" id="camp-fim" value="' + (v.data_fim || '') + '"></div>' +
      '<div class="form-group"><label class="form-label">Status</label><select class="form-select" id="camp-status">' + ui.renderOptions(CONFIG.STATUS_CAMPANHA, v.status || 'Planejamento') + '</select></div>' +
      '<div class="form-group full"><label class="form-label">Observacoes</label><textarea class="form-textarea" id="camp-obs" rows="3">' + ui.escHtml(v.observacoes || '') + '</textarea></div>' +
      '</div></div><div class="modal-footer"><button class="btn btn-outline" onclick="ui.fecharModal(\'modal-campanha\')">Cancelar</button><button class="btn btn-primary" onclick="app.salvarCampanha()">Salvar</button></div></div></div>';
  },

  abrirFormCampanha(id) {
    this.editItem.campanha = id ? this.getTable('campanhas').find(function(c) { return c.id === id; }) : null;
    var self = this;
    setTimeout(function() {
      var v = self.editItem.campanha || {};
      document.getElementById('camp-nome').value = v.nome || '';
      document.getElementById('camp-desc').value = v.descricao || '';
      document.getElementById('camp-tipo').value = v.tipo || '';
      document.getElementById('camp-area').value = v.area_atuacao || '';
      document.getElementById('camp-meta').value = v.meta != null ? v.meta : '';
      document.getElementById('camp-arr').value = v.arrecadado != null ? v.arrecadado : '';
      document.getElementById('camp-inicio').value = v.data_inicio || '';
      document.getElementById('camp-fim').value = v.data_fim || '';
      document.getElementById('camp-status').value = v.status || 'Planejamento';
      document.getElementById('camp-obs').value = v.observacoes || '';
      ui.abrirModal('modal-campanha');
    }, 0);
  },

  editarCampanha(id) { this.abrirFormCampanha(id); },

  salvarCampanha() {
    var campanhas = this.getTable('campanhas');
    var v = this.editItem.campanha || {};
    var obj = { id: v.id || ui.nextId(), nome: document.getElementById('camp-nome').value.trim(), descricao: document.getElementById('camp-desc').value,
      tipo: document.getElementById('camp-tipo').value, area_atuacao: document.getElementById('camp-area').value,
      meta: parseFloat(document.getElementById('camp-meta').value) || 0, arrecadado: parseFloat(document.getElementById('camp-arr').value) || 0,
      data_inicio: document.getElementById('camp-inicio').value, data_fim: document.getElementById('camp-fim').value,
      status: document.getElementById('camp-status').value, observacoes: document.getElementById('camp-obs').value,
      criado_em: v.criado_em || ui.today() };
    if (!obj.nome) { ui.toast('Nome obrigatorio', 'error'); return; }
    var self = this;
    if (v.id) { var idx = campanhas.findIndex(function(c) { return c.id === obj.id; }); if (idx >= 0) campanhas[idx] = obj; }
    else { campanhas.push(obj); }
    db.setTable('campanhas', campanhas).then(function() {
      self.cacheData.campanhas = campanhas; ui.fecharModal('modal-campanha');
      ui.toast(v.id ? 'Atualizada!' : 'Cadastrada!'); self.editItem.campanha = null; self.render(); self.enviarTabela('campanhas');
    });
  },

  deletarCampanha(id) {
    var self = this;
    ui.confirm('Excluir', 'Tem certeza?', function() {
      var campanhas = self.getTable('campanhas').filter(function(c) { return c.id !== id; });
      db.setTable('campanhas', campanhas).then(async function() {
        self.cacheData.campanhas = campanhas; await db.addDeletedId('campanhas', id);
        if (window.supabaseClient) { try { var res = await window.supabaseClient.from('campanhas').delete().eq('id', id); if (res.error) throw res.error; } catch(e) { ui.toast('Erro: ' + e.message, 'error'); } }
        ui.toast('Removida'); self.render(); self.enviarTabela('campanhas');
      });
    });
  },

  /* ========== VOLUNTARIOS (Leads + Kanban) ========== */
  renderVoluntarios() {
    var ps = this.pageState.voluntarios || {};
    var selStatus = ps.status || '';
    var statusOpts = ['', 'Ativo', 'Disponivel', 'Indisponivel', 'Inativo'].map(function(s) {
      return '<option value="' + s + '"' + (selStatus === s ? ' selected' : '') + '>' + (s || 'Todos') + '</option>';
    }).join('');
    var filterHtml = '<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:12px;padding:8px 12px;background:var(--gray-100);border-radius:8px">' +
      '<span style="font-size:12px;color:var(--text-muted)">Filtrar:</span>' +
      '<select onchange="app.pageState.voluntarios=app.pageState.voluntarios||{};app.pageState.voluntarios.status=this.value;app.render()" style="padding:4px 8px;border:1px solid var(--border);border-radius:6px;font-size:13px">' + statusOpts + '</select>' +
      (selStatus ? '<button class="btn btn-xs btn-outline" onclick="app.pageState.voluntarios={};app.render()">Limpar</button>' : '') + '</div>';
    var data = this.getTable('voluntarios');
    if (selStatus) data = data.filter(function(v) { return v.status === selStatus; });
    window._voluntariosFiltered = data;
    return filterHtml + '<div id="voluntarios-view" data-mode="list">' + this._renderVoluntariosList() + '</div>';
  },

  toggleVoluntariosView() {
    var view = document.getElementById('voluntarios-view');
    if (view.getAttribute('data-mode') === 'kanban') {
      view.setAttribute('data-mode', 'list'); view.innerHTML = this._renderVoluntariosList();
    } else {
      view.setAttribute('data-mode', 'kanban'); view.innerHTML = this._renderVoluntariosKanban();
    }
  },

  _renderVoluntariosList() {
    return this.createCRUD({
      title: 'voluntarios', data: function() { return window._voluntariosFiltered || app.getTable('voluntarios'); },
      columns: [
        { label: 'Nome', field: 'nome' }, { label: 'Telefone', field: 'telefone' },
        { label: 'Area Interesse', field: 'area_interesse' }, { label: 'Profissao', field: 'profissao' },
        { label: 'Disponibilidade', field: 'disponibilidade' },
        { label: 'Status', render: function(v) { return ui.statusBadge(v.status || 'Disponivel'); } }
      ],
      searchFields: ['nome', 'telefone', 'email', 'area_interesse', 'profissao'],
      modalHtml: this._modalVoluntario.bind(this),
      onAdd: 'app.abrirFormVoluntario', onEdit: 'app.editarVoluntario', onDelete: 'app.deletarVoluntario',
      extraBtns: function() { return '<button class="btn btn-outline btn-sm" onclick="app.toggleVoluntariosView()">Kanban</button>'; }
    });
  },

  _renderVoluntariosKanban() {
    var data = window._voluntariosFiltered || this.getTable('voluntarios');
    var stages = ['Disponivel', 'Ativo', 'Indisponivel', 'Inativo'];
    var colors = { 'Disponivel': 'var(--info)', 'Ativo': 'var(--success)', 'Indisponivel': 'var(--warning)', 'Inativo': 'var(--danger)' };
    var h = '<div class="kanban">';
    stages.forEach(function(stage) {
      var items = data.filter(function(v) { return v.status === stage; });
      h += '<div class="kanban-col"><div class="kanban-col-header" style="border-top:3px solid ' + colors[stage] + '">' + ui.escHtml(stage) + ' <span>' + items.length + '</span></div>';
      items.forEach(function(v) {
        h += '<div class="kanban-card" onclick="app.editarVoluntario(\'' + v.id + '\')"><div class="kanban-card-title">' + ui.escHtml(v.nome) + '</div>' +
          '<div class="kanban-card-sub">' + ui.escHtml(v.area_interesse || '') + '</div>' + (v.telefone ? '<div class="kanban-card-sub">&#x1F4DE; ' + ui.escHtml(v.telefone) + '</div>' : '') + '</div>';
      });
      h += '</div>';
    });
    return h + '</div>';
  },

  _modalVoluntario() {
    var v = this.editItem.voluntario || {};
    return '<div id="modal-voluntario" class="modal-overlay"><div class="modal"><div class="modal-header"><div class="modal-title">' + (v.id ? 'Editar' : 'Novo') + ' Voluntario</div><button class="modal-close" onclick="ui.fecharModal(\'modal-voluntario\')">&times;</button></div>' +
      '<div class="modal-body"><div class="form-grid">' +
      '<div class="form-group full"><label class="form-label required">Nome</label><input class="form-input" id="vol-nome" value="' + ui.escHtml(v.nome || '') + '"></div>' +
      '<div class="form-group"><label class="form-label">Telefone</label><input class="form-input" id="vol-tel" value="' + ui.escHtml(v.telefone || '') + '"></div>' +
      '<div class="form-group"><label class="form-label">WhatsApp</label><input class="form-input" id="vol-wpp" value="' + ui.escHtml(v.whatsapp || '') + '"></div>' +
      '<div class="form-group"><label class="form-label">E-mail</label><input class="form-input" id="vol-email" value="' + ui.escHtml(v.email || '') + '"></div>' +
      '<div class="form-group"><label class="form-label">Area Interesse</label><select class="form-select" id="vol-area"><option value="">Selecione</option>' + ui.renderOptions(CONFIG.AREAS_ATUACAO, v.area_interesse || '') + '</select></div>' +
      '<div class="form-group"><label class="form-label">Disponibilidade</label><input class="form-input" id="vol-disp" value="' + ui.escHtml(v.disponibilidade || '') + '" placeholder="Ex: fins de semana"></div>' +
      '<div class="form-group"><label class="form-label">Profissao</label><input class="form-input" id="vol-prof" value="' + ui.escHtml(v.profissao || '') + '"></div>' +
      '<div class="form-group"><label class="form-label">Status</label><select class="form-select" id="vol-status">' + ui.renderOptions(CONFIG.STATUS_VOLUNTARIO, v.status || 'Disponivel') + '</select></div>' +
      '<div class="form-group full"><label class="form-label">Observacoes</label><textarea class="form-textarea" id="vol-obs" rows="3">' + ui.escHtml(v.observacoes || '') + '</textarea></div>' +
      '</div></div><div class="modal-footer"><button class="btn btn-outline" onclick="ui.fecharModal(\'modal-voluntario\')">Cancelar</button><button class="btn btn-primary" onclick="app.salvarVoluntario()">Salvar</button></div></div></div>';
  },

  abrirFormVoluntario(id) {
    this.editItem.voluntario = id ? this.getTable('voluntarios').find(function(v) { return v.id === id; }) : null;
    var self = this;
    setTimeout(function() {
      var v = self.editItem.voluntario || {};
      document.getElementById('vol-nome').value = v.nome || '';
      document.getElementById('vol-tel').value = v.telefone || '';
      document.getElementById('vol-wpp').value = v.whatsapp || '';
      document.getElementById('vol-email').value = v.email || '';
      document.getElementById('vol-area').value = v.area_interesse || '';
      document.getElementById('vol-disp').value = v.disponibilidade || '';
      document.getElementById('vol-prof').value = v.profissao || '';
      document.getElementById('vol-status').value = v.status || 'Disponivel';
      document.getElementById('vol-obs').value = v.observacoes || '';
      ui.abrirModal('modal-voluntario');
    }, 0);
  },

  editarVoluntario(id) { this.abrirFormVoluntario(id); },

  salvarVoluntario() {
    var voluntarios = this.getTable('voluntarios');
    var v = this.editItem.voluntario || {};
    var obj = { id: v.id || ui.nextId(), nome: document.getElementById('vol-nome').value.trim(), telefone: document.getElementById('vol-tel').value,
      whatsapp: document.getElementById('vol-wpp').value, email: document.getElementById('vol-email').value,
      area_interesse: document.getElementById('vol-area').value, disponibilidade: document.getElementById('vol-disp').value,
      profissao: document.getElementById('vol-prof').value, status: document.getElementById('vol-status').value,
      observacoes: document.getElementById('vol-obs').value, criado_em: v.criado_em || ui.today() };
    if (!obj.nome) { ui.toast('Nome obrigatorio', 'error'); return; }
    var self = this;
    if (v.id) { var idx = voluntarios.findIndex(function(vo) { return vo.id === obj.id; }); if (idx >= 0) voluntarios[idx] = obj; }
    else { voluntarios.push(obj); }
    db.setTable('voluntarios', voluntarios).then(function() {
      self.cacheData.voluntarios = voluntarios; ui.fecharModal('modal-voluntario');
      ui.toast(v.id ? 'Atualizado!' : 'Cadastrado!'); self.editItem.voluntario = null; self.render();
      self.updateBadges(); self.enviarTabela('voluntarios');
    });
  },

  deletarVoluntario(id) {
    var self = this;
    ui.confirm('Excluir', 'Tem certeza?', function() {
      var voluntarios = self.getTable('voluntarios').filter(function(v) { return v.id !== id; });
      db.setTable('voluntarios', voluntarios).then(async function() {
        self.cacheData.voluntarios = voluntarios; await db.addDeletedId('voluntarios', id);
        if (window.supabaseClient) { try { var res = await window.supabaseClient.from('voluntarios').delete().eq('id', id); if (res.error) throw res.error; } catch(e) { ui.toast('Erro: ' + e.message, 'error'); } }
        ui.toast('Removido'); self.render(); self.enviarTabela('voluntarios');
      });
    });
  }
});

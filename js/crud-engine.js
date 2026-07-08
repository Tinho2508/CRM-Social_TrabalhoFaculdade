/* CRUD Engine - generic filter, pagination, bulk operations */

app = Object.assign(app, {

  crudFilter(key) {
    try {
      var cfg = this.CRUD_REG[key];
      if (!cfg) return;
      var searchEl = document.getElementById(cfg.searchId);
      var search = searchEl ? searchEl.value.toLowerCase().trim() : '';
      var items = cfg.data();
      var filtered = search ? items.filter(function(item) {
        return cfg.searchFields.some(function(f) { return ((item[f] || '') + '').toLowerCase().indexOf(search) >= 0; });
      }) : items;
      if (this.searchTimeout) clearTimeout(this.searchTimeout);
      var self = this;
      this.searchTimeout = setTimeout(function() {
        self.pageState[self.currentPage] = self.pageState[self.currentPage] || { page: 1 };
        self.pageState[self.currentPage].page = 1;
        self._crudRenderRows(key, filtered);
      }, 250);
    } catch(e) { console.error('crudFilter error:', e); }
  },

  crudGoPage(key, pageNum) {
    var cfg = this.CRUD_REG[key];
    if (!cfg) return;
    var searchEl = document.getElementById(cfg.searchId);
    var search = searchEl ? searchEl.value.toLowerCase().trim() : '';
    var items = cfg.data();
    var filtered = search ? items.filter(function(item) {
      return cfg.searchFields.some(function(f) { return ((item[f] || '') + '').toLowerCase().indexOf(search) >= 0; });
    }) : items;
    this.pageState[this.currentPage].page = pageNum;
    this._crudRenderRows(key, filtered);
  },

  _crudRenderRows(key, rows) {
    try {
      var cfg = this.CRUD_REG[key];
      if (!cfg) return;
      var ps = this.pageState[this.currentPage] || { page: 1 };
      var page = ps.page || 1;
      var tbody = document.getElementById(cfg.tbodyId);
      if (!tbody) return;
      var totalPages = Math.max(1, Math.ceil(rows.length / CONFIG.PAGE_SIZE));
      page = Math.min(page, totalPages);
      var start = (page - 1) * CONFIG.PAGE_SIZE;
      var pageRows = rows.slice(start, start + CONFIG.PAGE_SIZE);

      if (!pageRows.length) {
        tbody.innerHTML = '<tr><td colspan="' + (cfg.columns.length + 2) + '" style="text-align:center;padding:24px;color:var(--text-muted)">Nenhum registro</td></tr>';
        var pagEl = document.getElementById(cfg.pagId);
        if (pagEl) pagEl.innerHTML = '';
        return;
      }

      var html = '';
      var sel = this._getSelectedIds(key);
      for (var i = 0; i < pageRows.length; i++) {
        try {
          var item = pageRows[i];
          var cells = '<td><input type="checkbox" class="bulk-cb" data-key="' + key + '" data-id="' + item.id + '"' +
            (sel.indexOf(item.id) >= 0 ? ' checked' : '') + ' onchange="app._toggleSelect(\'' + key + '\',\'' + item.id + '\',this.checked)"></td>';
          for (var j = 0; j < cfg.columns.length; j++) {
            var col = cfg.columns[j];
            cells += '<td>' + (col.render ? col.render(item) : ui.escHtml(item[col.field] || '\u2014')) + '</td>';
          }
          cells += '<td style="white-space:nowrap">' +
            '<button class="btn btn-xs btn-outline" onclick="' + cfg.onEdit + '(\'' + item.id + '\')">&#x270F;</button> ' +
            '<button class="btn btn-xs btn-danger" onclick="' + cfg.onDelete + '(\'' + item.id + '\')">&#x1F5D1;</button></td>';
          html += '<tr>' + cells + '</tr>';
        } catch(ri) { console.error('Row render error:', ri); }
      }
      tbody.innerHTML = html;
      this._renderPagination(cfg, rows.length, totalPages, page);
      this._updateBulkBar(key);
    } catch(e) { console.error('crudRenderRows error:', e); }
  },

  _renderPagination(cfg, total, totalPages, cur) {
    var pagEl = document.getElementById(cfg.pagId);
    if (!pagEl) return;
    if (totalPages <= 1) {
      pagEl.innerHTML = '<div style="text-align:center;padding:12px;font-size:12px;color:var(--text-muted)">' + total + ' registros</div>';
      return;
    }
    var h = '<div class="pagination"><span style="font-size:12px;color:var(--text-muted);margin-right:8px">Pagina ' + cur + ' de ' + totalPages + '</span>' +
      '<button class="page-btn"' + (cur <= 1 ? ' disabled' : '') + ' onclick="app.crudGoPage(\'' + cfg.key + '\',' + (cur - 1) + ')">&laquo;</button>';
    var maxShow = 5;
    var s = Math.max(1, cur - 2);
    var e = Math.min(totalPages, s + maxShow - 1);
    s = Math.max(1, e - maxShow + 1);
    if (s > 1) {
      h += '<button class="page-btn" onclick="app.crudGoPage(\'' + cfg.key + '\',1)">1</button>';
      if (s > 2) h += '<span style="padding:0 4px;color:var(--text-muted)">...</span>';
    }
    for (var p = s; p <= e; p++) {
      h += '<button class="page-btn' + (p === cur ? ' active' : '') + '" onclick="app.crudGoPage(\'' + cfg.key + '\',' + p + ')">' + p + '</button>';
    }
    if (e < totalPages) {
      if (e < totalPages - 1) h += '<span style="padding:0 4px;color:var(--text-muted)">...</span>';
      h += '<button class="page-btn" onclick="app.crudGoPage(\'' + cfg.key + '\',' + totalPages + ')">' + totalPages + '</button>';
    }
    h += '<button class="page-btn"' + (cur >= totalPages ? ' disabled' : '') + ' onclick="app.crudGoPage(\'' + cfg.key + '\',' + (cur + 1) + ')">&raquo;</button>';
    h += '<span style="font-size:11px;color:var(--text-muted);margin-left:8px">' + total + ' registros</span></div>';
    pagEl.innerHTML = h;
  },

  _getSelectedIds(key) { return this.pageState[key + '_sel'] || []; },

  _toggleSelect(key, id, checked) {
    var sel = this.pageState[key + '_sel'] || [];
    if (checked) { if (sel.indexOf(id) < 0) sel.push(id); }
    else { var idx = sel.indexOf(id); if (idx >= 0) sel.splice(idx, 1); }
    this.pageState[key + '_sel'] = sel;
    this._updateBulkBar(key);
  },

  _updateBulkBar(key) {
    var bar = document.getElementById('bulk-bar-' + key);
    if (!bar) return;
    var sel = this.pageState[key + '_sel'] || [];
    if (sel.length > 0) { bar.classList.add('active'); bar.querySelector('.bulk-count').textContent = sel.length + ' selecionados'; }
    else { bar.classList.remove('active'); }
  },

  bulkDelete(key) {
    var cfg = this.CRUD_REG[key];
    if (!cfg) return;
    var sel = this.pageState[key + '_sel'] || [];
    if (!sel.length) return;
    var self = this;
    ui.confirm('Excluir ' + sel.length + ' registros?', 'Esta acao nao pode ser desfeita.', function() {
      var items = cfg.data();
      items = items.filter(function(item) { return sel.indexOf(item.id) < 0; });
      db.setTable(key, items).then(async function() {
        self.cacheData[key] = items;
        for (var di = 0; di < sel.length; di++) { await db.addDeletedId(key, sel[di]); }
        if (window.supabaseClient) {
          try { var res = await window.supabaseClient.from(key).delete().in('id', sel); if (res.error) throw res.error; }
          catch(e) { ui.toast('Erro ao excluir do servidor: ' + e.message, 'error'); console.error(e); }
        }
        self.render(); self.updateBadges();
      });
      self.pageState[key + '_sel'] = [];
      ui.toast(sel.length + ' removidos!');
    });
  },

  selectAll(key, checked) {
    var cfg = this.CRUD_REG[key];
    if (!cfg) return;
    var searchEl = document.getElementById(cfg.searchId);
    var search = searchEl ? searchEl.value.toLowerCase().trim() : '';
    var items = cfg.data();
    var filtered = search ? items.filter(function(item) {
      return cfg.searchFields.some(function(f) { return ((item[f] || '') + '').toLowerCase().indexOf(search) >= 0; });
    }) : items;
    if (checked) {
      var ids = [];
      for (var i = 0; i < filtered.length; i++) ids.push(filtered[i].id);
      this.pageState[key + '_sel'] = ids;
    } else { this.pageState[key + '_sel'] = []; }
    var cbs = document.querySelectorAll('.bulk-cb[data-key="' + key + '"]');
    for (var i = 0; i < cbs.length; i++) cbs[i].checked = checked;
    this._updateBulkBar(key);
  },

  createCRUD(cfg) {
    var title = cfg.title;
    var data = cfg.data;
    var columns = cfg.columns;
    var searchFields = cfg.searchFields;
    var modalHtml = cfg.modalHtml;
    var onEdit = cfg.onEdit;
    var onDelete = cfg.onDelete;
    var extraBtns = cfg.extraBtns;
    var key = title.toLowerCase();
    var searchId = 'search-' + key;
    var tbodyId = key + '-tbody';
    var pagId = key + '-pag';
    var ps = this.pageState[this.currentPage] || { page: 1 };
    var search = (ps.search || '').toLowerCase();
    var dataList = data();
    var filtered = search ? dataList.filter(function(item) {
      return searchFields.some(function(f) { return ((item[f] || '') + '').toLowerCase().indexOf(search) >= 0; });
    }) : dataList;
    var totalPages = Math.max(1, Math.ceil(filtered.length / CONFIG.PAGE_SIZE));
    var page = Math.min(ps.page || 1, totalPages);
    var pageRows = filtered.slice((page - 1) * CONFIG.PAGE_SIZE, (page - 1) * CONFIG.PAGE_SIZE + CONFIG.PAGE_SIZE);

    this.CRUD_REG[key] = { key: key, title: title, data: data, columns: columns,
      searchFields: searchFields, tbodyId: tbodyId, searchId: searchId, pagId: pagId, onEdit: onEdit, onDelete: onDelete };

    var colThs = '<th style="width:30px"><input type="checkbox" onchange="app.selectAll(\'' + key + '\',this.checked)"></th>';
    for (var j = 0; j < columns.length; j++) colThs += '<th>' + columns[j].label + '</th>';
    colThs += '<th>Acoes</th>';

    var rowsHtml = '';
    var sel = this.pageState[key + '_sel'] || [];
    if (!pageRows.length) {
      rowsHtml = '<tr><td colspan="' + (columns.length + 2) + '" style="text-align:center;padding:24px;color:var(--text-muted)">Nenhum registro</td></tr>';
    } else {
      for (var i = 0; i < pageRows.length; i++) {
        var item = pageRows[i];
        var cells = '<td><input type="checkbox" class="bulk-cb" data-key="' + key + '" data-id="' + item.id + '"' +
          (sel.indexOf(item.id) >= 0 ? ' checked' : '') + ' onchange="app._toggleSelect(\'' + key + '\',\'' + item.id + '\',this.checked)"></td>';
        for (var j = 0; j < columns.length; j++) {
          cells += '<td>' + (columns[j].render ? columns[j].render(item) : ui.escHtml(item[columns[j].field] || '\u2014')) + '</td>';
        }
        cells += '<td style="white-space:nowrap"><button class="btn btn-xs btn-outline" onclick="' + onEdit + '(\'' + item.id + '\')">&#x270F;</button> ' +
          '<button class="btn btn-xs btn-danger" onclick="' + onDelete + '(\'' + item.id + '\')">&#x1F5D1;</button></td>';
        rowsHtml += '<tr>' + cells + '</tr>';
      }
    }

    var extraH = extraBtns ? extraBtns() : '';
    var result = '<div class="bulk-bar" id="bulk-bar-' + key + '"><span class="bulk-count">0 selecionados</span>' +
      '<div style="display:flex;gap:8px"><button class="btn btn-sm" onclick="app.bulkDelete(\'' + key + '\')">&#x1F5D1; Excluir selecionados</button></div></div>' +
      '<div class="card"><div class="card-header">' +
      '<div class="search-bar"><input type="text" class="search-input" placeholder="&#x1F50D; Buscar..." id="' + searchId + '" oninput="app.crudFilter(\'' + key + '\')"></div>' +
      '<div style="display:flex;gap:8px;flex-wrap:wrap">' + extraH + '<button class="btn btn-primary" onclick="' + cfg.onAdd + '()">+ Novo</button></div></div>' +
      '<div class="table-wrapper"><table><thead><tr>' + colThs + '</tr></thead><tbody id="' + tbodyId + '">' + rowsHtml + '</tbody></table></div></div>' +
      (totalPages > 1
        ? '<div id="' + pagId + '"></div>'
        : '<div id="' + pagId + '"><div style="text-align:center;padding:12px;font-size:12px;color:var(--text-muted)">' + filtered.length + ' registros</div></div>') +
      modalHtml();
    return result;
  }
});

var ui = {

  toast(m, t) {
    t = t || 'success';
    var c = document.getElementById('toast-container');
    var el = document.createElement('div');
    el.className = 'toast toast-' + t;
    el.innerHTML = (t === 'success' ? '&#x2705;' : t === 'warning' ? '&#x26A0;&#xFE0F;' : '&#x274C;') + ' ' + m;
    c.appendChild(el);
    setTimeout(function() { el.remove(); }, 3500);
  },

  confirm(title, msg, cb) {
    document.getElementById('confirm-title').textContent = title;
    document.getElementById('confirm-msg').textContent = msg;
    document.getElementById('confirm-overlay').classList.add('open');
    document.getElementById('confirm-yes').onclick = function() {
      document.getElementById('confirm-overlay').classList.remove('open');
      if (cb) cb();
    };
  },

  closeConfirm() {
    document.getElementById('confirm-overlay').classList.remove('open');
  },

  abrirModal(id) {
    document.getElementById(id).classList.add('open');
  },

  fecharModal(id) {
    document.getElementById(id).classList.remove('open');
  },

  fmtBRL(v) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(v) || 0);
  },

  fmtDate(d) {
    if (!d) return '\u2014';
    try { return new Date(d + 'T00:00:00').toLocaleDateString('pt-BR'); } catch(e) { return d; }
  },

  today() {
    return new Date().toISOString().split('T')[0];
  },

  nextId() {
    return crypto.randomUUID ? crypto.randomUUID() : ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, function(c) {
      var r = Math.random() * 16 | 0;
      return (c == "8" ? r & 3 | 8 : r).toString(16);
    });
  },

  escHtml(s) {
    var div = document.createElement('div');
    div.textContent = s || '';
    return div.innerHTML;
  },

  escJs(s) {
    return (s || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/"/g, '&quot;');
  },

  normalizar(s) {
    return s.toString().toLowerCase()
      .replace(/[\u00E1\u00E0\u00E3\u00E2\u00E4]/g, 'a')
      .replace(/[\u00E9\u00E8\u00EA\u00EB]/g, 'e')
      .replace(/[\u00ED\u00EC\u00EE\u00EF]/g, 'i')
      .replace(/[\u00F3\u00F2\u00F5\u00F4\u00F6]/g, 'o')
      .replace(/[\u00FA\u00F9\u00FB\u00FC]/g, 'u')
      .replace(/\u00E7/g, 'c')
      .replace(/[^a-z0-9 ]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  },

  daysUntil(date) {
    if (!date) return 9999;
    var diff = new Date(date + 'T00:00:00') - new Date();
    return Math.ceil(diff / 86400000);
  },

  toDateYM(d) {
    if (!d) return '';
    if (d instanceof Date) {
      if (isNaN(d.getTime())) return '';
      return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
    }
    var s = (d || '').toString().trim();
    if (!s) return '';
    var v = parseFloat(s);
    if (!isNaN(v) && v > 20000 && v < 70000) {
      var ep = new Date(1899, 11, 30);
      var dt = new Date(ep.getTime() + v * 86400000);
      if (!isNaN(dt.getTime())) return dt.getFullYear() + '-' + String(dt.getMonth() + 1).padStart(2, '0');
    }
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s.substring(0, 7);
    if (/^\d{4}-\d{2}$/.test(s)) return s;
    if (/^\d{1,2}[\\/]\d{1,2}[\\/]\d{4}$/.test(s)) {
      var pt = s.split(/[/\\/]/);
      return pt[2] + '-' + String(parseInt(pt[1])).padStart(2, '0');
    }
    if (/^\d{4}$/.test(s)) return s;
    return s.substring(0, 7);
  },

  dateMatchesYM(dateVal, yr, mo) {
    if (!dateVal) return false;
    if (dateVal instanceof Date) {
      var dy = String(dateVal.getFullYear());
      var dm = String(dateVal.getMonth() + 1).padStart(2, '0');
      return dy === yr && (!mo || dm === mo);
    }
    var s = (dateVal || '').toString().trim();
    if (!s) return false;
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
      var ds = s.split('-');
      if (ds[0] === yr && (!mo || ds[1] === mo)) return true;
    }
    if (/^\d{1,2}[\\/]\d{1,2}[\\/]\d{4}$/.test(s)) {
      var pt = s.split(/[/\\]/);
      var yy = pt[pt.length - 1];
      var mm = String(parseInt(pt[1])).padStart(2, '0');
      if (yy === yr && (!mo || mm === mo)) return true;
    }
    if (/^\d{1,2}[\\/]\d{4}$/.test(s)) {
      var pt2 = s.split(/[/\\]/);
      if (pt2[pt2.length - 1] === yr && (!mo || String(parseInt(pt2[0])).padStart(2, '0') === mo)) return true;
    }
    if (/^\d{4}-\d{2}$/.test(s)) {
      var ds2 = s.split('-');
      if (ds2[0] === yr && (!mo || ds2[1] === mo)) return true;
    }
    if (/^\d{4}$/.test(s) && s === yr && !mo) return true;
    return false;
  },

  statusBadge(s, map) {
    map = map || {};
    var m = Object.assign({
      'Ativa': 'success', 'Ativo': 'success', 'Recebida': 'success',
      'Confirmada': 'success', 'Realizado': 'success', 'Realizada': 'success',
      'Resolvida': 'success', 'Resolvido': 'success', 'Pago': 'success',
      'Ativa': 'success', 'Encerrada': 'neutral', 'Inativo': 'neutral',
      'Inativa': 'neutral', 'Indisponivel': 'neutral', 'Cancelada': 'neutral',
      'Cancelado': 'neutral', 'Desligada': 'neutral', 'Arquivada': 'neutral',
      'Pendente': 'warning', 'Planejamento': 'info', 'Em Analise': 'info',
      'Registrada': 'info', 'Agendado': 'info', 'Disponivel': 'info',
      'Em Andamento': 'warning', 'Em Acompanhamento': 'warning',
      'Andamento': 'warning', 'Perdido': 'danger', 'Recusada': 'danger',
      'Suspensa': 'warning'
    }, map);
    return '<span class="badge badge-' + (m[s] || 'neutral') + '">' + ui.escHtml(s) + '</span>';
  },

  mergeData(local, remote) {
    var map = {};
    local.forEach(function(item) { if (item && item.id) map[item.id] = item; });
    remote.forEach(function(item) { if (item && item.id) map[item.id] = item; });
    return Object.keys(map).map(function(k) { return map[k]; });
  },

  deduplicateRecords(table, data) {
    var seen = {};
    var unique = [];
    var keyMap = {
      familias: 'nome',
      doacoes: 'familia',
      campanhas: 'nome',
      voluntarios: 'nome',
      captacao: 'doador',
      ocorrencias: 'familia'
    };
    var key = keyMap[table] || null;
    if (!key) return data;
    for (var i = 0; i < data.length; i++) {
      var item = data[i];
      var val = item[key];
      if (!val || !val.toString().trim()) { unique.push(item); continue; }
      var cleanVal = val.toString().trim().toLowerCase();
      if (!seen[cleanVal]) {
        seen[cleanVal] = item;
        unique.push(item);
      } else {
        var existing = seen[cleanVal];
        if (item.criado_em && (!existing.criado_em || item.criado_em >= existing.criado_em)) {
          var idx = unique.indexOf(existing);
          if (idx >= 0) unique[idx] = item;
          seen[cleanVal] = item;
        }
      }
    }
    return unique;
  },

  sanitizeRow(o) {
    var clean = {};
    for (var k in o) {
      if (!o.hasOwnProperty(k)) continue;
      var v = o[k];
      if (v === '' && (k.indexOf('data') >= 0 || k.indexOf('vcto') >= 0 || k.indexOf('vig') >= 0 ||
          k.indexOf('emissao') >= 0 || k.indexOf('criado') >= 0 || k.indexOf('dt') >= 0 ||
          k.indexOf('updated') >= 0 || k.indexOf('venc') >= 0 || k.indexOf('inicio') >= 0 ||
          k.indexOf('fim') >= 0)) v = null;
      clean[k] = v;
    }
    return clean;
  },

  renderOptions(arr, selected) {
    return arr.map(function(o) {
      var v = typeof o === 'object' ? o.v : o;
      var l = typeof o === 'object' ? o.l : o;
      return '<option value="' + v + '"' + (selected === v ? ' selected' : '') + '>' + l + '</option>';
    }).join('');
  }
};

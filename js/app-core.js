var app = {
  currentPage: 'dashboard',
  editItem: {},
  cacheData: {},
  searchTimeout: null,
  _realtimeChannel: null,
  pageState: {},
  CRUD_REG: {},

  async refreshCache() {
    for (var i = 0; i < CONFIG.TABELAS.length; i++)
      this.cacheData[CONFIG.TABELAS[i]] = await db.getAll(CONFIG.TABELAS[i]);
  },

  getTable(t) { return this.cacheData[t] || []; },

  /* Dark mode */
  toggleDark() {
    document.body.classList.toggle('dark');
    try { localStorage.setItem('crm_ong_dark', document.body.classList.contains('dark') ? '1' : '0'); } catch(e) {}
  },

  loadDark() {
    try { if (localStorage.getItem('crm_ong_dark') === '1') document.body.classList.add('dark'); } catch(e) {}
  },

  /* Config */
  showConfig() {
    document.getElementById('cfg-supa-url').value = localStorage.getItem('supa_url') || '';
    document.getElementById('cfg-supa-key').value = localStorage.getItem('supa_key') || '';
    ui.abrirModal('modal-config');
  },

  salvarConfig() {
    localStorage.setItem('supa_url', document.getElementById('cfg-supa-url').value.trim());
    localStorage.setItem('supa_key', document.getElementById('cfg-supa-key').value.trim());
    CONFIG.SUPABASE_URL = localStorage.getItem('supa_url');
    CONFIG.SUPABASE_ANON_KEY = localStorage.getItem('supa_key');
    ui.fecharModal('modal-config');
    ui.toast('Chaves salvas com sucesso!');
  },

  /* Login */
  async fazerLogin() {
    var email = document.getElementById('login-email').value.trim();
    var senha = document.getElementById('login-senha').value;
    var errDiv = document.getElementById('login-error');
    if (!email || !senha) { errDiv.style.display = 'block'; errDiv.textContent = 'Preencha e-mail e senha'; return; }
    errDiv.style.display = 'block'; errDiv.textContent = 'Conectando...';
    try {
      var u = localStorage.getItem('supa_url') || CONFIG.SUPABASE_URL;
      var k = localStorage.getItem('supa_key') || CONFIG.SUPABASE_ANON_KEY;
      var client = supabase.createClient(u, k);
      var res = await client.auth.signInWithPassword({ email: email, password: senha });
      if (res.error) throw res.error;
      window.supabaseClient = client;
      await this.entrarApp();
    } catch(err) {
      errDiv.style.display = 'block';
      errDiv.textContent = err.message && err.message.indexOf('Invalid') >= 0 ? 'E-mail ou senha incorretos' : err.message;
    }
  },

  modoOffline() { this.entrarApp(); },

  async entrarApp() {
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('app').style.display = 'flex';
    await this.refreshCache();
    if (window.supabaseClient) {
      await this.sincronizar();
      ui.toast('Dados sincronizados!');
      this.render();
      this.updateBadges();
      this.iniciarRealtime();
    } else {
      ui.toast('Sistema carregado!');
      this.render();
      this.updateBadges();
    }
  },

  fazerLogout() {
    if (window.supabaseClient) window.supabaseClient.auth.signOut();
    document.getElementById('login-screen').style.display = 'flex';
    document.getElementById('app').style.display = 'none';
  }
};

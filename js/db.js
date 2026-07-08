var db = {
  _db: null,
  _ready: false,
  _queue: [],

  init() {
    var self = this;
    return new Promise(function(res, rej) {
      var r = indexedDB.open(CONFIG.DB_NAME, CONFIG.DB_VERSION);
      r.onupgradeneeded = function(e) {
        var d = e.target.result;
        CONFIG.TABELAS.forEach(function(t) {
          if (!d.objectStoreNames.contains(t))
            d.createObjectStore(t, { keyPath: 'id' });
        });
        if (!d.objectStoreNames.contains('deleted_ids'))
          d.createObjectStore('deleted_ids', { keyPath: 'id' });
      };
      r.onsuccess = function(e) {
        self._db = e.target.result;
        self._ready = true;
        while (self._queue.length) self._queue.shift()();
        res();
      };
      r.onerror = function(e) { rej(e.target.error); };
    });
  },

  getAll(table) {
    var self = this;
    return new Promise(function(res) {
      if (!self._ready) {
        self._queue.push(function() { self.getAll(table).then(res); });
        return;
      }
      try {
        var tx = self._db.transaction(table, 'readonly');
        var store = tx.objectStore(table);
        var req = store.getAll();
        req.onsuccess = function() { res(req.result || []); };
        req.onerror = function() { res([]); };
      } catch(e) { res([]); }
    });
  },

  setTable(table, data) {
    var self = this;
    return new Promise(function(res, rej) {
      if (!self._ready) {
        self._queue.push(function() { self.setTable(table, data).then(res); });
        return;
      }
      try {
        var tx = self._db.transaction(table, 'readwrite');
        var store = tx.objectStore(table);
        store.clear();
        data.forEach(function(item) { store.put(item); });
        tx.oncomplete = function() { res(); };
      } catch(e) {
        if (e.name === 'InvalidStateError') {
          self._ready = false;
          self._db = null;
          self.init().then(function() { self.setTable(table, data).then(res); });
        } else { rej(e); }
      }
    });
  },

  bulkPut(table, items) {
    var self = this;
    return new Promise(function(res, rej) {
      if (!self._ready) {
        self._queue.push(function() { self.bulkPut(table, items).then(res); });
        return;
      }
      try {
        var tx = self._db.transaction(table, 'readwrite');
        var store = tx.objectStore(table);
        items.forEach(function(item) { store.put(item); });
        tx.oncomplete = function() { res(); };
      } catch(e) {
        if (e.name === 'InvalidStateError') {
          self._ready = false;
          self._db = null;
          self.init().then(function() { self.bulkPut(table, items).then(res); });
        } else { rej(e); }
      }
    });
  },

  addDeletedId(table, id) {
    var self = this;
    return new Promise(function(res) {
      if (!self._ready) {
        self._queue.push(function() { self.addDeletedId(table, id).then(res); });
        return;
      }
      try {
        var tx = self._db.transaction('deleted_ids', 'readwrite');
        tx.objectStore('deleted_ids').put({ id: id, table: table, deleted_at: new Date().toISOString() });
        tx.oncomplete = function() { res(); };
      } catch(e) { res(); }
    });
  },

  getDeletedIds() {
    var self = this;
    return new Promise(function(res) {
      if (!self._ready) {
        self._queue.push(function() { self.getDeletedIds().then(res); });
        return;
      }
      try {
        var tx = self._db.transaction('deleted_ids', 'readonly');
        var req = tx.objectStore('deleted_ids').getAll();
        req.onsuccess = function() { res(req.result || []); };
        req.onerror = function() { res([]); };
      } catch(e) { res([]); }
    });
  },

  clearDeletedIds() {
    var self = this;
    return new Promise(function(res) {
      if (!self._ready) {
        self._queue.push(function() { self.clearDeletedIds().then(res); });
        return;
      }
      try {
        var tx = self._db.transaction('deleted_ids', 'readwrite');
        tx.objectStore('deleted_ids').clear();
        tx.oncomplete = function() { res(); };
      } catch(e) { res(); }
    });
  },

  clearDeletedIdsByTable(table) {
    var self = this;
    return new Promise(function(res) {
      if (!self._ready) {
        self._queue.push(function() { self.clearDeletedIdsByTable(table).then(res); });
        return;
      }
      try {
        var tx = self._db.transaction('deleted_ids', 'readwrite');
        var store = tx.objectStore('deleted_ids');
        var req = store.getAll();
        req.onsuccess = function() {
          var all = req.result || [];
          var keep = all.filter(function(d) { return d.table !== table; });
          store.clear();
          keep.forEach(function(d) { store.put(d); });
          res();
        };
        req.onerror = function() { res(); };
      } catch(e) { res(); }
    });
  }
};

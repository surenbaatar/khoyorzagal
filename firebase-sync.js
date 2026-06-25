// ─── Firebase Real-Time Sync for Khoyor Zagal Booking System ───
// This script syncs localStorage data across all computers via Firebase.
// Include AFTER the Firebase SDK scripts and BEFORE the page's own <script>.

// ═══════════════════════════════════════════════
// PASTE YOUR FIREBASE CONFIG HERE
// ═══════════════════════════════════════════════
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyCKKwcmWN3TPy6rXBUgtja2KlCoWAuNmlY",
  authDomain: "khoyor-zagal.firebaseapp.com",
  databaseURL: "https://khoyor-zagal-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "khoyor-zagal",
  storageBucket: "khoyor-zagal.firebasestorage.app",
  messagingSenderId: "704807582308",
  appId: "1:704807582308:web:3f59737fe5a6975aeabd71"
};
// ═══════════════════════════════════════════════

// Keys to sync across computers (core data — NOT session keys)
const SYNCED_KEYS = [
  'kz_reservations',
  'kz_payments',
  'kz_companies',
  'kz_users',
  'kz_cancellations',
  'kz_credit_transfers',
  'kz_invoice_log',
  'kz_trip_status',
  'kz_trip_adjustments',
  'kz_trip_actuals',
  'kz_walkin_services',
  'kz_ws_states'
];

// Save original localStorage methods before overriding
const _origSetItem = localStorage.setItem.bind(localStorage);
const _origGetItem = localStorage.getItem.bind(localStorage);
const _origRemoveItem = localStorage.removeItem.bind(localStorage);

let _fbReady = false;
let _skipSync = new Set(); // guard against echo from own writes
let _db = null;
let _syncIndicator = null;

// ─── Sync status indicator ───
function createSyncIndicator() {
  _syncIndicator = document.createElement('div');
  _syncIndicator.id = 'fbSyncStatus';
  _syncIndicator.style.cssText = 'position:fixed;bottom:12px;right:12px;z-index:9999;font-size:11px;padding:5px 12px;border-radius:20px;background:#fef3c7;color:#92400e;display:none;align-items:center;gap:6px;box-shadow:0 2px 8px rgba(0,0,0,.15);transition:opacity .3s';
  document.body.appendChild(_syncIndicator);
}

function showSyncStatus(msg, color, duration) {
  if (!_syncIndicator) createSyncIndicator();
  _syncIndicator.textContent = msg;
  _syncIndicator.style.background = color || '#fef3c7';
  _syncIndicator.style.color = color === '#ECFDF5' ? '#065F46' : (color === '#FEE2E2' ? '#991B1B' : '#92400e');
  _syncIndicator.style.display = 'flex';
  if (duration) {
    setTimeout(() => { _syncIndicator.style.display = 'none'; }, duration);
  }
}

// ─── Initialize Firebase ───
function initFirebase() {
  if (!FIREBASE_CONFIG.apiKey || !FIREBASE_CONFIG.databaseURL) {
    console.warn('[Firebase Sync] No config found. Data will only be stored locally.');
    return Promise.resolve(false);
  }

  try {
    if (!firebase.apps.length) {
      firebase.initializeApp(FIREBASE_CONFIG);
    }
    _db = firebase.database();
    console.log('[Firebase Sync] Initialized successfully');
    return Promise.resolve(true);
  } catch (e) {
    console.error('[Firebase Sync] Init failed:', e);
    return Promise.resolve(false);
  }
}

// ─── Initial sync: pull all data from Firebase into localStorage ───
function initialSync() {
  if (!_db) return Promise.resolve();

  showSyncStatus('⟳ Syncing...', '#fef3c7');

  return _db.ref('data').once('value').then(function(snap) {
    var data = snap.val() || {};
    var updated = 0;

    SYNCED_KEYS.forEach(function(key) {
      if (data[key] !== undefined && data[key] !== null) {
        var fbVal = typeof data[key] === 'string' ? data[key] : JSON.stringify(data[key]);
        var lsVal = _origGetItem(key);
        if (fbVal !== lsVal) {
          _origSetItem(key, fbVal);
          updated++;
        }
      }
    });

    _fbReady = true;
    console.log('[Firebase Sync] Initial sync complete. Updated ' + updated + ' keys.');
    showSyncStatus('✓ Synced', '#ECFDF5', 2000);

    // Notify the page to refresh its data
    if (updated > 0 && window.onFirebaseSync) {
      window.onFirebaseSync();
    }
  }).catch(function(e) {
    console.error('[Firebase Sync] Initial sync failed:', e);
    _fbReady = true; // still allow local operation
    showSyncStatus('⚠ Offline mode', '#FEE2E2', 3000);
  });
}

// ─── Override localStorage.setItem to push changes to Firebase ───
localStorage.setItem = function(key, value) {
  // Always write locally first
  _origSetItem(key, value);

  // Push to Firebase if it's a synced key
  if (_fbReady && _db && SYNCED_KEYS.indexOf(key) !== -1) {
    _skipSync.add(key);
    _db.ref('data/' + key).set(value).then(function() {
      setTimeout(function() { _skipSync.delete(key); }, 500);
    }).catch(function(e) {
      console.error('[Firebase Sync] Push failed for ' + key + ':', e);
      _skipSync.delete(key);
    });
  }
};

// ─── Override localStorage.removeItem to also remove from Firebase ───
localStorage.removeItem = function(key) {
  _origRemoveItem(key);

  if (_fbReady && _db && SYNCED_KEYS.indexOf(key) !== -1) {
    _skipSync.add(key);
    _db.ref('data/' + key).remove().then(function() {
      setTimeout(function() { _skipSync.delete(key); }, 500);
    });
  }
};

// ─── Real-time listener: receive changes from other computers ───
function setupRealtimeSync() {
  if (!_db) return;

  SYNCED_KEYS.forEach(function(key) {
    _db.ref('data/' + key).on('value', function(snap) {
      // Skip if this change came from our own write
      if (_skipSync.has(key)) return;

      if (!snap.exists()) return;

      var fbVal = snap.val();
      // Firebase stores strings directly, objects need stringify
      var newVal = typeof fbVal === 'string' ? fbVal : JSON.stringify(fbVal);
      var oldVal = _origGetItem(key);

      if (newVal !== oldVal) {
        _origSetItem(key, newVal);
        console.log('[Firebase Sync] Received update for: ' + key);
        showSyncStatus('⟳ Updated: ' + key.replace('kz_', ''), '#ECFDF5', 2000);

        // Notify the page
        if (window.onFirebaseSync) {
          window.onFirebaseSync(key);
        }
      }
    });
  });

  console.log('[Firebase Sync] Real-time listeners active');
}

// ─── Push all current localStorage data to Firebase (first-time setup) ───
function pushAllToFirebase() {
  if (!_db) return;

  showSyncStatus('⟳ Uploading...', '#fef3c7');

  var updates = {};
  SYNCED_KEYS.forEach(function(key) {
    var val = _origGetItem(key);
    if (val) {
      updates['data/' + key] = val;
    }
  });

  return _db.ref().update(updates).then(function() {
    console.log('[Firebase Sync] All local data pushed to Firebase');
    showSyncStatus('✓ All data uploaded', '#ECFDF5', 3000);
  }).catch(function(e) {
    console.error('[Firebase Sync] Push all failed:', e);
    showSyncStatus('⚠ Upload failed', '#FEE2E2', 3000);
  });
}

// ─── Start everything ───
initFirebase().then(function(ok) {
  if (!ok) return;

  // Check if Firebase has any data
  _db.ref('data').once('value').then(function(snap) {
    if (!snap.exists() || !snap.val()) {
      // Firebase is empty — push local data up (first-time setup)
      console.log('[Firebase Sync] Firebase is empty. Pushing local data...');
      _fbReady = true;
      pushAllToFirebase().then(setupRealtimeSync);
    } else {
      // Firebase has data — pull it down
      initialSync().then(setupRealtimeSync);
    }
  });
});

// Expose utility for manual sync
window.firebasePushAll = pushAllToFirebase;
window.firebaseStatus = function() {
  return { ready: _fbReady, connected: !!_db, syncedKeys: SYNCED_KEYS };
};

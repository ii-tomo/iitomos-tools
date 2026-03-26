document.addEventListener('DOMContentLoaded', () => {

// ツールデータの定義
const toolsData = [
  {
    id: 'qr',
    name: 'QRジェネレーター',
    icon: '🔍',
    desc: '美しいQRコードと短縮URLを瞬時に作成・シェア。',
    updatedAt: '2026/03/24',
    isUnlocked: false
  },
  {
    id: 'translate',
    name: '翻訳 & プロンプト',
    icon: '🌎',
    desc: '日英連携でAI向けの完璧なプロンプトを構築。',
    updatedAt: '2026/03/24',
    isUnlocked: false
  },
  {
    id: 'image-converter',
    name: '画像コンバーター',
    icon: '🔄',
    desc: '画像をドラッグ＆ドロップで瞬時にフォーマット変換。',
    updatedAt: '2026/03/26',
    isUnlocked: false
  },
  {
    id: 'voice-pdf',
    name: 'PDF & 音声ツール',
    icon: '🎙️',
    desc: 'AI搭載のPDF翻訳・音声文字起こしツール（近日公開）。',
    isUnlocked: true
  }
];

// 初期設定：localStorageからアンロック状態を復元 (あれば)
let savedUnlocks = JSON.parse(localStorage.getItem('iitomo_unlocked_tools') || '[]');
let isPremium = localStorage.getItem('iitomo_premium_unlocked') === 'true';

if (savedUnlocks.length > 0) {
  toolsData.forEach(tool => {
    if (savedUnlocks.includes(tool.id)) {
      tool.isUnlocked = true;
    }
  });
}

// プレミアム状態なら全ツールをアンロック扱いにする
if (isPremium) {
  toolsData.forEach(tool => tool.isUnlocked = true);
}

const renderToolCards = () => {
  const container = document.getElementById('tool-cards-container');
  if(!container) return;
  container.innerHTML = '';

  toolsData.forEach(tool => {
    const card = document.createElement('div');
    card.className = `tool-card ${tool.isUnlocked ? 'unlocked' : 'locked'}`;
    card.innerHTML = `
      ${tool.isUnlocked ? '<div class="unlock-badge">ACTIVE</div>' : '<div class="lock-badge">🔒</div>'}
      <span class="tool-card-icon">${tool.icon}</span>
      <div class="tool-card-name">${tool.name}</div>
      <div class="tool-card-desc">${tool.desc}</div>
      <div class="tool-card-footer">
        <div class="tool-card-status">${tool.id === 'voice-pdf' ? 'COMING SOON' : (tool.isUnlocked ? 'UNLOCKED' : 'LOCKED')}</div>
        ${tool.updatedAt ? `<div class="tool-card-update">Updated: ${tool.updatedAt}</div>` : ''}
      </div>
    `;

    // アンロックされている場合はクリックで遷移
    if(tool.isUnlocked){
      card.addEventListener('click', () => switchView(tool.id));
    } else {
      card.addEventListener('click', () => {
        openModal();
      });
    }

    container.appendChild(card);
  });

  // 設定画面のライセンス一覧も同時に更新
  const settingsList = document.getElementById('settings-unlocked-list');
  if (settingsList) {
    settingsList.innerHTML = '';
    toolsData.filter(t => t.isUnlocked && t.id !== 'voice-pdf').forEach(t => {
      const span = document.createElement('span');
      span.className = 'badge-tool';
      span.textContent = `${t.icon} ${t.name}`;
      settingsList.appendChild(span);
    });
  }
};

// ナビゲーションとビューの切り替えロジック
const navItems = document.querySelectorAll('.nav-item[data-view]');
const viewSections = document.querySelectorAll('.view-section');

const switchView = (viewId) => {
  // すべてのビューを非表示
  viewSections.forEach(sec => sec.classList.remove('active'));
  // ターゲットのビューを表示
  const targetView = document.getElementById(`view-${viewId}`);
  if (targetView) {
    targetView.classList.add('active');
  }

  // ナビゲーションのActive状態を更新 (サイドバー・ボトムナビ両方)
  navItems.forEach(nav => {
    if (nav.dataset.view === viewId) {
      nav.classList.add('active');
    } else {
      nav.classList.remove('active');
    }
  });
};

navItems.forEach(nav => {
  nav.addEventListener('click', () => {
    switchView(nav.dataset.view);
  });
});

  // Handle messages from tool iframes (such as custom back buttons & resizes)
  window.addEventListener('message', (e) => {
    if (e.data === 'goHome') {
      switchView('dashboard');
    } else if (e.data && e.data.type === 'resize') {
      const activeIframe = document.querySelector('.view-section.active .tool-iframe');
      if (activeIframe) {
        // iframeの高さをコンテンツに合わせることで、親ポータル側でスクロールさせる
        activeIframe.parentElement.style.height = (e.data.height) + 'px';
      }
    }
  });


// ライセンスキー入力モーダル (Add-on プロトタイプ)
const btnAddTool = document.getElementById('btn-add-tool');
const modalOverlay = document.getElementById('add-tool-modal');
const modalClose = document.getElementById('modal-close');
const modalSubmit = document.getElementById('modal-submit');
const keyInput = document.getElementById('license-key-input');
const modalError = document.getElementById('modal-error');

const openModal = () => {
  modalOverlay.classList.add('active');
  keyInput.value = '';
  modalError.textContent = '';
  keyInput.focus();
};

const closeModal = () => {
  modalOverlay.classList.remove('active');
};

if (btnAddTool) btnAddTool.addEventListener('click', openModal);
if (modalClose) modalClose.addEventListener('click', closeModal);
modalOverlay.addEventListener('click', (e) => {
  if(e.target === modalOverlay) closeModal();
});

modalSubmit.addEventListener('click', () => {
  const key = keyInput.value.trim().toUpperCase();
  if (!key) {
    modalError.textContent = 'ライセンスキーを入力してください。';
    return;
  }
  
  let unlockedCount = 0;
  let targetTools = [];

  // ライセンスキーの判定ロジック
  if (key === 'IITOMO-QR-2026') {
    targetTools = ['qr'];
  } else if (key === 'IITOMO-TRANS-2026') {
    targetTools = ['translate'];
  } else if (key === 'IITOMO-PRO-2026' || key === 'IITOMO-ADDON' /* デモ用 */) {
    targetTools = ['qr', 'translate', 'image-converter', 'voice-pdf'];
  }

  if (targetTools.length > 0) {
    // ツール状態の更新
    targetTools.forEach(id => {
      const tool = toolsData.find(t => t.id === id);
      if (tool && !savedUnlocks.includes(id)) {
        tool.isUnlocked = true;
        savedUnlocks.push(id);
        unlockedCount++;
      }
    });

    if (unlockedCount > 0) {
      // localStorageへの保存
      localStorage.setItem('iitomo_unlocked_tools', JSON.stringify(savedUnlocks));
      renderToolCards();
      modalError.style.color = '#00f5d4';
      modalError.textContent = 'ライセンス認証に成功しました！';
      setTimeout(closeModal, 1500);
    } else {
      modalError.style.color = '#ff5577';
      modalError.textContent = 'そのキーは既に有効化されています。';
    }
  } else {
    modalError.style.color = '#ff5577';
    modalError.textContent = '無効なライセンスキーです。正しく入力してください。';
  }
});

// ── Stripe & Premium 連携 ──

const updatePremiumUI = () => {
  const banner = document.getElementById('premium-banner');
  const upgradeCard = document.getElementById('premium-upgrade-card');
  const badge = document.getElementById('license-badge');

  if (isPremium) {
    if (banner) banner.classList.add('active');
    if (upgradeCard) upgradeCard.style.display = 'none';
    if (badge) {
      badge.textContent = 'PREMIUM';
      badge.style.background = 'rgba(255, 204, 0, 0.1)';
      badge.style.color = 'var(--neon-amber)';
      badge.style.borderColor = 'rgba(255, 204, 0, 0.3)';
    }
  } else {
    if (banner) banner.classList.remove('active');
    if (upgradeCard) upgradeCard.style.display = 'flex';
  }
};

const showSuccessToast = () => {
  const toast = document.getElementById('purchase-success-toast');
  if (toast) {
    toast.classList.add('active');
    setTimeout(() => toast.classList.remove('active'), 6000);
  }
};

// 購入成功の検知
const checkPurchaseStatus = () => {
  const params = new URLSearchParams(window.location.search);
  if (params.get('purchase') === 'success') {
    isPremium = true;
    localStorage.setItem('iitomo_premium_unlocked', 'true');
    // 全ツールセットを有効化
    toolsData.forEach(t => t.isUnlocked = true);
    
    updatePremiumUI();
    renderToolCards();
    showSuccessToast();

    // URLからパラメータを消去（リロード対策）
    window.history.replaceState({}, document.title, window.location.pathname);
  }
};

// 購入ボタンの初期化
const btnBuy = document.getElementById('btn-buy-premium');
if (btnBuy) {
  btnBuy.addEventListener('click', () => {
    // リアルStripeリンクへ移動
    window.location.href = 'https://buy.stripe.com/fZu7sLbVf9kXa9heUPfw400';
  });
}

// ── マイグレーション (既存ユーザーへの自動反映) ──
const migrateLegacyUnlocks = () => {
  // 既存の「QR」と「翻訳」の両方を持っている＝プロ版購入者とみなし、
  // 新機能（画像コンバーター、PDF&音声）を自動でアンロックする
  if (savedUnlocks.includes('qr') && savedUnlocks.includes('translate')) {
    let updated = false;
    ['image-converter', 'voice-pdf'].forEach(id => {
      if (!savedUnlocks.includes(id)) {
        savedUnlocks.push(id);
        const tool = toolsData.find(t => t.id === id);
        if (tool) tool.isUnlocked = true;
        updated = true;
      }
    });

    if (updated) {
      localStorage.setItem('iitomo_unlocked_tools', JSON.stringify(savedUnlocks));
      renderToolCards();
      console.log('Migration: New tools auto-unlocked for legacy PRO users.');
    }
  }
};

// ── アップデート情報の反映 ──
const updateToolDates = () => {
  toolsData.forEach(tool => {
    const el = document.getElementById(`update-${tool.id}`);
    if (el) {
      el.textContent = tool.updatedAt ? `(Updated: ${tool.updatedAt})` : '';
    }
  });
};

// 初期実行
checkPurchaseStatus();
migrateLegacyUnlocks();
updateToolDates();
updatePremiumUI();

// 初期レンダリング
renderToolCards();

});

document.addEventListener('DOMContentLoaded', () => {

// ツールデータの定義
const toolsData = [
  {
    id: 'qr',
    name: 'QRジェネレーター',
    icon: '🔍',
    desc: '美しいQRコードと短縮URLを瞬時に作成・シェア。',
    isUnlocked: true
  },
  {
    id: 'translate',
    name: '翻訳 & プロンプト',
    icon: '🌎',
    desc: '日英連携でAI向けの完璧なプロンプトを構築。',
    isUnlocked: true
  },
  {
    id: 'image-converter',
    name: '画像コンバーター (Add-on)',
    icon: '🔄',
    desc: '画像をドラッグ＆ドロップで瞬時にフォーマット変換（PNG ⇔ JPEG 等）。',
    isUnlocked: false
  },
  {
    id: 'coming',
    name: 'Coming Soon',
    icon: '✨',
    desc: 'シークレットツールを開発中。アップデートをお待ちください。',
    isUnlocked: false
  }
];

// 初期設定：localStorageからアンロック状態を復元 (あれば)
let savedUnlocks = JSON.parse(localStorage.getItem('iitomo_unlocked_tools') || '[]');

// デモ等で誤って解放された未実装ツールを強制ロック（真っ暗バグ防止）
if (savedUnlocks.includes('image-converter')) {
  savedUnlocks = savedUnlocks.filter(id => id !== 'image-converter');
  localStorage.setItem('iitomo_unlocked_tools', JSON.stringify(savedUnlocks));
}

if (savedUnlocks.length > 0) {
  toolsData.forEach(tool => {
    if (savedUnlocks.includes(tool.id)) {
      tool.isUnlocked = true;
    }
  });
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
      <div class="tool-card-status">${tool.isUnlocked ? 'Unlocked' : 'Locked'}</div>
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
    toolsData.filter(t => t.isUnlocked).forEach(t => {
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
  
  // デモ用のパスワード判定 (現在は準備中として弾く)
  if (key === 'IITOMO-ADDON') {
    modalError.textContent = '現在、追加ツールは準備中です。アップデートをお待ちください。';
  } else {
    modalError.textContent = '無効なライセンスキーです。';
  }
});

// 初期レンダリング
renderToolCards();

});

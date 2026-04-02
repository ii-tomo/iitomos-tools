document.addEventListener('DOMContentLoaded', () => {

// 繝・・繝ｫ繝・・繧ｿ縺ｮ螳夂ｾｩ
const toolsData = [
  {
    id: 'qr',
    name: 'QR繧ｸ繧ｧ繝阪Ξ繝ｼ繧ｿ繝ｼ',
    icon: '剥',
    desc: '鄒弱＠縺РR繧ｳ繝ｼ繝峨→遏ｭ邵ｮURL繧堤椪譎ゅ↓菴懈・繝ｻ繧ｷ繧ｧ繧｢縲・,
    updatedAt: '2026/03/24',
    isUnlocked: false
  },
  {
    id: 'translate',
    name: '鄙ｻ險ｳ & 繝励Ο繝ｳ繝励ヨ',
    icon: '月',
    desc: '譌･闍ｱ騾｣謳ｺ縺ｧAI蜷代￠縺ｮ螳檎挑縺ｪ繝励Ο繝ｳ繝励ヨ繧呈ｧ狗ｯ峨・,
    updatedAt: '2026/03/24',
    isUnlocked: false
  },
  {
    id: 'image-converter',
    name: '逕ｻ蜒上さ繝ｳ繝舌・繧ｿ繝ｼ',
    icon: '売',
    desc: '逕ｻ蜒上ｒ繝峨Λ繝・げ・・ラ繝ｭ繝・・縺ｧ迸ｬ譎ゅ↓繝輔か繝ｼ繝槭ャ繝亥､画鋤縲・,
    updatedAt: '2026/03/26',
    isUnlocked: false
  },
  {
    id: 'voice-pdf',
    name: 'PDF & 髻ｳ螢ｰ繝・・繝ｫ',
    icon: '児・・,
    desc: 'AI謳ｭ霈峨・PDF鄙ｻ險ｳ繝ｻ髻ｳ螢ｰ譁・ｭ苓ｵｷ縺薙＠縲・,
    updatedAt: '2026/04/02',
    isUnlocked: true
  }
];

// 蛻晄悄險ｭ螳夲ｼ嗟ocalStorage縺九ｉ繧｢繝ｳ繝ｭ繝・け迥ｶ諷九ｒ蠕ｩ蜈・(縺ゅｌ縺ｰ)
let savedUnlocks = JSON.parse(localStorage.getItem('iitomo_unlocked_tools') || '[]');
let isPremium = localStorage.getItem('iitomo_premium_unlocked') === 'true';

if (savedUnlocks.length > 0) {
  toolsData.forEach(tool => {
    if (savedUnlocks.includes(tool.id)) {
      tool.isUnlocked = true;
    }
  });
}

// 繝励Ξ繝溘い繝迥ｶ諷九↑繧牙・繝・・繝ｫ繧偵い繝ｳ繝ｭ繝・け謇ｱ縺・↓縺吶ｋ
if (isPremium) {
  toolsData.forEach(tool => tool.isUnlocked = true);
}

const renderToolCards = () => {
  const container = document.getElementById('tool-cards-container');
  if(!container) return;
  container.innerHTML = '';

  toolsData.forEach(tool => {
    const card = document.createElement('div');
    const isComingSoon = tool.isComingSoon === true;
    card.className = `tool-card ${tool.isUnlocked ? 'unlocked' : (isComingSoon ? 'coming-soon' : 'locked')}`;
    
    let badge = '';
    if (tool.isUnlocked) {
      badge = '<div class="unlock-badge">ACTIVE</div>';
    } else if (isComingSoon) {
      badge = '<div class="coming-soon-badge">COMING SOON</div>';
    } else {
      badge = '<div class="lock-badge">白</div>';
    }

    card.innerHTML = `
      ${badge}
      <span class="tool-card-icon">${tool.icon}</span>
      <div class="tool-card-name">${tool.name}</div>
      <div class="tool-card-desc">${tool.desc}</div>
      <div class="tool-card-footer">
        <div class="tool-card-status">${tool.isUnlocked ? 'UNLOCKED' : (isComingSoon ? 'COMING SOON' : 'LOCKED')}</div>
        ${tool.updatedAt ? `<div class="tool-card-update">Updated: ${tool.updatedAt}</div>` : ''}
      </div>
    `;

    // 謖吝虚縺ｮ險ｭ螳・    if(tool.isUnlocked){
      card.addEventListener('click', () => switchView(tool.id));
    } else if (isComingSoon) {
      // 菴輔ｂ縺励↑縺・ｼ医∪縺溘・繝｡繝・そ繝ｼ繧ｸ繧定｡ｨ遉ｺ・・      card.style.cursor = 'default';
    } else {
      card.addEventListener('click', () => {
        openModal();
      });
    }

    container.appendChild(card);
  });

  // 險ｭ螳夂判髱｢縺ｮ繝ｩ繧､繧ｻ繝ｳ繧ｹ荳隕ｧ繧ょ酔譎ゅ↓譖ｴ譁ｰ
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

// 繝翫ン繧ｲ繝ｼ繧ｷ繝ｧ繝ｳ縺ｨ繝薙Η繝ｼ縺ｮ蛻・ｊ譖ｿ縺医Ο繧ｸ繝・け
const navItems = document.querySelectorAll('.nav-item[data-view]');
const viewSections = document.querySelectorAll('.view-section');

const switchView = (viewId) => {
  // 縺吶∋縺ｦ縺ｮ繝薙Η繝ｼ繧帝撼陦ｨ遉ｺ
  viewSections.forEach(sec => sec.classList.remove('active'));
  // 繧ｿ繝ｼ繧ｲ繝・ヨ縺ｮ繝薙Η繝ｼ繧定｡ｨ遉ｺ
  const targetView = document.getElementById(`view-${viewId}`);
  if (targetView) {
    targetView.classList.add('active');
  }

  // 繝翫ン繧ｲ繝ｼ繧ｷ繝ｧ繝ｳ縺ｮActive迥ｶ諷九ｒ譖ｴ譁ｰ (繧ｵ繧､繝峨ヰ繝ｼ繝ｻ繝懊ヨ繝繝翫ン荳｡譁ｹ)
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
        // iframe縺ｮ鬮倥＆繧偵さ繝ｳ繝・Φ繝・↓蜷医ｏ縺帙ｋ縺薙→縺ｧ縲∬ｦｪ繝昴・繧ｿ繝ｫ蛛ｴ縺ｧ繧ｹ繧ｯ繝ｭ繝ｼ繝ｫ縺輔○繧・        activeIframe.parentElement.style.height = (e.data.height) + 'px';
      }
    }
  });


// 繝ｩ繧､繧ｻ繝ｳ繧ｹ繧ｭ繝ｼ蜈･蜉帙Δ繝ｼ繝繝ｫ (Add-on 繝励Ο繝医ち繧､繝・
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
    modalError.textContent = '繝ｩ繧､繧ｻ繝ｳ繧ｹ繧ｭ繝ｼ繧貞・蜉帙＠縺ｦ縺上□縺輔＞縲・;
    return;
  }
  
  let unlockedCount = 0;
  let targetTools = [];

  // 繝ｩ繧､繧ｻ繝ｳ繧ｹ繧ｭ繝ｼ縺ｮ蛻､螳壹Ο繧ｸ繝・け
  if (key === 'IITOMO-QR-2026') {
    targetTools = ['qr'];
  } else if (key === 'IITOMO-TRANS-2026') {
    targetTools = ['translate'];
  } else if (key === 'IITOMO-PRO-2026' || key === 'IITOMO-ADDON' /* 繝・Δ逕ｨ */) {
    targetTools = ['qr', 'translate', 'image-converter', 'voice-pdf'];
  }

  if (targetTools.length > 0) {
    // 繝・・繝ｫ迥ｶ諷九・譖ｴ譁ｰ
    targetTools.forEach(id => {
      const tool = toolsData.find(t => t.id === id);
      if (tool && !savedUnlocks.includes(id)) {
        tool.isUnlocked = true;
        savedUnlocks.push(id);
        unlockedCount++;
      }
    });

    if (unlockedCount > 0) {
      // localStorage縺ｸ縺ｮ菫晏ｭ・      localStorage.setItem('iitomo_unlocked_tools', JSON.stringify(savedUnlocks));
      renderToolCards();
      modalError.style.color = '#00f5d4';
      modalError.textContent = '繝ｩ繧､繧ｻ繝ｳ繧ｹ隱崎ｨｼ縺ｫ謌仙粥縺励∪縺励◆・・;
      setTimeout(closeModal, 1500);
    } else {
      modalError.style.color = '#ff5577';
      modalError.textContent = '縺昴・繧ｭ繝ｼ縺ｯ譌｢縺ｫ譛牙柑蛹悶＆繧後※縺・∪縺吶・;
    }
  } else {
    modalError.style.color = '#ff5577';
    modalError.textContent = '辟｡蜉ｹ縺ｪ繝ｩ繧､繧ｻ繝ｳ繧ｹ繧ｭ繝ｼ縺ｧ縺吶よｭ｣縺励￥蜈･蜉帙＠縺ｦ縺上□縺輔＞縲・;
  }
});

// 笏笏 Stripe & Premium 騾｣謳ｺ 笏笏

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

// 雉ｼ蜈･謌仙粥縺ｮ讀懃衍
const checkPurchaseStatus = () => {
  const params = new URLSearchParams(window.location.search);
  if (params.get('purchase') === 'success') {
    isPremium = true;
    localStorage.setItem('iitomo_premium_unlocked', 'true');
    // 蜈ｨ繝・・繝ｫ繧ｻ繝・ヨ繧呈怏蜉ｹ蛹・    toolsData.forEach(t => t.isUnlocked = true);
    
    updatePremiumUI();
    renderToolCards();
    showSuccessToast();

    // URL縺九ｉ繝代Λ繝｡繝ｼ繧ｿ繧呈ｶ亥悉・医Μ繝ｭ繝ｼ繝牙ｯｾ遲厄ｼ・    window.history.replaceState({}, document.title, window.location.pathname);
  }
};

// 雉ｼ蜈･繝懊ち繝ｳ縺ｮ蛻晄悄蛹・const btnBuy = document.getElementById('btn-buy-premium');
if (btnBuy) {
  btnBuy.addEventListener('click', () => {
    // 繝ｪ繧｢繝ｫStripe繝ｪ繝ｳ繧ｯ縺ｸ遘ｻ蜍・    window.location.href = 'https://buy.stripe.com/fZu7sLbVf9kXa9heUPfw400';
  });
}

// 笏笏 繝槭う繧ｰ繝ｬ繝ｼ繧ｷ繝ｧ繝ｳ (譌｢蟄倥Θ繝ｼ繧ｶ繝ｼ縺ｸ縺ｮ閾ｪ蜍募渚譏) 笏笏
const migrateLegacyUnlocks = () => {
  // 譌｢蟄倥・縲群R縲阪→縲檎ｿｻ險ｳ縲阪・荳｡譁ｹ繧呈戟縺｣縺ｦ縺・ｋ・昴・繝ｭ迚郁ｳｼ蜈･閠・→縺ｿ縺ｪ縺励・  // 譁ｰ讖溯・・育判蜒上さ繝ｳ繝舌・繧ｿ繝ｼ縲￣DF&髻ｳ螢ｰ・峨ｒ閾ｪ蜍輔〒繧｢繝ｳ繝ｭ繝・け縺吶ｋ
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

// 笏笏 繧｢繝・・繝・・繝域ュ蝣ｱ縺ｮ蜿肴丐 笏笏
const updateToolDates = () => {
  toolsData.forEach(tool => {
    const el = document.getElementById(`update-${tool.id}`);
    if (el) {
      el.textContent = tool.updatedAt ? `(Updated: ${tool.updatedAt})` : '';
    }
  });
};

// 蛻晄悄螳溯｡・checkPurchaseStatus();
migrateLegacyUnlocks();
updateToolDates();
updatePremiumUI();

// 蛻晄悄繝ｬ繝ｳ繝繝ｪ繝ｳ繧ｰ
renderToolCards();

});


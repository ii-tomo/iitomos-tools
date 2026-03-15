document.addEventListener('DOMContentLoaded', () => {
    const sourceText = document.getElementById('source-text');
    const englishResult = document.getElementById('english-result');
    const japaneseResult = document.getElementById('japanese-result');
    const swapBtn = document.getElementById('swap-langs');
    const clearBtn = document.getElementById('clear-btn');
    const copyEnBtn = document.getElementById('copy-en-btn');
    const copyJaBtn = document.getElementById('copy-ja-btn');
    const charCount = document.getElementById('char-count');
    const toast = document.getElementById('toast');
    const lineBanner = document.getElementById('line-browser-banner');
    const openExternalBtn = document.getElementById('open-external-btn');
    const updateOriginalBtn = document.getElementById('update-original-btn');
    const statusIndicator = document.getElementById('status-indicator');

    const langBoxes = document.querySelectorAll('.lang-box');

    let sourceLang = 'ja';
    let targetLang = 'en';

    // Detect LINE Browser
    const isLineBrowser = /Line/i.test(navigator.userAgent);
    if (isLineBrowser && lineBanner) {
        lineBanner.style.display = 'block';
    }

    if (openExternalBtn) {
        openExternalBtn.addEventListener('click', () => {
            const url = new URL(window.location.href);
            url.searchParams.set('openExternalBrowser', '1');
            window.location.href = url.toString();
        });
    }

    function hasJapanese(text) {
        return /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(text);
    }

    swapBtn.addEventListener('click', () => {
        [sourceLang, targetLang] = [targetLang, sourceLang];
        updateLangUI();
        
        const currentSource = sourceText.value;
        const currentEn = englishResult.value;
        const currentJa = japaneseResult.value;
        
        if (currentEn || currentJa) {
            // Swap logic: if we were in JA->EN, source was currentJa, now swapping.
            // Actually simpler to just re-translate current source with NEW langs
            performTranslation(currentSource);
        }
    });

    function updateLangUI() {
        langBoxes.forEach(box => {
            if (box.dataset.lang === sourceLang) {
                box.classList.add('active');
            } else {
                box.classList.remove('active');
            }
        });
        
        sourceText.placeholder = sourceLang === 'ja' ? '翻訳したいテキストを入力...' : 'Enter text to translate...';
    }

    function updateCharCount() {
        if (!charCount) return;
        const len = sourceText.value.length;
        charCount.textContent = `${len} / 5000`;
        charCount.style.color = len > 5000 ? '#ff4d4d' : '';
    }

    let debounceTimer;
    sourceText.addEventListener('input', () => {
        updateCharCount();
        saveDraft();
        
        clearTimeout(debounceTimer);
        const text = sourceText.value.trim();
        if (text) {
            debounceTimer = setTimeout(() => {
                if (hasJapanese(text)) {
                    sourceLang = 'ja';
                    targetLang = 'en';
                } else {
                    sourceLang = 'en';
                    targetLang = 'ja';
                }
                updateLangUI();
                performTranslation(text);
            }, 800);
        } else {
            clearResults();
        }
    });

    async function performTranslation(text) {
        if (!text) return;
        
        statusIndicator.classList.add('active');

        try {
            const result = await translateApi(text, 'auto', targetLang);
            
            if (targetLang === 'en') {
                englishResult.value = result;
                japaneseResult.value = text;
            } else {
                englishResult.value = text;
                japaneseResult.value = result;
            }
            
            englishResult.classList.remove('empty');
            japaneseResult.classList.remove('empty');
            saveDraft();
        } catch (error) {
            console.error('Translation error:', error);
        } finally {
            statusIndicator.classList.remove('active');
        }
    }

    function clearResults() {
        englishResult.value = '';
        japaneseResult.value = '';
        englishResult.classList.add('empty');
        japaneseResult.classList.add('empty');
    }

    clearBtn.addEventListener('click', () => {
        sourceText.value = '';
        clearResults();
        updateCharCount();
        saveDraft();
    });

    copyEnBtn.addEventListener('click', () => {
        if (englishResult.classList.contains('empty')) return;
        navigator.clipboard.writeText(englishResult.value).then(() => showToast('English copied!'));
    });

    copyJaBtn.addEventListener('click', () => {
        if (japaneseResult.classList.contains('empty')) return;
        navigator.clipboard.writeText(japaneseResult.value).then(() => showToast('Japanese copied!'));
    });

    updateOriginalBtn.addEventListener('click', async () => {
        const revisedJa = japaneseResult.value.trim();
        if (!revisedJa) return;

        updateOriginalBtn.disabled = true;
        const originalContent = updateOriginalBtn.innerHTML;
        updateOriginalBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Refining...';

        try {
            // Reflect revised JA back to source and re-translate to EN
            sourceText.value = revisedJa;
            updateCharCount();
            
            sourceLang = 'ja';
            targetLang = 'en';
            updateLangUI();
            
            await performTranslation(revisedJa);
            
            sourceText.style.animation = 'flash 1s';
            setTimeout(() => sourceText.style.animation = '', 1000);
        } catch (error) {
            console.error('Refinement error:', error);
            alert('更新に失敗しました。');
        } finally {
            updateOriginalBtn.disabled = false;
            updateOriginalBtn.innerHTML = originalContent;
        }
    });

    function showToast(msg) {
        if (!toast) return;
        toast.textContent = msg || 'COPIED!';
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 2000);
    }

    async function translateApi(text, sl, tl) {
        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sl}&tl=${tl}&dt=t&q=${encodeURIComponent(text)}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error('API response error');
        const data = await response.json();
        return data[0].map(segment => segment[0]).join('');
    }

    function saveDraft() {
        const draft = {
            text: sourceText.value,
            sl: sourceLang,
            tl: targetLang,
            en: englishResult.value,
            ja: japaneseResult.value
        };
        localStorage.setItem('translator_draft_v2', JSON.stringify(draft));
    }

    function loadDraft() {
        const saved = localStorage.getItem('translator_draft_v2');
        if (saved) {
            try {
                const draft = JSON.parse(saved);
                sourceText.value = draft.text || '';
                sourceLang = draft.sl || 'ja';
                targetLang = draft.tl || 'en';
                
                englishResult.value = draft.en || '';
                japaneseResult.value = draft.ja || '';
                
                if (draft.en) englishResult.classList.remove('empty');
                if (draft.ja) japaneseResult.classList.remove('empty');
                
                updateLangUI();
                updateCharCount();
            } catch (e) {
                console.error('Failed to load draft:', e);
            }
        }
    }

    const style = document.createElement('style');
    style.textContent = `
        @keyframes flash {
            0% { background-color: rgba(168, 85, 247, 0.4); }
            100% { background-color: transparent; }
        }
    `;
    document.head.appendChild(style);

    // loadDraft(); // Removed to clear content on reload
});

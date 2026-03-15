document.addEventListener('DOMContentLoaded', () => {
    const sourceText = document.getElementById('source-text');
    const targetTextDisplay = document.getElementById('target-text-display');
    const translateBtn = document.getElementById('translate-btn');
    const swapBtn = document.getElementById('swap-langs');
    const clearBtn = document.getElementById('clear-btn');
    const copyBtn = document.getElementById('copy-result-btn');
    const charCount = document.getElementById('char-count');
    const toast = document.getElementById('toast');
    const lineBanner = document.getElementById('line-browser-banner');
    const openExternalBtn = document.getElementById('open-external-btn');

    const langBoxes = document.querySelectorAll('.lang-box');

    let sourceLang = 'ja';
    let targetLang = 'en';

    // Detect LINE Browser
    const isLineBrowser = /Line/i.test(navigator.userAgent);
    if (isLineBrowser) {
        lineBanner.style.display = 'block';
    }

    openExternalBtn.addEventListener('click', () => {
        const url = new URL(window.location.href);
        url.searchParams.set('openExternalBrowser', '1');
        window.location.href = url.toString();
    });

    // Language Swapping
    swapBtn.addEventListener('click', () => {
        [sourceLang, targetLang] = [targetLang, sourceLang];
        updateLangUI();
        
        // Swap text content if both exist
        const currentSource = sourceText.value;
        const currentTarget = targetTextDisplay.textContent;
        
        if (!targetTextDisplay.classList.contains('empty')) {
            sourceText.value = currentTarget;
            targetTextDisplay.textContent = currentSource || '翻訳結果がここに表示されます';
            if (!currentSource) targetTextDisplay.classList.add('empty');
            updateCharCount();
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
        if (targetTextDisplay.classList.contains('empty')) {
            targetTextDisplay.textContent = sourceLang === 'ja' ? '翻訳結果がここに表示されます' : 'Translation result will appear here';
        }
    }

    // Character Count
    sourceText.addEventListener('input', () => {
        updateCharCount();
        saveDraft();
    });

    function updateCharCount() {
        const len = sourceText.value.length;
        charCount.textContent = `${len} / 5000`;
        if (len > 5000) {
            charCount.style.color = '#ff4d4d';
        } else {
            charCount.style.color = '';
        }
    }

    // Clear Text
    clearBtn.addEventListener('click', () => {
        sourceText.value = '';
        targetTextDisplay.textContent = sourceLang === 'ja' ? '翻訳結果がここに表示されます' : 'Translation result will appear here';
        targetTextDisplay.classList.add('empty');
        updateCharCount();
        saveDraft();
    });

    // Copy Result
    copyBtn.addEventListener('click', () => {
        if (targetTextDisplay.classList.contains('empty')) return;
        
        navigator.clipboard.writeText(targetTextDisplay.textContent).then(() => {
            showToast();
        });
    });

    function showToast() {
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 2000);
    }

    // Translation Logic
    translateBtn.addEventListener('click', async () => {
        const text = sourceText.value.trim();
        if (!text) return;

        translateBtn.disabled = true;
        const originalContent = translateBtn.innerHTML;
        translateBtn.innerHTML = '<span>Translating...</span><i class="fas fa-spinner fa-spin"></i>';

        try {
            const result = await translateApi(text, sourceLang, targetLang);
            targetTextDisplay.textContent = result;
            targetTextDisplay.classList.remove('empty');
            saveDraft();
        } catch (error) {
            console.error('Translation error:', error);
            alert('翻訳に失敗しました。時間をおいて再度お試しください。');
        } finally {
            translateBtn.disabled = false;
            translateBtn.innerHTML = originalContent;
        }
    });

    async function translateApi(text, sl, tl) {
        // Using Google Translate free endpoint (client=gtx)
        // This is usually more stable than direct scraping but has rate limits
        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sl}&tl=${tl}&dt=t&q=${encodeURIComponent(text)}`;
        
        const response = await fetch(url);
        if (!response.ok) throw new Error('API response error');
        
        const data = await response.json();
        // data[0] contains the translated segments
        return data[0].map(segment => segment[0]).join('');
    }

    // Persistence
    function saveDraft() {
        const draft = {
            text: sourceText.value,
            sl: sourceLang,
            tl: targetLang,
            result: targetTextDisplay.classList.contains('empty') ? '' : targetTextDisplay.textContent
        };
        localStorage.setItem('translator_draft', JSON.stringify(draft));
    }

    function loadDraft() {
        const saved = localStorage.getItem('translator_draft');
        if (saved) {
            try {
                const draft = JSON.parse(saved);
                sourceText.value = draft.text || '';
                sourceLang = draft.sl || 'ja';
                targetLang = draft.tl || 'en';
                
                if (draft.result) {
                    targetTextDisplay.textContent = draft.result;
                    targetTextDisplay.classList.remove('empty');
                }
                
                updateLangUI();
                updateCharCount();
            } catch (e) {
                console.error('Failed to load draft:', e);
            }
        }
    }

    loadDraft();
});

document.addEventListener('DOMContentLoaded', () => {
    // Detect LINE Browser
    const isLineBrowser = /Line/i.test(navigator.userAgent);
    const lineBanner = document.getElementById('line-browser-banner');
    const openExternalBtn = document.getElementById('open-external-btn');

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

    // Manual Modal Logic
    const manualBtn = document.getElementById('manual-btn');
    const manualModal = document.getElementById('manual-modal');
    const closeManualBtn = document.getElementById('close-manual-btn');
    const manualBody = document.getElementById('manual-body');

    // マニュアルの内容を直接埋め込む（名前は「いいとも」、言葉遣いは自然なカタカナを再採用）
    const manualData = [
        {
            title: "📱 いいとも's Tools ってなに？",
            content: `いいとも's Tools（いいともズ・ツールズ）は、あなたのクリエイティブな活動を助ける「道具箱」のようなサイトです。

現在は、以下の2つの便利なアプリが入っています。
1. **QRツール**（QRコードを作成したり読み取ったりする）
2. **翻訳ツール**（日本語と英語を翻訳する）`
        },
        {
            title: "🏁 QRツール：QRコードを作る (Generate)",
            content: `URLや文字を入力するだけで、一瞬でQRコードが作成できます。

1. **「Generate」タブ**を選びます。
2. 下の白い枠に、QRコードにしたい **URLや文字**を入力します。
   * 🌟 **短縮URLを作りたいとき：** 「短縮URLを作成する」にチェックを入れると、長いURLを短くできます。
3. 画面にQRコードが表示されます。
4. **「Download Image」**を押すと、画像として保存（ダウンロード）できます。`
        },
        {
            title: "📷 QRツール：QRコードを読み取る (Read)",
            content: `カメラや画像ファイルから、QRコードの内容を読み取ります。

1. **「Read」タブ**を選びます。
2. カメラで読み取る場合は **「Scan with Camera」**をクリックします。
3. 画像ファイルを持っている場合は、点線の枠の中に画像をドラッグ＆ドロップするか、**枠の中を直接タップ（またはクリック）**して写真を選んでください。
4. 読み取りに成功すると、リンクなどの内容が下に表示されます！`
        },
        {
            title: "🌎 翻訳ツール：プロンプトを「磨き上げる」 (Translator)",
            content: `AIへの指示（プロンプト）作りを協力にサポートします。自動翻訳と、便利なセット表示がポイントです！

1. **自動で翻訳：** 上の枠に文章を入れると、手を止めた瞬間に自動で翻訳が始まります。
2. **セットで表示：** 下の結果エリアには「英語」と「元の日本語」がセットで表示されます。これをそのままAIのプロンプトとしてコピーできます。
3. **さらに磨き上げる：** 下の文章を手直ししてから**「元の文章を更新」**ボタンを押してください。修正したニュアンスを汲み取って、元の文章がより良い表現にアップデートされます！
4. **コピー：** お気に入りの文章ができたら、右下のコピーボタンで一気にコピーしましょう。`
        },
        {
            title: "💡 知っておくと便利なこと",
            content: `* **元の画面に戻る：** 左上の「← Back」や「← Tools」を押すとメインメニューに戻れます。
* **LINEで使っている人へ：** うまく動かないときは、上に出てくる「外部ブラウザで開く」ボタンを押すと安心です。
* **スマホでも快適：** パソコンでもスマホでも、きれいに表示されるように設計されています。

自分だけのツールとして、ぜひたくさん活用してくださいね！✨`
        }
    ];

    const openManual = () => {
        manualModal.classList.add('active');
        document.body.style.overflow = 'hidden';

        // アコーディオン形式で表示する
        let html = '';
        manualData.forEach((item, index) => {
            const contentHtml = window.marked && typeof window.marked.parse === 'function' 
                ? window.marked.parse(item.content) 
                : `<p>${item.content.replace(/\n/g, '<br>')}</p>`;

            html += `
                <div class="accordion-item">
                    <button class="accordion-header" data-index="${index}">
                        <span>${item.title}</span>
                        <i class="fa-solid fa-chevron-down"></i>
                    </button>
                    <div class="accordion-content" id="acc-content-${index}">
                        <div class="accordion-inner">
                            ${contentHtml}
                        </div>
                    </div>
                </div>
            `;
        });
        manualBody.innerHTML = html;

        // アコーディオンのクリックイベント設定
        const headers = manualBody.querySelectorAll('.accordion-header');
        headers.forEach(header => {
            header.addEventListener('click', () => {
                const content = header.nextElementSibling;
                const icon = header.querySelector('.fa-chevron-down');
                
                // 他のすべてを閉じる
                manualBody.querySelectorAll('.accordion-content').forEach(c => {
                    if (c !== content) {
                        c.classList.remove('active');
                        c.previousElementSibling.querySelector('.fa-chevron-down').style.transform = 'rotate(0deg)';
                    }
                });

                // 今のを切り替える
                const isActive = content.classList.contains('active');
                if (isActive) {
                    content.classList.remove('active');
                    icon.style.transform = 'rotate(0deg)';
                } else {
                    content.classList.add('active');
                    icon.style.transform = 'rotate(180deg)';
                }
            });
        });
        
        // 最初の一つを開いておく
        headers[0].click();
    };

    const closeManual = () => {
        manualModal.classList.remove('active');
        document.body.style.overflow = ''; // Restore scroll
    };

    if (manualBtn) manualBtn.addEventListener('click', openManual);
    if (closeManualBtn) closeManualBtn.addEventListener('click', closeManual);
    
    // Close on outside click
    window.addEventListener('click', (e) => {
        if (e.target === manualModal) closeManual();
    });

    const searchInput = document.getElementById('searchInput');
    const appCards = document.querySelectorAll('.app-card');

    // Filter apps based on search input
    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();

        appCards.forEach(card => {
            // Ignore the "Add New App" empty card from search filtering or always show it
            if (card.classList.contains('empty-card')) {
                return;
            }

            const title = card.getAttribute('data-title').toLowerCase();
            const heading = card.querySelector('h3').textContent.toLowerCase();
            const desc = card.querySelector('p').textContent.toLowerCase();

            if (title.includes(searchTerm) || heading.includes(searchTerm) || desc.includes(searchTerm)) {
                card.style.display = 'block';
                // Add tiny animation to make it smooth
                card.style.animation = 'fadeIn 0.3s ease forwards';
            } else {
                card.style.display = 'none';
            }
        });
    });

    // Add mouse move effect for glow tracking on cards
    appCards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const hoverEffect = card.querySelector('.card-hover-effect');
            if (!hoverEffect) return;

            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            hoverEffect.style.background = `radial-gradient(circle at ${x}px ${y}px, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0) 60%)`;
        });

        card.addEventListener('mouseleave', () => {
            const hoverEffect = card.querySelector('.card-hover-effect');
            if (!hoverEffect) return;
            // Reset to center on leave
            hoverEffect.style.background = `radial-gradient(circle at center, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 70%)`;
        });
    });
});

document.addEventListener('DOMContentLoaded', () => {
    const textInput = document.getElementById('text-input');
    const qrCanvas = document.getElementById('qr');
    const statusText = document.getElementById('status-text');
    const copyBtn = document.getElementById('copy-btn');
    const downloadBtn = document.getElementById('download-btn');


    const externalBrowserOption = document.getElementById('external-browser-option');
    const lineBanner = document.getElementById('line-browser-banner');
    const openExternalBtn = document.getElementById('open-external-btn');
    const enableShortUrlOption = document.getElementById('enable-short-url-option');

    // --- Modal Logic ---
    const settingsBtn = document.getElementById('settings-btn');
    const settingsModal = document.getElementById('settings-modal');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const saveSettingsBtn = document.getElementById('save-settings-btn');
    const bitlyKeyInput = document.getElementById('bitly-api-key');

    // Load saved settings
    bitlyKeyInput.value = localStorage.getItem('bitly_api_token') || '';

    settingsBtn.addEventListener('click', () => {
        settingsModal.style.display = 'block';
    });

    closeModalBtn.addEventListener('click', () => {
        settingsModal.style.display = 'none';
    });

    window.addEventListener('click', (e) => {
        if (e.target === settingsModal) {
            settingsModal.style.display = 'none';
        }
    });

    saveSettingsBtn.addEventListener('click', () => {
        localStorage.setItem('bitly_api_token', bitlyKeyInput.value.trim());
        settingsModal.style.display = 'none';
        generateQR(textInput.value); // Re-generate with new settings
    });



    // --- Tab Switching ---
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.getAttribute('data-tab');
            
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));

            btn.classList.add('active');
            document.getElementById(`${tabId}-tab`).classList.add('active');
            
            statusText.textContent = tabId === 'generator' ? (textInput.value ? `Length: ${textInput.value.length} characters` : 'Ready') : 'Ready to read QR';
        });
    });

    // --- Reader Logic ---
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    const readerResult = document.getElementById('reader-result');
    const readerResultContainer = document.getElementById('reader-result-container');
    const copyReaderResultBtn = document.getElementById('copy-reader-result-btn');
    const openLinkBtn = document.getElementById('open-link-btn');

    dropZone.addEventListener('click', () => fileInput.click());

    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('dragover');
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => dropZone.classList.remove('dragover'));
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFile(files[0]);
        }
    });

    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFile(e.target.files[0]);
        }
    });

    function handleFile(file) {
        if (!file.type.startsWith('image/')) {
            alert('Please upload an image file.');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                decodeQR(img);
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    // --- Paste Image Logic ---
    window.addEventListener('paste', (e) => {
        const items = (e.clipboardData || e.originalEvent.clipboardData).items;
        for (let item of items) {
            if (item.type.indexOf('image') === 0) {
                const file = item.getAsFile();
                if (file) {
                    // 自動的にReadタブに切り替える
                    const readerTabBtn = document.querySelector('.tab-btn[data-tab="reader"]');
                    if(readerTabBtn) readerTabBtn.click();
                    handleFile(file);
                }
                break;
            }
        }
    });

    function decodeQR(img) {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d', { willReadFrequently: true });
        
        // Scale down large images to prevent browser crash and speed up jsQR
        const MAX_DIM = 1000;
        let width = img.width;
        let height = img.height;
        if (width > MAX_DIM || height > MAX_DIM) {
            const ratio = Math.min(MAX_DIM / width, MAX_DIM / height);
            width = width * ratio;
            height = height * ratio;
        }

        canvas.width = width;
        canvas.height = height;
        context.drawImage(img, 0, 0, width, height);

        try {
            const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
            const code = jsQR(imageData.data, imageData.width, imageData.height, {
                inversionAttempts: 'attemptBoth'
            });

            if (code) {
                handleDecodedData(code.data);
            } else {
                alert('QRコードが見つかりません。別の画像をお試しください。');
                statusText.textContent = 'QR decoding failed';
            }
        } catch (e) {
            console.error(e);
            alert('画像の解析中にエラーが発生しました。');
            statusText.textContent = 'QR decoding error';
        }
    }

    // --- Camera Scanner Logic ---
    const startCameraBtn = document.getElementById('start-camera-btn');
    const cameraContainer = document.getElementById('camera-container');
    const cameraPreview = document.getElementById('camera-preview');
    let videoStream = null;
    let isScanning = false;

    startCameraBtn.addEventListener('click', () => {
        if (!isScanning) {
            startCamera();
        } else {
            stopCamera();
        }
    });

    async function startCamera() {
        try {
            const constraints = {
                video: { facingMode: 'environment' }
            };
            videoStream = await navigator.mediaDevices.getUserMedia(constraints);
            cameraPreview.srcObject = videoStream;
            cameraPreview.setAttribute('playsinline', true); // Fullscreen fix
            cameraPreview.play();
            
            cameraContainer.style.display = 'block';
            isScanning = true;
            startCameraBtn.innerHTML = '<i class="fa-solid fa-stop"></i> Stop Camera';
            startCameraBtn.style.background = 'rgba(239, 68, 68, 0.2)';
            startCameraBtn.style.borderColor = 'rgba(239, 68, 68, 0.3)';
            statusText.textContent = 'Scanning...';

            requestAnimationFrame(tick);
        } catch (err) {
            console.error('Error starting camera:', err);
            alert('Could not access camera. Please check permissions.');
            statusText.textContent = 'Camera access denied';
        }
    }

    function stopCamera() {
        if (videoStream) {
            videoStream.getTracks().forEach(track => track.stop());
            videoStream = null;
        }
        cameraContainer.style.display = 'none';
        isScanning = false;
        startCameraBtn.innerHTML = '<i class="fa-solid fa-camera"></i> Scan with Camera';
        startCameraBtn.style.background = '';
        startCameraBtn.style.borderColor = '';
        statusText.textContent = 'Reader Ready';
    }

    function tick() {
        if (!isScanning) return;

        if (cameraPreview.readyState === cameraPreview.HAVE_ENOUGH_DATA) {
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d', { willReadFrequently: true });
            canvas.width = cameraPreview.videoWidth;
            canvas.height = cameraPreview.videoHeight;
            context.drawImage(cameraPreview, 0, 0, canvas.width, canvas.height);

            const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
            const code = jsQR(imageData.data, imageData.width, imageData.height, {
                inversionAttempts: 'attemptBoth',
            });

            if (code) {
                // Success!
                handleDecodedData(code.data);
                stopCamera();
                return; // Stop the loop
            }
        }
        requestAnimationFrame(tick);
    }

    function handleDecodedData(data) {
        readerResult.value = data;
        readerResultContainer.style.display = 'block';
        statusText.textContent = 'QR Code decoded successfully!';

        if (isValidUrl(data)) {
            openLinkBtn.style.display = 'inline-block';
            openLinkBtn.onclick = () => window.open(data, '_blank');

            // Automatically redirect to the URL in a new tab
            const win = window.open(data, '_blank');
            if (win) {
                statusText.textContent = 'Redirecting to link...';
            } else {
                statusText.textContent = 'QR Code decoded. Population blocked - please click "Open Link".';
            }
            
            // Still generate short URL in background just in case
            generateShortUrl(data, 'reader-short-url-container', 'reader-short-url-input');
        } else {
            openLinkBtn.style.display = 'none';
            document.getElementById('reader-short-url-container').style.display = 'none';
        }

        readerResultContainer.scrollIntoView({ behavior: 'smooth' });
    }

    copyReaderResultBtn.addEventListener('click', async () => {
        try {
            await navigator.clipboard.writeText(readerResult.value);
            const originalBtnText = copyReaderResultBtn.textContent;
            copyReaderResultBtn.textContent = 'Copied!';
            copyReaderResultBtn.style.background = '#28a745';

            setTimeout(() => {
                copyReaderResultBtn.textContent = originalBtnText;
                copyReaderResultBtn.style.background = '';
            }, 2000);
        } catch (err) {
            console.error('Failed to copy: ', err);
            statusText.textContent = 'Failed to copy text';
        }
    });

    // --- Original Generator Logic ---
    const isLineBrowser = /Line/i.test(navigator.userAgent);
    if (isLineBrowser) {
        lineBanner.style.display = 'block';
    }

    openExternalBtn.addEventListener('click', () => {
        const url = new URL(window.location.href);
        url.searchParams.set('openExternalBrowser', '1');
        window.location.href = url.toString();
    });

    let qr = new QRious({
        element: qrCanvas,
        size: 200,
        level: 'H',
        background: 'white',
        foreground: 'black'
    });

    // Initialize empty state
    generateQR('');

    textInput.addEventListener('input', () => {
        generateQR(textInput.value);
    });

    enableShortUrlOption.addEventListener('change', () => {
        generateQR(textInput.value);
    });

    let shortUrlTimeout;


    function isValidUrl(string) {
        try {
            const url = new URL(string);
            return url.protocol === 'http:' || url.protocol === 'https:';
        } catch (_) {
            return false;
        }
    }

    async function generateShortUrl(url, targetContainerId, targetInputId) {
        if (!enableShortUrlOption.checked) {
            document.getElementById(targetContainerId).style.display = 'none';
            return;
        }

        const bitlyToken = localStorage.getItem('bitly_api_token');

        try {
            // 1. Try the Server-side API (Cloudflare Function)
            // This is the secure way for the deployed version (uses BITLY_API_TOKEN secret)
            try {
                const response = await fetch('/api/shorten', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ long_url: url })
                });

                if (response.ok) {
                    const data = await response.json();
                    if (data.link) {
                        const container = document.getElementById(targetContainerId);
                        const input = document.getElementById(targetInputId);
                        input.value = data.link;
                        container.style.display = 'flex';
                        statusText.textContent = statusText.textContent.replace(' | Generating short URL...', ' | Bitly URL generated (Server)');
                        return;
                    }
                }
            } catch (serverError) {
                console.log('Server-side shortening skipped or failed, trying client-side fallback.');
            }

            // 2. Client-side Fallback (User's manual token in localStorage)
            if (bitlyToken) {
                const response = await fetch('https://api-ssl.bitly.com/v4/shorten', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${bitlyToken}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ long_url: url })
                });
                const data = await response.json();
                
                if (data.link) {
                    const container = document.getElementById(targetContainerId);
                    const input = document.getElementById(targetInputId);
                    input.value = data.link;
                    container.style.display = 'flex';
                    statusText.textContent = statusText.textContent.replace(' | Generating short URL...', ' | Bitly URL generated');
                    return;
                }
            }

            // 3. Last Resort: v.gd (Public API)
            const response = await fetch(`https://v.gd/create.php?format=json&url=${encodeURIComponent(url)}`);
            const data = await response.json();

            if (data.shorturl) {
                const container = document.getElementById(targetContainerId);
                const input = document.getElementById(targetInputId);
                input.value = data.shorturl;
                container.style.display = 'flex';
                statusText.textContent = statusText.textContent.replace(' | Generating short URL...', ' | Short URL generated');
            } else {
                throw new Error(data.errormessage || 'Failed to shorten');
            }
        } catch (error) {
            console.error('Error shortening URL:', error);
            document.getElementById(targetContainerId).style.display = 'none';
            statusText.textContent = statusText.textContent.replace(' | Generating short URL...', ` | ${error.message || 'Short URL failed'}`);
        }
    }


    function generateQR(text) {
        if (!text) {
            statusText.textContent = 'Waiting for input...';
            document.getElementById('short-url-container').style.display = 'none';
            return;
        }

        let finalValue = text;
        if (externalBrowserOption.checked && isValidUrl(text)) {
            try {
                const url = new URL(text);
                url.searchParams.set('openExternalBrowser', '1');
                finalValue = url.toString();
            } catch (e) {
                console.error('Failed to parse URL for external browser option', e);
            }
        }

        qr.value = finalValue;
        statusText.textContent = `Length: ${finalValue.length} characters`;

        clearTimeout(shortUrlTimeout);
        if (isValidUrl(text) && enableShortUrlOption.checked) {
            statusText.textContent += ' | Generating short URL...';
            shortUrlTimeout = setTimeout(() => generateShortUrl(finalValue, 'short-url-container', 'short-url-input'), 500);
        } else {
            document.getElementById('short-url-container').style.display = 'none';
        }
    }


    copyBtn.addEventListener('click', async () => {
        try {
            const blob = await new Promise(resolve => qrCanvas.toBlob(resolve, 'image/png'));
            const data = [new ClipboardItem({ 'image/png': blob })];
            await navigator.clipboard.write(data);

            const originalBtnText = copyBtn.textContent;
            copyBtn.textContent = 'Copied!';
            copyBtn.style.backgroundColor = '#238636';

            setTimeout(() => {
                copyBtn.textContent = originalBtnText;
                copyBtn.style.backgroundColor = '';
            }, 2000);
        } catch (err) {
            console.error('Failed to copy: ', err);
            statusText.textContent = 'Failed to copy image';
        }
    });

    downloadBtn.addEventListener('click', () => {
        try {
            const link = document.createElement('a');
            link.download = `qr-code-${Date.now()}.png`;
            link.href = qrCanvas.toDataURL('image/png');
            link.click();

            const originalBtnText = downloadBtn.textContent;
            downloadBtn.textContent = 'Downloaded!';
            downloadBtn.style.backgroundColor = '#238636';

            setTimeout(() => {
                downloadBtn.textContent = originalBtnText;
                downloadBtn.style.backgroundColor = '';
            }, 2000);
        } catch (err) {
            console.error('Failed to download: ', err);
            statusText.textContent = 'Failed to download image';
        }
    });

    const copyUrlBtn = document.getElementById('copy-url-btn');
    const shortUrlInput = document.getElementById('short-url-input');

    copyUrlBtn.addEventListener('click', async () => {
        try {
            await navigator.clipboard.writeText(shortUrlInput.value);

            const originalBtnText = copyUrlBtn.textContent;
            copyUrlBtn.textContent = 'Copied!';
            copyUrlBtn.style.backgroundColor = '#2ea043';

            setTimeout(() => {
                copyUrlBtn.textContent = originalBtnText;
                copyUrlBtn.style.backgroundColor = '';
            }, 2000);
        } catch (err) {
            console.error('Failed to copy URL: ', err);
            statusText.textContent = 'Failed to copy URL';
        }
    });

    // Reader short URL copy logic
    const readerCopyUrlBtn = document.getElementById('reader-copy-url-btn');
    const readerShortUrlInput = document.getElementById('reader-short-url-input');

    readerCopyUrlBtn.addEventListener('click', async () => {
        try {
            await navigator.clipboard.writeText(readerShortUrlInput.value);

            const originalBtnText = readerCopyUrlBtn.textContent;
            readerCopyUrlBtn.textContent = 'Copied!';
            readerCopyUrlBtn.style.backgroundColor = '#2ea043';

            setTimeout(() => {
                readerCopyUrlBtn.textContent = originalBtnText;
                readerCopyUrlBtn.style.backgroundColor = '';
            }, 2000);
        } catch (err) {
            console.error('Failed to copy short URL: ', err);
            statusText.textContent = 'Failed to copy short URL';
        }
    });
});

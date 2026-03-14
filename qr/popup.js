document.addEventListener('DOMContentLoaded', () => {
    const textInput = document.getElementById('text-input');
    const qrCanvas = document.getElementById('qr');
    const statusText = document.getElementById('status-text');
    const copyBtn = document.getElementById('copy-btn');
    const downloadBtn = document.getElementById('download-btn');

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

    let shortUrlTimeout;

    function isValidUrl(string) {
        try {
            const url = new URL(string);
            return url.protocol === 'http:' || url.protocol === 'https:';
        } catch (_) {
            return false;
        }
    }

    async function generateShortUrl(url) {
        try {
            const response = await fetch(`https://is.gd/create.php?format=json&url=${encodeURIComponent(url)}`);
            const data = await response.json();
            if (data.shorturl) {
                const container = document.getElementById('short-url-container');
                const input = document.getElementById('short-url-input');
                input.value = data.shorturl;
                container.style.display = 'flex';
                statusText.textContent = statusText.textContent.replace(' | Generating short URL...', ' | Short URL generated');
            } else {
                throw new Error(data.errormessage || 'Failed to shorten');
            }
        } catch (error) {
            console.error('Error shortening URL:', error);
            document.getElementById('short-url-container').style.display = 'none';
            statusText.textContent = statusText.textContent.replace(' | Generating short URL...', ' | Short URL failed');
        }
    }

    function generateQR(text) {
        if (!text) {
            statusText.textContent = 'Waiting for input...';
            document.getElementById('short-url-container').style.display = 'none';
            return;
        }
        qr.value = text;
        statusText.textContent = `Length: ${text.length} characters`;

        clearTimeout(shortUrlTimeout);
        if (isValidUrl(text)) {
            statusText.textContent += ' | Generating short URL...';
            shortUrlTimeout = setTimeout(() => generateShortUrl(text), 500);
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
});

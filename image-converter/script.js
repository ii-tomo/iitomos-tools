// Image Converter - iitomo's Tools
// Client-side image format conversion using Canvas API

document.addEventListener('DOMContentLoaded', () => {

  // ── Tab Switching ──
  const tabImage = document.getElementById('tab-image');
  const tabPdf = document.getElementById('tab-pdf');
  const imageSection = document.getElementById('image-section');
  const pdfSection = document.getElementById('pdf-section');
  const mainSubtitle = document.getElementById('main-subtitle');

  tabImage.addEventListener('click', () => {
    tabImage.classList.add('active');
    tabPdf.classList.remove('active');
    imageSection.style.display = '';
    pdfSection.style.display = 'none';
    mainSubtitle.textContent = 'ドラッグ＆ドロップで画像フォーマットを瞬時に変換';
  });

  tabPdf.addEventListener('click', () => {
    tabPdf.classList.add('active');
    tabImage.classList.remove('active');
    imageSection.style.display = 'none';
    pdfSection.style.display = '';
    mainSubtitle.textContent = 'PDFを画像（PNG / JPEG）に変換してダウンロード';
  });

  // ── State ──
  let files = []; // { id, originalFile, originalUrl, convertedBlob, convertedUrl, status }
  let selectedFormat = 'image/jpeg';
  let selectedExt = 'jpg';
  let quality = 0.9;
  let idCounter = 0;

  // ── DOM Elements ──
  const dropZone = document.getElementById('drop-zone');
  const fileInput = document.getElementById('file-input');
  const settingsPanel = document.getElementById('settings-panel');
  const qualitySlider = document.getElementById('quality-slider');
  const qualityValue = document.getElementById('quality-value');
  const qualityGroup = document.getElementById('quality-group');
  const formatBtns = document.querySelectorAll('.format-btn');
  const fileList = document.getElementById('file-list');
  const actionBar = document.getElementById('action-bar');
  const convertAllBtn = document.getElementById('convert-all-btn');
  const downloadAllBtn = document.getElementById('download-all-btn');
  const clearAllBtn = document.getElementById('clear-all-btn');
  const toast = document.getElementById('toast');

  // ── Drop Zone Events ──
  dropZone.addEventListener('click', (e) => {
    if (e.target.closest('.file-select-btn') || e.target.closest('label')) return;
    fileInput.click();
  });

  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('drag-over');
  });

  dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('drag-over');
  });

  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
    const droppedFiles = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
    if (droppedFiles.length > 0) addFiles(droppedFiles);
  });

  fileInput.addEventListener('change', (e) => {
    const selectedFiles = Array.from(e.target.files).filter(f => f.type.startsWith('image/'));
    if (selectedFiles.length > 0) addFiles(selectedFiles);
    fileInput.value = ''; // Reset so same file can be re-selected
  });

  // ── Format Buttons ──
  formatBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      formatBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedFormat = btn.dataset.format;
      selectedExt = btn.dataset.ext;

      // Show/hide quality slider (only for JPEG and WebP)
      if (selectedFormat === 'image/png') {
        qualityGroup.classList.add('hidden');
      } else {
        qualityGroup.classList.remove('hidden');
      }

      // Reset conversion status since format changed
      files.forEach(f => {
        if (f.status === 'done') {
          f.status = 'ready';
          if (f.convertedUrl) URL.revokeObjectURL(f.convertedUrl);
          f.convertedBlob = null;
          f.convertedUrl = null;
        }
      });
      renderFileList();
    });
  });

  // ── Quality Slider ──
  qualitySlider.addEventListener('input', (e) => {
    quality = e.target.value / 100;
    qualityValue.textContent = e.target.value;

    // Reset conversions since quality changed
    files.forEach(f => {
      if (f.status === 'done') {
        f.status = 'ready';
        if (f.convertedUrl) URL.revokeObjectURL(f.convertedUrl);
        f.convertedBlob = null;
        f.convertedUrl = null;
      }
    });
    renderFileList();
  });

  // ── Add Files ──
  function addFiles(newFiles) {
    newFiles.forEach(file => {
      const url = URL.createObjectURL(file);
      files.push({
        id: ++idCounter,
        originalFile: file,
        originalUrl: url,
        convertedBlob: null,
        convertedUrl: null,
        status: 'ready' // ready | converting | done | error
      });
    });
    updateUI();
  }

  // ── Update UI ──
  function updateUI() {
    const hasFiles = files.length > 0;
    settingsPanel.classList.toggle('visible', hasFiles);
    actionBar.classList.toggle('visible', hasFiles);
    renderFileList();
    updateActionButtons();
  }

  // ── Render File List ──
  function renderFileList() {
    fileList.innerHTML = '';

    files.forEach(f => {
      const div = document.createElement('div');
      div.className = 'file-item';
      div.id = `file-${f.id}`;

      const ext = f.originalFile.name.split('.').pop().toUpperCase();
      const size = formatFileSize(f.originalFile.size);

      let statusHTML = '';
      switch(f.status) {
        case 'ready':
          statusHTML = `<span class="file-status ready"><i class="fa-solid fa-circle-dot"></i> ${ext}</span>`;
          break;
        case 'converting':
          statusHTML = `<span class="file-status converting"><span class="spinner"></span> 変換中...</span>`;
          break;
        case 'done':
          const newSize = f.convertedBlob ? formatFileSize(f.convertedBlob.size) : '';
          statusHTML = `<span class="file-status done"><i class="fa-solid fa-circle-check"></i> ${selectedExt.toUpperCase()} (${newSize})</span>`;
          break;
        case 'error':
          statusHTML = `<span class="file-status error"><i class="fa-solid fa-circle-xmark"></i> エラー</span>`;
          break;
      }

      let actionsHTML = '';
      if (f.status === 'done' && f.convertedUrl) {
        actionsHTML += `<button class="icon-btn download-btn" data-id="${f.id}" title="ダウンロード"><i class="fa-solid fa-download"></i></button>`;
      }
      actionsHTML += `<button class="icon-btn remove-btn" data-id="${f.id}" title="削除"><i class="fa-solid fa-xmark"></i></button>`;

      div.innerHTML = `
        <img class="file-thumb" src="${f.originalUrl}" alt="${f.originalFile.name}">
        <div class="file-info">
          <div class="file-name">${f.originalFile.name}</div>
          <div class="file-meta">${size} • ${ext}</div>
        </div>
        ${statusHTML}
        <div class="file-actions">${actionsHTML}</div>
      `;

      fileList.appendChild(div);
    });

    // Attach button events
    fileList.querySelectorAll('.download-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        downloadFile(parseInt(btn.dataset.id));
      });
    });

    fileList.querySelectorAll('.remove-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        removeFile(parseInt(btn.dataset.id));
      });
    });
  }

  // ── Update Action Buttons ──
  function updateActionButtons() {
    const hasDone = files.some(f => f.status === 'done');
    const hasReady = files.some(f => f.status === 'ready');
    downloadAllBtn.style.display = hasDone ? 'flex' : 'none';
    convertAllBtn.disabled = !hasReady;
  }

  // ── Convert Single File ──
  function convertFile(fileObj) {
    return new Promise((resolve) => {
      fileObj.status = 'converting';
      renderFileList();

      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.naturalWidth;
          canvas.height = img.naturalHeight;
          const ctx = canvas.getContext('2d');

          // For JPEG: fill with white background (since JPEG doesn't support transparency)
          if (selectedFormat === 'image/jpeg') {
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
          }

          ctx.drawImage(img, 0, 0);

          canvas.toBlob((blob) => {
            if (blob) {
              fileObj.convertedBlob = blob;
              fileObj.convertedUrl = URL.createObjectURL(blob);
              fileObj.status = 'done';
            } else {
              fileObj.status = 'error';
            }
            renderFileList();
            updateActionButtons();
            resolve();
          }, selectedFormat, selectedFormat === 'image/png' ? undefined : quality);
        } catch (err) {
          console.error('Conversion error:', err);
          fileObj.status = 'error';
          renderFileList();
          updateActionButtons();
          resolve();
        }
      };

      img.onerror = () => {
        fileObj.status = 'error';
        renderFileList();
        updateActionButtons();
        resolve();
      };

      img.src = fileObj.originalUrl;
    });
  }

  // ── Convert All ──
  convertAllBtn.addEventListener('click', async () => {
    convertAllBtn.disabled = true;
    const readyFiles = files.filter(f => f.status === 'ready');

    for (const f of readyFiles) {
      await convertFile(f);
    }

    showToast('変換完了！');
    updateActionButtons();
  });

  // ── Download Single File ──
  function downloadFile(id) {
    const f = files.find(f => f.id === id);
    if (!f || !f.convertedUrl) return;

    const baseName = f.originalFile.name.replace(/\.[^.]+$/, '');
    const a = document.createElement('a');
    a.href = f.convertedUrl;
    a.download = `${baseName}.${selectedExt}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  // ── Download All ──
  downloadAllBtn.addEventListener('click', () => {
    const doneFiles = files.filter(f => f.status === 'done' && f.convertedUrl);
    doneFiles.forEach(f => downloadFile(f.id));
    showToast(`${doneFiles.length}件ダウンロード開始`);
  });

  // ── Remove File ──
  function removeFile(id) {
    const idx = files.findIndex(f => f.id === id);
    if (idx === -1) return;

    const f = files[idx];
    if (f.originalUrl) URL.revokeObjectURL(f.originalUrl);
    if (f.convertedUrl) URL.revokeObjectURL(f.convertedUrl);
    files.splice(idx, 1);
    updateUI();
  }

  // ── Clear All ──
  clearAllBtn.addEventListener('click', () => {
    files.forEach(f => {
      if (f.originalUrl) URL.revokeObjectURL(f.originalUrl);
      if (f.convertedUrl) URL.revokeObjectURL(f.convertedUrl);
    });
    files = [];
    updateUI();
  });

  // ── Helpers ──
  function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  }

  function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2500);
  }

  // ══════════════════════════════════════════
  //  PDF CONVERTER
  // ══════════════════════════════════════════

  // ── Device limits ──
  const isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent) || window.innerWidth < 768;
  const PDF_LIMITS = isMobile
    ? { maxSizeMB: 20, maxPages: 10, scale: 1.5 }
    : { maxSizeMB: 50, maxPages: 20, scale: 2.0 };

  // ── PDF.js worker ──
  if (typeof pdfjsLib !== 'undefined') {
    pdfjsLib.GlobalWorkerOptions.workerSrc =
      'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  }

  // ── State ──
  let pdfDoc = null;
  let pdfFile = null;
  let pdfTotalPages = 0;
  let pdfOutputFormat = 'png';
  let pdfQuality = 0.9;
  let pdfPageMode = 'all';
  let pdfConverting = false;

  // ── DOM ──
  const pdfDropZone    = document.getElementById('pdf-drop-zone');
  const pdfFileInput   = document.getElementById('pdf-file-input');
  const pdfLimitText   = document.getElementById('pdf-limit-text');
  const pdfSettingsPanel = document.getElementById('pdf-settings-panel');
  const pdfFileName    = document.getElementById('pdf-file-name');
  const pdfPageCount   = document.getElementById('pdf-page-count');
  const pdfActionBar   = document.getElementById('pdf-action-bar');
  const pdfConvertBtn  = document.getElementById('pdf-convert-btn');
  const pdfClearBtn    = document.getElementById('pdf-clear-btn');
  const pdfProgress    = document.getElementById('pdf-progress');
  const pdfProgressBar = document.getElementById('pdf-progress-bar');
  const pdfProgressText = document.getElementById('pdf-progress-text');
  const pdfQualitySlider = document.getElementById('pdf-quality-slider');
  const pdfQualityValue  = document.getElementById('pdf-quality-value');
  const pdfQualityGroup  = document.getElementById('pdf-quality-group');
  const rangeStart     = document.getElementById('range-start');
  const rangeEnd       = document.getElementById('range-end');
  const customPages    = document.getElementById('custom-pages');
  const pageRangeInput = document.getElementById('page-range-input');
  const pageCustomInput = document.getElementById('page-custom-input');

  // Set limit label
  pdfLimitText.textContent = `最大${PDF_LIMITS.maxSizeMB}MB・${PDF_LIMITS.maxPages}ページまで`;

  // ── PDF Drop Zone ──
  pdfDropZone.addEventListener('click', (e) => {
    if (e.target.closest('label') || e.target.closest('.file-select-btn')) return;
    pdfFileInput.click();
  });

  pdfDropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    pdfDropZone.classList.add('drag-over');
  });

  pdfDropZone.addEventListener('dragleave', () => {
    pdfDropZone.classList.remove('drag-over');
  });

  pdfDropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    pdfDropZone.classList.remove('drag-over');
    const file = Array.from(e.dataTransfer.files).find(f => f.type === 'application/pdf' || f.name.endsWith('.pdf'));
    if (file) loadPDF(file);
    else showToast('PDFファイルを選択してください');
  });

  pdfFileInput.addEventListener('change', (e) => {
    if (e.target.files[0]) loadPDF(e.target.files[0]);
    pdfFileInput.value = '';
  });

  // ── Load PDF ──
  async function loadPDF(file) {
    const maxBytes = PDF_LIMITS.maxSizeMB * 1024 * 1024;
    if (file.size > maxBytes) {
      showToast(`ファイルサイズが上限（${PDF_LIMITS.maxSizeMB}MB）を超えています`);
      return;
    }

    try {
      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      pdfDoc = await loadingTask.promise;
      pdfFile = file;

      const total = pdfDoc.numPages;
      pdfTotalPages = Math.min(total, PDF_LIMITS.maxPages);

      pdfFileName.textContent = file.name;
      if (total > PDF_LIMITS.maxPages) {
        pdfPageCount.textContent = `全${total}ページ（上限${PDF_LIMITS.maxPages}ページ）`;
      } else {
        pdfPageCount.textContent = `全${total}ページ`;
      }

      rangeStart.max = pdfTotalPages;
      rangeEnd.max = pdfTotalPages;
      rangeStart.value = 1;
      rangeEnd.value = pdfTotalPages;

      pdfSettingsPanel.classList.add('visible');
      pdfActionBar.classList.add('visible');
    } catch (err) {
      console.error('PDF load error:', err);
      showToast('PDFの読み込みに失敗しました');
    }
  }

  // ── Page Mode Selector ──
  document.querySelectorAll('#page-mode-selector .format-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#page-mode-selector .format-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      pdfPageMode = btn.dataset.mode;
      pageRangeInput.style.display = pdfPageMode === 'range' ? 'flex' : 'none';
      pageCustomInput.style.display = pdfPageMode === 'custom' ? 'block' : 'none';
    });
  });

  // ── PDF Format Selector ──
  document.querySelectorAll('#pdf-format-selector .format-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#pdf-format-selector .format-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      pdfOutputFormat = btn.dataset.pdfFormat;
      if (pdfOutputFormat === 'jpeg') {
        pdfQualityGroup.style.opacity = '1';
        pdfQualityGroup.style.pointerEvents = 'auto';
      } else {
        pdfQualityGroup.style.opacity = '0.3';
        pdfQualityGroup.style.pointerEvents = 'none';
      }
    });
  });

  // ── PDF Quality Slider ──
  pdfQualitySlider.addEventListener('input', (e) => {
    pdfQuality = e.target.value / 100;
    pdfQualityValue.textContent = e.target.value;
  });

  // ── Get Selected Pages ──
  function getSelectedPages() {
    if (pdfPageMode === 'all') {
      return Array.from({ length: pdfTotalPages }, (_, i) => i + 1);
    }
    if (pdfPageMode === 'range') {
      const s = Math.max(1, parseInt(rangeStart.value) || 1);
      const e = Math.min(pdfTotalPages, parseInt(rangeEnd.value) || pdfTotalPages);
      if (s > e) return null;
      return Array.from({ length: e - s + 1 }, (_, i) => s + i);
    }
    // custom
    const parts = customPages.value.split(',')
      .map(p => parseInt(p.trim()))
      .filter(p => !isNaN(p) && p >= 1 && p <= pdfTotalPages);
    return parts.length > 0 ? [...new Set(parts)].sort((a, b) => a - b) : null;
  }

  // ── Render Single Page ──
  async function renderPage(pageNum) {
    const page = await pdfDoc.getPage(pageNum);
    const viewport = page.getViewport({ scale: PDF_LIMITS.scale });
    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext('2d');

    if (pdfOutputFormat === 'jpeg') {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    await page.render({ canvasContext: ctx, viewport }).promise;

    return new Promise((resolve) => {
      const mime = pdfOutputFormat === 'jpeg' ? 'image/jpeg' : 'image/png';
      const q = pdfOutputFormat === 'jpeg' ? pdfQuality : undefined;
      canvas.toBlob(resolve, mime, q);
    });
  }

  // ── Convert & Download ──
  pdfConvertBtn.addEventListener('click', async () => {
    if (pdfConverting || !pdfDoc) return;

    const pages = getSelectedPages();
    if (!pages || pages.length === 0) {
      showToast('有効なページが選択されていません');
      return;
    }

    pdfConverting = true;
    pdfConvertBtn.disabled = true;
    pdfActionBar.classList.remove('visible');
    pdfProgress.style.display = 'block';
    pdfProgressBar.style.width = '0%';

    const baseName = pdfFile.name.replace(/\.pdf$/i, '');
    const ext = pdfOutputFormat === 'jpeg' ? 'jpg' : 'png';
    const blobs = [];

    try {
      for (let i = 0; i < pages.length; i++) {
        pdfProgressText.textContent = `変換中... ${i + 1} / ${pages.length} ページ`;
        pdfProgressBar.style.width = `${Math.round(((i + 1) / pages.length) * 100)}%`;

        const blob = await renderPage(pages[i]);
        blobs.push({ blob, pageNum: pages[i] });

        // Yield to browser between pages
        await new Promise(r => setTimeout(r, 0));
      }

      if (blobs.length === 1) {
        downloadBlob(blobs[0].blob, `${baseName}_p${blobs[0].pageNum}.${ext}`);
        showToast('変換完了！');
      } else {
        pdfProgressText.textContent = 'ZIPを作成中...';
        const zip = new JSZip();
        blobs.forEach(({ blob, pageNum }) => {
          zip.file(`${baseName}_p${String(pageNum).padStart(3, '0')}.${ext}`, blob);
        });
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        downloadBlob(zipBlob, `${baseName}.zip`);
        showToast(`${blobs.length}ページを変換・ZIP化しました！`);
      }
    } catch (err) {
      console.error('PDF convert error:', err);
      showToast('変換中にエラーが発生しました');
    }

    pdfConverting = false;
    pdfConvertBtn.disabled = false;
    pdfProgress.style.display = 'none';
    pdfActionBar.classList.add('visible');
  });

  // ── PDF Clear ──
  pdfClearBtn.addEventListener('click', () => {
    pdfDoc = null;
    pdfFile = null;
    pdfTotalPages = 0;
    pdfPageMode = 'all';
    pdfSettingsPanel.classList.remove('visible');
    pdfActionBar.classList.remove('visible');
    pdfProgress.style.display = 'none';
    // Reset page mode UI
    document.querySelectorAll('#page-mode-selector .format-btn').forEach((b, i) => {
      b.classList.toggle('active', i === 0);
    });
    pageRangeInput.style.display = 'none';
    pageCustomInput.style.display = 'none';
    customPages.value = '';
  });

  // ── Helper: download blob ──
  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

});

// Image Converter - iitomo's Tools
// Client-side image format conversion using Canvas API

document.addEventListener('DOMContentLoaded', () => {

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

});

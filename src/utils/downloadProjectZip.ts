import JSZip from 'jszip';

/**
 * Downloads the complete project source code as a .ZIP file directly in the user's browser.
 * Uses client-side Blob generation to bypass all iframe and cross-origin restrictions.
 */
export async function downloadProjectZip(onProgress?: (status: string) => void) {
  try {
    if (onProgress) onProgress('Menyiapkan file proyek...');

    // Method 1: Try pre-built Base64 ZIP
    try {
      const res = await fetch('/api/project-zip-base64');
      if (res.ok) {
        const data = await res.json();
        if (data.base64) {
          if (onProgress) onProgress('Mendekode zip...');
          const binary = atob(data.base64);
          const bytes = new Uint8Array(binary.length);
          for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
          }
          const blob = new Blob([bytes], { type: 'application/zip' });
          saveBlob(blob, 'suara-ai-voiceover.zip');
          if (onProgress) onProgress('Selesai!');
          return;
        }
      }
    } catch (e) {
      console.warn('Base64 endpoint failed, falling back to client JSZip bundling', e);
    }

    // Method 2: Fetch project files and bundle in-browser via JSZip
    if (onProgress) onProgress('Mengambil berkas source code...');
    const filesRes = await fetch('/api/project-files');
    if (!filesRes.ok) {
      throw new Error(`Gagal mengambil berkas (${filesRes.status})`);
    }

    const { files } = await filesRes.json();
    if (!files || Object.keys(files).length === 0) {
      throw new Error('Tidak ada berkas yang ditemukan untuk dikompres.');
    }

    if (onProgress) onProgress('Mengemas berkas ke ZIP...');
    const zip = new JSZip();

    for (const [filePath, content] of Object.entries(files)) {
      zip.file(filePath, content as string);
    }

    if (onProgress) onProgress('Menghasilkan arsip ZIP...');
    const zipBlob = await zip.generateAsync({
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 },
    });

    saveBlob(zipBlob, 'suara-ai-voiceover.zip');
    if (onProgress) onProgress('Unduhan berhasil dimulai!');
  } catch (error: any) {
    console.warn('Fetch-based download failed, using direct anchor fallback:', error);
    if (onProgress) onProgress('Mengunduh langsung via browser...');
    const a = document.createElement('a');
    a.href = '/suara-ai-voiceover.zip';
    a.download = 'suara-ai-voiceover.zip';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
    }, 1000);
  }
}

function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 1000);
}

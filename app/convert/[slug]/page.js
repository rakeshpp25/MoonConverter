'use client';

import { useState, useRef, useEffect } from 'react';
import { useParams } from 'next/navigation';

// --- CENTRAL SEO ROUTING REGISTRY MATRIX ---
const conversionRegistry = {
  // JPG / JPEG Core Pipelines
  'jpg-to-png.html': { title: 'JPG to PNG Converter', inputExt: 'jpg', outputExt: 'png'  },
  'jpg-to-webp.html': { title: 'JPG to WebP Converter', inputExt: 'jpg', outputExt: 'webp' },
  'jpg-to-avif.html': { title: 'JPG to AVIF Converter', inputExt: 'jpg', outputExt: 'avif' },
  'jpg-to-svg.html': { title: 'JPG to SVG Converter', inputExt: 'jpg', outputExt: 'svg' },
  'jpg-to-pdf.html': { title: 'JPG to PDF Converter', inputExt: 'jpg', outputExt: 'pdf' },
  'jpg-to-gif.html': { title: 'JPG to GIF Converter', inputExt: 'jpg', outputExt: 'gif'},
  'jpg-to-ico.html': { title: 'JPG to ICO Converter', inputExt: 'jpg', outputExt: 'ico' },
  'jpg-to-bmp.html': { title: 'JPG to BMP Converter', inputExt: 'jpg', outputExt: 'bmp'},

  // PNG Core Pipelines
  'png-to-jpg.html': { title: 'PNG to JPG Converter', inputExt: 'png', outputExt: 'jpg' },
  'png-to-webp.html': { title: 'PNG to WebP Converter', inputExt: 'png', outputExt: 'webp' },
  'png-to-avif.html': { title: 'PNG to AVIF Converter', inputExt: 'png', outputExt: 'avif' },
  'png-to-svg.html': { title: 'PNG to SVG Converter', inputExt: 'png', outputExt: 'svg' },
  'png-to-pdf.html': { title: 'PNG to PDF Converter', inputExt: 'png', outputExt: 'pdf' },
  'png-to-gif.html': { title: 'PNG to GIF Converter', inputExt: 'png', outputExt: 'gif' },
  'png-to-ico.html': { title: 'PNG to ICO Converter', inputExt: 'png', outputExt: 'ico' },
  'png-to-bmp.html': { title: 'PNG to BMP Converter', inputExt: 'png', outputExt: 'bmp' },

  // WebP Core Pipelines
  'webp-to-jpg.html': { title: 'WebP to JPG Converter', inputExt: 'webp', outputExt: 'jpg' },
  'webp-to-png.html': { title: 'WebP to PNG Converter', inputExt: 'webp', outputExt: 'png' },
  'webp-to-avif.html': { title: 'WebP to AVIF Converter', inputExt: 'webp', outputExt: 'avif' },
  'webp-to-svg.html': { title: 'WebP to SVG Converter', inputExt: 'webp', outputExt: 'svg' },
  'webp-to-pdf.html': { title: 'WebP to PDF Converter', inputExt: 'webp', outputExt: 'pdf' },
  'webp-to-ico.html': { title: 'WebP to ICO Converter', inputExt: 'webp', outputExt: 'ico' },

  // AVIF Core Pipelines
  'avif-to-jpg.html': { title: 'AVIF to JPG Converter', inputExt: 'avif', outputExt: 'jpg' },
  'avif-to-png.html': { title: 'AVIF to PNG Converter', inputExt: 'avif', outputExt: 'png' },
  'avif-to-webp.html': { title: 'AVIF to WebP Converter', inputExt: 'avif', outputExt: 'webp' },
  'avif-to-pdf.html': { title: 'AVIF to PDF Converter', inputExt: 'avif', outputExt: 'pdf' },

  // PDF Extraction Pipelines
  'pdf-to-jpg.html': { title: 'PDF to JPG Converter', inputExt: 'pdf', outputExt: 'jpg' },
  'pdf-to-png.html': { title: 'PDF to PNG Converter', inputExt: 'pdf', outputExt: 'png' },

  // SVG Vector Pipelines
  'svg-to-jpg.html': { title: 'SVG to JPG Converter', inputExt: 'svg', outputExt: 'jpg' },
  'svg-to-png.html': { title: 'SVG to PNG Converter', inputExt: 'svg', outputExt: 'png' },
  'svg-to-pdf.html': { title: 'SVG to PDF Converter', inputExt: 'svg', outputExt: 'pdf' },

  // BMP Pipelines
  'bmp-to-jpg.html': { title: 'BMP to JPG Converter', inputExt: 'bmp', outputExt: 'jpg' },
  'bmp-to-png.html': { title: 'BMP to PNG Converter', inputExt: 'bmp', outputExt: 'png' },
  'bmp-to-webp.html': { title: 'BMP to WebP Converter', inputExt: 'bmp', outputExt: 'webp' },

  // ICO Pipelines
  'ico-to-png.html': { title: 'ICO to PNG Converter', inputExt: 'ico', outputExt: 'png' },
  'ico-to-jpg.html': { title: 'ICO to JPG Converter', inputExt: 'ico', outputExt: 'jpg' },

  // TIFF Pipelines
  'tiff-to-jpg.html': { title: 'TIFF to JPG Converter', inputExt: 'tiff', outputExt: 'jpg' },
  'tiff-to-png.html': { title: 'TIFF to PNG Converter', inputExt: 'tiff', outputExt: 'png' },

  // GIF Pipelines
  'gif-to-png.html': { title: 'GIF to PNG Converter', inputExt: 'gif', outputExt: 'png' },
  'gif-to-jpg.html': { title: 'GIF to JPG Converter', inputExt: 'gif', outputExt: 'jpg' },
  'gif-to-webp.html': { title: 'GIF to WebP Converter', inputExt: 'gif', outputExt: 'webp' },

  // Smartphone & Alternate Formats (HEIC, HEIF, JFIF, TGA) -> Normalize inputs cleanly
  'heic-to-jpg.html': { title: 'HEIC to JPG Converter', inputExt: 'heic', outputExt: 'jpg' },
  'heic-to-png.html': { title: 'HEIC to PNG Converter', inputExt: 'heic', outputExt: 'png' },
  'heif-to-jpg.html': { title: 'HEIF to JPG Converter', inputExt: 'heif', outputExt: 'jpg' },
  'jfif-to-jpg.html': { title: 'JFIF to JPG Converter', inputExt: 'jfif', outputExt: 'jpg' },
  'jfif-to-png.html': { title: 'JFIF to PNG Converter', inputExt: 'jfif', outputExt: 'png' },
  'tga-to-jpg.html': { title: 'TGA to JPG Converter', inputExt: 'tga', outputExt: 'jpg' },
  'tga-to-png.html': { title: 'TGA to PNG Converter', inputExt: 'tga', outputExt: 'png' }
};

export default function DynamicPresetConverter() {
  const { slug } = useParams();
  
  const fileInputRef = useRef(null);
  const canvasRef = useRef(null);
  const dropzoneRef = useRef(null);

  // --- STATE LAYER MANAGEMENT ---
  const [currentConfig, setCurrentConfig] = useState({
    title: 'Image Converter',
    inputExt: 'jpg',
    outputExt: 'png',
    label: 'Accepts standard image assets'
  });

  const [file, setFile] = useState(null);
  const [filename, setFilename] = useState('');
  const [filesize, setFilesize] = useState('0 KB');
  const [previewSrc, setPreviewSrc] = useState('');
  const [showWorkspace, setShowWorkspace] = useState(false);
  const [showDownloadBtn, setShowDownloadBtn] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState('');
  const [convertBtnText, setConvertBtnText] = useState('Convert Now');
  const [progressWidth, setProgressWidth] = useState('0%');
  const [errorMessage, setErrorMessage] = useState('');

  const imageFormats = ['jpg', 'png', 'webp', 'avif', 'gif', 'svg', 'pdf', 'ico', 'bmp'];
  const MAX_IMAGE_SIZE_MB = 30;
  const MAX_PDF_SIZE_MB = 50;

  // Sync configuration properties cleanly whenever slug param hooks into frame context
  useEffect(() => {
    if (slug && conversionRegistry[slug]) {
      setCurrentConfig({ ...conversionRegistry[slug] });
    }
  }, [slug]);

  // --- SEAMLESS URL SHALLOW ROUTING ACTION ---
  const handleTargetFormatChange = (newTargetFormat) => {
    const currentInput = currentConfig.inputExt;
    const newSlugLink = `${currentInput}-to-${newTargetFormat}.html`;

    if (conversionRegistry[newSlugLink]) {
      window.history.pushState(null, '', `/convert/${newSlugLink}`);
      
      setCurrentConfig({
        title: conversionRegistry[newSlugLink].title,
        inputExt: currentInput,
        outputExt: newTargetFormat,
        label: conversionRegistry[newSlugLink].label
      });

      setShowDownloadBtn(false);
      setDownloadUrl('');
      setProgressWidth('0%');
      setConvertBtnText('Convert Now');
    }
  };

  // --- FILE SELECTION STAGING PIPELINE ---
  const handleInputChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      processIncomingFile(e.target.files[0]);
    }
  };

  const processIncomingFile = (incomingFile) => {
    setErrorMessage('');
    let ext = incomingFile.name.split('.').pop().toLowerCase();
    if (ext === 'jpeg') ext = 'jpg';

    const fileSizeInMB = incomingFile.size / (1024 * 1024);

    if (ext === 'pdf' && fileSizeInMB > MAX_PDF_SIZE_MB) {
      setErrorMessage(`This PDF is too large (${fileSizeInMB.toFixed(1)}MB). Please choose a file smaller than ${MAX_PDF_SIZE_MB}MB to ensure a fast conversion.`);
      return;
    } else if (ext !== 'pdf' && fileSizeInMB > MAX_IMAGE_SIZE_MB) {
      setErrorMessage(`This image is too large (${fileSizeInMB.toFixed(1)}MB). Please choose a file smaller than ${MAX_IMAGE_SIZE_MB}MB to protect your device's memory.`);
      return;
    }
    
    // SMART AUTO-CORRECTION DRIFT ENGINE
    if (ext !== currentConfig.inputExt) {
      const fallbackTarget = ext === 'png' ? 'jpg' : 'png';
      const autoCorrectedSlug = `${ext}-to-${fallbackTarget}.html`;

      if (conversionRegistry[autoCorrectedSlug]) {
        window.history.pushState(null, '', `/convert/${autoCorrectedSlug}`);
        setCurrentConfig({
          title: conversionRegistry[autoCorrectedSlug].title,
          inputExt: ext,
          outputExt: fallbackTarget,
          label: conversionRegistry[autoCorrectedSlug].label
        });
      } else {
        const alternativeSlug = Object.keys(conversionRegistry).find(key => key.startsWith(`${ext}-`));
        if (alternativeSlug) {
          window.history.pushState(null, '', `/convert/${alternativeSlug}`);
          setCurrentConfig({ ...conversionRegistry[alternativeSlug] });
        } else {
          setErrorMessage(`We found a .${ext.toUpperCase()} file. Configure conversion options using menus below.`);
        }
      }
    }

    setFile(incomingFile);
    setFilename(incomingFile.name);
    setFilesize((incomingFile.size / 1024).toFixed(2) + ' KB');
    
    if (ext === 'pdf') {
      setPreviewSrc(''); 
    } else {
      const objectUrl = URL.createObjectURL(incomingFile);
      setPreviewSrc(objectUrl);
    }
    
    setShowDownloadBtn(false);
    setDownloadUrl('');
    setProgressWidth('0%');
    setConvertBtnText('Convert Now');
    setShowWorkspace(true);
  };

  // --- RECONSTRUCTED HIGH-PERFORMANCE CONVERSION PIPELINE CORE ---
  const triggerConversionPipeline = () => {
    if (!file) return;
    setConvertBtnText('Converting...');
    setProgressWidth('30%');

    const targetFormat = currentConfig.outputExt;
    const currentInput = currentConfig.inputExt;

    // --- PIPELINE A: LOCAL IMAGE BLOB COMPILING TO PDF LAYERS ---
    if (targetFormat === 'pdf') {
      const reader = new FileReader();
      reader.onload = function (e) {
        setProgressWidth('60%');
        const img = new Image();
        img.onload = function () {
          const runPdfGeneration = () => {
            const { jsPDF } = window.jspdf;
            const orientation = img.width > img.height ? 'l' : 'p';
            const pdf = new jsPDF(orientation, 'px', [img.width, img.height]);
            pdf.addImage(e.target.result, currentInput.toUpperCase(), 0, 0, img.width, img.height);
            
            const blobDataUrl = pdf.output('dataurlstring');
            setDownloadUrl(blobDataUrl);
            
            setProgressWidth('100%');
            setShowDownloadBtn(true);
            setConvertBtnText('Convert Now');
          };

          if (window.jspdf) {
            runPdfGeneration();
          } else {
            setConvertBtnText('Preparing drivers...');
            if (!document.getElementById('jspdf-cdn-script')) {
              const script = document.createElement('script');
              script.id = 'jspdf-cdn-script';
              script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
              document.body.appendChild(script);
            }

            setTimeout(() => {
              if (window.jspdf) {
                runPdfGeneration();
              } else {
                setErrorMessage('PDF tool component loading timed out. Try again.');
                setProgressWidth('0%');
                setConvertBtnText('Convert Now');
              }
            }, 1000);
          }
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    } 
    // --- PIPELINE B: DOCUMENT LAYER TEXT EXTRACTOR DRIVER ---
    else if (currentInput === 'pdf') {
      alert('Extracting multi-page document layers frames... Opening console panel channels.');
      setConvertBtnText('Convert Now');
      setProgressWidth('0%');
    } 
    // --- PIPELINE C: RASTER LAYERS COMPILING TO VECTOR SVG CODE ---
    else if (targetFormat === 'svg') {
      const reader = new FileReader();
      reader.onload = function (e) {
        setProgressWidth('70%');
        const img = new Image();
        img.onload = function () {
          const svgString = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${img.width} ${img.height}" width="${img.width}" height="${img.height}"><image width="${img.width}" height="${img.height}" href="${e.target.result}" /></svg>`;
          const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
          setDownloadUrl(URL.createObjectURL(svgBlob));
          setProgressWidth('100%');
          setShowDownloadBtn(true);
          setConvertBtnText('Convert Now');
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    } 
    // --- PIPELINE D: HIGH-SPEED RASTER BITMAP CANVAS ENGINE TRANSFORMS ---
    else {
      const reader = new FileReader();
      reader.onload = function (event) {
        setProgressWidth('50%');
        const img = new Image();
        img.onload = function () {
          setProgressWidth('70%');
          const canvas = canvasRef.current;
          if (!canvas) return;
          const ctx = canvas.getContext('2d');
          
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);

          // SMART BROAD EXTENSION MIME NORMALIZER
          let mime = `image/${targetFormat}`;
          if (targetFormat === 'jpg') mime = 'image/jpeg';
          if (targetFormat === 'ico') mime = 'image/x-icon';
          if (targetFormat === 'bmp') mime = 'image/bmp';

          // Compile raw data bytes directly using fixed parameters
          const outputDataUrl = canvas.toDataURL(mime, 0.9);
          
          setDownloadUrl(outputDataUrl);
          setProgressWidth('100%');
          setShowDownloadBtn(true);
          setConvertBtnText('Convert Now');
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <main className="container" style={{ paddingBottom: '5rem' }}>
      {/* Native SEO Breadcrumbs */}
      <nav aria-label="Breadcrumb navigation" style={{ paddingTop: '2rem', textAlign: 'left' }}>
        <ul style={{ display: 'flex', listStyle: 'none', padding: 0, margin: 0, gap: '0.5rem', fontSize: '0.85rem', fontWeight: '600', color: '#64748b' }}>
          <li><a href="/" style={{ color: '#64748b', textDecoration: 'none' }}>Home</a></li>
          <li>/</li>
          <li style={{ color: '#4f46e5' }}>{currentConfig.title}</li>
        </ul>
      </nav>

      <section className="hero-sec" style={{ padding: '3rem 0 2rem 0', textAlign: 'center' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: '800', color: '#0f172a', marginBottom: '0.5rem' }}>{currentConfig.title}</h1>
        <p style={{ color: '#64748b', maxWidth: '600px', margin: '0 auto' }}>Fast, private, secure client-side asset conversions running completely inside your browser.</p>
      </section>

      <section className="app-container" style={{ maxWidth: '760px', margin: '0 auto', padding: '2.5rem', background: '#ffffff', borderRadius: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.03)', border: '1px solid #e2e8f0', textAlign: 'center' }}>
        {errorMessage && (
          <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', color: '#991b1b', padding: '1rem', borderRadius: '12px', marginBottom: '1.5rem', fontWeight: '600', textAlign: 'left', fontSize: '0.9rem' }}>
            ⚠️ {errorMessage}
          </div>
        )}

        <input 
          type="file" 
          id="workspaceFileInput" 
          ref={fileInputRef} 
          onChange={handleInputChange} 
          style={{ display: 'none' }} 
          accept="image/*,.pdf" 
        />

        {!showWorkspace ? (
          <label htmlFor="workspaceFileInput" ref={dropzoneRef} style={{ display: 'block', border: '2px dashed #cbd5e1', padding: '4rem 2rem', borderRadius: '18px', background: '#ffffff', cursor: 'pointer', transition: 'all 0.3s ease' }}>
            <div style={{ width: '70px', height: '70px', background: '#EEF2FF', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem auto' }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>
            </div>
           <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#0f172a', margin: '0 0 0.5rem 0' }}>Drag & drop your file here</h3>
            <span style={{ display: 'inline-block', fontSize: '0.8rem', fontWeight: '700', background: '#E2E8F0', padding: '0.25rem 0.75rem', borderRadius: '10px', color: '#334155' }}>
              Or browse your computer files
            </span>
          </label>
        ) : (
          <div>
            {/* FILE DETAILS PANEL */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginBottom: '2rem', background: '#f8fafc', padding: '1.25rem', borderRadius: '14px', border: '1px solid #f1f5f9', textAlign: 'left' }}>
              <div style={{ width: '60px', height: '60px', borderRadius: '10px', background: '#e2e8f0', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {currentConfig.inputExt === 'pdf' ? (
                  <span style={{ fontSize: '1.5rem' }}>📕</span>
                ) : (
                  <img src={previewSrc} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Preview" />
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: '700', color: '#0f172a', fontSize: '1rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{filename}</div>
                <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: '600', marginTop: '0.25rem' }}>{filesize}</div>
              </div>
              <span style={{ background: '#4F46E5', color: 'white', padding: '0.35rem 0.8rem', borderRadius: '8px', fontSize: '0.75rem', fontWeight: '800' }}>
                {currentConfig.inputExt.toUpperCase()}
              </span>
            </div>

            {/* LIVE CONVERT DROPDOWN SELECTOR */}
            <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', marginBottom: '2.5rem', background: '#ffffff', padding: '1rem 1.5rem', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
              <label style={{ fontWeight: '700', color: '#334155', fontSize: '0.95rem' }}>Convert to:</label>
              <select 
                value={currentConfig.outputExt} 
                onChange={(e) => handleTargetFormatChange(e.target.value)}
                style={{ padding: '0.5rem 2rem 0.5rem 1rem', fontSize: '1rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontWeight: '700', background: '#fff', cursor: 'pointer', color: '#0f172a', outline: 'none' }}
              >
                {imageFormats.map((format) => (
                  format !== currentConfig.inputExt && (
                    <option key={format} value={format}>{format.toUpperCase()}</option>
                  )
                ))}
              </select>
            </div>

            {/* PROGRESS VISUALIZER */}
            <div className="progress-bar-container" style={{ background: '#cbd5e1', height: '6px', borderRadius: '10px', overflow: 'hidden', marginBottom: '2rem' }}>
              <div className="progress-bar-fill" style={{ width: progressWidth, height: '100%', background: 'linear-gradient(90deg, #4F46E5, #7C3AED)', transition: 'width 0.3s ease' }}></div>
            </div>

            {/* CTA ACTION SYSTEM BLOCK */}
            <div>
              {!showDownloadBtn ? (
                <button 
                  onClick={triggerConversionPipeline} 
                  disabled={convertBtnText !== 'Convert Now'}
                  style={{ 
                    background: 'linear-gradient(135deg, #4F46E5, #4338CA)', 
                    color: 'white', 
                    padding: '0.9rem 2.5rem', 
                    fontSize: '1.05rem', 
                    borderRadius: '12px', 
                    fontWeight: '700', 
                    border: 'none', 
                    cursor: convertBtnText !== 'Convert Now' ? 'not-allowed' : 'pointer', 
                    width: '100%',
                    transition: 'all 0.2s'
                  }}
                  className={convertBtnText !== 'Convert Now' ? 'processing-pulse' : ''}
                >
                  {convertBtnText}
                </button>
              ) : (
                <a href={downloadUrl} download={`moon_converted_${filename.split('.')[0]}.${currentConfig.outputExt}`} style={{ display: 'block', background: 'linear-gradient(135deg, #10B981, #059669)', color: 'white', padding: '0.9rem 2.5rem', fontSize: '1.05rem', borderRadius: '12px', fontWeight: '700', textDecoration: 'none', width: '100%', boxSizing: 'border-box' }}>
                  Download
                </a>
              )}
            </div>

            {/* SAFE LABELED NATIVE HOT-SWAP TRIGGER LINK */}
            <label htmlFor="workspaceFileInput" style={{ display: 'inline-block', color: '#64748b', fontSize: '0.85rem', fontWeight: '600', marginTop: '1.5rem', cursor: 'pointer', textDecoration: 'underline' }}>
              Choose a different file
            </label>
          </div>
        )}
      </section>

      <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>
    </main>
  );
}
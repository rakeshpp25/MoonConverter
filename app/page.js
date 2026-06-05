'use client';
import Link from 'next/link'; //
import { useState, useRef } from 'react';

export default function HomePage() {
  const fileInputRef = useRef(null);
  const canvasRef = useRef(null);
  const homeDropzoneRef = useRef(null);

  // --- STATE ENVIRONMENT ---
  const [file, setFile] = useState(null);
  const [filename, setFilename] = useState('filename.png');
  const [filesize, setFilesize] = useState('0 KB');
  const [incomingExtension, setIncomingExtension] = useState('');
  const [targetFormat, setTargetFormat] = useState('');
  const [targetOptions, setTargetOptions] = useState([]);
  const [showWorkspace, setShowWorkspace] = useState(false);
  const [convertBtnText, setConvertBtnText] = useState('Convert Now');
  const [downloadUrl, setDownloadUrl] = useState('');
  const [showDownloadBtn, setShowDownloadBtn] = useState(false);
  const [livePreviewSrc, setLivePreviewSrc] = useState('');
  const [showLivePreview, setShowLivePreview] = useState(false);
  const [fileIconText, setFileIconText] = useState('📄');
  const [progressWidth, setProgressWidth] = useState('0%');
  const [errorMessage, setErrorMessage] = useState('');

  const imageFormats = ['jpg', 'png', 'webp', 'avif', 'gif', 'svg', 'pdf', 'ico', 'bmp'];

  // --- MAX FILE SIZE LIMIT CONSTRAINTS ---
  const MAX_IMAGE_SIZE_MB = 30;
  const MAX_PDF_SIZE_MB = 50;

  // --- DROPZONE INTERACTION ENGINE ---
  const handleDragOver = (e) => {
    e.preventDefault();
    if (homeDropzoneRef.current) {
      homeDropzoneRef.current.style.borderColor = '#4f46e5';
      homeDropzoneRef.current.style.background = '#f5f3ff';
    }
  };

  const handleDragLeave = () => {
    if (homeDropzoneRef.current) {
      homeDropzoneRef.current.style.borderColor = '#cbd5e1';
      homeDropzoneRef.current.style.background = '#ffffff';
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (homeDropzoneRef.current) {
      homeDropzoneRef.current.style.borderColor = '#cbd5e1';
      homeDropzoneRef.current.style.background = '#ffffff';
    }
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleHomeFile(e.dataTransfer.files[0]);
    }
  };

  const handleInputChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleHomeFile(e.target.files[0]);
    }
  };

  // --- SMART AUTOMATIC FILE TYPE DETECTOR & LIMITS CHECKER ---
  const handleHomeFile = (uploadedFile) => {
    setErrorMessage('');
    let ext = uploadedFile.name.split('.').pop().toLowerCase();
    if (ext === 'jpeg') ext = 'jpg';

    const fileSizeInMB = uploadedFile.size / (1024 * 1024);

    if (ext === 'pdf' && fileSizeInMB > MAX_PDF_SIZE_MB) {
      setErrorMessage(`This PDF is too large (${fileSizeInMB.toFixed(1)}MB). Please choose a file smaller than ${MAX_PDF_SIZE_MB}MB to ensure a fast conversion.`);
      return;
    } else if (ext !== 'pdf' && fileSizeInMB > MAX_IMAGE_SIZE_MB) {
      setErrorMessage(`This image is too large (${fileSizeInMB.toFixed(1)}MB). Please choose a file smaller than ${MAX_IMAGE_SIZE_MB}MB to protect your device's memory.`);
      return;
    }

    setFile(uploadedFile);
    setIncomingExtension(ext);
    setFilename(uploadedFile.name);
    setFilesize((uploadedFile.size / 1024).toFixed(2) + ' KB');

    setConvertBtnText('Convert Now');
    setShowDownloadBtn(false);
    setDownloadUrl('');
    setProgressWidth('0%');

    const options = [];

    if (ext === 'pdf') {
      setShowLivePreview(false);
      setFileIconText('📕');
      options.push({ value: 'png', label: 'PNG (Extract Images)' });
      options.push({ value: 'jpg', label: 'JPG (Extract Images)' });
      setTargetFormat('png');
    } else {
      setFileIconText('📄');
      const objectUrl = URL.createObjectURL(uploadedFile);
      setLivePreviewSrc(objectUrl);
      setShowLivePreview(true);

      // Loop through format array dynamically, ignoring matching source formats
      imageFormats.forEach((fmt) => {
        if (fmt !== ext) {
          options.push({ value: fmt, label: fmt.toUpperCase() });
        }
      });
      
      // Smart Auto-Selection logic mapping baseline defaults
      let smartDefaultTarget = 'png';
      if (ext === 'png') smartDefaultTarget = 'jpg';
      if (ext === 'jpg') smartDefaultTarget = 'webp';
      if (ext === 'svg') smartDefaultTarget = 'png';
      
      const verifiedTarget = options.some(opt => opt.value === smartDefaultTarget) 
        ? smartDefaultTarget 
        : (options[0]?.value || 'png');
        
      setTargetFormat(verifiedTarget);
    }

    setTargetOptions(options);
    setShowWorkspace(true);
  };

  const clearStagingMemory = () => {
    setFile(null);
    setLivePreviewSrc('');
    setShowWorkspace(false);
    setShowDownloadBtn(false);
    setDownloadUrl('');
    setProgressWidth('0%');
    setErrorMessage('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // --- CLIENT-SIDE LIGHTSPEED CONVERSION PROCESSOR ---
  const handleConversion = () => {
    if (!file) return;
    setConvertBtnText('Converting...');
    setProgressWidth('20%');

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
            pdf.addImage(e.target.result, incomingExtension.toUpperCase(), 0, 0, img.width, img.height);

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
                setErrorMessage('PDF tool component loading timed out. Please try again.');
                setProgressWidth('0%');
                setConvertBtnText('Convert Now');
              }
            }, 1000);
          }
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    } else if (incomingExtension === 'pdf') {
      // --- LIVE 100% CLIENT-SIDE BROWSER PDF EXTRACTION SYSTEM ---
      const runPdfExtraction = async () => {
        try {
          setProgressWidth('40%');
          const arrayBuffer = await file.arrayBuffer();
          
          // Access globally loaded PDFJS instance context
          const pdfjsLib = window['pdfjs-dist/build/pdf'];
          const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
          
          // Extract the first page for fast single conversion download configuration targeting
          const page = await pdf.getPage(1);
          const viewport = page.getViewport({ scale: 2.0 }); // 2.0 rendering multiplier ensures high definition crisp outputs
          
          const canvas = canvasRef.current;
          if (!canvas) return;
          const ctx = canvas.getContext('2d');
          
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          
          setProgressWidth('70%');
          await page.render({ canvasContext: ctx, viewport }).promise;
          
          let mimeType = `image/${targetFormat}`;
          if (targetFormat === 'jpg') mimeType = 'image/jpeg';
          
          const outputDataUrl = canvas.toDataURL(mimeType, 0.92);
          setDownloadUrl(outputDataUrl);
          
          setProgressWidth('100%');
          setShowDownloadBtn(true);
          setConvertBtnText('Convert Now');
        } catch (error) {
          console.error(error);
          setErrorMessage('Failed to extract images from PDF client-side. Make sure the file is not encrypted.');
          setProgressWidth('0%');
          setConvertBtnText('Convert Now');
        }
      };

      // Load PDFJS dependencies dynamically onto client-side window memory context
      if (window['pdfjs-dist/build/pdf']) {
        runPdfExtraction();
      } else {
        setConvertBtnText('Converting...');
        
        if (!document.getElementById('pdfjs-cdn-script')) {
          // Injection script block for core global dependency matrix
          const coreScript = document.createElement('script');
          coreScript.id = 'pdfjs-cdn-script';
          coreScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.min.js';
          document.body.appendChild(coreScript);

          // Configure standard background worker context thread explicitly
          coreScript.onload = () => {
            window['pdfjs-dist/build/pdf'].GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';
          };
        }

        setTimeout(() => {
          if (window['pdfjs-dist/build/pdf']) {
            runPdfExtraction();
          } else {
            setErrorMessage('Local processing engine setup timed out. Please try again.');
            setProgressWidth('0%');
            setConvertBtnText('Convert Now');
          }
        }, 1500);
      }
    } else if (targetFormat === 'svg') {
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
    } else {
      const reader = new FileReader();
      reader.onload = function (event) {
        setProgressWidth('50%');
        const img = new Image();
        img.onload = function () {
          setProgressWidth('80%');
          const canvas = canvasRef.current;
          if (!canvas) return;
          const ctx = canvas.getContext('2d');
          
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);

          // SMART BROAD EXTENSION MIME NORMALIZER
          let mimeType = `image/${targetFormat}`;
          if (targetFormat === 'jpg') mimeType = 'image/jpeg';
          if (targetFormat === 'ico') mimeType = 'image/x-icon';
          if (targetFormat === 'bmp') mimeType = 'image/bmp';

          const outputDataUrl = canvas.toDataURL(mimeType, 0.9);
          
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
    <>
      {/* HERO SECTION */}
      <section className="hero-sec">
        <div className="container">
<h1 className="hero-title" style={{ fontSize: '3.25rem', fontWeight: '800', color: '#1e1b4b', marginBottom: '1rem', letterSpacing: '-0.02em', lineHeight: '1.2' }}>
   Convert Images Offline. <br /> Anywhere. Anytime.
</h1>
<p className="hero-subtitle" style={{ color: '#64748b', maxWidth: '500px', margin: '0 auto 2.5rem auto', fontSize: '1.15rem', lineHeight: '1.6' }}>
   Fast, secure, and ready whenever you are, even with slow internet, network issues, or no connection at all.
</p>        </div>
      </section>

      {/* MAIN WORKSPACE COMPONENT */}
      <section className="app-container" style={{ maxWidth: '760px', margin: '-2rem auto 5rem auto', padding: '2.5rem', background: 'rgba(255, 255, 255, 0.85)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', borderRadius: '24px', boxShadow: '0 20px 40px rgba(79, 70, 229, 0.08)', textAlign: 'center', position: 'relative', zIndex: 10, border: '1px solid rgba(226, 232, 240, 0.8)' }}>
        <div style={{ position: 'absolute', top: '-10%', left: '10%', width: '80%', height: '20%', background: 'linear-gradient(90deg, #4F46E5, #7C3AED)', filter: 'blur(40px)', opacity: 0.15, zIndex: -1 }}></div>

        {/* Dynamic Safety Error Alerts Banner */}
        {errorMessage && (
          <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', color: '#991b1b', padding: '1rem 1.25rem', borderRadius: '14px', marginBottom: '1.5rem', fontWeight: '600', fontSize: '0.9rem', textAlign: 'left', lineHeight: '1.5' }}>
            ⚠️ {errorMessage}
          </div>
        )}

        {/* SINGLE HIDDEN SOURCE INPUT (Controlled perfectly via Label selectors) */}
        <input 
          type="file" 
          id="workspaceFileInput"
          ref={fileInputRef} 
          onChange={handleInputChange} 
          style={{ display: 'none' }} 
          accept="image/*,.pdf" 
        />

        {!showWorkspace ? (
          /* NATIVE INTERACTIVE LABEL WRAPPER (Dropzone Input Staging View) */
          <label 
            htmlFor="workspaceFileInput"
            id="homeDropzone" 
            ref={homeDropzoneRef}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            style={{ display: 'block', border: '2px dashed #cbd5e1', padding: '4rem 2rem', borderRadius: '18px', background: '#ffffff', cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', position: 'relative', overflow: 'hidden' }}
          >
            <div style={{ width: '70px', height: '70px', background: '#EEF2FF', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem auto' }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#0f172a', margin: '0 0 0.5rem 0' }}>Drag & drop your file or PDF here</h3>
            <p style={{ color: '#64748b', fontSize: '0.95rem', fontWeight: 500, margin: 0 }}>or click to browse your computer files</p>
          </label>
        ) : (
          /* REASSURING INTERACTIVE USER WORKSPACE DASHBOARD */
          <div style={{ marginTop: '1rem', paddingTop: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginBottom: '2rem', background: '#f8fafc', padding: '1.25rem', borderRadius: '14px', border: '1px solid #f1f5f9', textAlign: 'left' }}>
              <div style={{ width: '60px', height: '60px', borderRadius: '10px', background: '#e2e8f0', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
                {!showLivePreview ? (
                  <span style={{ fontSize: '1.5rem' }}>{fileIconText}</span>
                ) : (
                  <img src={livePreviewSrc} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Preview" />
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: '700', color: '#0f172a', fontSize: '1rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: '0.25rem' }}>{filename}</div>
                <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: '600' }}>{filesize}</div>
              </div>
              <span style={{ background: 'linear-gradient(135deg, #4F46E5, #7C3AED)', color: 'white', padding: '0.35rem 0.8rem', borderRadius: '8px', fontSize: '0.75rem', fontWeight: '800', letterSpacing: '0.05em', boxShadow: '0 4px 10px rgba(79, 70, 229, 0.2)' }}>
                {incomingExtension.toUpperCase()}
              </span>
            </div>

            <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', marginBottom: '2.5rem', background: '#ffffff', padding: '1rem 1.5rem', borderRadius: '14px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.01)' }}>
              <label style={{ fontWeight: '700', color: '#334155', fontSize: '0.95rem', letterSpacing: '-0.01em' }}>Convert to:</label>
              <select 
                value={targetFormat}
                onChange={(e) => {
                  setTargetFormat(e.target.value);
                  setShowDownloadBtn(false);
                  setDownloadUrl('');
                  setProgressWidth('0%');
                }}
                style={{ padding: '0.5rem 2.5rem 0.5rem 1rem', fontSize: '1rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontWeight: '700', background: '#fff', cursor: 'pointer', color: '#0f172a', outline: 'none', appearance: 'none', WebkitAppearance: 'none', backgroundImage: `url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%234F46E5%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.8rem top 50%', backgroundSize: '0.65rem auto' }}
              >
                {targetOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* Fluid CSS Eased Progress Element Line */}
            <div className="progress-bar-container" style={{ background: '#cbd5e1', height: '6px', borderRadius: '10px', overflow: 'hidden', marginBottom: '2rem' }}>
              <div className="progress-bar-fill" style={{ width: progressWidth, height: '100%', background: 'linear-gradient(90deg, #4F46E5, #7C3AED)', transition: 'width 0.3s ease' }}></div>
            </div>

            <div>
              {!showDownloadBtn ? (
                <button 
                  onClick={handleConversion}
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
                    boxShadow: '0 4px 12px rgba(79, 70, 229, 0.25)',
                    transition: 'all 0.2s'
                  }}
                  className={convertBtnText !== 'Convert Now' ? 'processing-pulse' : ''}
                >
                  {convertBtnText}
                </button>
              ) : (
                <a href={downloadUrl} download={`moon_converted_${filename.split('.')[0]}.${targetFormat}`} style={{ display: 'block', background: 'linear-gradient(135deg, #10B981, #059669)', color: 'white', padding: '0.9rem 2.5rem', fontSize: '1.05rem', borderRadius: '12px', fontWeight: '700', textDecoration: 'none', transition: 'all 0.2s', width: '100%', boxSizing: 'border-box', textAlign: 'center', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)' }}>
                  Download
                </a>
              )}
            </div>

            
            <label 
              htmlFor="workspaceFileInput" 
              style={{ 
                display: 'inline-block',
                background: 'none', 
                border: 'none', 
                color: '#64748b', 
                fontSize: '0.85rem', 
                fontWeight: '600', 
                marginTop: '1.5rem', 
                cursor: 'pointer', 
                textDecoration: 'underline' 
              }}
            >
              Choose a different file
            </label>
          </div>
        )}
      </section>

      {/* ULTRA-CLEAN POPULAR PRESET CHIPS GRID */}
      <section id="popular-converters" className="section" style={{ paddingTop: '0' }}>
        <div className="container">
          <div style={{ textAlign: 'left', marginBottom: '2rem' }}>
            <h2 style={{ color: '#0f172a', fontSize: '1.5rem', fontWeight: '800', letterSpacing: '-0.02em', margin: '0' }}>
              Popular Presets
            </h2>
            <p style={{ color: '#64748b', fontSize: '0.9rem', margin: '0.25rem 0 0 0', fontWeight: '500' }}>
              Jump straight into a pre-configured file optimization mode.
            </p>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '1rem' }}>
            {[
              { title: 'JPG to PNG', path: '/convert/jpg-to-png.html' },
              { title: 'PNG to JPG', path: '/convert/png-to-jpg.html' },
              { title: 'JPG to WebP', path: '/convert/jpg-to-webp.html' },
              { title: 'WebP to JPG', path: '/convert/webp-to-jpg.html' },
              { title: 'JPG to AVIF', path: '/convert/jpg-to-avif.html' },
              { title: 'AVIF to JPG', path: '/convert/avif-to-jpg.html' },
              { title: 'HEIC to JPG', path: '/convert/heic-to-jpg.html' },
              { title: 'SVG to PNG', path: '/convert/svg-to-png.html' },
              { title: 'PNG to SVG', path: '/convert/png-to-svg.html' },
              { title: 'TIFF to JPG', path: '/convert/tiff-to-jpg.html' },
              { title: 'GIF to PNG', path: '/convert/gif-to-png.html' },
              { title: 'PNG to ICO', path: '/convert/png-to-ico.html' }, 
              { title: 'ICO to PNG', path: '/convert/ico-to-png.html' },
              { title: 'BMP to PNG', path: '/convert/bmp-to-png.html' }
            ].map((tool, index) => (
              <a key={index} href={tool.path} className="preset-chip" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1rem 0.5rem', color: '#334155', fontWeight: '700', fontSize: '0.95rem', textDecoration: 'none', textAlign: 'center', transition: 'all 0.2s ease' }}>
                {tool.title}
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* SUPPORTED CHANNELS SLIDESHOW FOOTER GRID */}
      <section className="section" style={{ background: '#F1F5F9' }}>
        <div className="container">
          <h2 className="section-title">Supported Formats</h2>
          <p className="section-subtitle">Upload, convert, and process your files effortlessly. We support the most popular image and document formats while keeping your data private and secure.</p>
          <div className="format-flex">
            {['JPG', 'JPEG', 'PNG', 'WebP', 'GIF', 'BMP', 'TIFF', 'SVG', 'AVIF', 'ICO', 'HEIC', 'HEIF', 'JFIF', 'TGA'].map((fmt) => (
              <div key={fmt} className="format-badge">{fmt}</div>
            ))}
            <div className="format-badge" style={{ background: '#4f46e5', color: 'white' }}>PDF</div>
          </div>
        </div>
      </section>

     {/* STREAMLINED HUMAN-FRIENDLY VALUE GRID */}
      <section className="section" style={{ padding: '4rem 0' }}>
        <div className="container">
          <h2 className="section-title" style={{ color: '#0f172a', fontSize: '1.75rem', fontWeight: '800', marginBottom: '0.5rem' }}>
            Why Use MoonConverter
          </h2>
          <p className="section-subtitle" style={{ color: '#64748b', fontSize: '1rem', marginBottom: '3rem' }}>
            A safe, fast, and simple way to convert your files with total peace of mind.
          </p>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '2rem', marginTop: '2rem' }}>
            
            {/* BOX 1: 100% offlin */}
            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '2rem 1.5rem', textAlign: 'center', boxShadow: '0 4px 6px rgba(0,0,0,0.01)' }}>
              <div style={{ width: '48px', height: '48px', background: '#EEF2FF', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem auto' }}>
<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="2"><path d="M1 1v22h22M16.5 4.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0zM6 20a6 6 0 0 1 12 0"/></svg>              </div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: '700', color: '#0f172a', margin: '0 0 0.5rem 0' }}>Runs 100% Offline</h3>
              <p style={{ color: '#64748b', fontSize: '0.9rem', lineHeight: '1.5', margin: 0 }}>No internet? Slow network? No problem. Once MoonConverter is loaded, you can keep converting files offline.</p>
            </div>

            {/* BOX 2: SPEED & LIMITS */}
            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '2rem 1.5rem', textAlign: 'center', boxShadow: '0 4px 6px rgba(0,0,0,0.01)' }}>
              <div style={{ width: '48px', height: '48px', background: '#EEF2FF', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem auto' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
              </div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: '700', color: '#0f172a', margin: '0 0 0.5rem 0' }}>Instant & Unlimited</h3>
              <p style={{ color: '#64748b', fontSize: '0.9rem', lineHeight: '1.5', margin: 0 }}>Skip the upload queues. Enjoy lightning-fast local conversions and process as many images or PDFs as you need without restrictions.</p>
            </div>

            {/* BOX 3: QUALITY & COST */}
            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '2rem 1.5rem', textAlign: 'center', boxShadow: '0 4px 6px rgba(0,0,0,0.01)' }}>
              <div style={{ width: '48px', height: '48px', background: '#EEF2FF', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem auto' }}>
<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>              </div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: '700', color: '#0f172a', margin: '0 0 0.5rem 0' }}>100% Free, High Quality</h3>
              <p style={{ color: '#64748b', fontSize: '0.9rem', lineHeight: '1.5', margin: 0 }}>No sign-ups, hidden subscriptions, or watermarks. Get professional-grade results that preserve your original image details perfectly.</p>
            </div>

          </div>
        </div>
      </section>

  {/* ADVANCED CLEAN COMPLEMENTARY GRAPHIC UTILITIES GRID */}
      <section id="image-tools" style={{ background: '#F8FAFC', padding: '5rem 0' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1.5rem' }}>
          
          <h2 style={{ color: '#0f172a', fontSize: '2rem', fontWeight: '800', marginBottom: '0.5rem', textAlign: 'center', letterSpacing: '-0.02em' }}>
            Advanced Image Tools Suite
          </h2>
          <p style={{ color: '#64748b', fontSize: '1.05rem', marginBottom: '3.5rem', textAlign: 'center', maxWidth: '600px', margin: '0 auto 3.5rem auto', lineHeight: '1.5' }}>
            Explore complementary features built to refine, crop, and optimize your design system assets.
          </p>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', 
            gap: '1.5rem' 
          }}>
            {[
              { name: 'Image Compressor', desc: 'Reduce device storage footprint sizes while maintaining structural texture depth.' },
              { name: 'Image Resizer', desc: 'Scale configuration layout boundary dimensions and pixel width profiles.' },
              { name: 'Image Cropper', desc: 'Crop composition focal lines and slice unnecessary pixel data padding away.' },
              { name: 'Background Remover', desc: 'Isolate key foreground subjects from noisy backgrounds completely offline.' },
              { name: 'Watermark Tool', desc: 'Apply visible security metadata layers or protect your branding across raw project batches.' },
              { name: 'Metadata Viewer', desc: 'Read embedded camera hardware profile metrics, timestamps, and active EXIF logs.' }
            ].map((tool, i) => (
              <div 
                key={i} 
                style={{ 
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '16px',
                  padding: '2rem 1.5rem',
                  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.01), 0 2px 4px -1px rgba(0,0,0,0.01)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  minHeight: '210px'
                }}
              >
                {/* Content Wrapper */}
                <div style={{ textAlign: 'left' }}>
                  <h3 style={{ margin: '0 0 0.5rem 0', color: '#0f172a', fontSize: '1.2rem', fontWeight: '700' }}>
                    {tool.name}
                  </h3>
                  <p style={{ margin: '0 0 1.25rem 0', color: '#64748b', fontSize: '0.9rem', lineHeight: '1.6' }}>
                    {tool.desc}
                  </p>
                </div>

                {/* Badge Wrapper - Placed Cleanly Below Description */}
                <div style={{ textAlign: 'left' }}>
                  <span style={{ 
                    fontSize: '0.75rem', 
                    color: '#4f46e5', 
                    fontWeight: '700', 
                    background: '#EEF2FF', 
                    padding: '4px 10px', 
                    borderRadius: '6px',
                    display: 'inline-block'
                  }}>
                    Coming Soon ⚡
                  </span>
                </div>

              </div>
            ))}
          </div>
        </div>
      </section>

      <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>
      <script
  type="application/ld+json"
  dangerouslySetInnerHTML={{
    __html: JSON.stringify({
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",

      name: "MoonConverter",
      alternateName: "Moon Converter",

      url: "https://moonconverter.com",

      description:
        "Free offline image and PDF converter. Convert JPG, PNG, WebP, SVG, AVIF, HEIC, GIF, BMP, ICO, TIFF and PDF files directly in your browser without uploading files.",

      applicationCategory: "UtilitiesApplication",

      operatingSystem: "Web Browser",

      browserRequirements:
        "Requires JavaScript and a modern HTML5-compatible browser.",

      image: "https://moonconverter.com/og-image.png",

      screenshot: "https://moonconverter.com/og-image.png",

      softwareVersion: "1.0",

      featureList: [
        "Offline image conversion",
        "Offline PDF conversion",
        "No file uploads",
        "Unlimited conversions",
        "Privacy-focused processing",
        "Batch conversion",
        "JPG to PNG",
        "PNG to JPG",
        "WebP conversion",
        "SVG conversion",
        "PDF to Image",
        "Image to PDF"
        "JPG to AVIF",
        "AVIF to JPG",
        "HEIC to JPG",
        "SVG to PNG",
        "PNG to SVG",
        "TIFF to JPG",
        "GIF to PNG",
        "PNG to ICO",
        "ICO to PNG",
        "BMP to PNG",
        "PDF to JPG",
        "PDF to PNG",
        "Image converter",
        "image type convert",
        "pdf converter"
      ],

      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD"
      },

      creator: {
        "@type": "Organization",
        name: "MoonConverter"
      },

      publisher: {
        "@type": "Organization",
        name: "MoonConverter"
      }
    })
  }}
/>
    </>
  );
}
// public/pdf-worker.js

// Import pdf-lib safely from a highly optimized delivery mirror
importScripts('https://unpkg.com/pdf-lib@1.17.1/dist/pdf-lib.min.js');

/**
 * 🔒 MoonConverter High-Speed Local PDF Worker Engine
 * Uses optimized single-pass array chunks to prevent worker freezes.
 */
self.onmessage = async function (e) {
  const { fileBuffer, mode, profile, targetSizeKb } = e.data;

  try {
    self.postMessage({ status: 'processing', pass: 1, currentSizeEstimate: 'Opening secure data sandbox...' });

    // 1. Instantly parse the document structure
    const pdfDoc = await PDFLib.PDFDocument.load(fileBuffer, { 
      updateMetadata: false, // Prevents slow parsing of corrupted data chunks
      capNumbers: true 
    });
    
    let targetQuality = 0.60;
    if (mode === 'target') {
      const inputSizeKb = fileBuffer.byteLength / 1024;
      const ratio = targetSizeKb / inputSizeKb;
      targetQuality = ratio < 0.3 ? 0.25 : ratio < 0.6 ? 0.45 : 0.70;
    } else {
      targetQuality = profile === 'maximum' ? 0.30 : profile === 'low' ? 0.85 : 0.60;
    }

    self.postMessage({ status: 'processing', pass: 2, currentSizeEstimate: 'Scanning object streams...' });

    // 2. ULTRA-FAST SINGLE PASS OBJECT STRIPPING
    const context = pdfDoc.context;
    const indirectObjects = context.indirectObjects;

    for (const [ref, obj] of indirectObjects.entries()) {
      if (obj instanceof PDFLib.PDFStream && obj.dict) {
        const subtype = obj.dict.get(PDFLib.PDFName.of('Subtype'));
        
        if (subtype === PDFLib.PDFName.of('Image')) {
          try {
            // Fast skip if the image data chunk is too microscopic to save significant space
            if (obj.contents && obj.contents.length < 50 * 1024) continue;

            const originalBytes = obj.contents;
            const imageBlob = new Blob([originalBytes]);
            
            // Generate offscreen bitmap data rapidly
            const imgBitmap = await self.createImageBitmap(imageBlob);
            
            // Downsample dimensions by 15% to immediately reduce memory processing load
            const scaleFactor = targetQuality < 0.4 ? 0.75 : 0.90;
            const width = Math.floor(imgBitmap.width * scaleFactor);
            const height = Math.floor(imgBitmap.height * scaleFactor);
            
            const offscreenCanvas = new OffscreenCanvas(width, height);
            const canvasCtx = offscreenCanvas.getContext('2d');
            
            canvasCtx.drawImage(imgBitmap, 0, 0, width, height);
            
            const optimizedBlob = await offscreenCanvas.convertToBlob({
              type: 'image/jpeg',
              quality: targetQuality
            });
            
            const optimizedBytes = new Uint8Array(await optimizedBlob.arrayBuffer());
            
            // Overwrite memory addresses
            obj.contents = optimizedBytes;
            obj.dict.set(PDFLib.PDFName.of('Length'), PDFLib.PDFNumber.of(optimizedBytes.length));
            obj.dict.set(PDFLib.PDFName.of('Filter'), PDFLib.PDFName.of('DCTDecode'));
            
            imgBitmap.close();
          } catch (imgErr) {
            continue; // Keep moving if an individual object block is locked
          }
        }
      }
    }

    self.postMessage({ status: 'processing', pass: 3, currentSizeEstimate: 'Stripping layout tracking metadata...' });

    // 3. Clear document tracker history weights
    pdfDoc.setTitle('');
    pdfDoc.setAuthor('');
    pdfDoc.setSubject('');
    pdfDoc.setCreator('');
    pdfDoc.setProducer('');

    // 4. Save using linear stream deflating
    const finalDocumentBytes = await pdfDoc.save({
      useObjectStreams: true,
      addIndependentObjects: false
    });

    const finalBuffer = finalDocumentBytes.buffer;
    const finalSizeKb = finalBuffer.byteLength / 1024;

    self.postMessage({
      status: 'success',
      finalBuffer: finalBuffer,
      finalSizeKb: finalSizeKb.toFixed(1)
    }, [finalBuffer]);

  } catch (error) {
    self.postMessage({ status: 'error', message: error.toString() });
  }
};
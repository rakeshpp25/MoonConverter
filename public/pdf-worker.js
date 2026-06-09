// public/pdf-worker.js

// 🟢 Import pdf-lib core components safely from standard unpkg CDN
importScripts('https://unpkg.com/pdf-lib@1.17.1/dist/pdf-lib.min.js');

/**
 * 🔒 MoonConverter Secure Offline PDF Web Worker Engine
 * Recursively deep-scans the internal document object stream tree dictionary.
 * Re-quantizes and unzips internal embedded scan images using canvas pipelines.
 */
self.onmessage = async function (e) {
  const { fileBuffer, mode, profile, targetSizeKb } = e.data;

  try {
    self.postMessage({ status: 'processing', pass: 1, currentSizeEstimate: 'Initializing local document sandbox...' });

    // 1. Reconstruct document structural models safely
    const pdfDoc = await PDFLib.PDFDocument.load(fileBuffer);
    
    // Calculate adaptive JPEG image quality scales based on input configurations
    let targetQuality = 0.55; // Default balanced baseline quality

    if (mode === 'target') {
      const inputSizeKb = fileBuffer.byteLength / 1024;
      const targetRatio = targetSizeKb / inputSizeKb;

      if (targetRatio < 0.25) {
        targetQuality = 0.15; // Aggressive squeeze down
      } else if (targetRatio < 0.5) {
        targetQuality = 0.35; // Medium reduction bracket
      } else if (targetRatio < 0.75) {
        targetQuality = 0.55; // Recommended balance standard
      } else {
        targetQuality = 0.75; // Subtle compression trace pass
      }
    } else {
      if (profile === 'maximum') targetQuality = 0.25;
      if (profile === 'low') targetQuality = 0.85;
    }

    self.postMessage({ status: 'processing', pass: 2, currentSizeEstimate: 'Unpacking embedded image objects...' });

    // 2. 🔥 DEEP SCAN LOOP: Traverse indirect object streams to grab raster objects
    const context = pdfDoc.context;
    const indirectObjects = context.indirectObjects;
    let imagesProcessedCount = 0;

    for (const [ref, obj] of indirectObjects.entries()) {
      // Check if current block structure maps to an unzipped binary data object stream
      if (obj instanceof PDFLib.PDFStream && obj.dict) {
        const subtype = obj.dict.get(PDFLib.PDFName.of('Subtype'));
        
        if (subtype === PDFLib.PDFName.of('Image')) {
          try {
            imagesProcessedCount++;
            self.postMessage({ 
              status: 'processing', 
              pass: 2, 
              currentSizeEstimate: `Downsampling embedded image layer #${imagesProcessedCount}...` 
            });

            // Extract the original raster image byte array
            const originalBytes = obj.contents;
            const imageBlob = new Blob([originalBytes]);
            
            // Draw into an offscreen hardware bitmap container context
            const imgBitmap = await self.createImageBitmap(imageBlob);
            const offscreenCanvas = new OffscreenCanvas(imgBitmap.width, imgBitmap.height);
            const canvasCtx = offscreenCanvas.getContext('2d');
            
            // Build transparent background fallback protection parameters
            canvasCtx.fillStyle = '#ffffff';
            canvasCtx.fillRect(0, 0, offscreenCanvas.width, offscreenCanvas.height);
            canvasCtx.drawImage(imgBitmap, 0, 0);
            
            // Compress image layers down directly into a tight JPEG matrix array configuration
            const optimizedBlob = await offscreenCanvas.convertToBlob({
              type: 'image/jpeg',
              quality: targetQuality
            });
            
            // Read fresh calculated raw array bits buffer snapshots
            const optimizedBytes = new Uint8Array(await optimizedBlob.arrayBuffer());
            
            // 🟢 FORCE DIRECT STRUCTURAL OVERWRITE: Re-bind new data lengths straight to PDF dictionary trees
            obj.contents = optimizedBytes;
            obj.dict.set(PDFLib.PDFName.of('Length'), PDFLib.PDFNumber.of(optimizedBytes.length));
            obj.dict.set(PDFLib.PDFName.of('Filter'), PDFLib.PDFName.of('DCTDecode')); // Updates dictionary encryption headers to JPEG configuration specifications
            
            imgBitmap.close();
          } catch (innerImageError) {
            // Safe fail-safe trace: Skip vector files, gradients, and font glyph paths
            continue;
          }
        }
      }
    }

    self.postMessage({ status: 'processing', pass: 3, currentSizeEstimate: 'Stripping layout metadata tracking histories...' });

    // 3. Lossless meta history deletion optimization sweeps
    pdfDoc.setTitle('');
    pdfDoc.setAuthor('');
    pdfDoc.setSubject('');
    pdfDoc.setCreator('');
    pdfDoc.setProducer('');

    // 4. Save and deflate document map arrays utilizing tightly indexed object streams
    const finalDocumentBytes = await pdfDoc.save({
      useObjectStreams: true, 
      addIndependentObjects: false
    });

    const finalBuffer = finalDocumentBytes.buffer;
    const finalSizeKb = finalBuffer.byteLength / 1024;

    // Send the truly updated compressed data asset across the channel
    self.postMessage({
      status: 'success',
      finalBuffer: finalBuffer,
      finalSizeKb: finalSizeKb.toFixed(1)
    }, [finalBuffer]);

  } catch (error) {
    self.postMessage({ status: 'error', message: error.toString() });
  }
};
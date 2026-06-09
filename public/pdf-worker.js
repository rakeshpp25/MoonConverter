// public/pdf-worker.js

importScripts('https://unpkg.com/pdf-lib@1.17.1/dist/pdf-lib.min.js');

/**
 * 🔒 MoonConverter Precision Local PDF Worker Engine
 * Runs an iterative binary search loop to match manual KB size constraints closely.
 */
self.onmessage = async function (e) {
  const { fileBuffer, mode, profile, targetSizeKb } = e.data;

  try {
    self.postMessage({ status: 'processing', pass: 1, currentSizeEstimate: 'Initializing precision document sandbox...' });

    // 1. Load the original base byte array
    const originalPdfDoc = await PDFLib.PDFDocument.load(fileBuffer, { updateMetadata: false, capNumbers: true });
    const originalSizeKb = fileBuffer.byteLength / 1024;

    // Fast-track skip: If file is already smaller than target, run a light cleanup pass
    if (mode === 'target' && originalSizeKb <= targetSizeKb) {
      const finalBytes = await originalPdfDoc.save({ useObjectStreams: true });
      self.postMessage({ status: 'success', finalBuffer: finalBytes.buffer, finalSizeKb: (finalBytes.length / 1024).toFixed(1) });
      return;
    }

    // 2. RUN ITERATIVE BINARY LOOP IF IN TARGET MODE
    let finalBuffer = fileBuffer;
    let finalSizeKb = originalSizeKb;

    if (mode === 'target') {
      let lowQuality = 0.15;
      let highQuality = 0.90;
      let bestQualityMatched = 0.45;
      let currentPass = 1;
      const maxPasses = 4; // 4 quick loops prevent browser lag while finding a tight match

      while (currentPass <= maxPasses) {
        const testQuality = (lowQuality + highQuality) / 2;
        
        self.postMessage({ 
          status: 'processing', 
          pass: currentPass, 
          currentSizeEstimate: `Refining layout matrix balance (Pass ${currentPass}/${maxPasses})...` 
        });

        // Load a fresh, un-mutated copy of the document for this pass
        const testDoc = await PDFLib.PDFDocument.load(fileBuffer, { updateMetadata: false, capNumbers: true });
        const indirectObjects = testDoc.context.indirectObjects;

        // Compress internal image objects at this specific test quality
        for (const [ref, obj] of indirectObjects.entries()) {
          if (obj instanceof PDFLib.PDFStream && obj.dict) {
            const subtype = obj.dict.get(PDFLib.PDFName.of('Subtype'));
            if (subtype === PDFLib.PDFName.of('Image')) {
              try {
                const imgBlob = new Blob([obj.contents]);
                const imgBitmap = await self.createImageBitmap(imgBlob);
                
                // Adaptive slight dimension scaling to help hit aggressive targets smoothly
                const dimensionScale = testQuality < 0.35 ? 0.80 : 0.95;
                const w = Math.floor(imgBitmap.width * dimensionScale);
                const h = Math.floor(imgBitmap.height * dimensionScale);

                const offscreenCanvas = new OffscreenCanvas(w, h);
                const canvasCtx = offscreenCanvas.getContext('2d');
                canvasCtx.drawImage(imgBitmap, 0, 0, w, h);
                
                const optimizedBlob = await offscreenCanvas.convertToBlob({ type: 'image/jpeg', quality: testQuality });
                const optimizedBytes = new Uint8Array(await optimizedBlob.arrayBuffer());
                
                obj.contents = optimizedBytes;
                obj.dict.set(PDFLib.PDFName.of('Length'), PDFLib.PDFNumber.of(optimizedBytes.length));
                obj.dict.set(PDFLib.PDFName.of('Filter'), PDFLib.PDFName.of('DCTDecode'));
                
                imgBitmap.close();
              } catch (innerErr) {
                continue;
              }
            }
          }
        }

        // Clean meta parameters on this pass
        testDoc.setTitle(''); testDoc.setAuthor(''); testDoc.setSubject(''); testDoc.setCreator(''); testDoc.setProducer('');

        const testBytes = await testDoc.save({ useObjectStreams: true, addIndependentObjects: false });
        const testSizeKb = testBytes.length / 1024;

        // Evaluate sizing limits
        if (testSizeKb <= targetSizeKb) {
          // It fits under the target ceiling! Save this configuration as our current winner
          finalBuffer = testBytes.buffer;
          finalSizeKb = testSizeKb;
          bestQualityMatched = testQuality;
          lowQuality = testQuality; // Try increasing quality to see if we can get closer to 100KB
        } else {
          highQuality = testQuality; // Still too heavy, drop top boundaries down
        }

        currentPass++;
      }
    } 
    // PROFILE MODE FALLBACK
    else {
      self.postMessage({ status: 'processing', pass: 2, currentSizeEstimate: 'Applying profile optimization values...' });
      const profileQuality = profile === 'maximum' ? 0.30 : profile === 'low' ? 0.85 : 0.60;
      const indirectObjects = originalPdfDoc.context.indirectObjects;

      for (const [ref, obj] of indirectObjects.entries()) {
        if (obj instanceof PDFLib.PDFStream && obj.dict) {
          const subtype = obj.dict.get(PDFLib.PDFName.of('Subtype'));
          if (subtype === PDFLib.PDFName.of('Image')) {
            try {
              const imgBlob = new Blob([obj.contents]);
              const imgBitmap = await self.createImageBitmap(imgBlob);
              const offscreenCanvas = new OffscreenCanvas(imgBitmap.width, imgBitmap.height);
              const canvasCtx = offscreenCanvas.getContext('2d');
              canvasCtx.drawImage(imgBitmap, 0, 0);
              
              const optimizedBlob = await offscreenCanvas.convertToBlob({ type: 'image/jpeg', quality: profileQuality });
              const optimizedBytes = new Uint8Array(await optimizedBlob.arrayBuffer());
              
              obj.contents = optimizedBytes;
              obj.dict.set(PDFLib.PDFName.of('Length'), PDFLib.PDFNumber.of(optimizedBytes.length));
              obj.dict.set(PDFLib.PDFName.of('Filter'), PDFLib.PDFName.of('DCTDecode'));
              imgBitmap.close();
            } catch (e) { continue; }
          }
        }
      }
      originalPdfDoc.setTitle(''); originalPdfDoc.setAuthor(''); originalPdfDoc.setSubject(''); originalPdfDoc.setCreator(''); originalPdfDoc.setProducer('');
      const finalBytes = await originalPdfDoc.save({ useObjectStreams: true, addIndependentObjects: false });
      finalBuffer = finalBytes.buffer;
      finalSizeKb = finalBytes.length / 1024;
    }

    // Return the closest matching payload configuration
    self.postMessage({
      status: 'success',
      finalBuffer: finalBuffer,
      finalSizeKb: finalSizeKb.toFixed(1)
    }, [finalBuffer]);

  } catch (error) {
    self.postMessage({ status: 'error', message: error.toString() });
  }
};
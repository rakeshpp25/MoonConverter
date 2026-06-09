// public/image-worker.js

/**
 * 🔒 MoonConverter Secure Offline Web Worker Engine
 * Runs completely isolated from the main UI thread to prevent browser tab freezing.
 * Processes images 100% locally on the client-side device.
 */
self.onmessage = async function (e) {
  const { fileBuffer, fileType, fileName, targetSizeKb, mode, qualitySliderValue } = e.data;
  
  try {
    // 1. Reconstruct the raw binary data array inside the worker's thread memory bubble
    const blob = new Blob([fileBuffer], { type: fileType });
    const bitmap = await self.createImageBitmap(blob);
    
    // Create an offscreen canvas context (natively supported inside browser Web Workers)
    const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
    const ctx = canvas.getContext('2d');
    
    // Anti-blackbox fallback rule: Handle standard JPEG opaque boundaries if alpha channels are missing
    if (fileType === 'image/jpeg' || fileType === 'image/jpg') {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    
    ctx.drawImage(bitmap, 0, 0);

    let finalBlob = blob;
    let finalSizeKb = fileBuffer.byteLength / 1024;
    let appliedQuality = qualitySliderValue / 100;

    // ---------------------------------------------------------------------------
    // 🎚️ MODE A: FIXED QUALITY SLIDER PROCESSING
    // ---------------------------------------------------------------------------
    if (mode === 'slider') {
      if (fileType === 'image/png') {
        // PNG uses lossless quantization. We can downsample color depth layers locally.
        finalBlob = await canvas.convertToBlob({ type: 'image/png' });
      } else {
        finalBlob = await canvas.convertToBlob({
          type: 'image/jpeg',
          quality: appliedQuality
        });
      }
      finalSizeKb = finalBlob.size / 1024;
    } 
    
    // ---------------------------------------------------------------------------
    // 🎯 MODE B: 5-PASS TARGET-SEEKING BINARY SEARCH ALGORITHM (Manual Target Size)
    // ---------------------------------------------------------------------------
    else {
      let lowQuality = 0.10;
      let highQuality = 0.95;
      let currentPass = 1;
      const maxPasses = 5;
      
      // If original file is already smaller than the user's manual target, keep original balance parameters
      if (finalSizeKb <= targetSizeKb) {
        if (fileType !== 'image/png') {
          finalBlob = await canvas.convertToBlob({ type: 'image/jpeg', quality: 0.90 });
          finalSizeKb = finalBlob.size / 1024;
        }
      } else {
        // Run binary iterations to find perfect quantization settings without crashing laptop
        while (currentPass <= maxPasses) {
          appliedQuality = (lowQuality + highQuality) / 2;
          
          let tempBlob;
          if (fileType === 'image/png') {
            // PNG fallback: Convert to high-grade JPEG to respect the hard size ceiling requested by user
            tempBlob = await canvas.convertToBlob({
              type: 'image/jpeg',
              quality: appliedQuality
            });
          } else {
            tempBlob = await canvas.convertToBlob({
              type: 'image/jpeg',
              quality: appliedQuality
            });
          }
          
          const tempSizeKb = tempBlob.size / 1024;
          
          // Evaluate current pass payload footprint boundary constraints
          if (tempSizeKb <= targetSizeKb) {
            finalBlob = tempBlob;
            finalSizeKb = tempSizeKb;
            lowQuality = appliedQuality; // Step up quality scale parameters to see if we can get closer
          } else {
            highQuality = appliedQuality; // Still too heavy, drop top bounds parameter down
          }
          
          // Communicate status variables to the homepage interface loader
          self.postMessage({
            status: 'processing',
            pass: currentPass,
            currentSizeEstimate: tempSizeKb.toFixed(0)
          });
          
          currentPass++;
        }
      }
    }

    // 3. Convert optimized data asset cleanly to ArrayBuffer to pass data back safely
    const finalBuffer = await finalBlob.arrayBuffer();
    
    // Transfer buffer ownership natively to maximize thread performance speed
    self.postMessage({
      status: 'success',
      finalBuffer: finalBuffer,
      finalSizeKb: finalSizeKb.toFixed(1),
      qualityPercentageUsed: Math.round(appliedQuality * 100),
      forcedFormatShift: fileType === 'image/png' && mode === 'target'
    }, [finalBuffer]);

  } catch (error) {
    self.postMessage({ status: 'error', message: error.toString() });
  }
};
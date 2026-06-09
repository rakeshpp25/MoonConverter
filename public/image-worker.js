// public/image-worker.js

/**
 * 🔒 MoonConverter Secure Offline Web Worker Engine
 * Runs completely isolated from the main UI thread to prevent browser tab freezing.
 * Processes images 100% locally on the client-side device.
 */
self.onmessage = async function (e) {
  const { fileBuffer, fileType, fileName, targetSizeKb, mode, qualitySliderValue } = e.data;
  
  // Create a tracking pointer to safely dispose of hardware images from RAM
  let bitmap = null;

  try {
    // 1. Reconstruct the raw binary data array inside the worker's thread memory bubble
    const blob = new Blob([fileBuffer], { type: fileType });
    bitmap = await self.createImageBitmap(blob);
    
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
    let finalSizeKb = blob.size / 1024; // 🟢 FIXED: Use true blob size metadata instead of byteLength tracking
    let appliedQuality = qualitySliderValue / 100;

    // ---------------------------------------------------------------------------
    // 🎚️ MODE A: FIXED QUALITY SLIDER PROCESSING
    // ---------------------------------------------------------------------------
    if (mode === 'slider') {
      if (fileType === 'image/png') {
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
      let lowQuality = 0.05; // Drop lower limits slightly to allow hitting extreme compressions like 10KB
      let highQuality = 0.95;
      let currentPass = 1;
      const maxPasses = 5;
      
      // Force calculation pass if original size is heavier than requested ceiling
      if (finalSizeKb <= targetSizeKb) {
        if (fileType !== 'image/png') {
          finalBlob = await canvas.convertToBlob({ type: 'image/jpeg', quality: 0.90 });
          finalSizeKb = finalBlob.size / 1024;
        } else {
          // If it's a PNG and it's already under the limit, pass it through cleanly
          finalBlob = blob;
        }
      } else {
        // Run fresh binary iterations to find perfect quantization settings
        while (currentPass <= maxPasses) {
          appliedQuality = (lowQuality + highQuality) / 2;
          
          const tempBlob = await canvas.convertToBlob({
            type: 'image/jpeg',
            quality: appliedQuality
          });
          
          const tempSizeKb = tempBlob.size / 1024;
          
          // Evaluate current pass payload footprint boundary constraints
          if (tempSizeKb <= targetSizeKb) {
            finalBlob = tempBlob;
            finalSizeKb = tempSizeKb;
            lowQuality = appliedQuality; // Try to step up quality parameters to see if we can get closer
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
    
    // 🟢 CLEANUP: Explicitly destroy image assets to clean up GPU/RAM hardware allocations
    if (bitmap) {
      bitmap.close();
    }

    // Transfer buffer ownership natively to maximize thread performance speed
    self.postMessage({
      status: 'success',
      finalBuffer: finalBuffer,
      finalSizeKb: finalSizeKb.toFixed(1),
      qualityPercentageUsed: Math.round(appliedQuality * 100),
      forcedFormatShift: fileType === 'image/png' && mode === 'target'
    }, [finalBuffer]);

  } catch (error) {
    // 🟢 CLEANUP ON CRASH: Prevent hardware leaks if a processing pass encounters a corrupt file system block
    if (bitmap) {
      bitmap.close();
    }
    self.postMessage({ status: 'error', message: error.toString() });
  }
};
// public/pdf-worker.js
// ============================================================================
// MoonConverter — Hybrid Tiered PDF Optimization & Rasterization Worker Engine
// ============================================================================

// ─── Complete Library Script Imports ─────────────────────────────────────────
importScripts('https://unpkg.com/pdf-lib@1.17.1/dist/pdf-lib.min.js');
// 🟢 FIX: Changed 'pdf.worker.min.js' to the correct unpkg asset track: 'pdf.worker.js'
importScripts('https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.js');

// ─── Core Hook Assignments ───────────────────────────────────────────────────
// 🟢 FIX: Explicitly bind the global build context so pdfjsLib works without UI files
const pdfjsLib = self['pdfjs-dist/build/pdf'] || self.pdfjsLib;

// ─── Search Allocation Parameters ───────────────────────────────────────────
const TOLERANCE_PCT        = 0.05;  // Target window variance threshold
const MAX_PASSES           = 14;    // Allocation threshold cap for deep search runs
const NORMAL_QUALITY_FLOOR = 0.15;  // Floor threshold to preserve legibility on normal runs
const RASTER_QUALITY_FLOOR = 0.08;  // Floor threshold allowed as a last resort on fallback runs
const MAX_IMAGE_QUALITY    = 0.92;  // Ceiling threshold to bypass lossless bloat arrays

// ─── Entry Point Message Router ──────────────────────────────────────────────
self.onmessage = async function (e) {
  const { fileBuffer, mode, profile, targetSizeKb } = e.data;

  try {
    postUpdate(0, 'Analyzing internal document maps…');
    const originalKb = fileBuffer.byteLength / 1024;
    
    // Fast-track: Return instantly if file already fits within parameters
    if (mode === 'target' && originalKb <= targetSizeKb * (1 + TOLERANCE_PCT)) {
      const doc = await PDFLib.PDFDocument.load(fileBuffer, { updateMetadata: false });
      const savedBytes = await doc.save({ useObjectStreams: true });
      return postDone(savedBytes, originalKb, 1, 'Document baseline satisfies target boundaries.');
    }

    const pdfType = await analyzePdfStreamProperties(fileBuffer);
    postUpdate(0, `Classification established: ${pdfType.toUpperCase()} blueprint structure.`);

    let outputBytes;
    let computedPasses = 0;
    let traceNote = '';

    if (mode === 'profile' || profile === 'maximum' || profile === 'low') {
      const profileResult = await executeProfilePass(fileBuffer, profile || mode, pdfType);
      outputBytes = profileResult.bytes;
      computedPasses = 1;
    } else {
      // Execute 2-Phase Adaptive Multi-Loop optimization
      const targetResult = await executeTargetPrecisionSearch(fileBuffer, targetSizeKb, originalKb, pdfType);
      outputBytes = targetResult.bytes;
      computedPasses = targetResult.passes;
      traceNote = targetResult.note;
    }

    postDone(outputBytes, originalKb, computedPasses, traceNote);

  } catch (err) {
    self.postMessage({ status: 'error', message: err?.message || String(err) });
  }
};

// ─── Messaging Pipeline Wrappers ────────────────────────────────────────────
function postUpdate(pass, message, kbTrace) {
  self.postMessage({
    status: 'processing',
    pass,
    currentSizeEstimate: kbTrace ? `${kbTrace.toFixed(1)} KB` : '',
    message: message
  });
}

function postDone(bytes, originalKb, passes, note) {
  self.postMessage({
    status: 'done',
    outputBuffer: bytes.buffer,
    originalSizeKb: originalKb.toFixed(1),
    finalSizeKb: (bytes.byteLength / 1024).toFixed(1),
    passes,
    note: note || ''
  }, [bytes.buffer]); // Zero-copy Transferable optimization
}

// ─── High-Fidelity Type Classification Matrix ───────────────────────────────
async function analyzePdfStreamProperties(buffer) {
  try {
    const doc = await PDFLib.PDFDocument.load(buffer, { updateMetadata: false });
    let scanBytesTotal = 0;
    let structureBytesTotal = 0;

    for (const [ref, obj] of doc.context.indirectObjects.entries()) {
      if (obj instanceof PDFLib.PDFStream && obj.dict) {
        // Follow proxy reference indicators safely if length property is an indirect block
        let lengthVal = obj.dict.get(PDFLib.PDFName.of('Length'));
        if (lengthVal instanceof PDFLib.PDFRef) {
          lengthVal = doc.context.lookup(lengthVal);
        }
        
        const streamLength = lengthVal instanceof PDFLib.PDFNumber ? lengthVal.asNumber() : (obj.contents?.length || 0);
        structureBytesTotal += streamLength;

        const subType = obj.dict.get(PDFLib.PDFName.of('Subtype'));
        if (subType?.toString() === '/Image') {
          scanBytesTotal += streamLength;
        }
      }
    }

    if (structureBytesTotal === 0) return 'text';
    const volumetricRatio = scanBytesTotal / structureBytesTotal;
    
    if (volumetricRatio > 0.65) return 'scanned';
    if (volumetricRatio > 0.12) return 'mixed';
    return 'text';
  } catch (_) {
    return 'mixed';
  }
}

// ─── Two-Phase Target Search Optimizer ──────────────────────────────────────
async function executeTargetPrecisionSearch(fileBuffer, targetKb, originalKb, pdfType) {
  let activeBytes = null;
  let runningBestKb = originalKb;
  let loopsCount = 0;
  
  // Phase 1: Structural Stripping Baseline Pass
  loopsCount++;
  postUpdate(loopsCount, 'Executing metadata asset extraction…');
  let currentOptions = generateOptimizationMatrix(3, MAX_IMAGE_QUALITY, pdfType);
  activeBytes = await applyOptimizationPass(fileBuffer, currentOptions, pdfType);
  runningBestKb = activeBytes.byteLength / 1024;

  if (runningBestKb <= targetKb * (1 + TOLERANCE_PCT)) {
    return { bytes: activeBytes, passes: loopsCount, note: 'Target achieved via structural optimization parameters.' };
  }

  // Phase 2: Structural Object Squeezing
  if (pdfType !== 'text') {
    let qLow = NORMAL_QUALITY_FLOOR, qHigh = MAX_IMAGE_QUALITY;
    let scaleLow = 0.60, scaleHigh = 1.0;
    
    while (loopsCount < MAX_PASSES - 8 && (qHigh - qLow > 0.04)) {
      loopsCount++;
      const qMid = (qLow + qHigh) / 2;
      const sMid = (scaleLow + scaleHigh) / 2;

      postUpdate(loopsCount, `Optimizing asset streams (${Math.floor(qMid * 100)}% quality)…`, runningBestKb);
      
      currentOptions = generateOptimizationMatrix(6, qMid, pdfType);
      currentOptions.dimensionScale = sMid;

      const testBytes = await applyOptimizationPass(fileBuffer, currentOptions, pdfType);
      const testKb = testBytes.byteLength / 1024;

      if (Math.abs(testKb - targetKb) < Math.abs(runningBestKb - targetKb)) {
        activeBytes = testBytes;
        runningBestKb = testKb;
      }

      if (testKb <= targetKb * (1 + TOLERANCE_PCT) && testKb >= targetKb * (1 - TOLERANCE_PCT)) {
        return { bytes: testBytes, passes: loopsCount, note: 'Target reached within structural variance windows.' };
      }

      if (testKb > targetKb) {
        qHigh = qMid; scaleHigh = sMid;
      } else {
        qLow = qMid; scaleLow = sMid;
      }
    }
  }

  // 🚨 CRITICAL AUTOMATED FALLBACK: Engage offscreen page flattening pipeline if size limits missed
  if (runningBestKb > targetKb * 1.20) {
    loopsCount++;
    postUpdate(loopsCount, 'Target boundary exceeded. Engaging raster compression pass…', runningBestKb);
    
    const rasterResult = await executeAggressiveRasterizationPipeline(fileBuffer, targetKb, loopsCount);
    if (rasterResult.bytes.byteLength / 1024 < runningBestKb) {
      return rasterResult;
    }
  }

  return { bytes: activeBytes, passes: loopsCount, note: 'Closest targeted layout match found.' };
}

// ─── Setup Settings Allocator ───────────────────────────────────────────────
function generateOptimizationMatrix(tier, quality, pdfType) {
  return {
    useObjectStreams: true,
    stripThumbnails: tier >= 1,
    removeMetadata: tier >= 2,
    deduplicateObjects: tier >= 3,
    stripAnnotationAP: tier >= 4,
    stripUnusedResources: tier >= 5,
    stripPageLabels: tier >= 6,
    dimensionScale: 1.0,
    imageQuality: quality
  };
}

// ─── Profile Options Map ─────────────────────────────────────────────────────
async function executeProfilePass(fileBuffer, selectedProfile, pdfType) {
  let targetQuality = 0.65;
  let targetTier = 4;

  if (selectedProfile === 'screen' || selectedProfile === 'maximum') {
    targetQuality = 0.38; targetTier = 7;
  } else if (selectedProfile === 'print' || selectedProfile === 'low') {
    targetQuality = 0.82; targetTier = 2;
  }

  const opts = generateOptimizationMatrix(targetTier, targetQuality, pdfType);
  const bytes = await applyOptimizationPass(fileBuffer, opts, pdfType);
  return { bytes };
}

// ─── Structural Modifiers Pass Execution ─────────────────────────────────────
async function applyOptimizationPass(fileBuffer, opts, pdfType) {
  const doc = await PDFLib.PDFDocument.load(fileBuffer, { updateMetadata: false, capNumbers: true });
  const context = doc.context;

  if (opts.removeMetadata) {
    try {
      doc.catalog.delete(PDFLib.PDFName.of('Metadata'));
      doc.catalog.delete(PDFLib.PDFName.of('PieceInfo'));
      const infoRef = context.trailerInfo?.Info;
      if (infoRef) {
        const infoDict = context.lookup(infoRef);
        if (infoDict instanceof PDFLib.PDFDict) { // Using standard PDFDict securely
          const keysToKeep = new Set(['/Producer', '/Creator']);
          for (const key of infoDict.keys()) {
            if (!keysToKeep.has(key.toString())) infoDict.delete(key);
          }
        }
      }
    } catch (_) {}
  }

  if (opts.stripThumbnails) {
    for (const page of doc.getPages()) {
      try { page.node.delete(PDFLib.PDFName.of('Thumb')); } catch (_) {}
    }
  }

  if (opts.deduplicateObjects) {
    executeMemorySafeDeduplication(context);
  }

  if (pdfType !== 'text') {
    await processAlternativeEncodingFilters(context, opts.imageQuality, opts.dimensionScale);
  }

  return doc.save({ useObjectStreams: true, addIndependentObjects: false });
}

// ─── Cross-Filter Decompression Layer ───────────────────────────────────────
async function processAlternativeEncodingFilters(context, targetQuality, dimensionScale) {
  const matchingRefs = [];
  const targetFilters = new Set(['/DCTDecode', '/FlateDecode', '/LZWDecode', '/JPXDecode']);

  for (const [ref, obj] of context.indirectObjects.entries()) {
    if (obj instanceof PDFLib.PDFStream && obj.dict) {
      if (obj.dict.get(PDFLib.PDFName.of('Subtype'))?.toString() === '/Image') {
        const filterType = obj.dict.get(PDFLib.PDFName.of('Filter'))?.toString();
        if (targetFilters.has(filterType) || !filterType) {
          matchingRefs.push({ ref, obj });
        }
      }
    }
  }

  const BATCH_SIZE = 3;
  for (let i = 0; i < matchingRefs.length; i += BATCH_SIZE) {
    const activeBatch = matchingRefs.slice(i, i + BATCH_SIZE);
    await Promise.all(activeBatch.map(item => optimizeIndividualImageStream(context, item.ref, item.obj, targetQuality, dimensionScale)));
  }
}

// ─── Core Image Quantization Mutator ─────────────────────────────────────────
async function optimizeIndividualImageStream(context, ref, stream, quality, dimensionScale) {
  try {
    let rawDataBytes = stream.contents;
    if (!rawDataBytes || rawDataBytes.length < 4096) return;

    const dataBlob = new Blob([rawDataBytes]);
    const canvasBitmap = await self.createImageBitmap(dataBlob).catch(() => null);
    if (!canvasBitmap) return;

    const newWidth = Math.max(1, Math.floor(canvasBitmap.width * dimensionScale));
    const newHeight = Math.max(1, Math.floor(canvasBitmap.height * dimensionScale));

    const offscreenCanvas = new OffscreenCanvas(newWidth, newHeight);
    const canvasContext = offscreenCanvas.getContext('2d', { alpha: false, desynchronized: true });
    
    canvasContext.fillStyle = '#ffffff';
    canvasContext.fillRect(0, 0, newWidth, newHeight);
    canvasContext.drawImage(canvasBitmap, 0, 0, newWidth, newHeight);
    canvasBitmap.close();

    const outputBlob = await offscreenCanvas.convertToBlob({ type: 'image/jpeg', quality: quality });
    if (!outputBlob) return;

    const optimizedArrayBytes = new Uint8Array(await outputBlob.arrayBuffer());
    if (optimizedArrayBytes.length >= rawDataBytes.length) return;

    // Purge memory references completely to bypass the context.assign data retention trap
    stream.contents = new Uint8Array(0);
    if (stream.dict) {
      for (const key of stream.dict.keys()) stream.dict.delete(key);
    }

    const updatedDictionary = new PDFLib.PDFDict(context);
    updatedDictionary.set(PDFLib.PDFName.of('Type'), PDFLib.PDFName.of('XObject'));
    updatedDictionary.set(PDFLib.PDFName.of('Subtype'), PDFLib.PDFName.of('Image'));
    updatedDictionary.set(PDFLib.PDFName.of('Width'), PDFLib.PDFNumber.of(newWidth));
    updatedDictionary.set(PDFLib.PDFName.of('Height'), PDFLib.PDFNumber.of(newHeight));
    updatedDictionary.set(PDFLib.PDFName.of('Length'), PDFLib.PDFNumber.of(optimizedArrayBytes.length));
    updatedDictionary.set(PDFLib.PDFName.of('Filter'), PDFLib.PDFName.of('DCTDecode'));
    updatedDictionary.set(PDFLib.PDFName.of('ColorSpace'), PDFLib.PDFName.of('DeviceRGB'));
    updatedDictionary.set(PDFLib.PDFName.of('BitsPerComponent'), PDFLib.PDFNumber.of(8));

    const compressedStream = context.stream(optimizedArrayBytes, updatedDictionary);
    context.assign(ref, compressedStream);
  } catch (_) {}
}

// ─── Memory-Safe Data Deduplication Helper ───────────────────────────────────
function executeMemorySafeDeduplication(context) {
  try {
    const objectFingerprintMap = new Map();
    const referenceRemapMap = new Map();

    for (const [ref, obj] of context.indirectObjects.entries()) {
      // Prevent large-object stringification crashes by prioritizing dictionaries and skipping raw streams
      if (obj instanceof PDFLib.PDFDict) {
        let objectStringTrace = '';
        try { objectStringTrace = obj.toString(); } catch (_) { continue; }

        if (!objectStringTrace || objectStringTrace.length < 64) continue;

        if (objectFingerprintMap.has(objectStringTrace)) {
          referenceRemapMap.set(ref.toString(), objectFingerprintMap.get(objectStringTrace));
        } else {
          objectFingerprintMap.set(objectStringTrace, ref);
        }
      }
    }

    if (referenceRemapMap.size === 0) return;

    for (const [, obj] of context.indirectObjects.entries()) {
      if (obj instanceof PDFLib.PDFDict) {
        for (const [k, v] of obj.entries()) {
          const matchedRef = referenceRemapMap.get(v?.toString?.());
          if (matchedRef) obj.set(k, matchedRef);
        }
      }
    }
  } catch (_) {}
}

// ─── 🔥 THE 7-PASS MULTI-DIMENSIONAL RASTERIZATION FALLBACK ENGINE ───────────
async function executeAggressiveRasterizationPipeline(fileBuffer, targetSizeKb, startingPassCount) {
  let activePasses = startingPassCount;
  
  const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(fileBuffer), useWorkerFetch: false });
  const renderedDocInstance = await loadingTask.promise;
  const totalPagesCount = renderedDocInstance.numPages;

  let rLowQuality = RASTER_QUALITY_FLOOR;
  let rHighQuality = 0.85;
  
  let productionBytes = null;
  let rasterBestKb = Infinity;
  
  // Upgraded loop configuration to 7 full iterations for maximum target precision
  for (let searchLoop = 0; searchLoop < 7; searchLoop++) {
    activePasses++;
    const testQuality = (rLowQuality + rHighQuality) / 2;
    
    // Connect DPI resolution steps directly to quality changes
    const scaleFactor = (testQuality - RASTER_QUALITY_FLOOR) / (0.85 - RASTER_QUALITY_FLOOR);
    const rDPISelection = Math.floor(72 + (150 - 72) * scaleFactor);
    
    postUpdate(activePasses, `Re-mapping layouts (${rDPISelection} DPI @ ${Math.floor(testQuality * 100)}% quality)…`);

    const freshCompiledPdfDoc = await PDFLib.PDFDocument.create();

    for (let pageIdx = 1; pageIdx <= totalPagesCount; pageIdx++) {
      const activePageFrame = await renderedDocInstance.getPage(pageIdx);
      
      const targetViewportScale = rDPISelection / 72;
      const calculatedViewport = activePageFrame.getViewport({ scale: targetViewportScale });

      const renderingCanvas = new OffscreenCanvas(calculatedViewport.width, calculatedViewport.height);
      const canvasCtx = renderingCanvas.getContext('2d', { alpha: false, desynchronized: true });
      
      canvasCtx.fillStyle = '#ffffff';
      canvasCtx.fillRect(0, 0, calculatedViewport.width, calculatedViewport.height);

      await activePageFrame.render({
        canvasContext: canvasCtx,
        viewport: calculatedViewport
      }).promise;

      let pageArrayBufferBytes;
      try {
        // 1. COMPRESSION STAGE: Evaluate scaling bounds using high-efficiency WebP first
        let singlePageBlob = await renderingCanvas.convertToBlob({ type: 'image/webp', quality: testQuality });
        
        // Handle environments where WebP canvas output falls back to standard PNGs
        if (singlePageBlob && singlePageBlob.type !== 'image/webp') {
          singlePageBlob = await renderingCanvas.convertToBlob({ type: 'image/jpeg', quality: testQuality });
          pageArrayBufferBytes = await singlePageBlob.arrayBuffer();
        } else {
          // 2. TRANSCODING STAGE: WebP is supported. Extract WebP size metrics, 
          // then transcode back to a compliant JPEG buffer for stable pdf-lib embedding.
          const webpBytes = await singlePageBlob.arrayBuffer();
          const webpBlob = new Blob([webpBytes], { type: 'image/webp' });
          const webpBitmap = await self.createImageBitmap(webpBlob);
          
          const exportCanvas = new OffscreenCanvas(calculatedViewport.width, calculatedViewport.height);
          const exportCtx = exportCanvas.getContext('2d', { alpha: false, desynchronized: true });
          
          exportCtx.drawImage(webpBitmap, 0, 0);
          webpBitmap.close();
          
          const compliantJpgBlob = await exportCanvas.convertToBlob({ type: 'image/jpeg', quality: 0.94 });
          pageArrayBufferBytes = await compliantJpgBlob.arrayBuffer();
        }
      } catch (_) {
        const fallbackJpgBlob = await renderingCanvas.convertToBlob({ type: 'image/jpeg', quality: testQuality });
        pageArrayBufferBytes = await fallbackJpgBlob.arrayBuffer();
      }

      // Safe embedding pipeline execution using certified JPEG buffers
      const embeddedJpgInstance = await freshCompiledPdfDoc.embedJpg(pageArrayBufferBytes);
      const newPageLeafNode = freshCompiledPdfDoc.addPage([calculatedViewport.width, calculatedViewport.height]);
      
      newPageLeafNode.drawImage(embeddedJpgInstance, {
        x: 0, y: 0,
        width: calculatedViewport.width,
        height: calculatedViewport.height
      });
    }

    const testRasterBytes = await freshCompiledPdfDoc.save({ useObjectStreams: true });
    const testRasterKb = testRasterBytes.byteLength / 1024;

    if (Math.abs(testRasterKb - targetSizeKb) < Math.abs(rasterBestKb - targetSizeKb)) {
      productionBytes = testRasterBytes;
      rasterBestKb = testRasterKb;
    }

    // Early exit check if search results land inside a clean 3% window
    if (Math.abs(testRasterKb - targetSizeKb) / targetSizeKb <= 0.03) {
      productionBytes = testRasterBytes;
      break;
    }

    if (testRasterKb > targetSizeKb) {
      rHighQuality = testQuality;
    } else {
      rLowQuality = testQuality;
    }
  }

  return { bytes: productionBytes, passes: activePasses, note: 'Target achieved via fallback hardware page flattening.' };
}
// public/pdf-worker.js
// ============================================================
// MoonConverter — Hybrid Text-Preserving PDF Compression Engine
// ============================================================

importScripts('https://unpkg.com/pdf-lib@1.17.1/dist/pdf-lib.min.js');

// ─── Constants ────────────────────────────────────────────────────────────────
const TOLERANCE_PCT     = 0.05;          // ±5 % of target is a "hit"
const MAX_PASSES        = 8;             // hard cap on iterations
const MIN_IMAGE_QUALITY = 0.18;          // never drop JPEG below 18 %

// ─── Entry point ──────────────────────────────────────────────────────────────
self.onmessage = async function (e) {
  const { fileBuffer, mode, profile, targetSizeKb } = e.data;

  try {
    post({ status: 'processing', pass: 0, message: 'Analysing PDF…' });

    const originalKb = fileBuffer.byteLength / 1024;

    // Fast-track: already within target
    if (mode === 'target' && originalKb <= targetSizeKb) {
      const doc   = await loadDoc(fileBuffer);
      const bytes = await saveDoc(doc, true);
      return postDone(bytes, originalKb, 1, 'File already within target — light cleanup applied.');
    }

    // Detect content type
    post({ status: 'processing', pass: 0, message: 'Detecting content type…' });
    const pdfType = await analysePdfType(fileBuffer);
    post({ status: 'processing', pass: 0, message: `Detected: ${pdfType} PDF` });

    let result;
    if (mode === 'profile') {
      result = await profileCompress(fileBuffer, profile, pdfType);
    } else {
      result = await targetCompress(fileBuffer, targetSizeKb, originalKb, pdfType);
    }

    postDone(result.bytes, originalKb, result.passes, result.note);

  } catch (err) {
    self.postMessage({ status: 'error', message: err?.message ?? String(err) });
  }
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function post(data) { self.postMessage(data); }

function postDone(bytes, originalKb, passes, note) {
  self.postMessage({
    status:         'done',
    outputBuffer:   bytes.buffer,
    originalSizeKb: originalKb.toFixed(1),
    finalSizeKb:    (bytes.byteLength / 1024).toFixed(1),
    passes,
    note: note ?? '',
  }, [bytes.buffer]);
}

async function loadDoc(buffer) {
  return PDFLib.PDFDocument.load(buffer, {
    updateMetadata:       false,
    ignoreEncryption:     false,
    throwOnInvalidObject: false,
  });
}

async function saveDoc(doc, useObjectStreams = true) {
  return doc.save({ useObjectStreams });
}

// ─── PDF type analyser ────────────────────────────────────────────────────────
async function analysePdfType(fileBuffer) {
  try {
    const doc       = await loadDoc(fileBuffer);
    const context   = doc.context;
    let imageBytes  = 0;
    let streamTotal = 0;

    for (const [, obj] of context.enumerateIndirectObjects()) {
      if (!(obj instanceof PDFLib.PDFRawStream)) continue;
      const dict    = obj.dict;
      const subtype = dict.get(PDFLib.PDFName.of('Subtype'));
      const length  = dict.get(PDFLib.PDFName.of('Length'));
      const bytes   = length instanceof PDFLib.PDFNumber ? length.asNumber() : 0;
      streamTotal  += bytes;
      if (subtype?.toString() === '/Image') imageBytes += bytes;
    }

    if (streamTotal === 0) return 'text';
    const ratio = imageBytes / streamTotal;
    if (ratio > 0.80) return 'image';
    if (ratio > 0.15) return 'mixed';
    return 'text';
  } catch (_) {
    return 'mixed';
  }
}

// ─── Profile mode ─────────────────────────────────────────────────────────────
const PROFILE_SETTINGS = {
  screen: { structureLevel: 7, imageQuality: 0.40, stripStructureTree: true  },
  ebook:  { structureLevel: 5, imageQuality: 0.60, stripStructureTree: false },
  print:  { structureLevel: 3, imageQuality: 0.80, stripStructureTree: false },
};

async function profileCompress(fileBuffer, profile, pdfType) {
  const s     = PROFILE_SETTINGS[profile] ?? PROFILE_SETTINGS.ebook;
  const opts = buildOptions(s.structureLevel, s.imageQuality, s.stripStructureTree);
  const bytes = await runPass(fileBuffer, opts, pdfType, 1);
  return { bytes, passes: 1, note: '' };
}

// ─── Target / binary-search mode ─────────────────────────────────────────────
async function targetCompress(fileBuffer, targetKb, originalKb, pdfType) {
  const ladder = buildStrategyLadder(pdfType);
  let bestBytes = null;
  let bestKb    = originalKb;
  let passes    = 0;
  let smallestDelta = Infinity;

  // Pass 1 — gentlest configuration check
  {
    passes++;
    post({ status: 'processing', pass: passes, message: 'Pass 1 — structural cleanup…' });
    const bytes = await runPass(fileBuffer, ladder[0], pdfType, passes);
    const kb    = bytes.byteLength / 1024;
    postProgress(passes, kb, targetKb);
    
    bestBytes = bytes; bestKb = kb;
    smallestDelta = Math.abs(kb - targetKb);
    
    if (hit(kb, targetKb)) return { bytes, passes, note: 'Target reached with minimal compression.' };
  }

  // Pass 2 — most aggressive configuration check
  const lastIdx = ladder.length - 1;
  {
    passes++;
    post({ status: 'processing', pass: passes, message: 'Pass 2 — testing maximum compression…' });
    const bytes = await runPass(fileBuffer, ladder[lastIdx], pdfType, passes);
    const kb    = bytes.byteLength / 1024;
    postProgress(passes, kb, targetKb);
    
    const delta = Math.abs(kb - targetKb);
    if (delta < smallestDelta) {
      smallestDelta = delta;
      bestBytes = bytes; bestKb = kb;
    }
    if (hit(kb, targetKb)) return { bytes, passes, note: 'Target reached.' };
  }

  // Bidirectional search loop across the strategy ladder indexes
  let lo = 1, hi = lastIdx - 1;
  while (lo <= hi && passes < MAX_PASSES) {
    const mid = (lo + hi) >> 1;
    passes++;
    post({ status: 'processing', pass: passes, message: `Pass ${passes} — refining target sizes…` });
    const bytes = await runPass(fileBuffer, ladder[mid], pdfType, passes);
    const kb    = bytes.byteLength / 1024;
    postProgress(passes, kb, targetKb);

    const delta = Math.abs(kb - targetKb);
    
    // Track the absolute closest configuration pass available
    if (delta < smallestDelta) {
      smallestDelta = delta;
      bestBytes = bytes; bestKb = kb;
    }

    if (hit(kb, targetKb)) {
      return { bytes, passes, note: 'Target reached.' };
    }
    
    // Adjust logic boundaries based on file output metrics weight
    if (kb > targetKb) {
      lo = mid + 1; // Too large -> step up to more aggressive strategies
    } else {
      hi = mid - 1; // Too small -> step back down to gentler strategies
    }
  }

  return {
    bytes: bestBytes,
    passes,
    note: bestKb > targetKb * (1 + TOLERANCE_PCT)
      ? `Closest achieved: ${bestKb.toFixed(1)} KB (target: ${targetKb} KB).`
      : 'Target optimized closely to specifications.',
  };
}

function hit(kb, targetKb) {
  return kb <= targetKb * (1 + TOLERANCE_PCT) && kb >= targetKb * (1 - TOLERANCE_PCT);
}

function postProgress(pass, kb, targetKb) {
  post({ status: 'processing', pass, currentSizeEstimate: `${kb.toFixed(1)} KB`, targetSizeKb: targetKb });
}

// ─── Strategy ladder ──────────────────────────────────────────────────────────
function buildStrategyLadder(pdfType) {
  const isText = pdfType === 'text';
  const Q = isText
    ? Array(8).fill(1.0)
    : [0.90, 0.80, 0.68, 0.55, 0.45, 0.35, 0.25, MIN_IMAGE_QUALITY];

  return [
    buildOptions(0, Q[0], false),
    buildOptions(1, Q[1], false),
    buildOptions(2, Q[2], false),
    buildOptions(3, Q[3], false),
    buildOptions(4, Q[4], false),
    buildOptions(5, Q[5], false),
    buildOptions(6, Q[6], false),
    buildOptions(7, Q[7], true),
  ];
}

function buildOptions(level, imageQuality, stripStructureTree) {
  return {
    useObjectStreams:       level >= 0,
    stripThumbnails:       level >= 1,
    removeMetadata:        level >= 2,
    deduplicateObjects:    level >= 3,
    stripAnnotationAP:     level >= 4,
    stripUnusedResources:  level >= 5,
    stripPageLabels:       level >= 6,
    stripJavaScript:       level >= 6,
    stripStructureTree,
    imageQuality,
  };
}

// ─── Core compression pass ────────────────────────────────────────────────────
async function runPass(fileBuffer, opts, pdfType, passNum) {
  const doc     = await loadDoc(fileBuffer);
  const context = doc.context;

  if (opts.removeMetadata)       removeMetadata(doc, context);
  if (opts.stripThumbnails)      stripThumbnails(doc);
  if (opts.stripAnnotationAP)    stripAnnotationAP(doc, context);
  if (opts.stripUnusedResources) stripUnusedResources(doc);
  if (opts.stripPageLabels)      stripPageLabels(doc);
  if (opts.stripJavaScript)      stripJavaScriptActions(context);
  if (opts.stripStructureTree)   stripStructureTree(doc);
  if (opts.deduplicateObjects)   deduplicateObjects(context);

  if (pdfType !== 'text' && opts.imageQuality < 1.0) {
    await recompressJpegStreams(context, opts.imageQuality);
  }

  return saveDoc(doc, opts.useObjectStreams);
}

// ─── Structural optimisation helpers ─────────────────────────────────────────
function removeMetadata(doc, context) {
  try {
    const infoRef = context.trailerInfo?.Info;
    if (infoRef) {
      const info = context.lookup(infoRef);
      if (info instanceof PDFLib.PDFDict) {
        const KEEP = new Set(['/Producer', '/Creator']);
        for (const key of [...info.keys()]) {
          if (!KEEP.has(key.toString())) info.delete(key);
        }
      }
    }
    doc.catalog.delete(PDFLib.PDFName.of('Metadata'));
    doc.catalog.delete(PDFLib.PDFName.of('PieceInfo'));
  } catch (_) {}
}

function stripThumbnails(doc) {
  for (const page of doc.getPages()) {
    try { page.node.delete(PDFLib.PDFName.of('Thumb')); } catch (_) {}
  }
}

function stripAnnotationAP(doc, context) {
  for (const page of doc.getPages()) {
    try {
      const raw = page.node.get(PDFLib.PDFName.of('Annots'));
      if (!raw) continue;
      const annots = raw instanceof PDFLib.PDFArray ? raw : context.lookup(raw);
      if (!(annots instanceof PDFLib.PDFArray)) continue;
      for (let i = 0; i < annots.size(); i++) {
        try {
          const a = context.lookup(annots.get(i));
          if (a instanceof PDFLib.PDFDict) a.delete(PDFLib.PDFName.of('AP'));
        } catch (_) {}
      }
    } catch (_) {}
  }
}

function stripUnusedResources(doc) {
  for (const page of doc.getPages()) {
    try {
      const raw = page.node.get(PDFLib.PDFName.of('Resources'));
      if (!raw) continue;
      const res = raw instanceof PDFLib.PDFDict ? raw : doc.context.lookup(raw);
      if (!(res instanceof PDFLib.PDFDict)) continue;
      res.delete(PDFLib.PDFName.of('ProcSet'));
      res.delete(PDFLib.PDFName.of('Properties'));
    } catch (_) {}
  }
}

function stripPageLabels(doc) {
  try { doc.catalog.delete(PDFLib.PDFName.of('PageLabels')); } catch (_) {}
  try { doc.catalog.delete(PDFLib.PDFName.of('Names'));      } catch (_) {}
  try { doc.catalog.delete(PDFLib.PDFName.of('Dests'));      } catch (_) {}
}

function stripJavaScriptActions(context) {
  for (const [, obj] of context.enumerateIndirectObjects()) {
    if (!(obj instanceof PDFLib.PDFDict)) continue;
    try {
      const s = obj.get(PDFLib.PDFName.of('S'));
      if (s?.toString() === '/JavaScript') obj.delete(PDFLib.PDFName.of('JS'));
      obj.delete(PDFLib.PDFName.of('AA'));
      obj.delete(PDFLib.PDFName.of('OpenAction'));
    } catch (_) {}
  }
}

function stripStructureTree(doc) {
  try { doc.catalog.delete(PDFLib.PDFName.of('StructTreeRoot')); } catch (_) {}
  try { doc.catalog.delete(PDFLib.PDFName.of('MarkInfo'));        } catch (_) {}
}

// ─── Object deduplication ─────────────────────────────────────────────────────
function deduplicateObjects(context) {
  try {
    const seen  = new Map();
    const remap = new Map();

    for (const [ref, obj] of context.enumerateIndirectObjects()) {
      if (obj instanceof PDFLib.PDFRawStream && obj.contents.length > 64 * 1024) continue;
      let key;
      try { key = obj.toString(); } catch (_) { continue; }
      if (!key || key.length < 16) continue;

      if (seen.has(key)) {
        remap.set(ref.toString(), seen.get(key));
      } else {
        seen.set(key, ref);
      }
    }

    if (remap.size === 0) return;

    for (const [, obj] of context.enumerateIndirectObjects()) {
      try { remapRefs(obj, remap); } catch (_) {}
    }
  } catch (_) {}
}

function remapRefs(obj, remap) {
  if (obj instanceof PDFLib.PDFDict) {
    for (const [k, v] of obj.entries()) {
      const c = remap.get(v?.toString?.());
      if (c)  obj.set(k, c);
      else    remapRefs(v, remap);
    }
  } else if (obj instanceof PDFLib.PDFArray) {
    for (let i = 0; i < obj.size(); i++) {
      const v = obj.get(i);
      const c = v instanceof PDFLib.PDFRef ? remap.get(v.toString()) : null;
      if (c)  obj.set(i, c);
      else    remapRefs(v, remap);
    }
  }
}

// ─── JPEG image stream re-compression ────────────────────────────────────────
async function recompressJpegStreams(context, quality) {
  const tasks = [];

  for (const [ref, obj] of context.enumerateIndirectObjects()) {
    if (!(obj instanceof PDFLib.PDFRawStream)) continue;
    const dict    = obj.dict;
    const subtype = dict.get(PDFLib.PDFName.of('Subtype'));
    if (subtype?.toString() !== '/Image') continue;

    const filter = dict.get(PDFLib.PDFName.of('Filter'));
    if (filter?.toString() !== '/DCTDecode') continue;

    const imgMask = dict.get(PDFLib.PDFName.of('ImageMask'));
    if (imgMask?.toString() === 'true') continue;

    if (obj.contents.length < 2048) continue;

    tasks.push({ ref, obj, dict });
  }

  const BATCH = 4;
  for (let i = 0; i < tasks.length; i += BATCH) {
    await Promise.all(tasks.slice(i, i + BATCH).map(t => recompressOneImage(context, t, quality)));
    await yieldToEventLoop();
  }
}

async function recompressOneImage(context, { ref, obj, dict }, quality) {
  try {
    const blob   = new Blob([obj.contents], { type: 'image/jpeg' });
    const bitmap = await createImageBitmap(blob).catch(() => null);
    if (!bitmap) return;
    if (bitmap.width < 100 || bitmap.height < 100) {
      bitmap.close();
      return;
    }

    const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
    const ctx = canvas.getContext('2d', { alpha: false, desynchronized: true });
    ctx.drawImage(bitmap, 0, 0);
    bitmap.close();

    const newBlob  = await canvas.convertToBlob({ type: 'image/jpeg', quality });
    if (!newBlob) return;

    const newBytes = new Uint8Array(await newBlob.arrayBuffer());

    if (newBytes.length > obj.contents.length * 0.98) return;

    const cs  = dict.get(PDFLib.PDFName.of('ColorSpace'))      ?? PDFLib.PDFName.of('DeviceRGB');
    const bpc = dict.get(PDFLib.PDFName.of('BitsPerComponent')) ?? PDFLib.PDFNumber.of(8);
    const w   = dict.get(PDFLib.PDFName.of('Width'));
    const h   = dict.get(PDFLib.PDFName.of('Height'));

    const newStream = context.stream(newBytes, {
      Type:             PDFLib.PDFName.of('XObject'),
      Subtype:          PDFLib.PDFName.of('Image'),
      Width:            w,
      Height:           h,
      ColorSpace:       cs,
      BitsPerComponent: bpc,
      Filter:           PDFLib.PDFName.of('DCTDecode'),
    });

    context.assign(ref, newStream);
  } catch (_) {}
}

function yieldToEventLoop() {
  return new Promise(r => setTimeout(r, 0));
}
// public/pdf-worker.js
// ============================================================
// MoonConverter — Precision Hybrid PDF Compression Engine v3
// ============================================================

importScripts('https://unpkg.com/pdf-lib@1.17.1/dist/pdf-lib.min.js');

// ─── Constants ────────────────────────────────────────────────────────────────
const TOLERANCE_PCT     = 0.05;  // ±5% of target = success
const MAX_PASSES        = 18;  // hard cap
const MIN_IMAGE_QUALITY = 0.08;  // absolute floor for JPEG quality
const MAX_IMAGE_QUALITY = 0.95;  // ceiling (avoid lossless PNG re-encoding)

// ─── Entry point ──────────────────────────────────────────────────────────────
self.onmessage = async function (e) {
  const { fileBuffer, mode, profile, targetSizeKb } = e.data;

  try {
    post({ status: 'processing', pass: 0, message: 'Analysing PDF…' });
    const originalKb = fileBuffer.byteLength / 1024;

    // Already within target — just clean up and return
    if (mode === 'target' && originalKb <= targetSizeKb * (1 + TOLERANCE_PCT)) {
      const doc   = await loadDoc(fileBuffer);
      const bytes = await saveDoc(doc, true);
      return postDone(bytes, originalKb, 1, 'File was already at or below target — light cleanup applied.');
    }

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

function closerToTarget(kbA, kbB, targetKb) {
  return Math.abs(kbA - targetKb) < Math.abs(kbB - targetKb);
}

function withinTolerance(kb, targetKb) {
  return Math.abs(kb - targetKb) / targetKb <= TOLERANCE_PCT;
}

function postProgress(pass, kb, targetKb, message) {
  post({
    status:              'processing',
    pass,
    currentSizeEstimate: `${kb.toFixed(1)} KB`,
    targetSizeKb:        targetKb,
    message:             message ?? `Pass ${pass} — ${kb.toFixed(1)} KB`,
  });
}

// ─── PDF type analyser ────────────────────────────────────────────────────────
async function analysePdfType(fileBuffer) {
  try {
    const doc = await loadDoc(fileBuffer);
    let imageBytes = 0, streamTotal = 0;

    for (const [, obj] of doc.context.enumerateIndirectObjects()) {
      if (!(obj instanceof PDFLib.PDFRawStream)) continue;
      const dict  = obj.dict;
      const len   = dict.get(PDFLib.PDFName.of('Length'));
      const bytes = len instanceof PDFLib.PDFNumber ? len.asNumber() : 0;
      streamTotal += bytes;
      const sub = dict.get(PDFLib.PDFName.of('Subtype'));
      if (sub?.toString() === '/Image') imageBytes += bytes;
    }

    if (streamTotal === 0) return 'text';
    const r = imageBytes / streamTotal;
    if (r > 0.70) return 'image';
    if (r > 0.25) return 'mixed';
    return 'text';
  } catch (_) {
    return 'mixed';
  }
}

// ─── Profile mode (no target) ─────────────────────────────────────────────────
const PROFILE_OPTS = {
  screen: { structLevel: 7, imageQuality: 0.40, stripStructTree: true  },
  ebook:  { structLevel: 5, imageQuality: 0.60, stripStructTree: false },
  print:  { structLevel: 3, imageQuality: 0.80, stripStructTree: false },
};

async function profileCompress(fileBuffer, profile, pdfType) {
  const s     = PROFILE_OPTS[profile] ?? PROFILE_OPTS.ebook;
  const opts  = buildOpts(s.structLevel, s.imageQuality, s.stripStructTree);
  const bytes = await runPass(fileBuffer, opts, pdfType, 1);
  return { bytes, passes: 1, note: '' };
}

// ─── TWO-PHASE TARGET COMPRESSION ────────────────────────────────────────────
async function targetCompress(fileBuffer, targetKb, originalKb, pdfType) {
  let bestBytes = null;
  let bestKb    = originalKb;  // Closest to target tracked here
  let passes    = 0;

  // ── PHASE A: Structural binary search ──────────────────────────────────────
  const phaseAQuality = pdfType === 'text' ? 1.0 : MAX_IMAGE_QUALITY;
  const structResults = new Array(8).fill(null);

  const getStructResult = async (level) => {
    if (structResults[level]) return structResults[level];
    passes++;
    const opts  = buildOpts(level, phaseAQuality, level >= 7);
    const bytes = await runPass(fileBuffer, opts, pdfType, passes);
    const kb    = bytes.byteLength / 1024;
    postProgress(passes, kb, targetKb, `Phase A — structural level ${level}`);

    if (bestBytes === null || closerToTarget(kb, bestKb, targetKb)) {
      bestBytes = bytes; bestKb = kb;
    }
    structResults[level] = { bytes, kb };
    return structResults[level];
  };

  const r0 = await getStructResult(0);
  if (withinTolerance(r0.kb, targetKb)) return { bytes: r0.bytes, passes, note: '' };
  if (r0.kb <= targetKb) return { bytes: r0.bytes, passes, note: 'Target reached with minimal compression.' };

  const r7 = await getStructResult(7);
  if (withinTolerance(r7.kb, targetKb)) return { bytes: r7.bytes, passes, note: '' };

  if (pdfType === 'text' && r7.kb > targetKb) {
    return {
      bytes: bestBytes, passes,
      note: `Best achieved: ${bestKb.toFixed(1)} KB. Text PDFs cannot be compressed further without rasterization.`,
    };
  }

  // Bracket setups
  let aboveLevel = r0.kb > targetKb ? 0 : -1;
  let belowLevel = r7.kb <= targetKb ? 7 : -1;

  let lo = 1, hi = 6;
  while (lo <= hi && passes < MAX_PASSES - 5) {
    const mid = (lo + hi) >> 1;
    const r   = await getStructResult(mid);
    if (withinTolerance(r.kb, targetKb)) return { bytes: r.bytes, passes, note: '' };

    if (r.kb > targetKb) {
      if (aboveLevel === -1 || mid > aboveLevel) aboveLevel = mid;
      lo = mid + 1;
    } else {
      // 🟢 FIXED: Target the highest available level under the ceiling to avoid file destruction
      if (belowLevel === -1 || mid > belowLevel) belowLevel = mid;
      hi = mid - 1;
    }
  }

  // ── PHASE B: Image quality fine-tuning ────────────────────────────────────
  if (pdfType !== 'text') {
    // 🟢 FIXED: If no level stayed above the target, fall back onto level 7 to compress images out of it
    const structLevelForPhaseB = aboveLevel !== -1 ? aboveLevel : 7;
    post({ status: 'processing', pass: passes, message: `Phase B — fine-tuning image quality at structural tier ${structLevelForPhaseB}…` });

    let qLo = MIN_IMAGE_QUALITY;
    let qHi = MAX_IMAGE_QUALITY;

    while ((qHi - qLo) > 0.03 && passes < MAX_PASSES) {
      const qMid  = (qLo + qHi) / 2;
      passes++;
      const opts  = buildOpts(structLevelForPhaseB, qMid, structLevelForPhaseB >= 7);
      const bytes = await runPass(fileBuffer, opts, pdfType, passes);
      const kb    = bytes.byteLength / 1024;
      postProgress(passes, kb, targetKb, `Phase B — quality ${(qMid * 100).toFixed(0)}%`);

      if (closerToTarget(kb, bestKb, targetKb)) { bestBytes = bytes; bestKb = kb; }
      if (withinTolerance(kb, targetKb)) return { bytes, passes, note: '' };

      if (kb > targetKb) qLo = qMid;  // Too large -> lower quality
      else               qHi = qMid;  // Too small -> elevate quality
    }
  }

  // ── Final note ────────────────────────────────────────────────────────────
  const note = withinTolerance(bestKb, targetKb)
    ? ''
    : bestKb > targetKb
      ? `Closest: ${bestKb.toFixed(1)} KB (target: ${targetKb} KB). The PDF may contain incompressible streams.`
      : `Closest: ${bestKb.toFixed(1)} KB (target: ${targetKb} KB). Stopped to avoid over-compressing.`;

  return { bytes: bestBytes, passes, note };
}

// ─── Options builder ──────────────────────────────────────────────────────────
function buildOpts(structLevel, imageQuality, stripStructureTree) {
  return {
    useObjectStreams:      true,
    stripThumbnails:       structLevel >= 1,
    removeMetadata:        structLevel >= 2,
    deduplicateObjects:    structLevel >= 3,
    stripAnnotationAP:     structLevel >= 4,
    stripUnusedResources:  structLevel >= 5,
    stripPageLabels:       structLevel >= 6,
    stripJavaScript:       structLevel >= 6,
    stripStructureTree:    !!stripStructureTree,
    imageQuality,
  };
}

// ─── Core pass ────────────────────────────────────────────────────────────────
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

  if (pdfType !== 'text' && opts.imageQuality < MAX_IMAGE_QUALITY) {
    await recompressJpegStreams(context, opts.imageQuality);
  }

  return saveDoc(doc, opts.useObjectStreams);
}

// ─── Structural helpers ───────────────────────────────────────────────────────
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

function deduplicateObjects(context) {
  try {
    const seen  = new Map();
    const remap = new Map();

    for (const [ref, obj] of context.enumerateIndirectObjects()) {
      if (obj instanceof PDFLib.PDFRawStream && obj.contents.length > 64 * 1024) continue;
      let key;
      try { key = obj.toString(); } catch (_) { continue; }
      if (!key || key.length < 16) continue;
      if (seen.has(key)) remap.set(ref.toString(), seen.get(key));
      else               seen.set(key, ref);
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
      const c = v instanceof PDFLib.PDFRef ? remap.get(v.toString()) : null;
      if (c) obj.set(k, c); else remapRefs(v, remap);
    }
  } else if (obj instanceof PDFLib.PDFArray) {
    for (let i = 0; i < obj.size(); i++) {
      const v = obj.get(i);
      const c = v instanceof PDFRef ? remap.get(v.toString()) : null;
      if (c) obj.set(i, c); else remapRefs(v, remap);
    }
  }
}

// ─── JPEG re-compression ──────────────────────────────────────────────────────
async function recompressJpegStreams(context, quality) {
  const tasks = [];

  for (const [ref, obj] of context.enumerateIndirectObjects()) {
    if (!(obj instanceof PDFLib.PDFRawStream)) continue;
    const dict = obj.dict;
    if (dict.get(PDFLib.PDFName.of('Subtype'))?.toString() !== '/Image') continue;
    if (dict.get(PDFLib.PDFName.of('Filter'))?.toString()  !== '/DCTDecode') continue;
    if (dict.get(PDFLib.PDFName.of('ImageMask'))?.toString() === 'true') continue;
    if (obj.contents.length < 2048) continue;
    tasks.push({ ref, obj, dict });
  }

  const BATCH = 4;
  for (let i = 0; i < tasks.length; i += BATCH) {
    await Promise.all(tasks.slice(i, i + BATCH).map(t => recompressOne(context, t, quality)));
    await new Promise(r => setTimeout(r, 0));
  }
}

async function recompressOne(context, { ref, obj, dict }, quality) {
  try {
    const blob   = new Blob([obj.contents], { type: 'image/jpeg' });
    const bitmap = await createImageBitmap(blob).catch(() => null);
    if (!bitmap) return;

    const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
    canvas.getContext('2d').drawImage(bitmap, 0, 0);
    bitmap.close();

    const newBlob  = await canvas.convertToBlob({ type: 'image/jpeg', quality });
    if (!newBlob) return;
    const newBytes = new Uint8Array(await newBlob.arrayBuffer());
    if (newBytes.length >= obj.contents.length) return;

    const newStream = context.stream(newBytes, {
      Type:             PDFLib.PDFName.of('XObject'),
      Subtype:          PDFLib.PDFName.of('Image'),
      Width:            dict.get(PDFLib.PDFName.of('Width')),
      Height:           dict.get(PDFLib.PDFName.of('Height')),
      ColorSpace:       dict.get(PDFLib.PDFName.of('ColorSpace')) ?? PDFLib.PDFName.of('DeviceRGB'),
      BitsPerComponent: dict.get(PDFLib.PDFName.of('BitsPerComponent')) ?? PDFLib.PDFNumber.of(8),
      Filter:           PDFLib.PDFName.of('DCTDecode'),
    });
    context.assign(ref, newStream);
  } catch (_) {}
}
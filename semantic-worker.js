// ─── SMART SEARCH WORKER ─────────────────────────────
// Turns text into meaning vectors with a small multilingual model, away
// from the page so typing never waits for it. Task text only goes into the
// model here and is never sent anywhere. Model files come from the Hugging
// Face CDN on first use and Transformers.js keeps them in the browser
// cache, so later starts work offline.

import { env, pipeline } from './lib/transformers-4.3.2.min.js';

env.allowLocalModels = false;
// CPU build of the ONNX runtime: the small loader is a local copy, the
// 14 MB binary comes from the CDN at this exact version (too big for the
// repo) and Transformers.js caches it with the model
env.backends.onnx.wasm.wasmPaths = {
  mjs: new URL('lib/ort-wasm-simd-threaded-1.31.0-dev.20260914.mjs', import.meta.url).href,
  wasm: 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.31.0-dev.20260914-8d85527a0/dist/ort-wasm-simd-threaded.wasm',
};

// Model settings come from the page (semantic.js)
let model = null;
let extract = null;

// One job at a time. Queries go first and a newer query replaces one still
// waiting, so a long list of tasks never holds up the search.
const jobs = [];
let busy = false;

self.addEventListener('message', ({ data }) => {
  if (data.type === 'load') {
    load(data.model);
  } else if (data.type === 'embed') {
    if (data.kind === 'query') {
      const waiting = jobs.findIndex(job => job.kind === 'query');
      if (waiting !== -1) postMessage({ type: 'dropped', id: jobs.splice(waiting, 1)[0].id });
      jobs.unshift(data);
    } else {
      jobs.push(data);
    }
    next();
  }
});

async function load(settings) {
  model = settings;
  // Every file address uses the pinned revision, also where Transformers.js
  // leaves the revision out (it would ask for "main", which fails offline)
  env.remotePathTemplate = `{model}/resolve/${model.revision}/`;
  // Bytes so far for each file, added up for one progress bar
  const files = {};
  try {
    extract = await pipeline('feature-extraction', model.id, {
      revision: model.revision,
      dtype: model.dtype,
      device: 'wasm',
      progress_callback: info => {
        if (info.status !== 'progress' || !info.total) return;
        files[info.file] = info.loaded;
        postMessage({ type: 'progress', loaded: Object.values(files).reduce((a, b) => a + b, 0) });
      },
    });
    postMessage({ type: 'ready' });
    next();
  } catch (err) {
    postMessage({ type: 'error', message: String((err && err.message) || err) });
  }
}

async function next() {
  if (busy || !extract || !jobs.length) return;
  busy = true;
  const job = jobs.shift();
  try {
    const prefix = job.kind === 'query' ? model.queryPrefix : model.passagePrefix;
    // Average of the word vectors, scaled to length 1, as the model expects
    const output = await extract(job.texts.map(text => prefix + text), { pooling: 'mean', normalize: true });
    const size = output.dims[1];
    const vectors = job.texts.map((text, i) => output.data.slice(i * size, (i + 1) * size));
    postMessage({ type: 'vectors', id: job.id, vectors }, vectors.map(v => v.buffer));
  } catch (err) {
    postMessage({ type: 'error', message: String((err && err.message) || err) });
  }
  busy = false;
  // Lets messages that arrived meanwhile in before the next job
  setTimeout(next);
}

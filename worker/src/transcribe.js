// ─── TRANSCRIBE ──────────────────────────────────────
// POST /transcribe?lang=en|ar with a short voice recording as the body,
// for browsers whose own speech recognition can't reach its service
// (Brave) or has none. Workers AI's Whisper turns it into text in that
// language. The audio is never kept; logs hold its length only.

const MODEL = '@cf/openai/whisper-large-v3-turbo';
// What MediaRecorder makes in Chrome, Firefox and Safari
export const AUDIO_TYPES = ['audio/webm', 'audio/ogg', 'audio/mp4', 'audio/aac', 'audio/mpeg', 'audio/wav'];
// The app records at most 30 s at about 32 kbps (around 120 KB)
const MAX_AUDIO_BYTES = 640 * 1024;
const MIN_AUDIO_BYTES = 1024;
// Longer recordings are refused, so a slow-bitrate file gains nothing
const MAX_SECONDS = 35;
const MAX_TEXT = 300;
const LANGUAGES = ['en', 'ar'];

function checkAudio(bytes, lang) {
  if (!LANGUAGES.includes(lang) || bytes.byteLength < MIN_AUDIO_BYTES) return { error: 'bad_request' };
  return { input: { bytes, lang } };
}

async function transcribe(env, { bytes, lang }) {
  const answer = await env.AI.run(MODEL, {
    audio: toBase64(bytes),
    task: 'transcribe',
    language: lang,
    // Skips silence, where Whisper tends to make up words
    vad_filter: true,
    condition_on_previous_text: false,
  });
  const seconds = Number(answer?.transcription_info?.duration) || 0;
  console.log(JSON.stringify({ route: 'transcribe', bytes: bytes.byteLength, seconds: Math.round(seconds) }));
  if (seconds > MAX_SECONDS) return { error: 'too_long' };
  const text = typeof answer?.text === 'string' ? answer.text.replace(/\s+/g, ' ').trim() : '';
  return { text: Array.from(text).slice(0, MAX_TEXT).join('') };
}

// The route for index.js, beside the Claude ones in routes.js
export const TRANSCRIBE = { name: 'transcribe', audio: true, maxBytes: MAX_AUDIO_BYTES, check: checkAudio, run: transcribe };

// Workers have btoa but no Buffer; in chunks to keep the strings short
function toBase64(bytes) {
  let binary = '';
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(binary);
}

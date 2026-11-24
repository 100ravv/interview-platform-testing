import { env } from '../config/env.js';

let cachedLanguages = null;
let languageCacheUntil = 0;
const fallbackLanguages = [
  { id: 54, name: 'C++ (GCC 9.2.0)' },
  { id: 62, name: 'Java (OpenJDK 13.0.1)' },
  { id: 71, name: 'Python (3.8.1)' },
];

function configuration() {
  if (!env.JUDGE0_API_URL) {
    throw Object.assign(new Error('Code execution is not configured. Add JUDGE0_API_URL to server/.env.'), { statusCode: 503 });
  }
  return env.JUDGE0_API_URL.replace(/\/+$/, '');
}

function headers(json = false) {
  const result = json ? { 'Content-Type': 'application/json' } : {};
  if (env.JUDGE0_API_KEY) result[env.JUDGE0_API_KEY_HEADER] = env.JUDGE0_API_KEY;
  if (env.JUDGE0_RAPIDAPI_HOST) result['X-RapidAPI-Host'] = env.JUDGE0_RAPIDAPI_HOST;
  return result;
}

async function request(path, options = {}) {
  const response = await fetch(`${configuration()}${path}`, {
    ...options,
    headers: { ...headers(Boolean(options.body)), ...options.headers },
    signal: AbortSignal.timeout(20_000),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = payload.error || payload.message || `Judge0 returned HTTP ${response.status}.`;
    throw Object.assign(new Error(message), { statusCode: 502 });
  }
  return payload;
}

function supportedLanguages(languages) {
  const groups = [
    { match: (name) => /\bc\+\+|\bgcc\s*c\+\+/i.test(name), preferredId: 54 },
    { match: (name) => /^\s*java(?:\s|\(|$)/i.test(name), preferredId: 62 },
    { match: (name) => /\bpython\s*3\b/i.test(name), preferredId: 71 },
  ];
  return groups.flatMap(({ match, preferredId }) => {
    const matches = languages.filter((language) => match(language.name));
    matches.sort((a, b) => Number(b.id === preferredId) - Number(a.id === preferredId) || a.id - b.id);
    const language = matches[0];
    return language ? [{ id: language.id, name: language.name }] : [];
  });
}

export async function getLanguages() {
  if (!env.JUDGE0_API_URL) return fallbackLanguages;
  if (cachedLanguages && Date.now() < languageCacheUntil) return cachedLanguages;
  const languages = await request('/languages');
  if (!Array.isArray(languages)) throw Object.assign(new Error('Judge0 returned an invalid language list.'), { statusCode: 502 });
  cachedLanguages = supportedLanguages(languages);
  if (!cachedLanguages.length) throw Object.assign(new Error('Judge0 did not report Java, Python 3, or C++ as available.'), { statusCode: 502 });
  languageCacheUntil = Date.now() + 10 * 60 * 1000;
  return cachedLanguages;
}

export async function createExecution({ sourceCode, languageId, input, expectedOutput }) {
  const body = {
    source_code: Buffer.from(sourceCode, 'utf8').toString('base64'),
    language_id: languageId,
    stdin: Buffer.from(input, 'utf8').toString('base64'),
    expected_output: Buffer.from(expectedOutput, 'utf8').toString('base64'),
    cpu_time_limit: 2,
    wall_time_limit: 5,
    memory_limit: 128000,
    enable_network: false,
  };
  const result = await request('/submissions?base64_encoded=true&wait=false', { method: 'POST', body: JSON.stringify(body) });
  if (!result.token) throw Object.assign(new Error('Judge0 did not return a submission token.'), { statusCode: 502 });
  return result.token;
}

export async function getExecution(token) {
  const fields = 'stdout,stderr,compile_output,status,time,memory,message';
  const result = await request(`/submissions/${encodeURIComponent(token)}?base64_encoded=true&fields=${fields}`);
  const decode = (value) => value ? Buffer.from(value, 'base64').toString('utf8') : '';
  return {
    status: result.status?.description || 'Processing',
    statusId: result.status?.id,
    stdout: decode(result.stdout),
    stderr: decode(result.stderr),
    compileOutput: decode(result.compile_output),
    message: decode(result.message),
    time: result.time ?? null,
    memory: result.memory ?? null,
  };
}

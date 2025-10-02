// Ramps *users* (VUs) every minute; 80% reads, 20% writes.
// Good for finding the bottleneck of app + DB under mixed traffic.

import http from 'k6/http';
import { check, sleep } from 'k6';

// --- Configuration via environment variables ---
const BASE       = __ENV.BASE_URL;
const READ_PATH  = __ENV.READ_PATH  || '/read';
const WRITE_PATH = __ENV.WRITE_PATH || '/write';
const READ_RATIO = Number(__ENV.READ_RATIO || 0.8);
const THINK      = Number(__ENV.THINK || 0.2);

// VU ramp plan: start, step, steps, and per-step duration (usually 1m)
const START_VUS = Number(__ENV.START_VUS || 50);
const STEP_VUS  = Number(__ENV.STEP_VUS  || 50);
const STEPS     = Number(__ENV.STEPS     || 8);
const HOLD      = __ENV.HOLD || '1m'; // each stage lasts 1 minute by default

const stages = Array.from({ length: STEPS }, (_, i) => ({
  duration: HOLD,
  target: START_VUS + STEP_VUS * (i + 1),
}));

export const options = {
  scenarios: {
    vus_probe: {
      executor: 'ramping-vus',
      startVUs: START_VUS,
      stages,
      gracefulRampDown: '30s',
    },
  },
  thresholds: {
    // Abort once SLOs break (helps find your safe ceiling)
    'http_req_failed{endpoint:read}':   [{ threshold: 'rate<0.01', abortOnFail: true, delayAbortEval: '30s' }],
    'http_req_failed{endpoint:write}':  [{ threshold: 'rate<0.01', abortOnFail: true, delayAbortEval: '30s' }],
    'http_req_duration{endpoint:read}': [{ threshold: 'p(95)<300',  abortOnFail: true, delayAbortEval: '30s' }],
    'http_req_duration{endpoint:write}':[ { threshold: 'p(95)<450',  abortOnFail: true, delayAbortEval: '30s' }],
  },
};

export default function () {
  if (Math.random() < READ_RATIO) {
    const id = Math.floor(Math.random() * 100000);
    const res = http.get(`${BASE}${READ_PATH}?id=${id}&t=${__ITER}`, {
      headers: { 'Cache-Control': 'no-cache' },
      tags: { endpoint: 'read' },
    });
    check(res, { 'read 200': r => r.status === 200 });
  } else {
    const body = JSON.stringify({ value: Math.random().toString(36).slice(2) });
    const res = http.post(`${BASE}${WRITE_PATH}`, body, {
      headers: { 'Content-Type': 'application/json' },
      tags: { endpoint: 'write' },
    });
    check(res, { 'write ok': r => r.status === 200 || r.status === 201 });
  }
  sleep(THINK); // user "think time"
}

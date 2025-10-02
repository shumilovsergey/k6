// rw-hard.js
// Aggressive read/write RPS ramp to push server to hardware limits.
// Mixed traffic pattern (80% read, 20% write by default) without early abort.
// WARNING: This test will likely cause server degradation/failures.

import http from 'k6/http';
import { check } from 'k6';

const BASE = __ENV.BASE_URL;
const READ_PATH  = __ENV.READ_PATH  || '/read';
const WRITE_PATH = __ENV.WRITE_PATH || '/write';
const READ_RATIO = Number(__ENV.READ_RATIO || 0.8);

const STEP_DURATION = __ENV.STEP_DURATION || '1m';
const MAX_RPS = Number(__ENV.MAX_RPS || 5000);
const RPS_STEP = Number(__ENV.RPS_STEP || 500);

// Generate stages: 500 -> 1000 -> 1500 -> ... -> MAX_RPS
const steps = Math.ceil(MAX_RPS / RPS_STEP);
const stages = Array.from({ length: steps }, (_, i) => ({
  duration: STEP_DURATION,
  target: RPS_STEP * (i + 1),
}));

export const options = {
  scenarios: {
    rw_hard: {
      executor: 'ramping-arrival-rate',
      startRate: RPS_STEP / 2,  // start at half of first step
      timeUnit: '1s',
      preAllocatedVUs: 1000,    // larger pool for high RPS
      maxVUs: 10000,            // high safety cap
      stages,
    },
  },
  thresholds: {
    // Thresholds track metrics but DON'T abort - let it burn!
    'http_req_failed{endpoint:read}':   ['rate<0.50'],
    'http_req_failed{endpoint:write}':  ['rate<0.50'],
    'http_req_duration{endpoint:read}': ['p(95)<5000'],
    'http_req_duration{endpoint:write}':['p(95)<5000'],
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
    const body = JSON.stringify({
      payload: `load-test-${__VU}-${__ITER}-${Math.random().toString(36).slice(2)}`
    });
    const res = http.post(`${BASE}${WRITE_PATH}`, body, {
      headers: { 'Content-Type': 'application/json' },
      tags: { endpoint: 'write' },
    });
    check(res, { 'write ok': r => r.status === 200 || r.status === 201 });
  }
}

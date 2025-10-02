// rps-hard.js
// Aggressive RPS ramp to push server to hardware limits (CPU/RAM saturation).
// Runs full duration without early abort - use this to find infrastructure ceiling.
// WARNING: This test will likely cause server degradation/failures.

import http from 'k6/http';
import { check } from 'k6';

const BASE = __ENV.BASE_URL;
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
    rps_hard: {
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
    http_req_failed:   ['rate<0.50'],   // warn at >50% errors
    http_req_duration: ['p(95)<5000'],  // warn at p95 > 5s
  },
};

export default function () {
  const res = http.get(`${BASE}/?t=${__ITER}`);
  check(res, { '200': (r) => r.status === 200 });
}

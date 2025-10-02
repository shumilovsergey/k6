// rps-probe.js
// Increases target RPS each minute to find the ceiling.
// Stops early if p95 or error-rate thresholds are violated.
import http from 'k6/http';
import { check } from 'k6';

const BASE = __ENV.BASE_URL;

// Minute-by-minute steps (tweak as you like)
const stages = [
  { duration: '1m', target: 100 },
  { duration: '1m', target: 200 },
  { duration: '1m', target: 300 },
  { duration: '1m', target: 400 },
  { duration: '1m', target: 600 },
  { duration: '1m', target: 800 },
  { duration: '1m', target: 1000 },
];

export const options = {
  scenarios: {
    rps_probe: {
      executor: 'ramping-arrival-rate',
      startRate: 50,          // initial RPS
      timeUnit: '1s',
      preAllocatedVUs: 400,   // pool for generating arrivals
      maxVUs: 5000,           // safety cap
      stages,
    },
  },
  thresholds: {
    http_req_failed:   [{ threshold: 'rate<0.01', abortOnFail: true, delayAbortEval: '30s' }],
    http_req_duration: [{ threshold: 'p(95)<300', abortOnFail: true, delayAbortEval: '30s' }],
  },
};

export default function () {
  const res = http.get(`${BASE}/?t=${__ITER}`);
  check(res, { '200': (r) => r.status === 200 });
}

// ramp-vus.js
// Classic concurrent user ramp: up -> hold -> down.
import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE = __ENV.BASE_URL;
const THINK = Number(__ENV.THINK || 1);

export const options = {
  stages: [
    { duration: '2m', target: 100 },  // ramp to 100 users
    { duration: '2m', target: 200 },  // ramp to 200
    { duration: '2m', target: 400 },  // ramp to 400
    { duration: '5m', target: 400 },  // hold
    { duration: '1m', target: 0 },    // ramp down
  ],
  thresholds: {
    http_req_failed:   ['rate<0.01'],
    http_req_duration: ['p(95)<300'],
  },
};

export default function () {
  const res = http.get(`${BASE}/?t=${__ITER}`);
  check(res, { '200': (r) => r.status === 200 });
  sleep(THINK);
}

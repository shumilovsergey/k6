// smoke-url.js
import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE = __ENV.BASE_URL || 'https://test.sh-development.ru';

export const options = {
  vus: 5,
  duration: '30s',
  thresholds: {
    http_req_failed: ['rate<0.01'],     // <1% errors
    http_req_duration: ['p(95)<500'],   // p95 < 500ms
  },
};

export default function () {
  const res = http.get(`${BASE}/?t=${__ITER}`); // cache-buster
  check(res, { 'status 200': (r) => r.status === 200 });
  sleep(1);
}

# k6 Load Testing Scripts

Performance testing scripts for web applications using [k6](https://k6.io/) - a modern, developer-friendly load testing tool.

## Test Organization

- **test-local/** - High-intensity tests to find hardware/infrastructure limits. Run from server or same datacenter.
- **test-global/** - User experience tests simulating real-world usage. Run from laptop/remote locations.


## Installation

### macOS (Homebrew)
```bash
brew install k6
```

### Linux
```bash
# Debian/Ubuntu
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6

# Fedora/CentOS
sudo dnf install https://dl.k6.io/rpm/repo.rpm
sudo dnf install k6
```

## Running Tests

**IMPORTANT:** All tests require `BASE_URL` to be specified via `-e` flag:

```bash
# Local tests (run on server or same datacenter)
k6 run -e BASE_URL=http://localhost:8080 test-local/rps-hard.js

# Global tests (run from laptop/remote location)
k6 run -e BASE_URL=https://your-domain.com test-global/smoke-url.js
```

Override additional environment variables:
```bash
k6 run -e BASE_URL=https://example.com -e THINK=2 test-global/ramp-vus.js
```

## Available Scripts

### test-local/ (Infrastructure Stress Tests)
Run these from the server or same datacenter to eliminate network latency and find true hardware limits.

- **rps-probe.js** - RPS capacity finder (progressive RPS increase, stops at SLO breach)
- **rps-hard.js** - Aggressive RPS ramp to find hardware limits (CPU/RAM saturation, no early abort)
- **rw-hard.js** - Aggressive read/write RPS ramp with mixed traffic (80/20 by default, no early abort)
- **vus-probe-read-write.js** - Mixed read/write load with VU ramping (stops at SLO breach)

### test-global/ (User Experience Tests)
Run these from your laptop or remote locations to simulate real user experience with network latency.

- **smoke-url.js** - Quick smoke test (5 VUs, 30s)
- **ramp-vus.js** - Classic user ramp pattern (up → hold → down)

## Environment Variables

### Common (all scripts)
| Variable | Default | Description |
|----------|---------|-------------|
| `BASE_URL` | **Required** | Target base URL (e.g., `https://example.com`) |
| `THINK` | `1` or `0.2` | Sleep duration between requests (seconds) |

### rps-hard.js and rw-hard.js specific
| Variable | Default | Description |
|----------|---------|-------------|
| `MAX_RPS` | `5000` | Maximum target RPS to reach |
| `RPS_STEP` | `500` | RPS increment per step (500→1000→1500...) |
| `STEP_DURATION` | `1m` | Duration of each RPS stage |

### rw-hard.js additional options
| Variable | Default | Description |
|----------|---------|-------------|
| `READ_PATH` | `/read` | Read endpoint path |
| `WRITE_PATH` | `/write` | Write endpoint path |
| `READ_RATIO` | `0.8` | Ratio of read requests (0.8 = 80% reads) |

### vus-probe-read-write.js specific
| Variable | Default | Description |
|----------|---------|-------------|
| `READ_PATH` | `/read` | Read endpoint path |
| `WRITE_PATH` | `/write` | Write endpoint path |
| `READ_RATIO` | `0.8` | Ratio of read requests (0.8 = 80% reads) |
| `START_VUS` | `50` | Initial number of VUs |
| `STEP_VUS` | `50` | VU increment per step |
| `STEPS` | `8` | Number of ramp steps |
| `HOLD` | `1m` | Duration of each stage |


## Understanding Results

### Reading the Output

During test execution, you'll see live metrics:
```
rps_probe ✗ [>---------------] 0011/0400 VUs  0m32.0s/7m0s  0076.64 iters/s
```

- `✗` - Threshold failed (✓ = passing)
- `0011/0400 VUs` - Current active VUs / Pre-allocated VU pool
- `0m32.0s/7m0s` - Elapsed time / Total planned duration
- `0076.64 iters/s` - Current request rate (RPS for arrival-rate executors)

### Early Abort (Capacity Found)

```
ERRO[0032] thresholds on metrics 'http_req_duration' were crossed;
at least one has abortOnFail enabled, stopping test prematurely
```

This is **expected behavior** for `rps-probe.js` and `vus-probe-read-write.js`:
- Test stops when SLOs are violated (p95 latency or error rate)
- **The last successful stage** before abort = your system's safe capacity
- Example: Aborted at 32s means your system handles the load from the previous minute

### Key Metrics Summary

At test end, check:
- `http_req_duration` - Response times (p95, p99)
- `http_req_failed` - Error rate (should be <1%)
- `http_reqs` - Total successful requests
- `iterations` - Complete test iterations (one iteration = one user action)

**Tip:** For capacity tests, the RPS or VUs from the last *passing* stage is your target capacity.

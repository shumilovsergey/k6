# k6 Load Testing Scripts

Performance testing scripts for web applications using [k6](https://k6.io/).

## Quick Start

Run tests using Docker (no installation needed):

```bash
# Enter k6 container
docker-compose run k6

# Inside container, run tests
k6 run test-global/smoke-url.js

# With custom BASE_URL
k6 run -e BASE_URL=https://your-domain.com test-local/rps-hard.js

# Override multiple variables
k6 run -e BASE_URL=https://example.com -e THINK=2 test-global/ramp-vus.js
```

Your local files are mounted to `/k6` - any changes you make outside the container are immediately available inside.

## Test Organization

- **test-local/** - High-intensity tests to find hardware/infrastructure limits. Run from server or same datacenter.
- **test-global/** - User experience tests simulating real-world usage. Run from laptop/remote locations.

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



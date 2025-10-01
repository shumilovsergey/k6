# k6 Load Testing Scripts

Performance testing scripts for web applications using [k6](https://k6.io/) - a modern, developer-friendly load testing tool.


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

Basic execution:
```bash
k6 run smoke-url.js
```

With custom environment variables:
```bash
k6 run -e BASE_URL=https://example.com ramp-vus.js
```

## Available Scripts

- **smoke-url.js** - Quick smoke test (5 VUs, 30s)
- **ramp-vus.js** - Classic user ramp pattern (up → hold → down)
- **rps-probe.js** - RPS capacity finder (progressive RPS increase)
- **vus-probe-read-write.js** - Mixed read/write load with VU ramping

## Environment Variables

### Common (all scripts)
| Variable | Default | Description |
|----------|---------|-------------|
| `BASE_URL` | `https://test.sh-development.ru` | Target base URL |
| `THINK` | `1` or `0.2` | Sleep duration between requests (seconds) |

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

## Example Usage

```bash
# Smoke test your API
k6 run -e BASE_URL=https://api.example.com smoke-url.js

# Find RPS capacity
k6 run -e BASE_URL=https://api.example.com rps-probe.js

# Test with custom read/write mix
k6 run -e BASE_URL=https://api.example.com -e READ_RATIO=0.9 -e START_VUS=100 vus-probe-read-write.js
```

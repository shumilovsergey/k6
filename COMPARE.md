# Load Testing Results Comparison

This document compares performance metrics across different infrastructure configurations.

## Infrastructure Configurations

- **vps** - Single VPS server
- **hc-simple-cluster-3** - High-capacity simple 3-node cluster
- **hc-custom-cluster-3** - High-capacity custom 3-node cluster

## Test Results

| Test | vps | hc-simple-cluster-3 | hc-custom-cluster-3 |
|------|-----|---------------------|---------------------|
| **Hardware** | 0| 0| 0|
| **smoke-url** | 0| 0| 0|
| **ramp-vus** | 0| 0| 0|
| **probe-rps** | 0| 0| 0|
| **probe-rw-rps** | 0| 0| 0|
| **hard-rps** | 0| 0| 0|
| **hard-rw-rps** | 0| 0| 0|


## Example Filled Table

| Test | vps | hc-simple-cluster-3 | hc-custom-cluster-3 |
|------|-----|---------------------|---------------------|
| **Hardware** | 2 vCPU, 4GB RAM | 3×4 vCPU, 3×8GB RAM | 3×8 vCPU, 3×16GB RAM |
| **smoke-url** | p95: 120ms, 0% err | p95: 85ms, 0% err | p95: 65ms, 0% err |
| **ramp-vus** | p95: 180ms, 0.2% err | p95: 95ms, 0% err | p95: 75ms, 0% err |
| **probe-rps** | 450 RPS (abort@500) | 1800 RPS (abort@2000) | 3200 RPS (abort@3500) |
| **probe-rw-rps** | 380 RPS (abort@400) | 1500 RPS (abort@1700) | 2800 RPS (abort@3000) |
| **hard-rps** | 850@95%CPU, p95:3s | 4200@88%CPU, p95:1.8s | 7500@82%CPU, p95:1.2s |
| **hard-rw-rps** | 720@98%CPU, p95:4s | 3600@92%CPU, p95:2.1s | 6800@85%CPU, p95:1.5s |

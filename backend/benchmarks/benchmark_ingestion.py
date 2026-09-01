import time
import json
import os
import sys

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import rust_core

def generate_benchmark_data(filepath: str, num_records: int = 25000):
    print(f"Generating {num_records} synthetic transactions for benchmark...")
    transactions = []
    
    for i in range(num_records):
        transactions.append({
            "transaction_id": f"txn_{i}",
            "sender_id": f"acc_{i % 1000}",
            "receiver_id": f"acc_{(i + 1) % 1000}",
            "amount": float(i % 5000),
            "timestamp": "2026-09-02T12:00:00Z",
            "device_info": {
                "device_id": f"dev_{i % 500}",
                "ip_address": "192.168.1.1",
                "user_agent": "Mozilla/5.0 Benchmark Agent"
            }
        })
        
    with open(filepath, 'w') as f:
        json.dump(transactions, f)
    print(f"Saved to {filepath}")

def benchmark_pure_python(filepath: str):
    start = time.perf_counter()
    with open(filepath, 'r') as f:
        data = json.load(f)
        
    user_to_user = []
    user_to_device = []
    devices = []
    
    for txn in data:
        user_to_user.append((
            txn['sender_id'],
            txn['receiver_id'],
            txn['transaction_id'],
            txn['amount'],
            txn['timestamp'],
            txn['device_info']['device_id']
        ))
        user_to_device.append((
            txn['sender_id'],
            txn['device_info']['device_id']
        ))
        devices.append((
            txn['device_info']['device_id'],
            txn['device_info']['ip_address'],
            txn['device_info']['user_agent']
        ))
        
    duration = time.perf_counter() - start
    return duration

def benchmark_rust_core(filepath: str):
    start = time.perf_counter()
    _edge_list = rust_core.parse_transactions(filepath)
    duration = time.perf_counter() - start
    return duration

if __name__ == "__main__":
    test_file = "benchmark_data.json"
    num_records = 25000
    generate_benchmark_data(test_file, num_records)
    
    # Warmup
    print("Warming up...")
    benchmark_pure_python(test_file)
    benchmark_rust_core(test_file)
    
    print("Running Python Benchmark...")
    py_time = benchmark_pure_python(test_file)
    py_throughput = num_records / py_time
    
    print("Running Rust Benchmark...")
    rust_time = benchmark_rust_core(test_file)
    rust_throughput = num_records / rust_time
    
    speedup = py_time / rust_time
    
    # Clean up
    os.remove(test_file)
    
    # Save Results
    results = f"""# Rust Ingestion Benchmark Results

Benchmark performed on **{num_records:,} synthetic transaction records**, measuring the time to read from disk, parse JSON, and construct in-memory edge tuples.

| Engine | Execution Time (ms) | Throughput (Txns/sec) |
|---|---|---|
| Pure Python (`json` + dict parse) | {py_time * 1000:.2f} ms | {py_throughput:,.0f} |
| **Rust Core (PyO3 + Serde)** | **{rust_time * 1000:.2f} ms** | **{rust_throughput:,.0f}** |

## Result Summary
- The Rust PyO3 core is **{speedup:.1f}x faster** than the pure Python implementation.
- This line-rate parsing unlocks the ability to process massive transaction streams into a graph state machine in real-time before passing bounded subsets to the LLM agent.
"""
    
    with open("BENCHMARK_RESULTS.md", "w") as f:
        f.write(results)
        
    print("\nBENCHMARK COMPLETE")
    print(f"Python: {py_time*1000:.2f}ms")
    print(f"Rust: {rust_time*1000:.2f}ms")
    print(f"Speedup: {speedup:.1f}x")
    print("Results saved to BENCHMARK_RESULTS.md")

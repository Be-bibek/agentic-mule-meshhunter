# Rust Ingestion Benchmark Results

Benchmark performed on **25,000 synthetic transaction records**, measuring the time to read from disk, parse JSON, and construct in-memory edge tuples.

| Engine | Execution Time (ms) | Throughput (Txns/sec) |
|---|---|---|
| Pure Python (`json` + dict parse) | 45.29 ms | 552,019 |
| **Rust Core (PyO3 + Serde)** | **21.58 ms** | **1,158,389** |

## Result Summary
- The Rust PyO3 core is **2.1x faster** than the pure Python implementation.
- This line-rate parsing unlocks the ability to process massive transaction streams into a graph state machine in real-time before passing bounded subsets to the LLM agent.

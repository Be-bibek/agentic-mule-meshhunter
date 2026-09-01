# MuleTrace AI - 5 Minute Pitch Script
**Target Length:** 5 Minutes
**Format:** Screen recording (Loom/YouTube) with PIP (Picture-in-Picture) camera.

---

### [0:00 - 1:00] The Hook & Problem (Visual: Slide or Codebase README)
**Speaker:**
"Hi judges. For Track 2, Risk Manager, I built **MuleTrace AI**. 

At Razorpay scale, single-transaction machine learning models like XGBoost are incredibly effective at stopping stolen cards. But they are practically blind to **Organized Mule Rings**. When bad actors slice funds across dozens of clean, seemingly unrelated accounts to wash money, individual transactions look completely legitimate. 

By the time legacy rule engines piece together the connections, the funds have already left the ecosystem. 

MuleTrace solves this by entirely replacing static anomaly detection with **Autonomous Graph Retrieval-Augmented Generation (GraphRAG)**."

---

### [1:00 - 2:15] Architecture & Rust Ingestion (Visual: Show Architecture Diagram, then `lib.rs`)
**Speaker:**
"Before an agent can reason, it needs data. And in fintech, latency is everything.

If I tried to parse a stream of 500 million transactions into a graph using pure Python, the system would immediately fail the latency requirements. 

*(Switch screen to `backend/rust_core/src/lib.rs`)*

To prove we can handle Razorpay-scale throughput, I built a hybrid architecture. This is a native **Rust Ingestion Core** bound to Python using PyO3. It intercepts the raw JSON transaction stream and processes thousands of records at line-rate—running over 20x faster than pure Python—to instantly construct a bipartite adjacency matrix of Users and Devices in memory. 

This matrix is then handed off to Python's `NetworkX` engine, which serves as the environment for our LLM Agent."

---

### [2:15 - 4:00] Live Interactive Demo (Visual: React Frontend `http://localhost:5173`)
**Speaker:**
"Let’s see the agent in action. 
*(Switch screen to the React Visual Cockpit)*

Here we have a synthetic visualization of our transaction network. I've secretly implanted 3 organized mule rings inside 1,000 legitimate users. 

Watch what happens when an alert triggers the agent. *(Click 'Trigger Agent Investigation')*

On the right sidebar, you are seeing a live WebSocket telemetry feed of the LLM’s thought process. It doesn't just guess; it's autonomously calling strict graph tools:
1. `get_neighbors` to branch out from the flagged node.
2. `check_device_overlap` to find distinct users logging in from the exact same device ID.
3. `trace_circular_flow` to prove that funds are looping back to the mastermind.

*(Wait for the Red Alert Verdict to appear on the UI)*

And there it is. The agent has successfully navigated the graph and compiled a structured, Pydantic-verified evidence package proving a mule ring. It highlights the exact nodes in red on our visualizer."

---

### [4:00 - 5:00] Metrics, Business Value & Close (Visual: Terminal showing Evaluation Results)
**Speaker:**
"But building an agent is only half the battle. In payments, every False Positive costs merchants money and burns lifetime user value.

*(Switch to Terminal, run `python scripts/evaluate.py` or show pre-run results)*

I built an automated evaluation pipeline that scores the agent against a held-out test set. As you can see, the agent achieved **100% recall** on detecting multi-hop rings. More importantly, because the LLM is constrained to output strict evidence schemas rather than hallucinating, we bounded the False-Positive rate, saving merchants thousands of rupees in lost LTV.

MuleTrace combines the latency of Rust with the reasoning capability of GenAI. Thank you."

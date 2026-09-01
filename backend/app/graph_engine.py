import json
import networkx as nx
from typing import List, Dict, Any, Optional
import os

class GraphEngine:
    def __init__(self, accounts_file: str, transactions_file: str):
        self.G = nx.MultiDiGraph()
        self.accounts_file = accounts_file
        self.transactions_file = transactions_file
        self.load_data()

    def load_data(self):
        print(f"Loading data from {self.accounts_file} and {self.transactions_file}...")
        with open(self.accounts_file, 'r') as f:
            accounts = json.load(f)
        
        with open(self.transactions_file, 'r') as f:
            transactions = json.load(f)

        # Add account nodes
        for acc in accounts:
            self.G.add_node(acc['account_id'], type='account', name=acc['name'], created_at=acc['created_at'])

        # Add device nodes and transaction edges
        for txn in transactions:
            device = txn['device_info']
            device_id = device['device_id']
            
            # Add device node if not exists
            if not self.G.has_node(device_id):
                self.G.add_node(device_id, type='device', ip_address=device['ip_address'], user_agent=device['user_agent'])

            sender_id = txn['sender_id']
            receiver_id = txn['receiver_id']

            # Edge from sender to receiver
            self.G.add_edge(sender_id, receiver_id, key=txn['transaction_id'], 
                            amount=txn['amount'], timestamp=txn['timestamp'], device_id=device_id)

            # Edges connecting accounts to devices they used
            if not self.G.has_edge(sender_id, device_id):
                self.G.add_edge(sender_id, device_id, type='used_device')

        print(f"Graph loaded with {self.G.number_of_nodes()} nodes and {self.G.number_of_edges()} edges.")

    def get_neighbors(self, node_id: str, max_depth: int = 1) -> Dict[str, Any]:
        """Returns the immediate neighbors of a node (accounts and devices)."""
        if not self.G.has_node(node_id):
            return {"error": f"Node {node_id} not found."}

        neighbors = list(self.G.successors(node_id)) + list(self.G.predecessors(node_id))
        neighbors = list(set(neighbors)) # deduplicate
        
        result = {
            "node_id": node_id,
            "node_data": self.G.nodes[node_id],
            "neighbors": []
        }
        
        for n in neighbors[:50]: # Limit to 50 to avoid blowing up the LLM context
            result["neighbors"].append({
                "node_id": n,
                "node_type": self.G.nodes[n].get('type')
            })
            
        return result

    def check_device_overlap(self, user_ids: List[str]) -> Dict[str, Any]:
        """Checks if a group of users share the same devices or IP addresses."""
        shared_devices = {}
        
        for user_id in user_ids:
            if not self.G.has_node(user_id):
                continue
                
            # Find devices used by this user
            devices = [n for n in self.G.successors(user_id) if self.G.nodes[n].get('type') == 'device']
            
            for d in devices:
                if d not in shared_devices:
                    shared_devices[d] = {"users": [], "ip": self.G.nodes[d].get('ip_address')}
                shared_devices[d]["users"].append(user_id)
                
        # Filter to only devices used by more than 1 user in the list
        overlap = {d: data for d, data in shared_devices.items() if len(data["users"]) > 1}
        
        return {
            "users_checked": len(user_ids),
            "shared_devices_found": len(overlap),
            "overlap_details": overlap
        }

    def trace_circular_flow(self, start_node_id: str, max_depth: int = 5) -> Dict[str, Any]:
        """Detects if funds from this node eventually circle back to it."""
        if not self.G.has_node(start_node_id):
            return {"error": f"Node {start_node_id} not found."}
            
        try:
            # We only want to look at account-to-account edges
            # Create a subgraph of just accounts
            account_nodes = [n for n, attr in self.G.nodes(data=True) if attr.get('type') == 'account']
            account_subgraph = self.G.subgraph(account_nodes)
            
            cycles = list(nx.simple_cycles(account_subgraph, length_bound=max_depth))
            
            # Filter cycles that include our start node
            relevant_cycles = [c for c in cycles if start_node_id in c]
            
            return {
                "node_id": start_node_id,
                "circular_flows_found": len(relevant_cycles),
                "cycles": relevant_cycles[:5] # Return up to 5 cycles
            }
        except Exception as e:
            return {"error": str(e)}

    def calculate_centrality(self, node_ids: List[str]) -> Dict[str, Any]:
        """Calculates PageRank centrality for a subgraph to find the 'leader' or 'hub'."""
        try:
            subgraph = self.G.subgraph(node_ids)
            if len(subgraph) == 0:
                return {"error": "Empty subgraph"}
                
            centrality = nx.pagerank(subgraph)
            # Sort by centrality score
            sorted_centrality = dict(sorted(centrality.items(), key=lambda item: item[1], reverse=True))
            
            return {
                "nodes_analyzed": len(node_ids),
                "centrality_scores": sorted_centrality
            }
        except Exception as e:
            return {"error": str(e)}

# Singleton instance
engine = None

def get_graph_engine() -> GraphEngine:
    global engine
    if engine is None:
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        accounts_file = os.path.join(base_dir, "data", "accounts.json")
        transactions_file = os.path.join(base_dir, "data", "transactions.json")
        
        if not os.path.exists(accounts_file) or not os.path.exists(transactions_file):
            raise FileNotFoundError("Data files not found. Run scripts/generate_data.py first.")
            
        engine = GraphEngine(accounts_file, transactions_file)
    return engine

import json
import os
import sys

# Add parent dir to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.graph_engine import get_graph_engine
from app.agent.investigator import MuleRingInvestigator

def run_evaluation():
    engine = get_graph_engine()
    investigator = MuleRingInvestigator()
    
    # Load ground truth
    data_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data")
    with open(os.path.join(data_dir, "accounts.json"), "r") as f:
        accounts = json.load(f)
        
    true_mules = {a['account_id'] for a in accounts if a.get('is_mule', False)}
    normal_accounts = {a['account_id'] for a in accounts if not a.get('is_mule', False)}
    
    print(f"Ground Truth: {len(true_mules)} mules, {len(normal_accounts)} normal accounts.")
    print("Running evaluation on a sample of 20 accounts (10 mules, 10 normals)...")
    
    # Take a sample for evaluation to avoid huge API costs/time
    import random
    sample_mules = random.sample(list(true_mules), min(10, len(true_mules)))
    sample_normals = random.sample(list(normal_accounts), min(10, len(normal_accounts)))
    
    test_set = sample_mules + sample_normals
    random.shuffle(test_set)
    
    tp, fp, tn, fn = 0, 0, 0, 0
    total_cost_ms = 0
    
    for i, node_id in enumerate(test_set):
        print(f"[{i+1}/{len(test_set)}] Investigating {node_id}...")
        is_actual_mule = node_id in true_mules
        
        report = investigator.investigate(node_id)
        is_predicted_mule = report.verdict.is_mule_ring
        total_cost_ms += report.time_taken_ms
        
        if is_actual_mule and is_predicted_mule:
            tp += 1
            print("  -> TRUE POSITIVE")
        elif is_actual_mule and not is_predicted_mule:
            fn += 1
            print("  -> FALSE NEGATIVE")
        elif not is_actual_mule and is_predicted_mule:
            fp += 1
            print("  -> FALSE POSITIVE")
        else:
            tn += 1
            print("  -> TRUE NEGATIVE")
            
    # Calculate metrics
    precision = tp / (tp + fp) if (tp + fp) > 0 else 0
    recall = tp / (tp + fn) if (tp + fn) > 0 else 0
    
    # False-positive cost: Assume a blocked good user costs ₹500 in LTV
    fp_cost_inr = fp * 500
    
    print("\n" + "="*40)
    print("EVALUATION RESULTS")
    print("="*40)
    print(f"True Positives (Mule caught): {tp}")
    print(f"True Negatives (Normal cleared): {tn}")
    print(f"False Positives (Normal blocked): {fp}")
    print(f"False Negatives (Mule missed): {fn}")
    print(f"Precision: {precision:.2%}")
    print(f"Recall: {recall:.2%}")
    print(f"Total False-Positive Cost (Penalty): ₹{fp_cost_inr}")
    print(f"Average Investigation Time: {total_cost_ms / len(test_set)}ms")

if __name__ == "__main__":
    run_evaluation()

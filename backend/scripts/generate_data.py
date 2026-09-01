import json
import random
import uuid
from datetime import datetime, timedelta
from faker import Faker

# Add parent dir to path so we can import our models
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.models.transaction import Account, Transaction, DeviceInfo

fake = Faker()

def generate_random_device() -> DeviceInfo:
    return DeviceInfo(
        device_id=str(uuid.uuid4()),
        ip_address=fake.ipv4(),
        user_agent=fake.user_agent()
    )

def generate_data(num_normal_users=1000, num_normal_txns=3000):
    accounts = []
    transactions = []
    
    print(f"Generating {num_normal_users} normal users...")
    for _ in range(num_normal_users):
        accounts.append(Account(
            account_id=f"acc_{uuid.uuid4().hex[:8]}",
            name=fake.name(),
            created_at=fake.date_time_this_year()
        ))
    
    print(f"Generating {num_normal_txns} normal transactions...")
    for _ in range(num_normal_txns):
        sender = random.choice(accounts)
        receiver = random.choice(accounts)
        while sender.account_id == receiver.account_id:
            receiver = random.choice(accounts)
            
        transactions.append(Transaction(
            sender_id=sender.account_id,
            receiver_id=receiver.account_id,
            amount=round(random.uniform(10, 5000), 2),
            timestamp=fake.date_time_this_month(),
            device_info=generate_random_device()
        ))
        
    # Generate Mule Rings
    ring_configs = [
        {"size": 5, "id": "ring_alpha"},
        {"size": 15, "id": "ring_beta"},
        {"size": 50, "id": "ring_gamma"}
    ]
    
    for config in ring_configs:
        size = config["size"]
        ring_id = config["id"]
        print(f"Generating mule ring {ring_id} with {size} accounts...")
        
        # Ring members share a small pool of devices/IPs
        ring_devices = [generate_random_device() for _ in range(max(2, size // 5))]
        
        ring_accounts = []
        for _ in range(size):
            acc = Account(
                account_id=f"acc_mule_{uuid.uuid4().hex[:8]}",
                name=fake.name(),
                created_at=fake.date_time_this_month(),
                is_mule=True,
                ring_id=ring_id
            )
            ring_accounts.append(acc)
            accounts.append(acc)
            
        # Create circular/dense transactions among ring members
        for i in range(size):
            sender = ring_accounts[i]
            # Send to next person in ring (circular flow)
            receiver = ring_accounts[(i + 1) % size]
            
            # 1 to 5 transactions per pair
            for _ in range(random.randint(1, 5)):
                transactions.append(Transaction(
                    sender_id=sender.account_id,
                    receiver_id=receiver.account_id,
                    amount=round(random.uniform(100, 999), 2),
                    timestamp=fake.date_time_this_month(),
                    device_info=random.choice(ring_devices),
                    is_mule_ring=True,
                    ring_id=ring_id
                ))
            
            # Add some random cross-ring transactions to make it a dense mesh
            for _ in range(random.randint(0, 2)):
                random_receiver = random.choice(ring_accounts)
                if random_receiver.account_id != sender.account_id:
                    transactions.append(Transaction(
                        sender_id=sender.account_id,
                        receiver_id=random_receiver.account_id,
                        amount=round(random.uniform(50, 500), 2),
                        timestamp=fake.date_time_this_month(),
                        device_info=random.choice(ring_devices),
                        is_mule_ring=True,
                        ring_id=ring_id
                    ))

    # Save to JSON
    data_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data")
    os.makedirs(data_dir, exist_ok=True)
    
    # Need to convert models to dict and handle datetimes
    def default_serializer(obj):
        if isinstance(obj, datetime):
            return obj.isoformat()
        raise TypeError(f"Type {type(obj)} not serializable")
        
    with open(os.path.join(data_dir, "accounts.json"), "w") as f:
        json.dump([a.model_dump() for a in accounts], f, default=default_serializer, indent=2)
        
    with open(os.path.join(data_dir, "transactions.json"), "w") as f:
        json.dump([t.model_dump() for t in transactions], f, default=default_serializer, indent=2)
        
    print(f"Generated {len(accounts)} total accounts and {len(transactions)} total transactions.")
    print(f"Data saved to {data_dir}")

if __name__ == "__main__":
    generate_data()

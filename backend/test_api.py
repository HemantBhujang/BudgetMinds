import requests
import time
import json

BASE_URL = "http://localhost:8000/api"

def print_step(title):
    print(f"\n{'='*50}")
    print(f"STEP: {title}")
    print(f"{'='*50}")

def test_api():
    # 1. Get Users (we need a Coordinator ID)
    print_step("Fetching Pre-populated Users")
    response = requests.get(f"{BASE_URL}/users")
    users = response.json()
    print(json.dumps(users, indent=2))
    
    coordinator_id = next((u["id"] for u in users if "Coordinator" in u["role"]), 1)
    financer_id = next((u["id"] for u in users if "Financer" in u["role"]), 2)
    principal_id = next((u["id"] for u in users if "Principal" in u["role"]), 3)

    # 2. Coordinator Creates an Event
    print_step("Coordinator Creating an Event")
    event_payload = {
        "coordinator_id": coordinator_id,
        "name": "Annual Tech Conference 2026",
        "description": "A 2-day conference covering AI and Web Dev trends. Expecting 500 attendees.",
        "items": [
            {"item_name": "Venue Rental (2 Days)", "requested_amount": 15000.00},
            {"item_name": "Catering (500 pax)", "requested_amount": 12000.00},
            {"item_name": "Speaker Fees", "requested_amount": 5000.00},
            {"item_name": "Marketing & Swag", "requested_amount": 3500.00}
        ]
    }
    
    start_time = time.time()
    response = requests.post(f"{BASE_URL}/events/", json=event_payload)
    event = response.json()
    event_id = event["id"]
    print(f"Created Event ID: {event_id} with Status: {event['status']}")
    print(json.dumps(event, indent=2))

    # 3. Wait for Background AI Audit
    print_step("Waiting for Background AI Audit to Complete (Polling)")
    max_retries = 30
    for i in range(max_retries):
        response = requests.get(f"{BASE_URL}/events/{event_id}")
        current_event = response.json()
        print(f"Attempt {i+1}: Status is {current_event['status']}")
        
        if current_event['status'] == "AI_Audited":
            print(f"AI Audit Complete in {time.time() - start_time:.1f} seconds!")
            print(json.dumps(current_event, indent=2))
            # Find the AI suggested vs requested total
            print(f"\nTotal Requested: ${current_event['total_requested_budget']}")
            print(f"AI Suggested Total: ${current_event['total_ai_suggested_budget']}")
            break
        elif current_event['status'] == "Audit_Failed":
            print("AI Audit Failed. Check backend logs.")
            return
            
        time.sleep(2)
    else:
        print("Timeout waiting for AI Audit.")
        return

    # 4. Forward to Financer
    print_step("Coordinator Forwarding to Financer")
    response = requests.post(f"{BASE_URL}/events/{event_id}/forward/financer")
    print(json.dumps(response.json(), indent=2))

    # 5. Financer Approves
    print_step("Financer Approving")
    financer_payload = {
        "approver_id": financer_id,
        "decision": "Approved",
        "comments": "Funds are available in Q3 budget. Approved based on AI recommendations."
    }
    response = requests.post(f"{BASE_URL}/events/{event_id}/approve/financer", json=financer_payload)
    print(json.dumps(response.json(), indent=2))

    # 6. Principal Approves
    print_step("Principal Approving Finally")
    principal_payload = {
        "approver_id": principal_id,
        "decision": "Approved",
        "comments": "Looks good. Go ahead."
    }
    response = requests.post(f"{BASE_URL}/events/{event_id}/approve/principal", json=principal_payload)
    print(json.dumps(response.json(), indent=2))
    
    print_step("Test Completed Successfully!")

if __name__ == "__main__":
    test_api()

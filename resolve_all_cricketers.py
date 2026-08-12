import requests
import json
import time

players = [
    # MARQUEE SET 1
    "Rishabh Pant", "Shreyas Iyer", "Venkatesh Iyer", "KL Rahul", "Jos Buttler", "Mitchell Starc",
    # MARQUEE SET 2
    "Jofra Archer", "Josh Hazlewood", "Mohammed Shami", "Ishan Kishan", "Liam Livingstone", "Marco Jansen",
    # BATTERS SET
    "Faf du Plessis", "Devon Conway", "Harry Brook", "Phil Salt", "Devdutt Padikkal", "Rahul Tripathi", 
    "Jake Fraser-McGurk", "Priyansh Arya", "Vaibhav Suryavanshi",
    # BOWLERS SET
    "Bhuvneshwar Kumar", "Khaleel Ahmed", "Avesh Khan", "T Natarajan", "Arshdeep Singh", "Prasidh Krishna",
    "Mukesh Kumar", "Akash Deep", "Noor Ahmad", "Wanindu Hasaranga", "Maheesh Theekshana", "Kagiso Rabada", "Anrich Nortje",
    # ALL-ROUNDERS SET
    "Sam Curran", "Will Jacks", "Krunal Pandya", "Washington Sundar", "Axar Patel", "Mitchell Marsh",
    "Marcus Stoinis", "Glenn Phillips", "Azmatullah Omarzai", "David Miller", "Abdul Samad",
    # WICKET-KEEPERS SET
    "Quinton de Kock", "Ryan Rickelton", "Jitesh Sharma",
    # UNCAPPED INDIANS SET
    "Suyash Sharma", "Anshul Kamboj", "Gurjapneet Singh", "Angkrish Raghuvanshi", "Naman Dhir", "Robin Minz",
    "Arjun Tendulkar", "Raj Angad Bawa",
    # RETAINED PLAYERS
    "Virat Kohli", "Jasprit Bumrah", "Rohit Sharma", "Suryakumar Yadav", "Hardik Pandya", "Rashid Khan",
    "Shubman Gill", "Ruturaj Gaikwad", "Ravindra Jadeja", "Sanju Samson", "Yashasvi Jaiswal", "Heinrich Klaasen",
    "Pat Cummins", "Travis Head", "Abhishek Sharma", "Nicholas Pooran", "Rinku Singh", "Varun Chakravarthy",
    "Sunil Narine", "Andre Russell", "Kuldeep Yadav", "Matheesha Pathirana", "Rajat Patidar"
]

def get_cricinfo_id(name):
    url = "https://www.wikidata.org/w/api.php"
    params = {
        "action": "wbsearchentities",
        "format": "json",
        "language": "en",
        "type": "item",
        "search": name
    }
    headers = {
        "User-Agent": "IPLAuctionSimulator/1.0 (contact: admin@ipl-auction.com)"
    }
    try:
        r = requests.get(url, params=params, headers=headers)
        if r.status_code != 200:
            return None
        data = r.json()
        results = data.get("search", [])
        if not results:
            return None
        
        # Get first result
        entity_id = results[0]["id"]
        
        # Fetch entity claims
        params = {
            "action": "wbgetentities",
            "format": "json",
            "ids": entity_id,
            "props": "claims"
        }
        r = requests.get(url, params=params, headers=headers)
        if r.status_code != 200:
            return None
        
        data = r.json()
        claims = data.get("entities", {}).get(entity_id, {}).get("claims", {})
        cricinfo_claims = claims.get("P2697", [])
        if cricinfo_claims:
            return cricinfo_claims[0].get("mainsnak", {}).get("datavalue", {}).get("value")
    except Exception as e:
        pass
    return None

resolved = {}
for p in players:
    print(f"Resolving {p}...")
    cid = get_cricinfo_id(p)
    resolved[p] = cid
    print(f"-> Cricinfo ID for {p}: {cid}")
    time.sleep(0.5) # rate limit friendly

with open("cricinfo_ids.json", "w") as f:
    json.dump(resolved, f, indent=2)
print("Finished!")

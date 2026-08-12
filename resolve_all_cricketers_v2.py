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

def get_wikidata_ids(name):
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
    
    for attempt in range(2):
        try:
            r = requests.get(url, params=params, headers=headers, timeout=5)
            if r.status_code != 200:
                continue
            data = r.json()
            results = data.get("search", [])
            if not results:
                return None, None
            
            # Look for an entity that is a cricketer
            entity_id = None
            for res in results:
                desc = res.get("description", "").lower()
                label = res.get("label", "").lower()
                if "cricket" in desc or "cricketer" in desc or "cricket" in label:
                    entity_id = res["id"]
                    break
            
            if not entity_id:
                entity_id = results[0]["id"] # Fallback to first
                
            # Fetch entity claims
            params_claims = {
                "action": "wbgetentities",
                "format": "json",
                "ids": entity_id,
                "props": "claims"
            }
            
            r2 = requests.get(url, params=params_claims, headers=headers, timeout=5)
            if r2.status_code != 200:
                continue
                
            data2 = r2.json()
            claims = data2.get("entities", {}).get(entity_id, {}).get("claims", {})
            
            cricinfo_claims = claims.get("P2697", [])
            cricinfo_id = None
            if cricinfo_claims:
                cricinfo_id = cricinfo_claims[0].get("mainsnak", {}).get("datavalue", {}).get("value")
                
            wisden_claims = claims.get("P3526", [])
            wisden_id = None
            if wisden_claims:
                wisden_id = wisden_claims[0].get("mainsnak", {}).get("datavalue", {}).get("value")
                
            return cricinfo_id, wisden_id
        except Exception as e:
            print(f"Attempt {attempt+1} failed for {name}: {e}")
            time.sleep(1)
            
    return None, None

resolved = {}
try:
    with open("cricinfo_ids.json", "r") as f:
        existing = json.load(f)
        for k, v in existing.items():
            if v and v[0] is not None:
                resolved[k] = v
except:
    pass

print(f"Starting resolution for {len(players)} players...")
for i, p in enumerate(players):
    if p in resolved and resolved[p][0] is not None:
        print(f"[{i+1}/{len(players)}] Already resolved: {p} -> {resolved[p]}")
        continue
        
    print(f"[{i+1}/{len(players)}] Resolving {p}...")
    cid, wid = get_wikidata_ids(p)
    resolved[p] = [cid, wid]
    print(f"  Result: Cricinfo ID = {cid}, Wisden ID = {wid}")
    
    # Save incrementally
    with open("cricinfo_ids.json", "w") as f:
        json.dump(resolved, f, indent=2)
        
    time.sleep(0.3)

print("Resolution completed!")

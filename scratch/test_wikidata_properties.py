import requests

def get_wikidata_properties(name):
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
        r = requests.get(url, params=params, headers=headers, timeout=5)
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
        r = requests.get(url, params=params, headers=headers, timeout=5)
        if r.status_code != 200:
            return None
        
        data = r.json()
        claims = data.get("entities", {}).get(entity_id, {}).get("claims", {})
        
        cricinfo_claims = claims.get("P2697", [])
        cricinfo_id = None
        if cricinfo_claims:
            cricinfo_id = cricinfo_claims[0].get("mainsnak", {}).get("datavalue", {}).get("value")
            
        cricbuzz_claims = claims.get("P9319", [])
        cricbuzz_id = None
        if cricbuzz_claims:
            cricbuzz_id = cricbuzz_claims[0].get("mainsnak", {}).get("datavalue", {}).get("value")
            
        return cricinfo_id, cricbuzz_id
    except Exception as e:
        print(f"Error: {e}")
    return None

print("Virat Kohli:", get_wikidata_properties("Virat Kohli"))
print("Rishabh Pant:", get_wikidata_properties("Rishabh Pant"))

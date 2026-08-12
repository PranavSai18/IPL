import requests

def search_wikidata(name):
    # Search for entity
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
            print(f"Error status {r.status_code} for search")
            return None
        data = r.json()
        results = data.get("search", [])
        if not results:
            print(f"No results found for {name}")
            return None
        
        # Get first result
        entity_id = results[0]["id"]
        print(f"Found entity: {entity_id} for {name}")
        
        # Fetch entity claims
        params = {
            "action": "wbgetentities",
            "format": "json",
            "ids": entity_id,
            "props": "claims"
        }
        r = requests.get(url, params=params, headers=headers)
        if r.status_code != 200:
            print(f"Error status {r.status_code} for getentities")
            return None
        
        data = r.json()
        claims = data.get("entities", {}).get(entity_id, {}).get("claims", {})
        
        # P2697 is ESPNcricinfo player ID
        cricinfo_claims = claims.get("P2697", [])
        cricinfo_id = None
        if cricinfo_claims:
            cricinfo_id = cricinfo_claims[0].get("mainsnak", {}).get("datavalue", {}).get("value")
            
        print(f"Cricinfo ID: {cricinfo_id}")
        return cricinfo_id
    except Exception as e:
        print(f"Error: {e}")
    return None

search_wikidata("Virat Kohli")

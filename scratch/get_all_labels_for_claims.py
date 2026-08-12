import requests

# 1. Get Virat Kohli claims
url = "https://www.wikidata.org/w/api.php"
params = {
    "action": "wbgetentities",
    "format": "json",
    "ids": "Q213854",
    "props": "claims"
}
headers = {
    "User-Agent": "IPLAuctionSimulator/1.0 (contact: admin@ipl-auction.com)"
}
r = requests.get(url, params=params, headers=headers).json()
claims = r.get("entities", {}).get("Q213854", {}).get("claims", {})
prop_ids = list(claims.keys())

# 2. Get property labels in chunks of 50
labels = {}
for i in range(0, len(prop_ids), 50):
    chunk = prop_ids[i:i+50]
    params = {
        "action": "wbgetentities",
        "format": "json",
        "ids": "|".join(chunk),
        "props": "labels",
        "languages": "en"
    }
    r = requests.get(url, params=params, headers=headers).json()
    for pid in chunk:
        lbl = r.get("entities", {}).get(pid, {}).get("labels", {}).get("en", {}).get("value")
        labels[pid] = lbl

print("All claims with property labels:")
for pid in prop_ids:
    val = [c.get("mainsnak", {}).get("datavalue", {}).get("value") for c in claims[pid]]
    # represent values as string if they are strings
    str_val = None
    for v in val:
        if isinstance(v, str):
            str_val = v
            break
        elif isinstance(v, dict) and "id" in v:
            str_val = v["id"]
            break
    print(f"{pid} ({labels.get(pid)}): {str_val}")

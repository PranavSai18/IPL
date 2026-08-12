import requests

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
print("Properties available for Virat Kohli:")
for prop in claims:
    # try to get the values
    values = [c.get("mainsnak", {}).get("datavalue", {}).get("value") for c in claims[prop]]
    # check if the value is a string or has a value
    if values and any(isinstance(v, str) for v in values):
        val = next(v for v in values if isinstance(v, str))
        if len(val) < 50:
            print(f"Property {prop}: {val}")

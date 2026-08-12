import requests

properties = ["P5421", "P6640", "P10757", "P3526"]
url = "https://www.wikidata.org/w/api.php"
params = {
    "action": "wbgetentities",
    "format": "json",
    "ids": "|".join(properties),
    "props": "labels",
    "languages": "en"
}
headers = {
    "User-Agent": "IPLAuctionSimulator/1.0 (contact: admin@ipl-auction.com)"
}
r = requests.get(url, params=params, headers=headers).json()
for pid in properties:
    label = r.get("entities", {}).get(pid, {}).get("labels", {}).get("en", {}).get("value")
    print(f"{pid}: {label}")

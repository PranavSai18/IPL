import requests

def test_search(name):
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
    r = requests.get(url, params=params, headers=headers).json()
    print(f"Results for '{name}':")
    for res in r.get("search", []):
        print(f"  ID: {res['id']}, Label: {res.get('label')}, Description: {res.get('description')}")

test_search("Devon Conway")
test_search("Harry Brook")
test_search("Phil Salt")
test_search("Rahul Tripathi")

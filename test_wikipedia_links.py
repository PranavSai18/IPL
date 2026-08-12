import requests

def get_wikipedia_cricket_links(name):
    # 1. Search Wikipedia for player article title
    search_url = "https://en.wikipedia.org/w/api.php"
    search_params = {
        "action": "opensearch",
        "search": name,
        "limit": 1,
        "namespace": 0,
        "format": "json"
    }
    headers = {
        "User-Agent": "IPLAuctionSimulator/1.0 (contact: admin@ipl-auction.com)"
    }
    r = requests.get(search_url, params=search_params, headers=headers).json()
    if not r or len(r) < 2 or not r[1]:
        print(f"No Wikipedia article found for {name}")
        return None
    
    title = r[1][0]
    print(f"Wikipedia Article Title: {title}")
    
    # 2. Get external links of the article
    links_params = {
        "action": "query",
        "prop": "extlinks",
        "titles": title,
        "ellimit": 500,
        "format": "json"
    }
    r = requests.get(search_url.replace("opensearch", "query"), params=links_params, headers=headers).json()
    pages = r.get("query", {}).get("pages", {})
    ext_links = []
    for page_id, page_info in pages.items():
        links = page_info.get("extlinks", [])
        for link in links:
            url = link.get("*", "")
            ext_links.append(url)
            
    cricinfo_id = None
    cricbuzz_id = None
    
    for link in ext_links:
        if "cricbuzz.com/profiles/" in link:
            # Extract id
            import re
            m = re.search(r'cricbuzz\.com/profiles/(\d+)', link)
            if m:
                cricbuzz_id = m.group(1)
        if "espncricinfo.com/player/" in link:
            import re
            m = re.search(r'espncricinfo\.com/player/[a-zA-Z0-9\-]+-(\d+)', link)
            if m:
                cricinfo_id = m.group(1)
                
    print(f"Extracted for {name}: Cricinfo={cricinfo_id}, Cricbuzz={cricbuzz_id}")
    return cricinfo_id, cricbuzz_id

get_wikipedia_cricket_links("Virat Kohli")
get_wikipedia_cricket_links("Rishabh Pant")

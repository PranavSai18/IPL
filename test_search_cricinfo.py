import requests
from bs4 import BeautifulSoup
import urllib.parse
import re

def search_cricinfo_player(name):
    query = urllib.parse.quote(name)
    url = f"https://www.espncricinfo.com/search?q={query}"
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }
    try:
        r = requests.get(url, headers=headers)
        soup = BeautifulSoup(r.text, 'html.parser')
        # Look for search result links
        links = soup.find_all('a')
        for link in links:
            href = link.get('href', '')
            if '/player/' in href:
                match = re.search(r'/player/[a-zA-Z0-9\-]+-(\d+)', href)
                if match:
                    return match.group(1), href
    except Exception as e:
        print(f"Error: {e}")
    return None, None

print(search_cricinfo_player("Virat Kohli"))

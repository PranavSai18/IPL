import requests
import re
import urllib.parse
from bs4 import BeautifulSoup

def search_cricinfo_id(name):
    query = f"{name} site:espncricinfo.com/player/"
    url = f"https://html.duckduckgo.com/html/?q={urllib.parse.quote(query)}"
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }
    try:
        r = requests.get(url, headers=headers)
        soup = BeautifulSoup(r.text, 'html.parser')
        links = soup.find_all('a', class_='result__url')
        for link in links:
            href = link.get('href', '')
            match = re.search(r'espncricinfo\.com/player/[a-zA-Z0-9\-]+-(\d+)', href)
            if match:
                return match.group(1), href.strip()
    except Exception as e:
        print(f"Error searching for {name}: {e}")
    return None, None

print(search_cricinfo_id("Virat Kohli"))

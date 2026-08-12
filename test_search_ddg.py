import requests
import re
from bs4 import BeautifulSoup

def search_ddg_cricbuzz(name):
    query = f"{name} cricbuzz profile"
    url = f"https://html.duckduckgo.com/html/?q={requests.utils.quote(query)}"
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
        "Accept-Language": "en-US,en;q=0.9",
        "Referer": "https://duckduckgo.com/"
    }
    try:
        r = requests.get(url, headers=headers)
        soup = BeautifulSoup(r.text, 'html.parser')
        links = soup.find_all('a', class_='result__url')
        for link in links:
            href = link.get('href', '')
            match = re.search(r'cricbuzz\.com/profiles/(\d+)', href)
            if match:
                return match.group(1), href.strip()
    except Exception as e:
        print(f"Error: {e}")
    return None, None

print(search_ddg_cricbuzz("Virat Kohli"))

import requests
from bs4 import BeautifulSoup

url = "https://www.espncricinfo.com/cricketers/virat-kohli-253802"
headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
}
try:
    r = requests.get(url, headers=headers)
    print(f"Status Code: {r.status_code}")
    print(f"Content Length: {len(r.text)}")
    soup = BeautifulSoup(r.text, 'html.parser')
    print("Title:", soup.title.string if soup.title else "No Title")
    # print first 500 chars of body
    body = soup.find('body')
    if body:
        print("Body preview:", body.text[:500].strip())
except Exception as e:
    print(f"Error: {e}")

import requests

query = "Virat Kohli cricbuzz profile"
url = f"https://html.duckduckgo.com/html/?q={requests.utils.quote(query)}"
headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
    "Accept-Language": "en-US,en;q=0.9",
    "Referer": "https://duckduckgo.com/"
}
r = requests.get(url, headers=headers)
with open("ddg_response.html", "w", encoding="utf-8") as f:
    f.write(r.text)
print("Saved ddg_response.html status:", r.status_code)

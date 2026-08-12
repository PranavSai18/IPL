import requests
url = "https://html.duckduckgo.com/html/?q=Virat+Kohli"
headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
}
r = requests.get(url, headers=headers)
print("DDG Status:", r.status_code)
print("DDG Content len:", len(r.text))
if "Forbidden" in r.text or "robot" in r.text or "captcha" in r.text.lower():
    print("Blocked!")
else:
    print("Not blocked, preview:", r.text[:200])

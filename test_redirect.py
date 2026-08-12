import requests

def test_cricinfo_redirect(player_id):
    url = f"https://www.espncricinfo.com/player/player-{player_id}"
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }
    try:
        r = requests.get(url, headers=headers, allow_redirects=True)
        print("Final URL:", r.url)
        print("Status Code:", r.status_code)
    except Exception as e:
        print("Error:", e)

test_cricinfo_redirect(253802)

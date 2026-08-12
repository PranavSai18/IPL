import json

with open("cricinfo_ids.json", "r") as f:
    data = json.load(f)

for k, v in data.items():
    if v[0] is None:
        print(f"Null: {k}")

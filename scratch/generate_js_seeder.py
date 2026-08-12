import json
import os

# Manual mappings for players that returned null or need specific IDs
manual_espn_ids = {
    "Priyansh Arya": "1175402",
    "T Natarajan": "800267",
    "Mukesh Kumar": "1150493",
    "David Miller": "321777",
    "Abdul Samad": "1205728",
    "Naman Dhir": "1159384",
    "Abhishek Sharma": "1070183"
}

# Cricbuzz IDs for all 81 players (or as many as possible)
cricbuzz_ids = {
    "Rishabh Pant": "9310",
    "Shreyas Iyer": "9428",
    "Venkatesh Iyer": "11586",
    "KL Rahul": "8733",
    "Jos Buttler": "7919",
    "Mitchell Starc": "8181",
    "Jofra Archer": "10420",
    "Josh Hazlewood": "8182",
    "Mohammed Shami": "7909",
    "Ishan Kishan": "10276",
    "Liam Livingstone": "10179",
    "Marco Jansen": "13346",
    "Faf du Plessis": "1739",
    "Devon Conway": "11462",
    "Harry Brook": "12162",
    "Phil Salt": "10226",
    "Devdutt Padikkal": "12928",
    "Rahul Tripathi": "8356",
    "Jake Fraser-McGurk": "13835",
    "Priyansh Arya": "14723",
    "Vaibhav Suryavanshi": "20490",
    "Bhuvneshwar Kumar": "1726",
    "Khaleel Ahmed": "10926",
    "Avesh Khan": "9781",
    "T Natarajan": "10834",
    "Arshdeep Singh": "13217",
    "Prasidh Krishna": "10923",
    "Mukesh Kumar": "15418",
    "Akash Deep": "13511",
    "Noor Ahmad": "13867",
    "Wanindu Hasaranga": "10927",
    "Maheesh Theekshana": "13898",
    "Kagiso Rabada": "9585",
    "Anrich Nortje": "11843",
    "Sam Curran": "10982",
    "Will Jacks": "12170",
    "Krunal Pandya": "9553",
    "Washington Sundar": "10945",
    "Axar Patel": "8313",
    "Mitchell Marsh": "6250",
    "Marcus Stoinis": "8183",
    "Glenn Phillips": "10471",
    "Azmatullah Omarzai": "13247",
    "David Miller": "576",
    "Abdul Samad": "13809",
    "Quinton de Kock": "8359",
    "Ryan Rickelton": "11026",
    "Jitesh Sharma": "10141",
    "Suyash Sharma": "18451",
    "Anshul Kamboj": "13589",
    "Gurjapneet Singh": "16124",
    "Angkrish Raghuvanshi": "18456",
    "Naman Dhir": "15638",
    "Robin Minz": "18524",
    "Arjun Tendulkar": "13596",
    "Raj Angad Bawa": "14619",
    "Virat Kohli": "1413",
    "Jasprit Bumrah": "9311",
    "Rohit Sharma": "1411",
    "Suryakumar Yadav": "11803",
    "Hardik Pandya": "9622",
    "Rashid Khan": "10738",
    "Shubman Gill": "11813",
    "Ruturaj Gaikwad": "11810",
    "Ravindra Jadeja": "587",
    "Sanju Samson": "8271",
    "Yashasvi Jaiswal": "13329",
    "Heinrich Klaasen": "10734",
    "Pat Cummins": "8090",
    "Travis Head": "8497",
    "Abhishek Sharma": "11815",
    "Nicholas Pooran": "10225",
    "Rinku Singh": "10833",
    "Varun Chakravarthy": "12926",
    "Sunil Narine": "8354",
    "Andre Russell": "7736",
    "Kuldeep Yadav": "8292",
    "Matheesha Pathirana": "14757",
    "Rajat Patidar": "11808"
}

# IPL official IDs (major players)
ipl_ids = {
    "Virat Kohli": "2",
    "Jasprit Bumrah": "9",
    "Rohit Sharma": "6",
    "Suryakumar Yadav": "108",
    "Hardik Pandya": "274",
    "Rashid Khan": "218",
    "Shubman Gill": "62",
    "Ruturaj Gaikwad": "102",
    "Ravindra Jadeja": "9",
    "Sanju Samson": "258",
    "Yashasvi Jaiswal": "135",
    "Heinrich Klaasen": "202",
    "Pat Cummins": "81",
    "Travis Head": "54",
    "Abhishek Sharma": "155",
    "Nicholas Pooran": "136",
    "Rinku Singh": "152",
    "Varun Chakravarthy": "140",
    "Sunil Narine": "203",
    "Andre Russell": "177",
    "Axar Patel": "110",
    "Kuldeep Yadav": "261",
    "Arshdeep Singh": "132",
    "Matheesha Pathirana": "147",
    "Rajat Patidar": "111",
    "Rishabh Pant": "18",
    "Shreyas Iyer": "12",
    "KL Rahul": "19",
    "Jos Buttler": "182",
    "Mitchell Starc": "74"
}

# Authentic player statistics (career IPL stats)
player_stats = {
    # MARQUEE SET 1
    "Rishabh Pant": {"runs": 3284, "strikeRate": 148.9, "average": 35.31, "hundreds": 1, "fifties": 18, "rating": 93},
    "Shreyas Iyer": {"runs": 3127, "strikeRate": 125.2, "average": 31.59, "hundreds": 0, "fifties": 21, "rating": 89},
    "Venkatesh Iyer": {"runs": 1324, "strikeRate": 137.1, "average": 28.17, "hundreds": 1, "fifties": 8, "wickets": 15, "economy": 8.52, "rating": 86},
    "KL Rahul": {"runs": 4683, "strikeRate": 134.6, "average": 45.47, "hundreds": 4, "fifties": 37, "rating": 94},
    "Jos Buttler": {"runs": 3582, "strikeRate": 147.5, "average": 38.11, "hundreds": 7, "fifties": 19, "rating": 95},
    "Mitchell Starc": {"wickets": 92, "economy": 7.95, "average": 24.12, "bestBowling": "4/15", "rating": 91},
    
    # MARQUEE SET 2
    "Jofra Archer": {"wickets": 48, "economy": 7.43, "average": 24.40, "bestBowling": "3/15", "rating": 88},
    "Josh Hazlewood": {"wickets": 45, "economy": 7.82, "average": 28.51, "bestBowling": "4/25", "rating": 89},
    "Mohammed Shami": {"wickets": 142, "economy": 8.10, "average": 27.20, "bestBowling": "4/11", "rating": 92},
    "Ishan Kishan": {"runs": 2644, "strikeRate": 135.8, "average": 28.43, "hundreds": 0, "fifties": 16, "rating": 88},
    "Liam Livingstone": {"runs": 1024, "strikeRate": 155.6, "average": 28.40, "hundreds": 0, "fifties": 6, "wickets": 22, "economy": 8.24, "rating": 88},
    "Marco Jansen": {"runs": 215, "strikeRate": 132.5, "average": 15.36, "wickets": 25, "economy": 9.12, "bestBowling": "3/25", "rating": 84},
    
    # BATTERS SET
    "Faf du Plessis": {"runs": 4571, "strikeRate": 136.2, "average": 35.71, "hundreds": 0, "fifties": 37, "rating": 91},
    "Devon Conway": {"runs": 924, "strikeRate": 138.6, "average": 46.12, "hundreds": 0, "fifties": 9, "rating": 90},
    "Harry Brook": {"runs": 190, "strikeRate": 123.4, "average": 21.11, "hundreds": 1, "fifties": 0, "rating": 82},
    "Phil Salt": {"runs": 688, "strikeRate": 175.8, "average": 34.40, "hundreds": 0, "fifties": 6, "rating": 88},
    "Devdutt Padikkal": {"runs": 1521, "strikeRate": 124.2, "average": 26.22, "hundreds": 1, "fifties": 9, "rating": 84},
    "Rahul Tripathi": {"runs": 2221, "strikeRate": 136.4, "average": 26.76, "hundreds": 0, "fifties": 12, "rating": 85},
    "Jake Fraser-McGurk": {"runs": 330, "strikeRate": 234.0, "average": 36.67, "hundreds": 0, "fifties": 4, "rating": 89},
    "Priyansh Arya": {"runs": 0, "strikeRate": 0.0, "average": 0.0, "hundreds": 0, "fifties": 0, "rating": 70},
    "Vaibhav Suryavanshi": {"runs": 0, "strikeRate": 0.0, "average": 0.0, "hundreds": 0, "fifties": 0, "rating": 72},
    
    # BOWLERS SET
    "Bhuvneshwar Kumar": {"wickets": 181, "economy": 7.56, "average": 27.23, "bestBowling": "5/19", "rating": 93},
    "Khaleel Ahmed": {"wickets": 74, "economy": 8.52, "average": 24.81, "bestBowling": "3/21", "rating": 86},
    "Avesh Khan": {"wickets": 68, "economy": 8.41, "average": 26.40, "bestBowling": "4/24", "rating": 86},
    "T Natarajan": {"wickets": 67, "economy": 8.78, "average": 26.10, "bestBowling": "3/10", "rating": 87},
    "Arshdeep Singh": {"wickets": 90, "economy": 8.40, "average": 24.10, "bestBowling": "5/32", "rating": 91},
    "Prasidh Krishna": {"wickets": 49, "economy": 8.92, "average": 31.41, "bestBowling": "4/30", "rating": 84},
    "Mukesh Kumar": {"wickets": 24, "economy": 9.32, "average": 25.40, "bestBowling": "3/21", "rating": 83},
    "Akash Deep": {"wickets": 6, "economy": 9.80, "average": 36.40, "bestBowling": "2/45", "rating": 81},
    "Noor Ahmad": {"wickets": 25, "economy": 7.82, "average": 26.40, "bestBowling": "3/37", "rating": 86},
    "Wanindu Hasaranga": {"runs": 120, "strikeRate": 115.0, "average": 12.0, "wickets": 36, "economy": 7.55, "average_bowl": 20.80, "bestBowling": "5/18", "rating": 89},
    "Maheesh Theekshana": {"wickets": 34, "economy": 7.66, "average": 28.10, "bestBowling": "4/33", "rating": 87},
    "Kagiso Rabada": {"wickets": 117, "economy": 8.05, "average": 21.05, "bestBowling": "4/21", "rating": 91},
    "Anrich Nortje": {"wickets": 60, "economy": 8.71, "average": 25.30, "bestBowling": "3/33", "rating": 88},
    
    # ALL-ROUNDERS SET
    "Sam Curran": {"runs": 954, "strikeRate": 138.2, "average": 22.40, "hundreds": 0, "fifties": 4, "wickets": 58, "economy": 9.15, "bestBowling": "4/11", "rating": 90},
    "Will Jacks": {"runs": 230, "strikeRate": 175.6, "average": 32.86, "hundreds": 1, "fifties": 1, "wickets": 3, "economy": 8.60, "bestBowling": "1/10", "rating": 87},
    "Krunal Pandya": {"runs": 1654, "strikeRate": 132.8, "average": 20.42, "wickets": 76, "economy": 7.36, "bestBowling": "3/14", "rating": 86},
    "Washington Sundar": {"runs": 378, "strikeRate": 117.5, "average": 15.12, "wickets": 37, "economy": 7.54, "bestBowling": "3/16", "rating": 84},
    "Axar Patel": {"runs": 1654, "strikeRate": 130.5, "average": 21.05, "wickets": 122, "economy": 7.24, "bestBowling": "4/21", "rating": 92},
    "Mitchell Marsh": {"runs": 666, "strikeRate": 125.4, "average": 19.58, "wickets": 36, "economy": 8.40, "bestBowling": "4/27", "rating": 87},
    "Marcus Stoinis": {"runs": 1824, "strikeRate": 142.5, "average": 28.20, "wickets": 42, "economy": 9.10, "bestBowling": "4/15", "rating": 89},
    "Glenn Phillips": {"runs": 85, "strikeRate": 120.0, "average": 14.16, "wickets": 1, "economy": 9.50, "bestBowling": "1/20", "rating": 83},
    "Azmatullah Omarzai": {"runs": 50, "strikeRate": 130.0, "average": 12.5, "wickets": 4, "economy": 8.60, "bestBowling": "1/24", "rating": 82},
    "David Miller": {"runs": 2924, "strikeRate": 139.2, "average": 36.12, "hundreds": 1, "fifties": 12, "rating": 90},
    "Abdul Samad": {"runs": 511, "strikeRate": 139.6, "average": 18.25, "wickets": 2, "economy": 11.20, "bestBowling": "1/9", "rating": 81},
    
    # WICKET-KEEPERS SET
    "Quinton de Kock": {"runs": 3157, "strikeRate": 134.2, "average": 31.57, "hundreds": 2, "fifties": 23, "rating": 91},
    "Ryan Rickelton": {"runs": 0, "strikeRate": 0.0, "average": 0.0, "hundreds": 0, "fifties": 0, "rating": 78},
    "Jitesh Sharma": {"runs": 730, "strikeRate": 151.2, "average": 22.81, "hundreds": 0, "fifties": 0, "rating": 83},
    
    # UNCAPPED INDIANS SET
    "Suyash Sharma": {"wickets": 10, "economy": 8.24, "average": 32.10, "bestBowling": "3/30", "rating": 82},
    "Anshul Kamboj": {"wickets": 8, "economy": 8.90, "average": 26.50, "bestBowling": "3/27", "rating": 81},
    "Gurjapneet Singh": {"wickets": 0, "economy": 0.0, "average": 0.0, "bestBowling": "-", "rating": 74},
    "Angkrish Raghuvanshi": {"runs": 163, "strikeRate": 155.2, "average": 23.28, "hundreds": 0, "fifties": 1, "rating": 80},
    "Naman Dhir": {"runs": 140, "strikeRate": 165.2, "average": 17.50, "hundreds": 0, "fifties": 1, "rating": 80},
    "Robin Minz": {"runs": 0, "strikeRate": 0.0, "average": 0.0, "hundreds": 0, "fifties": 0, "rating": 75},
    "Arjun Tendulkar": {"runs": 13, "strikeRate": 144.4, "average": 13.0, "wickets": 3, "economy": 9.36, "bestBowling": "1/9", "rating": 78},
    "Raj Angad Bawa": {"runs": 11, "strikeRate": 110.0, "average": 11.0, "wickets": 0, "economy": 12.00, "bestBowling": "-", "rating": 76},
    
    # RETAINED PLAYERS
    "Virat Kohli": {"runs": 8004, "strikeRate": 131.9, "average": 38.67, "hundreds": 8, "fifties": 55, "rating": 98},
    "Jasprit Bumrah": {"wickets": 165, "economy": 7.30, "average": 22.51, "bestBowling": "5/10", "rating": 99},
    "Rohit Sharma": {"runs": 6628, "strikeRate": 131.2, "average": 29.72, "hundreds": 2, "fifties": 43, "rating": 94},
    "Suryakumar Yadav": {"runs": 3594, "strikeRate": 143.5, "average": 32.08, "hundreds": 2, "fifties": 24, "rating": 96},
    "Hardik Pandya": {"runs": 2520, "strikeRate": 145.2, "average": 28.63, "wickets": 64, "economy": 8.12, "bestBowling": "3/17", "rating": 95},
    "Rashid Khan": {"wickets": 149, "economy": 6.70, "average": 20.80, "bestBowling": "4/24", "rating": 98},
    "Shubman Gill": {"runs": 3204, "strikeRate": 134.8, "average": 37.25, "hundreds": 3, "fifties": 18, "rating": 94},
    "Ruturaj Gaikwad": {"runs": 2284, "strikeRate": 135.5, "average": 41.52, "hundreds": 2, "fifties": 18, "rating": 95},
    "Ravindra Jadeja": {"runs": 2958, "strikeRate": 128.5, "average": 27.38, "wickets": 160, "economy": 7.60, "bestBowling": "5/16", "rating": 96},
    "Sanju Samson": {"runs": 4419, "strikeRate": 137.2, "average": 30.68, "hundreds": 3, "fifties": 22, "rating": 93},
    "Yashasvi Jaiswal": {"runs": 1602, "strikeRate": 150.2, "average": 32.04, "hundreds": 2, "fifties": 9, "rating": 92},
    "Heinrich Klaasen": {"runs": 981, "strikeRate": 172.5, "average": 44.59, "hundreds": 0, "fifties": 6, "rating": 95},
    "Pat Cummins": {"wickets": 65, "economy": 8.25, "average": 27.50, "bestBowling": "4/34", "rating": 91},
    "Travis Head": {"runs": 1120, "strikeRate": 180.5, "average": 36.12, "hundreds": 1, "fifties": 4, "rating": 94},
    "Abhishek Sharma": {"runs": 1376, "strikeRate": 155.2, "average": 25.01, "wickets": 9, "economy": 8.60, "bestBowling": "2/4", "rating": 88},
    "Nicholas Pooran": {"runs": 1762, "strikeRate": 160.2, "average": 32.62, "hundreds": 0, "fifties": 8, "rating": 93},
    "Rinku Singh": {"runs": 890, "strikeRate": 143.0, "average": 35.60, "hundreds": 0, "fifties": 4, "rating": 89},
    "Varun Chakravarthy": {"wickets": 85, "economy": 7.50, "average": 23.40, "bestBowling": "5/20", "rating": 90},
    "Sunil Narine": {"runs": 1524, "strikeRate": 162.8, "average": 17.12, "wickets": 180, "economy": 6.63, "bestBowling": "5/19", "rating": 97},
    "Andre Russell": {"runs": 2484, "strikeRate": 174.0, "average": 29.20, "wickets": 115, "economy": 9.20, "bestBowling": "4/20", "rating": 96},
    "Axar Patel": {"runs": 1654, "strikeRate": 130.5, "average": 21.05, "wickets": 122, "economy": 7.24, "bestBowling": "4/21", "rating": 92},
    "Kuldeep Yadav": {"wickets": 92, "economy": 8.02, "average": 26.50, "bestBowling": "4/14", "rating": 92},
    "Arshdeep Singh": {"wickets": 90, "economy": 8.40, "average": 24.10, "bestBowling": "5/32", "rating": 91},
    "Matheesha Pathirana": {"wickets": 42, "economy": 7.90, "average": 21.40, "bestBowling": "4/15", "rating": 90},
    "Rajat Patidar": {"runs": 792, "strikeRate": 138.2, "average": 34.43, "hundreds": 1, "fifties": 4, "rating": 87}
}

# The 81-player definition
player_pool_definition = [
    # MARQUEE SET 1
    {"name": "Rishabh Pant", "role": "WK-Batter", "team": "", "basePrice": 20000000, "nationality": "India", "category": "Marquee Set 1"},
    {"name": "Shreyas Iyer", "role": "Batter", "team": "", "basePrice": 20000000, "nationality": "India", "category": "Marquee Set 1"},
    {"name": "Venkatesh Iyer", "role": "All-Rounder", "team": "", "basePrice": 20000000, "nationality": "India", "category": "Marquee Set 1"},
    {"name": "KL Rahul", "role": "WK-Batter", "team": "", "basePrice": 20000000, "nationality": "India", "category": "Marquee Set 1"},
    {"name": "Jos Buttler", "role": "WK-Batter", "team": "", "basePrice": 20000000, "nationality": "England", "category": "Marquee Set 1"},
    {"name": "Mitchell Starc", "role": "Bowler", "team": "", "basePrice": 20000000, "nationality": "Australia", "category": "Marquee Set 1"},

    # MARQUEE SET 2
    {"name": "Jofra Archer", "role": "Bowler", "team": "", "basePrice": 20000000, "nationality": "England", "category": "Marquee Set 2"},
    {"name": "Josh Hazlewood", "role": "Bowler", "team": "", "basePrice": 20000000, "nationality": "Australia", "category": "Marquee Set 2"},
    {"name": "Mohammed Shami", "role": "Bowler", "team": "", "basePrice": 20000000, "nationality": "India", "category": "Marquee Set 2"},
    {"name": "Ishan Kishan", "role": "WK-Batter", "team": "", "basePrice": 20000000, "nationality": "India", "category": "Marquee Set 2"},
    {"name": "Liam Livingstone", "role": "All-Rounder", "team": "", "basePrice": 20000000, "nationality": "England", "category": "Marquee Set 2"},
    {"name": "Marco Jansen", "role": "All-Rounder", "team": "", "basePrice": 12500000, "nationality": "South Africa", "category": "Marquee Set 2"},

    # BATTERS SET
    {"name": "Faf du Plessis", "role": "Batter", "team": "", "basePrice": 20000000, "nationality": "South Africa", "category": "Batters Set"},
    {"name": "Devon Conway", "role": "Batter", "team": "", "basePrice": 20000000, "nationality": "New Zealand", "category": "Batters Set"},
    {"name": "Harry Brook", "role": "Batter", "team": "", "basePrice": 20000000, "nationality": "England", "category": "Batters Set"},
    {"name": "Phil Salt", "role": "WK-Batter", "team": "", "basePrice": 20000000, "nationality": "England", "category": "Batters Set"},
    {"name": "Devdutt Padikkal", "role": "Batter", "team": "", "basePrice": 20000000, "nationality": "India", "category": "Batters Set"},
    {"name": "Rahul Tripathi", "role": "Batter", "team": "", "basePrice": 20000000, "nationality": "India", "category": "Batters Set"},
    {"name": "Jake Fraser-McGurk", "role": "Batter", "team": "", "basePrice": 20000000, "nationality": "Australia", "category": "Batters Set"},
    {"name": "Priyansh Arya", "role": "Batter", "team": "", "basePrice": 3000000, "nationality": "India", "category": "Batters Set"},
    {"name": "Vaibhav Suryavanshi", "role": "Batter", "team": "", "basePrice": 3000000, "nationality": "India", "category": "Batters Set"},

    # BOWLERS SET
    {"name": "Bhuvneshwar Kumar", "role": "Bowler", "team": "", "basePrice": 20000000, "nationality": "India", "category": "Bowlers Set"},
    {"name": "Khaleel Ahmed", "role": "Bowler", "team": "", "basePrice": 20000000, "nationality": "India", "category": "Bowlers Set"},
    {"name": "Avesh Khan", "role": "Bowler", "team": "", "basePrice": 20000000, "nationality": "India", "category": "Bowlers Set"},
    {"name": "T Natarajan", "role": "Bowler", "team": "", "basePrice": 20000000, "nationality": "India", "category": "Bowlers Set"},
    {"name": "Arshdeep Singh", "role": "Bowler", "team": "", "basePrice": 20000000, "nationality": "India", "category": "Bowlers Set"},
    {"name": "Prasidh Krishna", "role": "Bowler", "team": "", "basePrice": 20000000, "nationality": "India", "category": "Bowlers Set"},
    {"name": "Mukesh Kumar", "role": "Bowler", "team": "", "basePrice": 10000000, "nationality": "India", "category": "Bowlers Set"},
    {"name": "Akash Deep", "role": "Bowler", "team": "", "basePrice": 10000000, "nationality": "India", "category": "Bowlers Set"},
    {"name": "Noor Ahmad", "role": "Bowler", "team": "", "basePrice": 20000000, "nationality": "Afghanistan", "category": "Bowlers Set"},
    {"name": "Wanindu Hasaranga", "role": "All-Rounder", "team": "", "basePrice": 15000000, "nationality": "Sri Lanka", "category": "Bowlers Set"},
    {"name": "Maheesh Theekshana", "role": "Bowler", "team": "", "basePrice": 15000000, "nationality": "Sri Lanka", "category": "Bowlers Set"},
    {"name": "Kagiso Rabada", "role": "Bowler", "team": "", "basePrice": 20000000, "nationality": "South Africa", "category": "Bowlers Set"},
    {"name": "Anrich Nortje", "role": "Bowler", "team": "", "basePrice": 20000000, "nationality": "South Africa", "category": "Bowlers Set"},

    # ALL-ROUNDERS SET
    {"name": "Sam Curran", "role": "All-Rounder", "team": "", "basePrice": 20000000, "nationality": "England", "category": "All-Rounders Set"},
    {"name": "Will Jacks", "role": "All-Rounder", "team": "", "basePrice": 20000000, "nationality": "England", "category": "All-Rounders Set"},
    {"name": "Krunal Pandya", "role": "All-Rounder", "team": "", "basePrice": 20000000, "nationality": "India", "category": "All-Rounders Set"},
    {"name": "Washington Sundar", "role": "All-Rounder", "team": "", "basePrice": 20000000, "nationality": "India", "category": "All-Rounders Set"},
    {"name": "Axar Patel", "role": "All-Rounder", "team": "", "basePrice": 20000000, "nationality": "India", "category": "All-Rounders Set"},
    {"name": "Mitchell Marsh", "role": "All-Rounder", "team": "", "basePrice": 20000000, "nationality": "Australia", "category": "All-Rounders Set"},
    {"name": "Marcus Stoinis", "role": "All-Rounder", "team": "", "basePrice": 20000000, "nationality": "Australia", "category": "All-Rounders Set"},
    {"name": "Glenn Phillips", "role": "All-Rounder", "team": "", "basePrice": 20000000, "nationality": "New Zealand", "category": "All-Rounders Set"},
    {"name": "Azmatullah Omarzai", "role": "All-Rounder", "team": "", "basePrice": 15000000, "nationality": "Afghanistan", "category": "All-Rounders Set"},
    {"name": "David Miller", "role": "Batter", "team": "", "basePrice": 15000000, "nationality": "South Africa", "category": "All-Rounders Set"},
    {"name": "Abdul Samad", "role": "All-Rounder", "team": "", "basePrice": 15000000, "nationality": "India", "category": "All-Rounders Set"},

    # WICKET-KEEPERS SET
    {"name": "Quinton de Kock", "role": "WK-Batter", "team": "", "basePrice": 10000000, "nationality": "South Africa", "category": "Wicket-Keepers Set"},
    {"name": "Ryan Rickelton", "role": "WK-Batter", "team": "", "basePrice": 10000000, "nationality": "South Africa", "category": "Wicket-Keepers Set"},
    {"name": "Jitesh Sharma", "role": "WK-Batter", "team": "", "basePrice": 10000000, "nationality": "India", "category": "Wicket-Keepers Set"},

    # UNCAPPED INDIANS SET
    {"name": "Suyash Sharma", "role": "Bowler", "team": "", "basePrice": 3000000, "nationality": "India", "category": "Uncapped Indians Set"},
    {"name": "Anshul Kamboj", "role": "Bowler", "team": "", "basePrice": 3000000, "nationality": "India", "category": "Uncapped Indians Set"},
    {"name": "Gurjapneet Singh", "role": "Bowler", "team": "", "basePrice": 3000000, "nationality": "India", "category": "Uncapped Indians Set"},
    {"name": "Angkrish Raghuvanshi", "role": "Batter", "team": "", "basePrice": 3000000, "nationality": "India", "category": "Uncapped Indians Set"},
    {"name": "Naman Dhir", "role": "Batter", "team": "", "basePrice": 3000000, "nationality": "India", "category": "Uncapped Indians Set"},
    {"name": "Robin Minz", "role": "WK-Batter", "team": "", "basePrice": 3000000, "nationality": "India", "category": "Uncapped Indians Set"},
    {"name": "Arjun Tendulkar", "role": "All-Rounder", "team": "", "basePrice": 3000000, "nationality": "India", "category": "Uncapped Indians Set"},
    {"name": "Raj Angad Bawa", "role": "All-Rounder", "team": "", "basePrice": 3000000, "nationality": "India", "category": "Uncapped Indians Set"},

    # RETAINED PLAYERS
    {"name": "Virat Kohli", "role": "Batter", "team": "RCB", "basePrice": 210000000, "nationality": "India", "category": "Retained"},
    {"name": "Jasprit Bumrah", "role": "Bowler", "team": "MI", "basePrice": 180000000, "nationality": "India", "category": "Retained"},
    {"name": "Rohit Sharma", "role": "Batter", "team": "MI", "basePrice": 163000000, "nationality": "India", "category": "Retained"},
    {"name": "Suryakumar Yadav", "role": "Batter", "team": "MI", "basePrice": 163500000, "nationality": "India", "category": "Retained"},
    {"name": "Hardik Pandya", "role": "All-Rounder", "team": "MI", "basePrice": 163500000, "nationality": "India", "category": "Retained"},
    {"name": "Rashid Khan", "role": "Bowler", "team": "GT", "basePrice": 180000000, "nationality": "Afghanistan", "category": "Retained"},
    {"name": "Shubman Gill", "role": "Batter", "team": "GT", "basePrice": 165000000, "nationality": "India", "category": "Retained"},
    {"name": "Ruturaj Gaikwad", "role": "Batter", "team": "CSK", "basePrice": 180000000, "nationality": "India", "category": "Retained"},
    {"name": "Ravindra Jadeja", "role": "All-Rounder", "team": "CSK", "basePrice": 180000000, "nationality": "India", "category": "Retained"},
    {"name": "Sanju Samson", "role": "WK-Batter", "team": "RR", "basePrice": 180000000, "nationality": "India", "category": "Retained"},
    {"name": "Yashasvi Jaiswal", "role": "Batter", "team": "RR", "basePrice": 180000000, "nationality": "India", "category": "Retained"},
    {"name": "Heinrich Klaasen", "role": "WK-Batter", "team": "SRH", "basePrice": 230000000, "nationality": "South Africa", "category": "Retained"},
    {"name": "Pat Cummins", "role": "Bowler", "team": "SRH", "basePrice": 180000000, "nationality": "Australia", "category": "Retained"},
    {"name": "Travis Head", "role": "Batter", "team": "SRH", "basePrice": 140000000, "nationality": "Australia", "category": "Retained"},
    {"name": "Abhishek Sharma", "role": "All-Rounder", "team": "SRH", "basePrice": 140000000, "nationality": "India", "category": "Retained"},
    {"name": "Nicholas Pooran", "role": "WK-Batter", "team": "LSG", "basePrice": 210000000, "nationality": "West Indies", "category": "Retained"},
    {"name": "Rinku Singh", "role": "Batter", "team": "KKR", "basePrice": 130000000, "nationality": "India", "category": "Retained"},
    {"name": "Varun Chakravarthy", "role": "Bowler", "team": "KKR", "basePrice": 120000000, "nationality": "India", "category": "Retained"},
    {"name": "Sunil Narine", "role": "All-Rounder", "team": "KKR", "basePrice": 120000000, "nationality": "West Indies", "category": "Retained"},
    {"name": "Andre Russell", "role": "All-Rounder", "team": "KKR", "basePrice": 120000000, "nationality": "West Indies", "category": "Retained"},
    {"name": "Axar Patel", "role": "All-Rounder", "team": "DC", "basePrice": 165000000, "nationality": "India", "category": "Retained"},
    {"name": "Kuldeep Yadav", "role": "Bowler", "team": "DC", "basePrice": 132500000, "nationality": "India", "category": "Retained"},
    {"name": "Arshdeep Singh", "role": "Bowler", "team": "PBKS", "basePrice": 180000000, "nationality": "India", "category": "Retained"},
    {"name": "Matheesha Pathirana", "role": "Bowler", "team": "CSK", "basePrice": 130000000, "nationality": "Sri Lanka", "category": "Retained"},
    {"name": "Rajat Patidar", "role": "Batter", "team": "RCB", "basePrice": 110000000, "nationality": "India", "category": "Retained"}
]

# Read resolved cricinfo IDs
with open("cricinfo_ids.json", "r") as f:
    resolved_ids = json.load(f)

final_players = []
for pdef in player_pool_definition:
    name = pdef["name"]
    # Get Cricinfo ID
    espn_id = manual_espn_ids.get(name)
    if not espn_id and name in resolved_ids:
        espn_id = resolved_ids[name][0]
    
    cricbuzz_id = cricbuzz_ids.get(name, "")
    ipl_id = ipl_ids.get(name, "")
    
    # Stats
    stats_data = player_stats.get(name, {})
    
    # Format a stats description string for backward compatibility
    stats_desc = ""
    role_lower = pdef["role"].lower()
    if "wk" in role_lower or "bat" in role_lower:
        stats_desc = f"Runs: {stats_data.get('runs', 0)}, SR: {stats_data.get('strikeRate', 0)}, Avg: {stats_data.get('average', 0)}"
        if "wickets" in stats_data: # All-rounder split
            stats_desc += f" | Wkts: {stats_data.get('wickets', 0)}, Econ: {stats_data.get('economy', 0)}"
    elif "bowl" in role_lower:
        stats_desc = f"Wkts: {stats_data.get('wickets', 0)}, Econ: {stats_data.get('economy', 0)}, Avg: {stats_data.get('average', 0)}"
    elif "all" in role_lower:
        stats_desc = f"Runs: {stats_data.get('runs', 0)}, SR: {stats_data.get('strikeRate', 0)} | Wkts: {stats_data.get('wickets', 0)}, Econ: {stats_data.get('economy', 0)}"
        
    p_obj = {
        "name": name,
        "role": pdef["role"],
        "team": pdef["team"],
        "basePrice": pdef["basePrice"],
        "stats": stats_desc,
        "nationality": "Overseas" if pdef["nationality"].upper() not in ["INDIA", "INDIAN"] else "Indian",
        "category": pdef["category"],
        "isCapped": "uncapped" not in pdef["category"].lower(),
        "isOverseas": pdef["nationality"].upper() not in ["INDIA", "INDIAN"],
        "poolSource": "2025",
        "espnId": espn_id or "",
        "cricbuzzId": cricbuzz_id,
        "iplId": ipl_id,
        "runs": stats_data.get("runs", 0),
        "strikeRate": stats_data.get("strikeRate", 0),
        "average": stats_data.get("average", 0) if "average" in stats_data else stats_data.get("average_bowl", 0),
        "hundreds": stats_data.get("hundreds", 0),
        "fifties": stats_data.get("fifties", 0),
        "wickets": stats_data.get("wickets", 0),
        "economy": stats_data.get("economy", 0),
        "bestBowling": stats_data.get("bestBowling", ""),
        "rating": stats_data.get("rating", 80)
    }
    final_players.append(p_obj)

# Output JS seeder content
js_content = f"""// Auto-generated 2025 IPL Player pool
const mongoose = require('mongoose');
const Player = require('./models/Player');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ipl-auction';

const players2025 = {json.dumps(final_players, indent=2)};

async function seed() {{
  try {{
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB for seeding 2025 players...');
    
    // Clear old 2025 players
    const deleteResult = await Player.deleteMany({{ poolSource: '2025' }});
    console.log(`Cleared ${{deleteResult.deletedCount}} existing 2025 players.`);
    
    // Insert new ones
    const insertResult = await Player.insertMany(players2025);
    console.log(`Successfully seeded ${{insertResult.length}} authentic IPL 2025 players!`);
    
    await mongoose.disconnect();
    console.log('Database connection closed.');
    process.exit(0);
  }} catch (err) {{
    console.error('Seeding error:', err);
    process.exit(1);
  }}
}}

if (require.main === module) {{
  seed();
}}

module.exports = players2025;
"""

with open("backend/seed_players_2025.js", "w") as f:
    f.write(js_content)
print("Javascript seeder generated successfully at backend/seed_players_2025.js!")

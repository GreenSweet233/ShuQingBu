import openpyxl
import json

wb = openpyxl.load_workbook("D:\\Windows\\GreenSweet\\小本本备份\\抒情簿AI_Project\\抒情簿——哲学部.xlsx")
ws = wb["Main"]

cat_map = {
    "G": "对体悟（抽象感知）与理解的解释",
    "H": "对哲学与思想的认识",
    "I": "心流在哪",
    "J": "生活动态（吐槽）",
    "K": '涉及到"历史"一词的句子',
    "L": "论学习、读书",
    "M": "学科相关",
    "N": "对理性及其产物的思考",
    "O": "身份意识：自我评价",
    "P": "宏观视角：宇宙、科学、生死、精神",
    "Q": "以处于青春期的姿态看爱（情）",
    "R": "心态",
    "S": "意义",
    "T": "文学与艺术",
    "U": "为人、道德与社交",
    "V": "价值",
    "W": "友谊",
    "X": "哭泣",
    "Y": "说明",
    "Z": "对记忆的认识",
    "AA": "看字词（表层含义）",
    "AB": "教育与竞争",
    "AC": "努力与能力",
    "AD": "人生、命运",
    "AE": "欣赏",
    "AF": "美好",
    "AG": "一些疑惑",
    "AH": "社会",
    "AI": "其他的一些认识",
    "AJ": "其他的声音（仅为收录回忆，不作评价）",
    "AK": "愤怒",
    "AL": "草稿本",
    "AM": "本能",
    "AN": "名人名言",
    "AO": "悲剧",
}

cat_letters = [
    "G","H","I","J","K","L","M","N","O","P","Q","R","S","T","U","V",
    "W","X","Y","Z","AA","AB","AC","AD","AE","AF","AG","AH","AI","AJ",
    "AK","AL","AM","AN","AO"
]

entries = []
for row in ws.iter_rows(min_row=4, values_only=False):
    vals = [c.value for c in row]
    entry_id = vals[0]
    if entry_id is None:
        continue
    try:
        entry_id = int(entry_id)
    except (ValueError, TypeError):
        entry_id = 0
    content = vals[1] or ""
    year = vals[2]
    month = vals[3]
    day = vals[4]
    is_excerpt = vals[5] == 1

    date_parts = []
    if year:
        date_parts.append(str(int(year)))
    if month:
        date_parts.append(str(int(month)))
    if day:
        date_parts.append(str(int(day)))
    date_str = "-".join(date_parts) if date_parts else ""

    categories = []
    for i, letter in enumerate(cat_letters):
        col_idx = 6 + i
        if col_idx < len(vals) and vals[col_idx] == 1:
            categories.append(cat_map.get(letter, letter))

    entries.append({
        "id": int(entry_id),
        "content": content.strip(),
        "date": date_str,
        "is_excerpt": is_excerpt,
        "categories": categories,
    })

output = json.dumps(entries, ensure_ascii=False, indent=2)
out_path = "D:\\Windows\\GreenSweet\\小本本备份\\抒情簿AI_Project\\entries.json"
with open(out_path, "w", encoding="utf-8") as f:
    f.write(output)

all_cats = set()
for e in entries:
    for c in e["categories"]:
        all_cats.add(c)
print(f"Total entries: {len(entries)}")
print(f"Categories used: {len(all_cats)}")
print(f"All categories: {sorted(all_cats)}")
print("Sample:", json.dumps(entries[0], ensure_ascii=False, indent=2))

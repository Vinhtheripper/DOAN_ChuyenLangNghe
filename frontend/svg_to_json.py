import re, json

# Đường dẫn đến file SVG gốc
svg_path = r"D:\Project\dacsan3mien\frontend\src\assets\maps\New VN Maps (4).svg"
output_path = r"D:\Project\dacsan3mien\frontend\src\assets\maps\vietnamMapData.json"

with open(svg_path, "r", encoding="utf-8") as f:
    data = f.read()

# Tìm tất cả các nhóm <g id="...">...</g>
groups = re.findall(r'<g id="(.*?)">(.*?)</g>', data, flags=re.S)

province_map = {
    "HCM": "TP. Hồ Chí Minh", "HN": "Hà Nội", "DN": "Đà Nẵng", "LD": "Lâm Đồng",
    "KH": "Khánh Hòa", "BN": "Bắc Ninh", "QNA": "Quảng Nam", "QNG": "Quảng Ngãi",
    "BRVT": "Bà Rịa - Vũng Tàu", "BD": "Bình Định", "NA": "Nghệ An", "TTH": "Thừa Thiên Huế",
    "BDG": "Bình Dương", "DNai": "Đồng Nai", "KG": "Kiên Giang", "CM": "Cà Mau",
    "CT": "Cần Thơ", "BT": "Bến Tre", "VL": "Vĩnh Long", "ST": "Sóc Trăng",
    "NB": "Ninh Bình", "QN": "Quảng Ninh", "PY": "Phú Yên", "BG": "Bắc Giang",
    "ND": "Nam Định", "HT": "Hà Tĩnh", "LCA": "Lào Cai", "HP": "Hải Phòng",
    "NAI": "Ninh Thuận", "GL": "Gia Lai", "DL": "Đắk Lắk", "BP": "Bình Phước"
}

result = []

for gid, content in groups:
    paths = re.findall(r'd="(.*?)"', content)
    name = province_map.get(gid, gid)
    result.append({"id": gid, "name": name, "paths": paths})

with open(output_path, "w", encoding="utf-8") as f:
    json.dump(result, f, ensure_ascii=False, indent=2)

print(f"✅ Đã tạo file: {output_path}")

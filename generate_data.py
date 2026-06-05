import os, re, json

PPLD_ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "PPLD_Public")
OUTPUT = os.path.join(os.path.dirname(os.path.abspath(__file__)),
                      "assets", "js", "data.js")
IMAGE_EXTS = {'.png', '.jpg', '.jpeg', '.svg', '.gif', '.webp'}
YEAR_OVERRIDES = {
    "Labour 70s.png": [1970],
    "PCI color.png": [1983],
    "FI HD.png": [1994],
    "PPI.png": [1994],
    "Untitled.png": [2018],
}

def title_case(name):
    minor = {'a','an','the','and','or','but','of','in','on','at','to','for','with','by','from'}
    words = name.split()
    result = []
    for i, w in enumerate(words):
        if i == 0 or w.lower() not in minor:
            result.append(w.capitalize())
        else:
            result.append(w.lower())
    return ' '.join(result)

def extract_years(filename):
    name = os.path.splitext(filename)[0]
    found = re.findall(r'(?<!\d)(1[89]\d\d|20\d\d)(?!\d)', name)
    return sorted(set(int(y) for y in found if 1900 <= int(y) <= 2030))

entries = []
for country_dir in sorted(os.listdir(PPLD_ROOT)):
    cp = os.path.join(PPLD_ROOT, country_dir)
    if not os.path.isdir(cp) or country_dir.startswith('.'): continue
    for party_dir in sorted(os.listdir(cp)):
        pp = os.path.join(cp, party_dir)
        if not os.path.isdir(pp) or party_dir.startswith('.'): continue
        for fn in sorted(os.listdir(pp)):
            ext = os.path.splitext(fn)[1].lower()
            if ext not in IMAGE_EXTS or fn.startswith('.'): continue
            years = YEAR_OVERRIDES.get(fn) or extract_years(fn)
            # Skip logos with no years or all years before 1980
            if years and max(years) < 1980:
                continue
            entries.append({
                'country': country_dir,
                'party': title_case(party_dir),
                'year': years[0] if years else 0,
                'years': years or [],
                'file': f"./PPLD_Public/{country_dir}/{party_dir}/{fn}",
                'ext': ext[1:]
            })

lines = [
    "/*",
    "  PPLD Political Logo Library — Data Catalog",
    "  Each entry: { country, party, year, years, file, ext }",
    "  'years' = array of all years a multi-year logo covers.",
    "  'year'  = the primary / earliest year for sort/filter.",
    "  'file'  = path relative to the html5up-zerofour folder root.",
    "*/",
    "",
    "const LOGO_DATA = [",
    ""
]
cur = None
for e in entries:
    if e['country'] != cur:
        cur = e['country']
        lines.append(f"  /* {cur.upper()} */")
    fe = e['file'].replace('"', '\\"')
    pe = e['party'].replace('"', '\\"')
    ce = e['country'].replace('"', '\\"')
    lines.append(f'  {{ country:"{ce}", party:"{pe}", year:{e["year"]}, years:{json.dumps(e["years"])}, file:"{fe}", ext:"{e["ext"]}" }},')

lines += [
    "];",
    "",
    "// Derive filter option lists",
    "const ALL_COUNTRIES = [...new Set(LOGO_DATA.map(d => d.country))].sort();",
    "const ALL_PARTIES   = [...new Set(LOGO_DATA.map(d => d.party))].sort();",
    "const ALL_YEARS     = [...new Set(LOGO_DATA.flatMap(d => d.years))].filter(Boolean).sort((a,b)=>a-b);",
    "const MIN_YEAR      = ALL_YEARS[0];",
    "const MAX_YEAR      = ALL_YEARS[ALL_YEARS.length - 1];",
]

with open(OUTPUT, 'w', encoding='utf-8') as f:
    f.write('\n'.join(lines))

print(f"Done! Written {len(entries)} entries to data.js")

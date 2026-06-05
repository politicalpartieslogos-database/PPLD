# PPLD - Political Party Logo Database

A browsable archive of political party logos from 18 European countries, spanning the 1980s to the present. Built on the [ZeroFour](https://html5up.net/zerofour) template by HTML5 UP.

---

## Folder Structure

```
RESEARCH/
├── html5up-zerofour/          # Website Root
│   ├── index.html             # Homepage
│   ├── collection.html        # Logo Browser with Filtering
│   ├── left-sidebar.html      # About & Research Page
│   ├── images/                # Site Images + Researcher Photos
│   ├── assets/
│   │   ├── css/
│   │   │   ├── main.css       # ZeroFour Base Styles
│   │   │   └── collection.css # Collection Browser Styles
│   │   └── js/
│   │       ├── data.js        # Logo Catalog (All Metadata)
│   │       ├── collection.js  # Filtering and Browsing Logic
│   │       └── ...            # jQuery and ZeroFour Scripts
│   └── generate_data.py       # Script to Rebuild data.js from PPLD_Public
└── PPLD_Public/               # All Logo Image Files
    ├── Austria/
    │   ├── FPO/
    │   ├── OVP/
    │   └── ...
    ├── Belgium/
    └── ... (18 countries total)
```

> `PPLD_Public` sits **alongside** `html5up-zerofour`, not inside it. The site references logos as `../PPLD_Public/...` from the website root.

---

## Adding or Updating Logos

If you add new images to `PPLD_Public`, just run the generator script to rebuild `data.js`:

```bash
cd ~/Desktop/RESEARCH
python3 generate_data.py
```

This scans all image files and writes a fresh `data.js` with every logo catalogued by country, party, and year. No manual editing needed.

To add a logo manually, open `assets/js/data.js` and add an entry to `LOGO_DATA`:

```js
{ country:"Germany", party:"SPD", year:1998, years:[1998],
  file:"../PPLD_Public/Germany/SPD/1998 SPD.png", ext:"png" },
```

For logos that span multiple election years:

```js
{ country:"Germany", party:"SPD", year:2002, years:[2002, 2005, 2009],
  file:"../PPLD_Public/Germany/SPD/2002-2009 SPD.png", ext:"png" },
```

---

## Filter Features

| Feature      | Description                                         |
|------------- |---------------------------------------------------- |
| Country      | Checkbox list with live result counts               |
| Party        | Checkbox list with live result counts               |
| Year range   | Dual slider from 1948 to 2024                       |
| File type    | Toggle PNG, JPG, SVG independently                  |
| Text search  | Searches country, party, and year                   |
| Sort         | By year (oldest/newest), country, or party          |
| View toggle  | Grid or list layout                                 |
| Active tags  | Click x on any tag to remove that filter            |
| Lightbox     | Click any logo to enlarge with download option      |
| Reset        | Clears all filters and shows the full collection    |

---

## Credits

Template: [ZeroFour by HTML5 UP](https://html5up.net/zerofour) (CCA 3.0)
Logo Data: PPLD Research Project, University of Pittsburgh
Site Creation/Coding: Nishita Jakkam (2026)

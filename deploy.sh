#!/bin/bash
echo "Regenerating data.js..."
python3 generate_data.py

echo "Syncing files to subfolder..."
cp assets/js/data.js html5up-zerofour/assets/js/data.js
cp assets/css/collection.css html5up-zerofour/assets/css/collection.css
cp assets/css/main.css html5up-zerofour/assets/css/main.css
cp index.html html5up-zerofour/index.html
cp collection.html html5up-zerofour/collection.html
cp left-sidebar.html html5up-zerofour/left-sidebar.html

echo "Pushing to GitHub..."
git add -A
git commit -m "${1:-Update site}"
git push origin main
echo "Done!"

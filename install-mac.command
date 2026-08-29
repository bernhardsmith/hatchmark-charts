#!/bin/bash
# Hatchmark Charts for Excel — Mac installer.
# Copies the add-in manifest into Excel's sideload folder.
set -e
echo ""
echo "  Hatchmark Charts for Excel — installer"
echo "  ---------------------------------------"
DEST="$HOME/Library/Containers/com.microsoft.Excel/Data/Documents/wef"
if [ ! -d "$HOME/Library/Containers/com.microsoft.Excel" ]; then
  echo "  ✗ Microsoft Excel doesn't appear to be installed for this user."
  echo "    Install Excel (Microsoft 365), run it once, then run this again."
  read -n 1 -s -r -p "  Press any key to close..."
  exit 1
fi
mkdir -p "$DEST"
curl -fsSL "https://bernhardsmith.github.io/hatchmark-charts/hatchmark-charts.xml" \
  -o "$DEST/hatchmark-charts.xml"
echo "  ✓ Installed."
echo ""
echo "  Now: quit and reopen Excel, open any workbook, and look for the"
echo "  'Hatchmark' tab in the ribbon. (If you don't see it: Insert menu"
echo "  ▸ Add-ins ▸ My Add-ins ▸ Hatchmark Charts.)"
echo ""
read -n 1 -s -r -p "  Press any key to close..."
echo ""

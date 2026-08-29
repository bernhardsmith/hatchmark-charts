# Hatchmark Charts for Excel — Windows installer.
# Downloads the add-in manifest, shares its folder, and registers it as an
# Office trusted catalog for the current user (Microsoft's documented
# sideload mechanism). Sharing a folder may require Administrator rights:
# if this script reports an error, right-click PowerShell and
# "Run as administrator", then run it again.

$ErrorActionPreference = "Stop"
$manifestUrl = "https://bernhardsmith.github.io/hatchmark-charts/hatchmark-charts.xml"
$dir = "$env:USERPROFILE\HatchmarkAddin"
$shareName = "HatchmarkAddin"
$catalogId = "{82661C88-3206-465C-9F10-3B4A586D72BC}"

Write-Host ""
Write-Host "  Hatchmark Charts for Excel - installer"
Write-Host "  --------------------------------------"

New-Item -ItemType Directory -Force -Path $dir | Out-Null
Invoke-WebRequest $manifestUrl -OutFile "$dir\hatchmark-charts.xml"

if (-not (Get-SmbShare -Name $shareName -ErrorAction SilentlyContinue)) {
    New-SmbShare -Name $shareName -Path $dir -FullAccess "$env:USERDOMAIN\$env:USERNAME" | Out-Null
}
$unc = "\\$env:COMPUTERNAME\$shareName"

$key = "HKCU:\Software\Microsoft\Office\16.0\WEF\TrustedCatalogs\$catalogId"
New-Item -Path $key -Force | Out-Null
New-ItemProperty -Path $key -Name "Id" -Value $catalogId -Force | Out-Null
New-ItemProperty -Path $key -Name "Url" -Value $unc -Force | Out-Null
New-ItemProperty -Path $key -Name "Flags" -Value 3 -PropertyType DWord -Force | Out-Null

Write-Host "  Installed."
Write-Host ""
Write-Host "  Now: restart Excel, then Insert > My Add-ins > SHARED FOLDER"
Write-Host "  > Hatchmark Charts. After the first launch you'll find it on"
Write-Host "  the 'Hatchmark' ribbon tab."
Write-Host ""
Read-Host "  Press Enter to close"

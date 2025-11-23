$ErrorActionPreference = 'Stop'
$files = @(
  (Join-Path (Get-Location) 'converted-data/btc-trades.json');
  (Join-Path (Get-Location) 'converted-data/eth-trades.json');
  (Join-Path (Get-Location) 'converted-data/sol-trades.json')
)
foreach ($path in $files) {
  Write-Host ('Testing: ' + $path)
  $txt = Get-Content $path -Raw
  $obj = $txt | ConvertFrom-Json
  Write-Host ('Parsed OK: ' + ($obj.summary.years.Count) + ' years')
}
param(
  [string]$BaseDir = (Get-Location)
)

$ErrorActionPreference = 'Stop'
$files = @(
  (Join-Path $BaseDir 'converted-data/btc-trades.json');
  (Join-Path $BaseDir 'converted-data/eth-trades.json');
  (Join-Path $BaseDir 'converted-data/sol-trades.json')
)

foreach ($path in $files) {
  if (-not (Test-Path $path)) { Write-Error "File not found: $path" }
  $json = Get-Content $path -Raw | ConvertFrom-Json
  $initialEquity = 10000.0
  $equity = $initialEquity

  $years = @()
  if ($json.summary -and $json.summary.years) {
    $years = $json.summary.years
  } else {
    $years = ($json.yearlyData | Get-Member -MemberType NoteProperty | Select-Object -ExpandProperty Name)
  }
  $sortedYears = $years | ForEach-Object { $_.ToString() } | Sort-Object {[int]$_}

  foreach ($year in $sortedYears) {
    $yd = $json.yearlyData.$year
    if (-not $yd) { continue }
    $yearStartEquity = [math]::Round($equity, 2)
    $yearCompPnl = 0.0
    $compTrades = @()

    foreach ($t in $yd.trades) {
      $rate = [double]$t.pnlPercent / 100.0
      $tradeAmt = [math]::Round($equity, 2)
      $compPnl = [math]::Round($tradeAmt * $rate, 2)
      $equity = [math]::Round($equity + $compPnl, 2)
      $t | Add-Member -NotePropertyName equityBefore -NotePropertyValue $tradeAmt -Force
      $t | Add-Member -NotePropertyName compoundedPnl -NotePropertyValue $compPnl -Force
      $t | Add-Member -NotePropertyName equityAfter -NotePropertyValue $equity -Force
      $yearCompPnl += $compPnl
      $compTrades += $t
    }

    $yd.trades = $compTrades
    if (-not $yd.stats) { $yd | Add-Member -NotePropertyName stats -NotePropertyValue ([pscustomobject]@{}) -Force }
    $yd.stats | Add-Member -NotePropertyName compoundedPnl -NotePropertyValue ([math]::Round($yearCompPnl,2)) -Force
    $yd.stats | Add-Member -NotePropertyName startEquity -NotePropertyValue $yearStartEquity -Force
    $yd.stats | Add-Member -NotePropertyName endEquity -NotePropertyValue ([math]::Round($equity,2)) -Force
    $retRate = if ($yearStartEquity -ne 0) { (($equity - $yearStartEquity)/$yearStartEquity)*100.0 } else { 0 }
    $yd.stats | Add-Member -NotePropertyName returnRateComp -NotePropertyValue ([math]::Round($retRate,2)) -Force
  }

  $finalEquity = [math]::Round($equity,2)
  $totalCompPnl = [math]::Round($finalEquity - $initialEquity,2)
  if (-not $json.summary) { $json | Add-Member -NotePropertyName summary -NotePropertyValue ([pscustomobject]@{}) -Force }
  if (-not $json.summary.overallStats) { $json.summary | Add-Member -NotePropertyName overallStats -NotePropertyValue ([pscustomobject]@{}) -Force }
  $json.summary.overallStats | Add-Member -NotePropertyName initialEquity -NotePropertyValue $initialEquity -Force
  $json.summary.overallStats | Add-Member -NotePropertyName finalEquity -NotePropertyValue $finalEquity -Force
  $json.summary.overallStats | Add-Member -NotePropertyName compoundedTotalPnl -NotePropertyValue $totalCompPnl -Force
  $json.summary.overallStats | Add-Member -NotePropertyName totalReturnRateComp -NotePropertyValue ([math]::Round(($finalEquity / $initialEquity - 1)*100.0,2)) -Force

  $parent = Split-Path $path -Parent
  $leaf = Split-Path $path -Leaf
  $outLeaf = (([System.IO.Path]::GetFileNameWithoutExtension($leaf)) + '-compound.json')
  $outPath = Join-Path $parent $outLeaf
  ($json | ConvertTo-Json -Depth 14) | Set-Content $outPath -Encoding UTF8
  Write-Host ("Processed: " + $leaf + " -> " + $outLeaf + "; FinalEquity=" + $finalEquity)
}
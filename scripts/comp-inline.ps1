$ErrorActionPreference='Stop'
function Comp([string]$f){
  $txt = Get-Content $f -Raw
  $rxTrades = '"trades"\s*:\s*\[([\s\S]*?)\]'
  $tradeBlocks = [regex]::Matches($txt, $rxTrades)
  $rates = @()
  foreach ($tb in $tradeBlocks) {
    $block = $tb.Groups[1].Value
    $msRates = [regex]::Matches($block, '"pnlPercent"\s*:\s*(-?\d+(?:\.\d+)?)')
    foreach ($m in $msRates) { $rates += [double]$m.Groups[1].Value }
  }
  $prod = 1.0
  foreach ($r in $rates) { $prod *= (1.0 + $r/100.0) }
  $final = [math]::Round(10000.0 * $prod, 2)
  Write-Host ($f + ' trades=' + $rates.Count + ' finalEquity=' + $final + ' compoundedTotalPnl=' + ([math]::Round($final-10000.0,2)))
}

Comp 'converted-data/btc-trades.json'
Comp 'converted-data/eth-trades.json'
Comp 'converted-data/sol-trades.json'
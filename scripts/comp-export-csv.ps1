$ErrorActionPreference='Stop'
function ExportCompCsv([string]$inFile, [string]$outFile) {
  $txt = Get-Content $inFile -Raw
  $rxTrades = '"trades"\s*:\s*\[([\s\S]*?)\]'
  $tradeBlocks = [regex]::Matches($txt, $rxTrades)
  $equity = 10000.0
  $rows = @()
  foreach ($tb in $tradeBlocks) {
    $arrTxt = $tb.Groups[1].Value
    $items = [regex]::Matches($arrTxt, '\{[\s\S]*?\}')
    foreach ($it in $items) {
      $item = $it.Value
      $mNum = [regex]::Match($item, '"tradeNum"\s*:\s*(\d+)')
      $mDate = [regex]::Match($item, '"entryDate"\s*:\s*"([^"]*)"')
      $mPos = [regex]::Match($item, '"position"\s*:\s*"([^"]*)"')
      $mRate = [regex]::Match($item, '"pnlPercent"\s*:\s*(-?\d+(?:\.\d+)?)')
      if (-not ($mRate.Success)) { continue }
      $rate = [double]$mRate.Groups[1].Value
      $equityBefore = [math]::Round($equity, 2)
      $compPnl = [math]::Round($equityBefore * $rate / 100.0, 2)
      $equity = [math]::Round($equity + $compPnl, 2)
      $rows += [pscustomobject]@{
        tradeNum     = if ($mNum.Success) { [int]$mNum.Groups[1].Value } else { $null }
        position     = if ($mPos.Success) { $mPos.Groups[1].Value } else { $null }
        entryDate    = if ($mDate.Success) { $mDate.Groups[1].Value } else { $null }
        pnlPercent   = $rate
        equityBefore = $equityBefore
        compoundedPnl= $compPnl
        equityAfter  = $equity
      }
    }
  }
  $rows | Export-Csv -NoTypeInformation -Encoding UTF8 -Path $outFile
  Write-Host ('Exported ' + $outFile + ' rows=' + $rows.Count)
}

$base = Get-Location
ExportCompCsv (Join-Path $base 'converted-data/btc-trades.json') (Join-Path $base 'converted-data/btc-trades-compound.csv')
ExportCompCsv (Join-Path $base 'converted-data/eth-trades.json') (Join-Path $base 'converted-data/eth-trades-compound.csv')
ExportCompCsv (Join-Path $base 'converted-data/sol-trades.json') (Join-Path $base 'converted-data/sol-trades-compound.csv')
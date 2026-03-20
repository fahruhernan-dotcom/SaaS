$src = "src\dashboard\broker\Pengiriman.jsx"
$lines = [System.IO.File]::ReadAllLines($src)

# LogisticsDetailSheet is from line 570 to 717 (0-indexed: 569-716)
$before = $lines[0..568]
$comment = "
// LogisticsDetailSheet -> extracted to @/dashboard/broker/pengiriman/LogisticsDetailSheet.jsx
"
$after = $lines[717..($lines.Count-1)]
$newSrc = $before + $comment + $after
[System.IO.File]::WriteAllLines($src, $newSrc)

Write-Host "Done. Removed LogisticsDetailSheet. Source now $($newSrc.Count) lines."

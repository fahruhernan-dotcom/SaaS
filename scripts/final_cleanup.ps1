$src = "src\dashboard\broker\Pengiriman.jsx"
$lines = [System.IO.File]::ReadAllLines($src)

# Components are from line 478 to 555 (0-indexed: 477-554)
$before = $lines[0..476]
$comment = "
// SummaryCard, FilterPill, EmptyState -> extracted to @/dashboard/broker/pengiriman/Common.jsx
"
$after = $lines[555..($lines.Count-1)]
$newSrc = $before + $comment + $after
[System.IO.File]::WriteAllLines($src, $newSrc)

Write-Host "Done. Final cleanup of Pengiriman.jsx. Source now $($newSrc.Count) lines."

$src = "src\dashboard\broker\Pengiriman.jsx"
$lines = [System.IO.File]::ReadAllLines($src)

# CreateLossSheet is from line 565 to 694 (0-indexed: 564-693)
$before = $lines[0..563]
$comment = "
// CreateLossSheet -> extracted to @/dashboard/broker/pengiriman/CreateLossSheet.jsx
"
$after = $lines[694..($lines.Count-1)]
$newSrc = $before + $comment + $after
[System.IO.File]::WriteAllLines($src, $newSrc)

Write-Host "Done. Removed CreateLossSheet. Source now $($newSrc.Count) lines."

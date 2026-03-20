$src = "src\dashboard\broker\Pengiriman.jsx"
$dest = "src\dashboard\broker\pengiriman\UpdateArrivalSheet.jsx"

$lines = [System.IO.File]::ReadAllLines($src)

# UpdateArrivalSheet is from line 561 to 1674 (0-indexed: 560-1673)
$body = $lines[560..1673]

# Build the imports header
$header = @(
    "import React, { useState, useEffect, useMemo } from 'react'"
    "import { useQuery, useQueryClient } from '@tanstack/react-query'"
    "import { motion, AnimatePresence } from 'framer-motion'"
    "import {"
    "    Truck, ArrowRightLeft,"
    "    Plus, Check, X, Pencil, PencilLine, Trash2,"
    "    Printer, ChevronDown, Lock, Unlock"
    "} from 'lucide-react'"
    "import { format } from 'date-fns'"
    "import { id } from 'date-fns/locale'"
    "import { cn } from '@/lib/utils'"
    "import { supabase } from '@/lib/supabase'"
    "import { useAuth } from '@/hooks/useAuth'"
    "import { toast } from 'sonner'"
    "import { formatWeight, formatEkor, safeNum } from '@/lib/format'"
    "import { useUpdateDelivery } from '@/lib/hooks/useUpdateDelivery'"
    "import { InputNumber } from '@/components/ui/InputNumber'"
    ""
    "import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet'"
    "import { Button } from '@/components/ui/button'"
    "import { Input } from '@/components/ui/input'"
    "import { Label } from '@/components/ui/label'"
    "import { Textarea } from '@/components/ui/textarea'"
    "import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'"
    "import {"
    "    AlertDialog, AlertDialogAction, AlertDialogCancel,"
    "    AlertDialogContent, AlertDialogDescription, AlertDialogFooter,"
    "    AlertDialogHeader, AlertDialogTitle"
    "} from '@/components/ui/alert-dialog'"
    ""
    "export default function UpdateArrivalSheet({ isOpen, onClose, delivery }) {"
)

# Remove the original function signature from the body and prepend 'export default'
# The first line of body is "function UpdateArrivalSheet({ isOpen, onClose, delivery }) {"
# We skip it and use the header's last line instead
$bodyWithoutSig = $body[1..($body.Count-1)]

$result = $header + $bodyWithoutSig
[System.IO.File]::WriteAllLines($dest, $result)

# Now remove lines 561-1674 from the source and replace with a comment
$before = $lines[0..559]
$comment = "// UpdateArrivalSheet -> extracted to @/dashboard/broker/pengiriman/UpdateArrivalSheet.jsx"
$after = $lines[1674..($lines.Count-1)]
$newSrc = $before + "" + $comment + "" + $after
[System.IO.File]::WriteAllLines($src, $newSrc)

Write-Host "Done. Extracted UpdateArrivalSheet ($($result.Count) lines). Source now $($newSrc.Count) lines."

import { QueryClient } from '@tanstack/react-query'
import { normalizeSupabaseError } from './supabaseErrorHandler'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime:           1000 * 60 * 5,  // data fresh 5 menit — tidak refetch saat navigasi
      gcTime:              1000 * 60 * 10, // cache tetap di memory 10 menit setelah tidak dipakai
      refetchOnWindowFocus: false,          // jangan refetch saat user alt-tab / klik window
      refetchOnMount:      true,           // refetch jika cache kosong; skip jika data masih fresh (staleTime)
      refetchOnReconnect:  true,           // tetap refetch jika internet reconnect
      retry: (failureCount, error) => {
        const appError = normalizeSupabaseError(error)
        
        // Jangan retry jika error terkait auth (401), permission (403), kuota (402), atau logic business (400)
        if ([401, 403, 400, 402].includes(appError.status)) {
          return false
        }
        
        // Retry maksimal 2 kali untuk error lainnya (network, 500, dll)
        return failureCount < 2
      },
    },
  },
})

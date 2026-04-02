import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime:           1000 * 60 * 5,  // data fresh 5 menit — tidak refetch saat navigasi
      gcTime:              1000 * 60 * 10, // cache tetap di memory 10 menit setelah tidak dipakai
      refetchOnWindowFocus: false,          // jangan refetch saat user alt-tab / klik window
      refetchOnMount:      true,           // refetch jika cache kosong; skip jika data masih fresh (staleTime)
      refetchOnReconnect:  true,           // tetap refetch jika internet reconnect
      retry:               1,
    },
  },
})

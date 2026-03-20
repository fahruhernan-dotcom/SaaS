import { useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { supabase } from '../supabase'
import { safeNum } from '../format'

export function useUpdateDelivery() {
  const queryClient = useQueryClient()
  
  const updateTiba = async ({
    deliveryId,
    arrivedCount,
    arrivedWeight,
    notes,
    driverId = null,
    driverName = null,
    driverPhone = null
  }) => {
    // 1. Fetch current delivery data for calculations
    const { data: delivery, error: fetchError } = await supabase
      .from('deliveries')
      .select('initial_count, initial_weight_kg, sale_id')
      .eq('id', deliveryId)
      .single()
    
    if (fetchError) throw fetchError
    
    const mortality = safeNum(delivery.initial_count) - safeNum(arrivedCount)
    const shrinkage = safeNum(delivery.initial_weight_kg) - safeNum(arrivedWeight)
    
    // 2. Update delivery status
    const { error: updateError } = await supabase
      .from('deliveries')
      .update({
        arrived_count:     safeNum(arrivedCount),
        arrived_weight_kg: safeNum(arrivedWeight),
        mortality_count:   mortality,
        arrival_time:      format(new Date(), "yyyy-MM-dd'T'HH:mm:ssxxx"),
        status:            'completed',
        notes:             notes || null,
        driver_id:         driverId || null,
        driver_name:       driverName || null,
        driver_phone:      driverPhone || null
      })
      .eq('id', deliveryId)
    
    if (updateError) throw updateError
    
    // 3. Auto-create loss report if there is mortality
    if (mortality > 0) {
      const { data: saleData } = await supabase
        .from('sales')
        .select('price_per_kg, tenant_id')
        .eq('id', delivery.sale_id)
        .single()
      
      if (saleData) {
        // We use a standardized weight per chicken (1.85kg) for mortality financial loss
        const estWeightLoss = mortality * 1.85
        const financialLoss = Math.round(estWeightLoss * safeNum(saleData.price_per_kg))

        await supabase.from('loss_reports').insert({
          tenant_id:      saleData.tenant_id,
          delivery_id:    deliveryId,
          sale_id:        delivery.sale_id,
          loss_type:      'mortality',
          chicken_count:  mortality,
          weight_loss_kg: 0, // In mortality, we usually track count, but financial is derived
          price_per_kg:   saleData.price_per_kg,
          financial_loss: financialLoss,
          description:    `${mortality} ekor mati dalam perjalanan`,
          report_date:    format(new Date(), 'yyyy-MM-dd')
        })
      }
    }
    
    // 4. Invalidate all relevant queries
    queryClient.invalidateQueries({ queryKey: ['deliveries'] })
    queryClient.invalidateQueries({ queryKey: ['sales'] })
    queryClient.invalidateQueries({ queryKey: ['broker-stats'] })
    queryClient.invalidateQueries({ queryKey: ['loss-reports'] })
    
    return { mortality, shrinkage }
  }
  
  return { updateTiba }
}

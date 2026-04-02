import { useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { supabase } from '../supabase'
import { safeNum } from '../format'

export function useUpdateDelivery() {
  const queryClient = useQueryClient()
  
  const updateTiba = async (payload) => {
    const {
      deliveryId,
      arrivedCount,
      arrivedWeight,
      notes,
      loadTime,
      driverId,
      driverName,
      driverPhone,
      vehicleId,
      vehiclePlate,
      vehicleType
    } = payload

    // 1. Fetch current delivery data for calculations
    const { data: delivery, error: fetchError } = await supabase
      .from('deliveries')
      .select('initial_count, initial_weight_kg, sale_id')
      .eq('id', deliveryId)
      .single()
    
    if (fetchError) throw fetchError
    
    const mortality = safeNum(delivery.initial_count) - safeNum(arrivedCount)
    const shrinkage = safeNum(delivery.initial_weight_kg) - safeNum(arrivedWeight)
    
    // Construct dynamic update object to avoid wiping out existing data
    const updateData = {
      arrived_count:     safeNum(arrivedCount),
      arrived_weight_kg: safeNum(arrivedWeight),
      mortality_count:   mortality,
      arrival_time:      format(new Date(), "yyyy-MM-dd'T'HH:mm:ssxxx"),
      status:            'arrived',
      notes:             notes || null
    }

    // Only update these if they were provided in payload
    if (loadTime !== undefined)     updateData.load_time = loadTime
    if (driverId !== undefined)     updateData.driver_id = driverId
    if (driverName !== undefined)   updateData.driver_name = driverName
    if (driverPhone !== undefined)  updateData.driver_phone = driverPhone
    if (vehicleId !== undefined)    updateData.vehicle_id = vehicleId
    if (vehiclePlate !== undefined) updateData.vehicle_plate = vehiclePlate
    if (vehicleType !== undefined)  updateData.vehicle_type = vehicleType
    
    // 2. Update delivery status
    const { error: updateError } = await supabase
      .from('deliveries')
      .update(updateData)
      .eq('id', deliveryId)
    
    if (updateError) throw updateError
    
    // 3. Update Sales Revenue based on Arrived Weight
    const { data: saleData } = await supabase
      .from('sales')
      .select('price_per_kg, tenant_id')
      .eq('id', delivery.sale_id)
      .single()

    if (saleData) {
      const newTotalRevenue = Math.round(safeNum(arrivedWeight) * safeNum(saleData.price_per_kg))
      
      const { error: saleUpdateError } = await supabase
        .from('sales')
        .update({ total_revenue: newTotalRevenue })
        .eq('id', delivery.sale_id)

      if (saleUpdateError) console.error('Error updating sale revenue:', saleUpdateError)
      else console.log('✅ Sales total_revenue updated:', newTotalRevenue)

      // 4. Auto-create loss report if there is mortality
      if (mortality > 0) {
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
    await queryClient.invalidateQueries({ queryKey: ['sales'] })
    if (saleData) await queryClient.invalidateQueries({ queryKey: ['sales', saleData.tenant_id] })
    await queryClient.invalidateQueries({ queryKey: ['deliveries'] })
    if (saleData) await queryClient.invalidateQueries({ queryKey: ['deliveries', saleData.tenant_id] })
    if (saleData) await queryClient.refetchQueries({ queryKey: ['sales', saleData.tenant_id] })
    await queryClient.invalidateQueries({ queryKey: ['broker-stats'] })
    await queryClient.invalidateQueries({ queryKey: ['loss-reports'] })
    
    return { mortality, shrinkage }
  }
  
  return { updateTiba }
}

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export async function createOrder(orderData: any) {
  const { items, ...orderDetails } = orderData;
  
  // Use transaction to ensure both order and items are created
  return await prisma.$transaction(async (tx) => {
    // Create the order
    const order = await tx.order.create({
      data: {
        hotel_id: orderDetails.hotel_id,
        owner_name: orderDetails.owner_name,
        phone_number: orderDetails.phone_number,
        location: orderDetails.location,
        note: orderDetails.note,
        total: orderDetails.total,
        date: orderDetails.date,
        status: orderDetails.status
      }
    });

    // Create order items
    const orderItems = await Promise.all(
      items.map((item: any) =>
        tx.orderItem.create({
          data: {
            order_id: order.id,
            item_id: item.item_id,
            name: item.name,
            quantity: item.quantity,
            grams: item.grams,
            price: item.price,
            unit: item.unit
          }
        })
      )
    );

    return { ...order, items: orderItems };
  });
}

export async function getUserOrders(hotelId: number) {
  return await prisma.order.findMany({
    where: {
      hotel_id: hotelId
    },
    include: {
      items: true
    },
    orderBy: {
      created_at: 'desc'
    }
  });
} 
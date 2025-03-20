import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function createOrder(orderData: any) {
  return await prisma.$transaction(async (tx) => {
    const { items, ...orderDetails } = orderData;

    const order = await tx.order.create({
      data: {
        hotel_id: orderDetails.hotel_id,
        owner_name: orderDetails.owner_name,
        phone_number: orderDetails.phone_number,
        location: orderDetails.location,
        note: orderDetails.note,
        total: orderDetails.total,
        date: new Date(orderDetails.date),
        status: orderDetails.status
      }
    });

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

    return {
      ...order,
      items: orderItems
    };
  });
}

export async function getOrdersByHotelId(hotelId: number) {
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

export async function getOrderById(orderId: number, hotelId: number) {
  return await prisma.order.findFirst({
    where: {
      id: orderId,
      hotel_id: hotelId
    },
    include: {
      items: true
    }
  });
} 
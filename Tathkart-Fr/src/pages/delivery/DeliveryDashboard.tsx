import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth, Order } from '@/context/AuthContext';
import PageTransition from '@/components/layout/PageTransition';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, LogOut, Truck } from 'lucide-react';
import BrandLogo from '@/components/ui/brand-logo';

const DeliveryDashboard = () => {
  const { user, isAuthenticated, getOrders, updateOrderStatus, logout } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);

  // Redirect if not authenticated or not a delivery person
  if (!isAuthenticated || (user && user.role !== 'delivery')) {
    return <Navigate to="/login/delivery" replace />;
  }

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    const readyOrders = await getOrders();
    setOrders(readyOrders.filter(order => order.status === 'ready'));
  };

  const handleDelivered = async (orderId: string) => {
    await updateOrderStatus(orderId, 'delivered');
    loadOrders();
  };

  const handleLogout = async () => {
    await logout();
    // The auth context will handle the redirect
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-gray-50">
        <header className="bg-tathkart-800 text-white p-4 shadow-md">
          <div className="container mx-auto">
            <div className="flex justify-between items-center">
              <BrandLogo size="sm" animated={false} />
              <Button 
                variant="destructive" 
                size="sm"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </header>

        <main className="container mx-auto p-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <Truck className="h-5 w-5 mr-2 text-tathkart-gold" />
                Ready for Delivery
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              {orders.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>No orders ready for delivery.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map(order => (
                    <div key={order.id} className="border border-gray-200 rounded-lg overflow-hidden">
                      <div className="bg-blue-600 px-4 py-2 text-white">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">{order.hotelName}</span>
                          <span className="text-xs">
                            {new Date(order.createdAt).toLocaleString()}
                          </span>
                        </div>
                      </div>
                      <div className="p-4">
                        <div className="space-y-2">
                          {order.items.map(item => (
                            <div key={item.id} className="flex justify-between text-sm">
                              <span>{item.name} ({item.quantity} {item.unit})</span>
                              <span>₹{item.totalPrice}</span>
                            </div>
                          ))}
                          <div className="border-t border-gray-200 pt-2 mt-2">
                            <div className="flex justify-between font-medium">
                              <span>Total</span>
                              <span>₹{order.total}</span>
                            </div>
                            {order.address && (
                              <div className="mt-2 text-sm text-gray-600">
                                <p className="font-medium">Delivery Address:</p>
                                <p>{order.address}</p>
                                {order.addressLink && (
                                  <a 
                                    href={order.addressLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-tathkart-gold hover:underline inline-block mt-1"
                                  >
                                    View on Maps
                                  </a>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <Button
                          className="w-full mt-4 bg-tathkart-gold hover:bg-amber-500 text-tathkart-800"
                          onClick={() => handleDelivered(order.id)}
                        >
                          Mark as Delivered
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </PageTransition>
  );
};

export default DeliveryDashboard;

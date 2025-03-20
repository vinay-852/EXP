import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth, GroceryItem, OrderItem } from '@/context/AuthContext';
import PageTransition from '@/components/layout/PageTransition';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { CalendarIcon, ShoppingCart, User, Phone, MapPin, Minus, Plus, Send } from 'lucide-react';
import { motion } from 'framer-motion';
import BrandLogo from '@/components/ui/brand-logo';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from 'sonner';

const UserDashboard = () => {
  const { user, isAuthenticated, getUserDefaultItems, placeOrder, getOrders, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("groceries");
  const [items, setItems] = useState<GroceryItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<OrderItem[]>([]);
  const [note, setNote] = useState("");
  const [orders, setOrders] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirect if not authenticated or not a user
  if (!isAuthenticated || (user && user.role !== 'user')) {
    return <Navigate to="/login/user" replace />;
  }
  
  // Show pending registration screen if user is not registered
  if (user && !user.isRegistered) {
    return (
      <PageTransition>
        <div className="min-h-screen flex items-center justify-center bg-tathkart-800 p-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="mb-4 bg-tathkart-50 text-tathkart-700 inline-flex rounded-full px-3 py-1 text-sm font-medium">
              Registration Pending
            </div>
            <h1 className="text-2xl font-bold mb-4 text-tathkart-900">Welcome to Tathkart</h1>
            <p className="text-gray-600 mb-6">
              Your registration is pending approval from our administrators. You'll be notified once your account is activated.
            </p>
            <div className="border-t border-gray-200 pt-4 mt-4">
              <p className="font-medium text-tathkart-900">Your Hotel ID</p>
              <p className="text-xl text-tathkart-gold bg-tathkart-800 inline-block px-4 py-2 rounded-full mt-1">{user.hotelId}</p>
              <p className="text-sm text-gray-500 mt-2">
                Please provide this ID when contacting support.
              </p>
            </div>
          </div>
        </div>
      </PageTransition>
    );
  }

  useEffect(() => {
    const loadItems = async () => {
      if (user) {
        const defaultItems = await getUserDefaultItems(user.id);
        setItems(defaultItems);
      }
    };
    
    const loadOrders = async () => {
      if (user) {
        const userOrders = await getOrders(user.id);
        setOrders(userOrders);
      }
    };
    
    loadItems();
    loadOrders();
  }, [user]);

  const handleQuantityChange = (itemId: string, newQuantity: number) => {
    // Update items quantity
    const updatedItems = items.map(item => 
      item.id === itemId ? { ...item, defaultQuantity: newQuantity } : item
    );
    setItems(updatedItems);
    
    // Update or add to selected items
    const itemToUpdate = items.find(item => item.id === itemId);
    if (!itemToUpdate) return;
    
    if (newQuantity > 0) {
      const exists = selectedItems.some(item => item.id === itemId);
      
      if (exists) {
        const updatedSelected = selectedItems.map(item => 
          item.id === itemId ? { 
            ...item, 
            quantity: newQuantity,
            totalPrice: newQuantity * itemToUpdate.price 
          } : item
        );
        setSelectedItems(updatedSelected);
      } else {
        setSelectedItems([
          ...selectedItems,
          {
            ...itemToUpdate,
            quantity: newQuantity,
            totalPrice: newQuantity * itemToUpdate.price
          }
        ]);
      }
    } else {
      // Remove from selected if quantity is 0
      setSelectedItems(selectedItems.filter(item => item.id !== itemId));
    }
  };

  const handleSubmitOrder = async () => {
    if (selectedItems.length === 0) {
      toast.error("Please add at least one item to your order");
      return;
    }
    
    setIsSubmitting(true);
    try {
      const orderId = await placeOrder(selectedItems, note);
      if (orderId) {
        // Reset form
        setNote("");
        // Refresh orders
        const userOrders = await getOrders(user?.id);
        setOrders(userOrders);
        setActiveTab("orders");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    // The auth context will handle the redirect
  };

  const totalOrderAmount = selectedItems.reduce((sum, item) => sum + item.totalPrice, 0);

  return (
    <PageTransition>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-tathkart-800 text-white p-4 shadow-md">
          <div className="container mx-auto">
            <div className="flex justify-between items-center">
              <BrandLogo size="sm" animated={false} />
              <div className="text-sm">
                <span className="bg-tathkart-700 px-3 py-1 rounded-full text-xs font-medium">
                  {user?.hotelId}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto p-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-4">
              <TabsTrigger value="groceries" className="text-sm">
                <ShoppingCart className="w-4 h-4 mr-2" />
                Groceries
              </TabsTrigger>
              <TabsTrigger value="orders" className="text-sm">
                <CalendarIcon className="w-4 h-4 mr-2" />
                Orders
              </TabsTrigger>
              <TabsTrigger value="profile" className="text-sm">
                <User className="w-4 h-4 mr-2" />
                Profile
              </TabsTrigger>
            </TabsList>
            
            {/* Groceries Tab */}
            <TabsContent value="groceries" className="space-y-4">
              <Card>
                <CardContent className="p-4">
                  <h2 className="text-lg font-semibold mb-4 flex items-center">
                    <ShoppingCart className="w-5 h-5 mr-2 text-tathkart-gold" />
                    Daily Grocery Order
                  </h2>
                  
                  <div className="space-y-2">
                    {items.map(item => (
                      <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <h3 className="font-medium">{item.name}</h3>
                          <p className="text-sm text-gray-500">₹{item.price}/{item.unit}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button 
                            variant="outline" 
                            size="icon" 
                            className="h-8 w-8 rounded-full"
                            onClick={() => handleQuantityChange(item.id, Math.max(0, item.defaultQuantity - 1))}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-8 text-center">{item.defaultQuantity}</span>
                          <Button 
                            variant="outline" 
                            size="icon" 
                            className="h-8 w-8 rounded-full"
                            onClick={() => handleQuantityChange(item.id, item.defaultQuantity + 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Order note */}
                  <div className="mt-6">
                    <h3 className="text-sm font-medium mb-2">Add a note (optional)</h3>
                    <Textarea
                      placeholder="Any special instructions for your order..."
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      className="resize-none"
                    />
                  </div>
                  
                  {/* Order summary and submit */}
                  <div className="mt-6 space-y-4">
                    {selectedItems.length > 0 && (
                      <div className="bg-tathkart-50 p-4 rounded-lg">
                        <h3 className="font-medium mb-2">Order Summary</h3>
                        <div className="space-y-2">
                          {selectedItems.map(item => (
                            <div key={item.id} className="flex justify-between text-sm">
                              <span>{item.name} ({item.quantity} {item.unit})</span>
                              <span>₹{item.totalPrice}</span>
                            </div>
                          ))}
                          <div className="border-t border-gray-200 pt-2 mt-2 font-medium flex justify-between">
                            <span>Total</span>
                            <span>₹{totalOrderAmount}</span>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <Button 
                      className="w-full bg-tathkart-gold hover:bg-amber-500 text-tathkart-800"
                      onClick={handleSubmitOrder}
                      disabled={selectedItems.length === 0 || isSubmitting}
                    >
                      {isSubmitting ? (
                        <>Processing...</>
                      ) : (
                        <>
                          <Send className="mr-2 h-4 w-4" />
                          Place Order
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Orders Tab */}
            <TabsContent value="orders" className="space-y-4">
              <Card>
                <CardContent className="p-4">
                  <h2 className="text-lg font-semibold mb-4 flex items-center">
                    <CalendarIcon className="w-5 h-5 mr-2 text-tathkart-gold" />
                    Order History
                  </h2>
                  
                  {orders.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <ShoppingCart className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p>No orders found.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {orders.map((order) => (
                        <div key={order.id} className="border border-gray-200 rounded-lg overflow-hidden">
                          <div className={`px-4 py-2 text-white ${
                            order.status === 'delivered' ? 'bg-green-600' : 
                            order.status === 'cancelled' ? 'bg-red-600' :
                            order.status === 'ready' ? 'bg-blue-600' :
                            order.status === 'processing' ? 'bg-amber-600' : 'bg-gray-600'
                          }`}>
                            <div className="flex justify-between items-center">
                              <span className="capitalize font-medium">{order.status}</span>
                              <span className="text-xs">
                                {new Date(order.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          <div className="p-4">
                            <div className="space-y-2">
                              {order.items.map((item: OrderItem) => (
                                <div key={item.id} className="flex justify-between text-sm">
                                  <span>{item.name} ({item.quantity} {item.unit})</span>
                                  <span>₹{item.totalPrice}</span>
                                </div>
                              ))}
                              <div className="border-t border-gray-200 pt-2 mt-2 font-medium flex justify-between">
                                <span>Total</span>
                                <span>₹{order.total}</span>
                              </div>
                            </div>
                            
                            {order.note && (
                              <div className="mt-3 text-sm bg-gray-50 p-2 rounded">
                                <span className="font-medium">Note: </span>
                                {order.note}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Profile Tab */}
            <TabsContent value="profile" className="space-y-4">
              <Card>
                <CardContent className="p-4">
                  <h2 className="text-lg font-semibold mb-4 flex items-center">
                    <User className="w-5 h-5 mr-2 text-tathkart-gold" />
                    Hotel Profile
                  </h2>
                  
                  <div className="space-y-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-500">Hotel ID</p>
                      <p className="font-medium">{user?.hotelId}</p>
                    </div>
                    
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-500">Hotel Name</p>
                      <p className="font-medium">{user?.name}</p>
                    </div>
                    
                    <div className="bg-gray-50 p-4 rounded-lg flex items-start">
                      <Phone className="w-5 h-5 mr-2 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-500">Phone Number</p>
                        <p className="font-medium">{user?.phone}</p>
                      </div>
                    </div>
                    
                    {user?.address && (
                      <div className="bg-gray-50 p-4 rounded-lg flex items-start">
                        <MapPin className="w-5 h-5 mr-2 text-gray-400 mt-0.5" />
                        <div>
                          <p className="text-sm text-gray-500">Address</p>
                          <p className="font-medium">{user.address}</p>
                          {user.addressLink && (
                            <a 
                              href={user.addressLink} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-tathkart-gold hover:underline inline-block mt-1 text-sm"
                            >
                              View on Maps
                            </a>
                          )}
                        </div>
                      </div>
                    )}
                    
                    <Button 
                      variant="outline" 
                      className="w-full mt-4 border-red-200 text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={handleLogout}
                    >
                      Logout
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </PageTransition>
  );
};

export default UserDashboard;

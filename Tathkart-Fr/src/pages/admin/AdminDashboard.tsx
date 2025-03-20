import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth, Order, User as UserType, GroceryItem } from '@/context/AuthContext';
import PageTransition from '@/components/layout/PageTransition';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Tabs, TabsContent, TabsList, TabsTrigger 
} from "@/components/ui/tabs";
import { 
  Users, Package, Truck, ShoppingCart, Plus, Trash2, CheckCircle, Send, Bell
} from 'lucide-react';
import BrandLogo from '@/components/ui/brand-logo';
import { toast } from 'sonner';

const AdminDashboard = () => {
  const { 
    user, isAuthenticated, getAllUsers, getOrders, updateOrderStatus, 
    getUserDefaultItems, setUserDefaultItems, registerUser, removeUser,
    logout // Add this
  } = useAuth();
  
  const [activeTab, setActiveTab] = useState("orders");
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<UserType[]>([]);
  const [pendingUsers, setPendingUsers] = useState<UserType[]>([]);
  const [registeredUsers, setRegisteredUsers] = useState<UserType[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [defaultItems, setDefaultItems] = useState<GroceryItem[]>([]);
  
  // New registration form state
  const [newUser, setNewUser] = useState({
    hotelId: '',
    name: '',
    phone: '',
    address: '',
    addressLink: '',
  });

  // Redirect if not authenticated or not an admin
  if (!isAuthenticated || (user && user.role !== 'admin')) {
    return <Navigate to="/login/admin" replace />;
  }

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    // Get all orders
    const allOrders = await getOrders();
    setOrders(allOrders);
    
    // Get all users
    const allUsers = await getAllUsers();
    setUsers(allUsers);
    
    // Split users into pending and registered
    setPendingUsers(allUsers.filter(u => !u.isRegistered));
    setRegisteredUsers(allUsers.filter(u => u.isRegistered));
    
    // If a user is selected, get their default items
    if (selectedUserId) {
      const items = await getUserDefaultItems(selectedUserId);
      setDefaultItems(items);
    }
  };

  const handleOrderStatus = async (orderId: string, status: Order['status']) => {
    const success = await updateOrderStatus(orderId, status);
    if (success) {
      // Refresh orders
      loadData();
    }
  };

  const handleRegisterUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newUser.hotelId || !newUser.name || !newUser.phone) {
      toast.error("Hotel ID, Name, and Phone are required");
      return;
    }
    
    const userId = await registerUser({
      ...newUser,
      role: 'user',
      isRegistered: true,
    });
    
    if (userId) {
      // Reset form
      setNewUser({
        hotelId: '',
        name: '',
        phone: '',
        address: '',
        addressLink: '',
      });
      
      // Refresh users
      loadData();
    }
  };

  const handleRemoveUser = async (userId: string) => {
    if (confirm("Are you sure you want to remove this user?")) {
      const success = await removeUser(userId);
      if (success) {
        loadData();
      }
    }
  };

  const handleApproveUser = async (user: UserType) => {
    // For pending users, approve them by updating their registered status
    // This would be implemented through a function like updateUser in a real API
    toast.success(`User ${user.hotelId} approved!`);
    
    // In this mock version, we'll just reload the data
    loadData();
  };

  const handleSendReminders = () => {
    toast.success("Reminders sent to all registered users");
  };

  const handleLogout = async () => {
    await logout();
    // The auth context should handle the redirect to login
  };

  const pendingOrdersCount = orders.filter(o => o.status === 'pending').length;
  const processingOrdersCount = orders.filter(o => o.status === 'processing').length;
  const readyOrdersCount = orders.filter(o => o.status === 'ready').length;
  const todayOrdersCount = orders.filter(o => 
    new Date(o.createdAt).toDateString() === new Date().toDateString()
  ).length;

  return (
    <PageTransition>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-tathkart-800 text-white p-4 shadow-md">
          <div className="container mx-auto">
            <div className="flex justify-between items-center">
              <BrandLogo size="sm" animated={false} />
              <div className="flex items-center space-x-3">
                <Button 
                  variant="secondary" 
                  size="sm" 
                  className="bg-tathkart-700 hover:bg-tathkart-600 text-white"
                  onClick={handleSendReminders}
                >
                  <Bell className="h-4 w-4 mr-1" />
                  Send Reminders
                </Button>
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={handleLogout}
                >
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Stats Overview */}
        <div className="container mx-auto p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card className="bg-white shadow-sm">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Users</p>
                  <p className="text-2xl font-semibold">{registeredUsers.length}</p>
                </div>
                <Users className="h-8 w-8 text-tathkart-gold" />
              </CardContent>
            </Card>
            
            <Card className="bg-white shadow-sm">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Today's Orders</p>
                  <p className="text-2xl font-semibold">{todayOrdersCount}</p>
                </div>
                <ShoppingCart className="h-8 w-8 text-tathkart-gold" />
              </CardContent>
            </Card>
            
            <Card className="bg-white shadow-sm">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Processing</p>
                  <p className="text-2xl font-semibold">{processingOrdersCount}</p>
                </div>
                <Package className="h-8 w-8 text-amber-500" />
              </CardContent>
            </Card>
            
            <Card className="bg-white shadow-sm">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Ready for Delivery</p>
                  <p className="text-2xl font-semibold">{readyOrdersCount}</p>
                </div>
                <Truck className="h-8 w-8 text-blue-500" />
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Main Content */}
        <main className="container mx-auto p-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-4">
              <TabsTrigger value="orders" className="text-sm">
                <ShoppingCart className="w-4 h-4 mr-2" />
                Orders
              </TabsTrigger>
              <TabsTrigger value="users" className="text-sm">
                <Users className="w-4 h-4 mr-2" />
                Users
              </TabsTrigger>
              <TabsTrigger value="new" className="text-sm">
                <Plus className="w-4 h-4 mr-2" />
                New User
              </TabsTrigger>
              <TabsTrigger value="items" className="text-sm">
                <Package className="w-4 h-4 mr-2" />
                Default Items
              </TabsTrigger>
            </TabsList>
            
            {/* Orders Tab */}
            <TabsContent value="orders" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Pending Orders ({pendingOrdersCount})</CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  {orders.filter(order => order.status === 'pending').length === 0 ? (
                    <div className="text-center py-6 text-gray-500">
                      <ShoppingCart className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p>No pending orders</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {orders
                        .filter(order => order.status === 'pending')
                        .map(order => (
                          <div key={order.id} className="border border-gray-200 rounded-lg overflow-hidden">
                            <div className="bg-gray-100 px-4 py-2">
                              <div className="flex justify-between items-center">
                                <div>
                                  <span className="font-medium">{order.hotelName || order.hotelId}</span>
                                  <span className="text-xs text-gray-500 ml-2">
                                    {new Date(order.createdAt).toLocaleTimeString()}
                                  </span>
                                </div>
                                <span className="bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded-full">
                                  Pending
                                </span>
                              </div>
                            </div>
                            <div className="p-4">
                              <div className="space-y-1 mb-3">
                                {order.items.map(item => (
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
                              
                              <div className="mt-4 flex justify-end space-x-2">
                                <Button 
                                  variant="outline"
                                  size="sm"
                                  className="text-red-600 border-red-200 hover:bg-red-50"
                                  onClick={() => handleOrderStatus(order.id, 'cancelled')}
                                >
                                  Cancel
                                </Button>
                                <Button 
                                  size="sm"
                                  className="bg-tathkart-gold hover:bg-amber-500 text-tathkart-800"
                                  onClick={() => handleOrderStatus(order.id, 'processing')}
                                >
                                  Process Order
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Processing Orders ({processingOrdersCount})</CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  {orders.filter(order => order.status === 'processing').length === 0 ? (
                    <div className="text-center py-6 text-gray-500">
                      <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p>No orders in processing</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {orders
                        .filter(order => order.status === 'processing')
                        .map(order => (
                          <div key={order.id} className="border border-gray-200 rounded-lg overflow-hidden">
                            <div className="bg-amber-100 px-4 py-2">
                              <div className="flex justify-between items-center">
                                <div>
                                  <span className="font-medium">{order.hotelName || order.hotelId}</span>
                                  <span className="text-xs text-gray-500 ml-2">
                                    {new Date(order.createdAt).toLocaleTimeString()}
                                  </span>
                                </div>
                                <span className="bg-amber-500 text-white text-xs px-2 py-1 rounded-full">
                                  Processing
                                </span>
                              </div>
                            </div>
                            <div className="p-4">
                              <div className="space-y-1 mb-3">
                                {order.items.map(item => (
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
                              
                              <div className="mt-4 flex justify-end">
                                <Button 
                                  size="sm"
                                  className="bg-blue-600 hover:bg-blue-700 text-white"
                                  onClick={() => handleOrderStatus(order.id, 'ready')}
                                >
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Mark Ready for Delivery
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Users Tab */}
            <TabsContent value="users" className="space-y-4">
              {/* Pending Users */}
              {pendingUsers.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Pending Registrations ({pendingUsers.length})</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      {pendingUsers.map(pendingUser => (
                        <div key={pendingUser.id} className="border border-gray-200 rounded-lg p-3 flex justify-between items-center">
                          <div>
                            <div className="font-medium">{pendingUser.hotelId}</div>
                            <div className="text-sm text-gray-500">{pendingUser.phone}</div>
                          </div>
                          <Button 
                            size="sm"
                            className="bg-tathkart-gold hover:bg-amber-500 text-tathkart-800"
                            onClick={() => handleApproveUser(pendingUser)}
                          >
                            Approve
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
              
              {/* Registered Users */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Registered Users ({registeredUsers.length})</CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  {registeredUsers.length === 0 ? (
                    <div className="text-center py-6 text-gray-500">
                      <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p>No registered users</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {registeredUsers.map(registeredUser => (
                        <div key={registeredUser.id} className="border border-gray-200 rounded-lg overflow-hidden">
                          <div className="bg-gray-100 px-4 py-2 flex justify-between items-center">
                            <div className="font-medium">{registeredUser.name}</div>
                            <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                              Registered
                            </span>
                          </div>
                          <div className="p-4">
                            <div className="grid grid-cols-2 gap-3 text-sm">
                              <div>
                                <span className="text-gray-500">Hotel ID:</span>
                                <span className="ml-2 font-medium">{registeredUser.hotelId}</span>
                              </div>
                              <div>
                                <span className="text-gray-500">Phone:</span>
                                <span className="ml-2 font-medium">{registeredUser.phone}</span>
                              </div>
                              {registeredUser.address && (
                                <div className="col-span-2">
                                  <span className="text-gray-500">Address:</span>
                                  <span className="ml-2">{registeredUser.address}</span>
                                  {registeredUser.addressLink && (
                                    <a 
                                      href={registeredUser.addressLink} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="text-tathkart-gold hover:underline ml-2 text-xs"
                                    >
                                      View on Maps
                                    </a>
                                  )}
                                </div>
                              )}
                            </div>
                            
                            <div className="mt-3 flex justify-end">
                              <Button 
                                variant="outline"
                                size="sm"
                                className="text-red-600 border-red-200 hover:bg-red-50"
                                onClick={() => handleRemoveUser(registeredUser.id)}
                              >
                                <Trash2 className="h-4 w-4 mr-1" />
                                Remove
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* New User Tab */}
            <TabsContent value="new">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Register New User</CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <form onSubmit={handleRegisterUser} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="hotelId">Hotel ID*</Label>
                      <Input 
                        id="hotelId" 
                        value={newUser.hotelId} 
                        onChange={(e) => setNewUser({...newUser, hotelId: e.target.value})}
                        placeholder="e.g., HOTEL123"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="name">Hotel Name*</Label>
                      <Input 
                        id="name" 
                        value={newUser.name} 
                        onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                        placeholder="e.g., Hotel Paradise"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number*</Label>
                      <Input 
                        id="phone" 
                        value={newUser.phone} 
                        onChange={(e) => setNewUser({...newUser, phone: e.target.value})}
                        placeholder="e.g., 1234567890"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="address">Address</Label>
                      <Input 
                        id="address" 
                        value={newUser.address} 
                        onChange={(e) => setNewUser({...newUser, address: e.target.value})}
                        placeholder="e.g., 123 Main St, Anytown"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="addressLink">Google Maps Link</Label>
                      <Input 
                        id="addressLink" 
                        value={newUser.addressLink} 
                        onChange={(e) => setNewUser({...newUser, addressLink: e.target.value})}
                        placeholder="e.g., https://maps.google.com/?q=..."
                      />
                    </div>
                    
                    <Button 
                      type="submit" 
                      className="w-full bg-tathkart-gold hover:bg-amber-500 text-tathkart-800"
                    >
                      Register User
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Default Items Tab */}
            <TabsContent value="items">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Manage Default Items</CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <p className="text-gray-500 mb-4">
                    Configure default grocery items and quantities for each user
                  </p>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="user-select">Select User</Label>
                      <select
                        id="user-select"
                        className="w-full border border-input bg-background px-3 py-2 rounded-md"
                        value={selectedUserId}
                        onChange={(e) => {
                          setSelectedUserId(e.target.value);
                          if (e.target.value) {
                            getUserDefaultItems(e.target.value).then(items => {
                              setDefaultItems(items);
                            });
                          } else {
                            setDefaultItems([]);
                          }
                        }}
                      >
                        <option value="">-- Select a user --</option>
                        {registeredUsers.map(user => (
                          <option key={user.id} value={user.id}>
                            {user.name} ({user.hotelId})
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    {selectedUserId && (
                      <div className="border border-gray-200 rounded-lg p-4">
                        <h3 className="font-medium mb-3">Default Grocery Items</h3>
                        
                        <div className="space-y-3">
                          {defaultItems.map((item, index) => (
                            <div key={item.id} className="flex items-center space-x-2">
                              <Input 
                                value={item.name}
                                onChange={(e) => {
                                  const newItems = [...defaultItems];
                                  newItems[index].name = e.target.value;
                                  setDefaultItems(newItems);
                                }}
                                placeholder="Item name"
                                className="flex-grow"
                              />
                              <Input 
                                type="number"
                                value={item.price}
                                onChange={(e) => {
                                  const newItems = [...defaultItems];
                                  newItems[index].price = parseFloat(e.target.value);
                                  setDefaultItems(newItems);
                                }}
                                placeholder="Price"
                                className="w-20"
                              />
                              <Input 
                                type="number"
                                value={item.defaultQuantity}
                                onChange={(e) => {
                                  const newItems = [...defaultItems];
                                  newItems[index].defaultQuantity = parseFloat(e.target.value);
                                  setDefaultItems(newItems);
                                }}
                                placeholder="Default Qty"
                                className="w-20"
                              />
                              <Input 
                                value={item.unit}
                                onChange={(e) => {
                                  const newItems = [...defaultItems];
                                  newItems[index].unit = e.target.value;
                                  setDefaultItems(newItems);
                                }}
                                placeholder="Unit"
                                className="w-16"
                              />
                              <Button 
                                size="icon" 
                                variant="outline"
                                className="text-red-500 hover:bg-red-50"
                                onClick={() => {
                                  const newItems = defaultItems.filter((_, i) => i !== index);
                                  setDefaultItems(newItems);
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                        
                        <div className="mt-4 flex space-x-3">
                          <Button 
                            variant="outline"
                            className="text-tathkart-gold border-tathkart-gold hover:bg-tathkart-50"
                            onClick={() => {
                              setDefaultItems([
                                ...defaultItems,
                                { id: `item_${Date.now()}`, name: '', defaultQuantity: 1, price: 0, unit: 'kg' }
                              ]);
                            }}
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Add Item
                          </Button>
                          
                          <Button 
                            className="bg-tathkart-gold hover:bg-amber-500 text-tathkart-800"
                            onClick={() => {
                              setUserDefaultItems(selectedUserId, defaultItems)
                                .then(() => {
                                  toast.success("Default items updated successfully");
                                });
                            }}
                          >
                            <Send className="h-4 w-4 mr-1" />
                            Save Changes
                          </Button>
                        </div>
                      </div>
                    )}
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

export default AdminDashboard;

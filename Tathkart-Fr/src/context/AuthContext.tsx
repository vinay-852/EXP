import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from "sonner";

// Types for our users
export type UserRole = 'user' | 'admin' | 'delivery';

export interface User {
  id: string;
  role: UserRole;
  name?: string;
  phone?: string;
  email?: string;
  hotelId?: string;
  isRegistered?: boolean;
  address?: string;
  addressLink?: string;
}

// Order structure
export interface GroceryItem {
  id: string;
  name: string;
  defaultQuantity: number;
  price: number;
  unit: string;
}

export interface OrderItem extends GroceryItem {
  quantity: number;
  totalPrice: number;
}

export interface Order {
  id: string;
  userId: string;
  hotelId: string;
  hotelName?: string;
  items: OrderItem[];
  status: 'pending' | 'processing' | 'ready' | 'delivered' | 'cancelled';
  total: number;
  note?: string;
  createdAt: string;
  updatedAt: string;
  deliveryDate?: string;
  assignedTo?: string;
}

export interface UserDefaultItems {
  userId: string;
  items: GroceryItem[];
}

// Context type definition
interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (phoneOrEmail: string, password?: string, role?: UserRole) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  // Order management functions
  placeOrder: (items: OrderItem[], note?: string) => Promise<string>;
  getOrders: (userId?: string, status?: Order['status']) => Promise<Order[]>;
  updateOrderStatus: (orderId: string, status: Order['status'], assignedTo?: string) => Promise<boolean>;
  // Default item management
  getUserDefaultItems: (userId: string) => Promise<GroceryItem[]>;
  setUserDefaultItems: (userId: string, items: GroceryItem[]) => Promise<boolean>;
  // Admin functions
  getAllUsers: () => Promise<User[]>;
  registerUser: (user: Omit<User, 'id'>) => Promise<string>;
  removeUser: (userId: string) => Promise<boolean>;
}

// Creating the context with a default value
const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => false,
  logout: () => {},
  isAuthenticated: false,
  placeOrder: async () => "",
  getOrders: async () => [],
  updateOrderStatus: async () => false,
  getUserDefaultItems: async () => [],
  setUserDefaultItems: async () => false,
  getAllUsers: async () => [],
  registerUser: async () => "",
  removeUser: async () => false,
});

// Mock users for development
const MOCK_USERS = [
  {
    id: '1',
    role: 'user' as UserRole,
    phone: '1234567890',
    hotelId: 'HOTEL001',
    name: 'Hotel Paradise',
    isRegistered: true,
    address: '123 Main St, Anytown',
    addressLink: 'https://maps.google.com'
  },
  {
    id: '2',
    role: 'user' as UserRole,
    phone: '0987654321',
    hotelId: 'HOTEL002',
    isRegistered: false,
  },
  {
    id: '3',
    role: 'admin' as UserRole,
    email: 'sankeerthbalabhadra@gmail.com',
    password: '123456789',
    name: 'Admin User',
  },
  {
    id: '4',
    role: 'delivery' as UserRole,
    email: 's93989596@gmail.com',
    password: '789456123',
    name: 'Delivery Staff',
  }
];

// Mock data for grocery items
const MOCK_GROCERY_ITEMS: GroceryItem[] = [
  { id: '1', name: 'Rice', defaultQuantity: 5, price: 50, unit: 'kg' },
  { id: '2', name: 'Wheat Flour', defaultQuantity: 2, price: 40, unit: 'kg' },
  { id: '3', name: 'Sugar', defaultQuantity: 1, price: 45, unit: 'kg' },
  { id: '4', name: 'Salt', defaultQuantity: 0.5, price: 20, unit: 'kg' },
  { id: '5', name: 'Cooking Oil', defaultQuantity: 2, price: 120, unit: 'liter' },
  { id: '6', name: 'Potatoes', defaultQuantity: 3, price: 30, unit: 'kg' },
  { id: '7', name: 'Onions', defaultQuantity: 2, price: 35, unit: 'kg' },
  { id: '8', name: 'Tomatoes', defaultQuantity: 1, price: 40, unit: 'kg' },
];

// Mock user default items
const MOCK_USER_DEFAULT_ITEMS: UserDefaultItems[] = [
  {
    userId: '1',
    items: MOCK_GROCERY_ITEMS
  }
];

// Mock orders
const MOCK_ORDERS: Order[] = [
  {
    id: '1',
    userId: '1',
    hotelId: 'HOTEL001',
    hotelName: 'Hotel Paradise',
    items: [
      { ...MOCK_GROCERY_ITEMS[0], quantity: 5, totalPrice: 250 },
      { ...MOCK_GROCERY_ITEMS[1], quantity: 2, totalPrice: 80 },
    ],
    status: 'delivered',
    total: 330,
    note: 'Please deliver in the morning',
    createdAt: '2023-09-01T10:00:00.000Z',
    updatedAt: '2023-09-01T15:30:00.000Z',
    deliveryDate: '2023-09-01'
  },
  {
    id: '2',
    userId: '1',
    hotelId: 'HOTEL001',
    hotelName: 'Hotel Paradise',
    items: [
      { ...MOCK_GROCERY_ITEMS[2], quantity: 1, totalPrice: 45 },
      { ...MOCK_GROCERY_ITEMS[4], quantity: 2, totalPrice: 240 },
    ],
    status: 'pending',
    total: 285,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
];

// Helper to persist data to localStorage
const saveToLocalStorage = (key: string, data: any) => {
  try {
    localStorage.setItem(`tathkart_${key}`, JSON.stringify(data));
    return true;
  } catch (e) {
    console.error(`Failed to save ${key} to localStorage`, e);
    return false;
  }
};

// Helper to get data from localStorage
const getFromLocalStorage = (key: string) => {
  try {
    const data = localStorage.getItem(`tathkart_${key}`);
    return data ? JSON.parse(data) : null;
  } catch (e) {
    console.error(`Failed to get ${key} from localStorage`, e);
    return null;
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Load user data from localStorage on mount
  useEffect(() => {
    const storedUser = getFromLocalStorage('user');
    if (storedUser) {
      setUser(storedUser);
    }
    
    // Initialize mock data in localStorage if not present
    if (!getFromLocalStorage('users')) {
      saveToLocalStorage('users', MOCK_USERS);
    }
    
    if (!getFromLocalStorage('orders')) {
      saveToLocalStorage('orders', MOCK_ORDERS);
    }
    
    if (!getFromLocalStorage('userDefaultItems')) {
      saveToLocalStorage('userDefaultItems', MOCK_USER_DEFAULT_ITEMS);
    }
    
    setLoading(false);
  }, []);

  // Login function
  const login = async (phoneOrEmail: string, password?: string, role?: UserRole): Promise<boolean> => {
    setLoading(true);
    console.log("Login function called with:", { phoneOrEmail, password, role });
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    let foundUser;
    const users = getFromLocalStorage('users') || MOCK_USERS;
    
    console.log("Available users:", users);
    
    if (role === 'admin' || role === 'delivery') {
      // For admin and delivery, check email and password
      console.log("Looking for admin/delivery user with email:", phoneOrEmail);
      foundUser = users.find((u: any) => 
        u.role === role && 
        u.email === phoneOrEmail && 
        u.password === password
      );
    } else {
      // For users, check phone number only
      console.log("Looking for user with phone:", phoneOrEmail);
      foundUser = users.find((u: any) => 
        u.role === 'user' && 
        u.phone === phoneOrEmail
      );
    }
    
    console.log("Found user:", foundUser);
    
    if (foundUser) {
      // Remove password before storing
      const { password, ...userWithoutPassword } = foundUser;
      setUser(userWithoutPassword);
      saveToLocalStorage('user', userWithoutPassword);
      toast.success(`Welcome ${userWithoutPassword.name || 'back'}!`);
      setLoading(false);
      return true;
    }
    
    toast.error("Invalid credentials. Please try again.");
    setLoading(false);
    return false;
  };

  // Logout function
  const logout = () => {
    setUser(null);
    localStorage.removeItem('tathkart_user');
    toast.info("You have been logged out");
  };

  // Place an order
  const placeOrder = async (items: OrderItem[], note?: string): Promise<string> => {
    if (!user) {
      toast.error("You must be logged in to place an order");
      return "";
    }
    
    try {
      const orders = getFromLocalStorage('orders') || [];
      const newOrderId = `order_${Date.now()}`;
      
      const newOrder: Order = {
        id: newOrderId,
        userId: user.id,
        hotelId: user.hotelId || '',
        hotelName: user.name,
        items,
        status: 'pending',
        total: items.reduce((sum, item) => sum + item.totalPrice, 0),
        note,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      orders.push(newOrder);
      saveToLocalStorage('orders', orders);
      
      toast.success("Order placed successfully!");
      return newOrderId;
    } catch (error) {
      console.error("Error placing order:", error);
      toast.error("Failed to place order. Please try again.");
      return "";
    }
  };

  // Get orders based on filters
  const getOrders = async (userId?: string, status?: Order['status']): Promise<Order[]> => {
    try {
      const orders = getFromLocalStorage('orders') || [];
      
      // Filter orders based on parameters
      return orders.filter((order: Order) => {
        let match = true;
        
        if (userId && order.userId !== userId) {
          match = false;
        }
        
        if (status && order.status !== status) {
          match = false;
        }
        
        return match;
      });
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast.error("Failed to fetch orders");
      return [];
    }
  };

  // Update order status
  const updateOrderStatus = async (orderId: string, status: Order['status'], assignedTo?: string): Promise<boolean> => {
    try {
      const orders = getFromLocalStorage('orders') || [];
      const orderIndex = orders.findIndex((o: Order) => o.id === orderId);
      
      if (orderIndex === -1) {
        toast.error("Order not found");
        return false;
      }
      
      orders[orderIndex].status = status;
      orders[orderIndex].updatedAt = new Date().toISOString();
      
      if (assignedTo) {
        orders[orderIndex].assignedTo = assignedTo;
      }
      
      if (status === 'delivered') {
        orders[orderIndex].deliveryDate = new Date().toISOString().split('T')[0];
      }
      
      saveToLocalStorage('orders', orders);
      toast.success(`Order status updated to ${status}`);
      return true;
    } catch (error) {
      console.error("Error updating order status:", error);
      toast.error("Failed to update order status");
      return false;
    }
  };

  // Get default items for a user
  const getUserDefaultItems = async (userId: string): Promise<GroceryItem[]> => {
    try {
      const userDefaultItems = getFromLocalStorage('userDefaultItems') || [];
      const userItems = userDefaultItems.find((u: UserDefaultItems) => u.userId === userId);
      
      return userItems ? userItems.items : MOCK_GROCERY_ITEMS;
    } catch (error) {
      console.error("Error fetching default items:", error);
      return MOCK_GROCERY_ITEMS;
    }
  };

  // Set default items for a user
  const setUserDefaultItems = async (userId: string, items: GroceryItem[]): Promise<boolean> => {
    try {
      const userDefaultItems = getFromLocalStorage('userDefaultItems') || [];
      const existingIndex = userDefaultItems.findIndex((u: UserDefaultItems) => u.userId === userId);
      
      if (existingIndex >= 0) {
        userDefaultItems[existingIndex].items = items;
      } else {
        userDefaultItems.push({
          userId,
          items
        });
      }
      
      saveToLocalStorage('userDefaultItems', userDefaultItems);
      toast.success("Default items updated successfully");
      return true;
    } catch (error) {
      console.error("Error setting default items:", error);
      toast.error("Failed to update default items");
      return false;
    }
  };

  // Get all users (admin only)
  const getAllUsers = async (): Promise<User[]> => {
    if (!user || user.role !== 'admin') {
      toast.error("Unauthorized access");
      return [];
    }
    
    try {
      const users = getFromLocalStorage('users') || [];
      // Filter out admin users and remove passwords
      return users
        .filter((u: any) => u.role === 'user')
        .map(({ password, ...user }: any) => user);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to fetch users");
      return [];
    }
  };

  // Register a new user (admin only)
  const registerUser = async (newUser: Omit<User, 'id'>): Promise<string> => {
    if (!user || user.role !== 'admin') {
      toast.error("Unauthorized access");
      return "";
    }
    
    try {
      const users = getFromLocalStorage('users') || [];
      
      // Check if phone already exists
      if (newUser.phone && users.some((u: User) => u.phone === newUser.phone)) {
        toast.error("Phone number already registered");
        return "";
      }
      
      // Create new user with ID
      const userId = `user_${Date.now()}`;
      const userWithId = { 
        ...newUser, 
        id: userId,
        isRegistered: true
      };
      
      users.push(userWithId);
      saveToLocalStorage('users', users);
      
      toast.success("User registered successfully");
      return userId;
    } catch (error) {
      console.error("Error registering user:", error);
      toast.error("Failed to register user");
      return "";
    }
  };

  // Remove a user (admin only)
  const removeUser = async (userId: string): Promise<boolean> => {
    if (!user || user.role !== 'admin') {
      toast.error("Unauthorized access");
      return false;
    }
    
    try {
      const users = getFromLocalStorage('users') || [];
      const updatedUsers = users.filter((u: User) => u.id !== userId);
      
      if (users.length === updatedUsers.length) {
        toast.error("User not found");
        return false;
      }
      
      saveToLocalStorage('users', updatedUsers);
      toast.success("User removed successfully");
      return true;
    } catch (error) {
      console.error("Error removing user:", error);
      toast.error("Failed to remove user");
      return false;
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading,
      login,
      logout,
      isAuthenticated: !!user,
      placeOrder,
      getOrders,
      updateOrderStatus,
      getUserDefaultItems,
      setUserDefaultItems,
      getAllUsers,
      registerUser,
      removeUser
    }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the auth context
export const useAuth = () => useContext(AuthContext);

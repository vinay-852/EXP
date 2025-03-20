-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  hotel_id VARCHAR(100) NOT NULL,
  owner_name VARCHAR(255) NOT NULL,
  phone_number VARCHAR(20) NOT NULL,
  location TEXT,
  note TEXT,
  total DECIMAL(10,2) NOT NULL,
  delivery_date DATE NOT NULL,
  status VARCHAR(20) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (hotel_id) REFERENCES registrations(hotel_id)
);

-- Create order_items table
CREATE TABLE IF NOT EXISTS order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL,
  item_id INTEGER NOT NULL,
  quantity INTEGER NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  unit VARCHAR(20) NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id),
  FOREIGN KEY (item_id) REFERENCES registration_items(id)
); 
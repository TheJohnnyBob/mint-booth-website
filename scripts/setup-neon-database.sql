-- Create packages table
CREATE TABLE IF NOT EXISTS packages (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  duration_hours INTEGER NOT NULL,
  description TEXT,
  features TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create addons table
CREATE TABLE IF NOT EXISTS addons (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  is_hourly BOOLEAN DEFAULT FALSE,
  available_packages TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id SERIAL PRIMARY KEY,
  booking_reference VARCHAR(50) UNIQUE NOT NULL,
  customer_name VARCHAR(255) NOT NULL,
  customer_email VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(50),
  event_date DATE NOT NULL,
  event_time TIME NOT NULL,
  event_type VARCHAR(100),
  guest_count INTEGER,
  venue_address TEXT,
  package_id INTEGER NOT NULL,
  selected_addons TEXT,
  subtotal DECIMAL(10,2) NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  special_requests TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (package_id) REFERENCES packages (id)
);

-- Insert packages
INSERT INTO packages (id, name, price, duration_hours, description, features) VALUES
(1, 'Mint Pro', 299.00, 2, 'Our entry-level package for small events or budgets.', 
 '["2 Hours of Booth Rental", "Unlimited Digital Captures", "Fun Filters & Digital Stickers", "Standard Template Overlay", "LED Ring Light", "Standard Backdrop"]'),
(2, 'Mint Max', 399.00, 3, 'A longer session with extra flair for most events.',
 '["3 Hours of Booth Rental", "All Pro features, plus:", "Animated GIF Capture", "Glam B&W Filter & AR Masks", "Custom Event Overlay", "Color-Tunable LED Lighting"]'),
(3, 'Mint Ultra', 599.00, 4, 'The ultimate, all-inclusive photobooth experience.',
 '["4 Hours of Booth Rental", "All Max features, plus:", "HD Video Messages", "AI Green Screen Backgrounds", "Unlimited On-Site Prints", "Premium Backdrop Included", "Live Slideshow Feed"]')
ON CONFLICT (id) DO NOTHING;

-- Insert add-ons
INSERT INTO addons (id, name, price, description, category, is_hourly, available_packages) VALUES
(1, 'Booth Attendant', 49.00, 'Professional attendant per hour', 'service', TRUE, '[1,2,3]'),
(2, 'Guest Scrapbook Service', 119.00, 'Physical scrapbook creation', 'service', FALSE, '[1,2,3]'),
(3, 'Live Slideshow Station', 119.00, 'Real-time photo display', 'equipment', FALSE, '[1,2]'),
(4, 'Unlimited Prints', 149.00, 'On-site photo printing', 'service', FALSE, '[1,2,3]'),
(5, 'Green-Screen / AI Scene Pack', 79.00, 'Digital background effects', 'digital', FALSE, '[1,2]'),
(6, 'Idle / Early Setup', 49.00, 'Setup time per hour', 'service', TRUE, '[1,2,3]'),
(7, 'Premium Backdrop', 99.00, 'Upgraded backdrop option', 'equipment', FALSE, '[1,2]'),
(8, 'Virtual Booth', 49.00, 'Remote photo booth access', 'digital', FALSE, '[1,2,3]'),
(9, 'Additional Hour', 99.00, 'Extend booth rental per hour', 'service', TRUE, '[1,2,3]')
ON CONFLICT (id) DO NOTHING;

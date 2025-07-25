-- Drop existing tables if they exist (D1 compatible)
DROP TABLE IF EXISTS availability;
DROP TABLE IF EXISTS bookings;
DROP TABLE IF EXISTS addons;
DROP TABLE IF EXISTS packages;

-- Packages table
CREATE TABLE packages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  price REAL NOT NULL,
  duration_hours INTEGER NOT NULL,
  description TEXT,
  features TEXT, -- JSON array of features
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Add-ons table with package restrictions and hour-based options
CREATE TABLE addons (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  price REAL NOT NULL,
  description TEXT,
  category TEXT, -- 'service', 'equipment', 'digital', etc.
  is_hourly INTEGER DEFAULT 0, -- 0 = false, 1 = true (D1 doesn't have BOOLEAN)
  available_packages TEXT, -- JSON array of package IDs this addon is available for
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Bookings table to store addon quantities
CREATE TABLE bookings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  booking_reference TEXT UNIQUE NOT NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT,
  event_date DATE NOT NULL,
  event_time TIME NOT NULL,
  event_type TEXT,
  guest_count INTEGER,
  venue_address TEXT,
  package_id INTEGER NOT NULL,
  selected_addons TEXT, -- JSON object with addon IDs and quantities: {"1": 2, "5": 1}
  subtotal REAL NOT NULL,
  total_amount REAL NOT NULL,
  status TEXT DEFAULT 'pending',
  special_requests TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (package_id) REFERENCES packages (id)
);

-- Availability table (for blocking out dates/times)
CREATE TABLE availability (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date DATE NOT NULL,
  time_slot TIME NOT NULL,
  is_available INTEGER DEFAULT 1, -- 0 = false, 1 = true
  booking_id INTEGER, -- If booked, reference to booking
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (booking_id) REFERENCES bookings (id)
);

-- Insert initial packages
INSERT INTO packages (id, name, price, duration_hours, description, features) VALUES
(1, 'Mint Pro', 299.00, 2, 'Our entry-level package for small events or budgets.', 
 '["2 Hours of Booth Rental", "Unlimited Digital Captures", "Fun Filters & Digital Stickers", "Standard Template Overlay", "LED Ring Light", "Standard Backdrop"]'),
(2, 'Mint Max', 399.00, 3, 'A longer session with extra flair for most events.',
 '["3 Hours of Booth Rental", "All Pro features, plus:", "Animated GIF Capture", "Glam B&W Filter & AR Masks", "Custom Event Overlay", "Color-Tunable LED Lighting"]'),
(3, 'Mint Ultra', 599.00, 4, 'The ultimate, all-inclusive photobooth experience.',
 '["4 Hours of Booth Rental", "All Max features, plus:", "HD Video Messages", "AI Green Screen Backgrounds", "Unlimited On-Site Prints", "Premium Backdrop Included", "Live Slideshow Feed"]');

-- Insert updated add-ons with package restrictions
INSERT INTO addons (id, name, price, description, category, is_hourly, available_packages) VALUES
(1, 'Booth Attendant', 49.00, 'Professional attendant per hour', 'service', 1, '[1,2,3]'),
(2, 'Guest Scrapbook Service', 119.00, 'Physical scrapbook creation', 'service', 0, '[1,2,3]'),
(3, 'Live Slideshow Station', 119.00, 'Real-time photo display', 'equipment', 0, '[1,2]'),
(4, 'Unlimited Prints', 149.00, 'On-site photo printing', 'service', 0, '[1,2,3]'),
(5, 'Green-Screen / AI Scene Pack', 79.00, 'Digital background effects', 'digital', 0, '[1,2]'),
(6, 'Idle / Early Setup', 49.00, 'Setup time per hour', 'service', 1, '[1,2,3]'),
(7, 'Premium Backdrop', 99.00, 'Upgraded backdrop option', 'equipment', 0, '[1,2]'),
(8, 'Virtual Booth', 49.00, 'Remote photo booth access', 'digital', 0, '[1,2,3]'),
(9, 'Additional Hour', 99.00, 'Extend booth rental per hour', 'service', 1, '[1,2,3]');

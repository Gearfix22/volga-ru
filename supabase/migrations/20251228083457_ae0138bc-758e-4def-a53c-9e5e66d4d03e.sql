-- Activate the existing Guide service
UPDATE services SET is_active = true WHERE type = 'Guide';

-- Insert missing core services
INSERT INTO services (name, type, description, base_price, is_active, display_order, features, image_url)
VALUES 
  ('Transportation (Driver)', 'Driver', 'Professional driver service for one-way or round trips. Airport transfers, city transportation, and more.', 50.00, true, 1, ARRAY['One-way or Round Trip', 'Professional Drivers', 'Airport Transfers', 'City Transportation'], 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=400&h=300&fit=crop'),
  ('Accommodation Booking', 'Accommodation', 'Hotels, apartments, and lodging reservations. Submit your requirements and receive a custom quote from admin.', 1000.00, true, 2, ARRAY['Hotels & Resorts', 'Apartments', 'Guest Houses', 'Custom Requests'], 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=300&fit=crop'),
  ('Activities & Events', 'Events', 'Tickets and experiences for attractions, shows, and entertainment. Circus, museums, city tours, and more.', 100.00, true, 3, ARRAY['Circus & Shows', 'Museums & Parks', 'City Tours', 'Opera & Theater'], 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=300&fit=crop')
ON CONFLICT DO NOTHING;

-- Update Guide service with proper features and image if missing
UPDATE services 
SET 
  features = ARRAY['Local Expertise', 'Multiple Languages', 'Personalized Tours', 'Historical Insights'],
  image_url = 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400&h=300&fit=crop'
WHERE type = 'Guide' AND (features IS NULL OR image_url IS NULL);
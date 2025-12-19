-- Insert test driver location for Ahmed (existing driver)
INSERT INTO public.driver_locations (driver_id, latitude, longitude, heading, speed, accuracy, booking_id, updated_at)
VALUES 
  ('ff26282a-05f6-4e0d-839d-6a6d07e68464', 55.7558, 37.6173, 90, 45, 10, NULL, now()),
  ('ad9840c2-5857-4d79-975d-cf02f9ee0aa1', 55.7512, 37.6184, 180, 30, 15, NULL, now())
ON CONFLICT (driver_id) DO UPDATE SET
  latitude = EXCLUDED.latitude,
  longitude = EXCLUDED.longitude,
  heading = EXCLUDED.heading,
  speed = EXCLUDED.speed,
  accuracy = EXCLUDED.accuracy,
  updated_at = now();
-- Add pricing columns to facilities table
ALTER TABLE public.facilities
ADD COLUMN IF NOT EXISTS pricing_model text not null default 'duration',
ADD COLUMN IF NOT EXISTS price_per_person numeric(10,2),
ADD COLUMN IF NOT EXISTS max_people_per_booking integer;

-- Add participant count to bookings table
ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS participant_count integer not null default 1;

-- Explicitly configure duration facilities
UPDATE public.facilities
SET pricing_model = 'duration'
WHERE slug IN ('conference_hall', 'tennis_court');

-- Explicitly configure swimming pool for per-person pricing
-- Note: max_people_per_booking is 4 (maximum people one customer can book).
-- The 20-person total session capacity is configured in Koalendar separately.
UPDATE public.facilities
SET 
  pricing_model = 'per_person',
  price_per_person = 50.00,
  max_people_per_booking = 4
WHERE slug = 'swimming_pool';


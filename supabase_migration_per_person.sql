-- Add pricing columns to facilities table
ALTER TABLE public.facilities
ADD COLUMN IF NOT EXISTS pricing_model text not null default 'duration',
ADD COLUMN IF NOT EXISTS price_per_person numeric(10,2),
ADD COLUMN IF NOT EXISTS max_people_per_booking integer;

-- Add participant count to bookings table
ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS participant_count integer not null default 1;

-- Configure the swimming pool for per-person pricing
UPDATE public.facilities
SET 
  pricing_model = 'per_person',
  price_per_person = 50.00, -- Adjust this to your desired price
  max_people_per_booking = 20 -- Adjust this to your desired capacity
WHERE slug = 'swimming_pool';

-- Note: conference_hall and tennis_court will naturally default to 'duration'

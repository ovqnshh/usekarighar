-- Seed script to generate 100 fake Karighars with Reviews and Locations
DO $$
DECLARE
    pro_id UUID;
    user_id UUID;
    review_id UUID;
    i INT;
    j INT;
    first_names TEXT[] := ARRAY['Rajesh', 'Amit', 'Suresh', 'Vijay', 'Rahul', 'Vikram', 'Sandeep', 'Arun', 'Deepak', 'Manoj', 'Anil', 'Sunil', 'Ajay', 'Ravi', 'Prakash', 'Sanjay', 'Kiran'];
    last_names TEXT[] := ARRAY['Kumar', 'Sharma', 'Patel', 'Singh', 'Verma', 'Desai', 'Yadav', 'Menon', 'Reddy', 'Tiwari', 'Joshi', 'Gupta', 'Rao', 'Iyer', 'Nair', 'Das', 'Bose'];
    businesses TEXT[] := ARRAY['Home Solutions', 'Repairs & Co', 'Expert Services', 'FixIt Now', 'ProFix', 'Reliable Works', 'Urban Care', 'Super Fixers', 'QuickFix'];
    cities TEXT[] := ARRAY['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Kolkata', 'Pune', 'Ahmedabad', 'Jaipur', 'Lucknow'];
    trades TEXT[] := ARRAY['Plumber', 'Electrician', 'Carpenter', 'Painter', 'AC Technician', 'Pest Control', 'Appliance Repair', 'Home Cleaning', 'Mason', 'Welder'];
    
    review_texts TEXT[] := ARRAY[
        'Did an excellent job. Arrived on time and cleaned up after.',
        'Very professional and polite. Highly recommended!',
        'Fixed the issue quickly. The price was reasonable.',
        'Great work! Will definitely hire again.',
        'Good service, but arrived a bit late.',
        'Outstanding quality of work. Truly a master at what they do.',
        'Very quick response time. Saved the day!',
        'Honest pricing and solid workmanship.',
        'Very satisfied with the service provided.',
        'Super fast and efficient.'
    ];
    name TEXT;
    trade TEXT;
BEGIN

    -- Create Reviews Table if it doesn't exist (since it's used in the UI but missing from types)
    CREATE TABLE IF NOT EXISTS public.reviews (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        professional_id UUID REFERENCES public.professionals(id) NOT NULL,
        user_id UUID REFERENCES auth.users(id),
        rating NUMERIC NOT NULL,
        body TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
    );

    ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
    
    -- Anyone can read reviews
    DROP POLICY IF EXISTS "Anyone can view reviews" ON public.reviews;
    CREATE POLICY "Anyone can view reviews" ON public.reviews FOR SELECT USING (true);

    FOR i IN 1..100 LOOP
        user_id := gen_random_uuid();
        pro_id := gen_random_uuid();
        name := first_names[1 + floor(random() * array_length(first_names, 1))::INT] || ' ' || last_names[1 + floor(random() * array_length(last_names, 1))::INT];
        trade := trades[1 + floor(random() * array_length(trades, 1))::INT];
        
        -- Create Auth User
        INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
        VALUES (
            user_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 
            'pro' || i || '_' || floor(random() * 10000)::TEXT || '@example.com', 
            crypt('password123', gen_salt('bf')), 
            now(), '{"provider":"email","providers":["email"]}', 
            jsonb_build_object('full_name', name),
            now(), now()
        );
        
        -- Create Professional Profile
        INSERT INTO public.professionals (
            id, user_id, name, bio, business, city, experience, projects_count, rating, reviews, slug, trade, created_at
        )
        VALUES (
            pro_id,
            user_id,
            name,
            'Hi, I am ' || name || '. I have been working as a professional ' || trade || ' for over ' || floor(random() * 15 + 1)::TEXT || ' years. I believe in delivering high-quality work and ensuring customer satisfaction.',
            name || ' ' || businesses[1 + floor(random() * array_length(businesses, 1))::INT],
            cities[1 + floor(random() * array_length(cities, 1))::INT],
            floor(random() * 15 + 1)::TEXT || ' years',
            floor(random() * 300 + 10)::INT,
            round((random() * 1.5 + 3.5)::numeric, 1),
            floor(random() * 150 + 5)::INT,
            lower(replace(name, ' ', '-')) || '-' || i || '-' || floor(random() * 1000)::TEXT,
            trade,
            now() - (random() * interval '365 days')
        );

        -- Give them a random location for the map
        INSERT INTO public.professional_locations (professional_id, latitude, longitude)
        VALUES (
            pro_id,
            19.0760 + (random() * 0.2 - 0.1), -- Randomize slightly around Mumbai
            72.8777 + (random() * 0.2 - 0.1)
        ) ON CONFLICT DO NOTHING;
        
        -- Add 3-5 random reviews for each professional
        FOR j IN 1..(floor(random() * 3 + 3)::INT) LOOP
            DECLARE
                dummy_proj UUID := gen_random_uuid();
            BEGIN
                INSERT INTO public.projects (id, customer_id, professional_id, title, status, summary, location, budget, timing, intent, source)
                VALUES (dummy_proj, user_id, pro_id, 'Completed Job', 'completed', 'Standard service.', cities[1 + floor(random() * array_length(cities, 1))::INT], '1000', 'flexible', 'fix', 'quote');
                
                INSERT INTO public.reviews (professional_id, project_id, customer_id, rating, body, created_at)
                VALUES (
                    pro_id,
                    dummy_proj,
                    user_id,
                    floor(random() * 2 + 4)::numeric, 
                    review_texts[1 + floor(random() * array_length(review_texts, 1))::INT],
                    now() - (random() * interval '180 days')
                );
            END;
        END LOOP;
        
    END LOOP;
END $$;

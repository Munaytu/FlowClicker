-- Add a country_code column to the users table to store the user's primary country.
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS country_code TEXT;

-- Create the increment_clicks function
CREATE OR REPLACE FUNCTION public.increment_clicks(p_user_id TEXT, p_country_code TEXT)
RETURNS VOID AS $$
BEGIN
    -- Increment the user's total clicks
    UPDATE public.users
    SET total_clicks = total_clicks + 1
    WHERE id = p_user_id;

    -- Increment the total clicks for the country from the current click
    INSERT INTO public.country_clicks (country_code, total_clicks)
    VALUES (p_country_code, 1)
    ON CONFLICT (country_code)
    DO UPDATE SET total_clicks = country_clicks.total_clicks + 1;

END;
$$ LANGUAGE plpgsql;

-- Add a country_code column to the users table to store the user's primary country.
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS country_code TEXT;

-- Create the increment_clicks function
CREATE OR REPLACE FUNCTION public.increment_clicks(p_user_id TEXT, p_country_code TEXT)
RETURNS VOID AS $$
DECLARE
    user_country_code TEXT;
BEGIN
    -- Increment the user's total clicks
    UPDATE public.users
    SET total_clicks = total_clicks + 1
    WHERE id = p_user_id;

    -- Check if the user already has a country assigned
    SELECT country_code INTO user_country_code
    FROM public.users
    WHERE id = p_user_id;

    -- If the user does not have a country, assign the current one
    IF user_country_code IS NULL THEN
        UPDATE public.users
        SET country_code = p_country_code
        WHERE id = p_user_id;
        user_country_code := p_country_code;
    END IF;

    -- Increment the total clicks for the user's assigned country
    INSERT INTO public.country_clicks (country_code, total_clicks)
    VALUES (user_country_code, 1)
    ON CONFLICT (country_code)
    DO UPDATE SET total_clicks = country_clicks.total_clicks + 1;

END;
$$ LANGUAGE plpgsql;

-- This script cleans up the country_clicks table by merging rows with incorrect country codes.

-- Create a temporary table to hold the corrected data
CREATE TEMP TABLE country_clicks_temp (
    country_code TEXT PRIMARY KEY,
    total_clicks BIGINT
);

-- Iterate over the existing country_clicks table and populate the temp table
DO $$
DECLARE
    rec RECORD;
    correct_code TEXT;
BEGIN
    FOR rec IN SELECT * FROM public.country_clicks LOOP
        -- Extract the 2-letter country code from the existing data
        correct_code := (regexp_matches(rec.country_code, '[A-Z]{2}'))[1];

        IF correct_code IS NOT NULL THEN
            -- Insert or update the clicks count in the temporary table
            INSERT INTO country_clicks_temp (country_code, total_clicks)
            VALUES (correct_code, rec.total_clicks)
            ON CONFLICT (country_code)
            DO UPDATE SET total_clicks = country_clicks_temp.total_clicks + rec.total_clicks;
        END IF;
    END LOOP;
END $$;

-- Clear the original country_clicks table
TRUNCATE public.country_clicks;

-- Copy the corrected data back to the original table
INSERT INTO public.country_clicks (country_code, total_clicks)
SELECT country_code, total_clicks FROM country_clicks_temp;

-- Drop the temporary table
DROP TABLE country_clicks_temp;

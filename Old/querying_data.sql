-- Get all guides in the 'Electronics' category
SELECT g.title, g.date, g.location, g.contributor_contact, g.rating
FROM guides g
JOIN categories c ON g.category_id = c.id
WHERE c.name = 'Electronics';

-- Get the steps for a specific guide (assuming guide ID 1)
SELECT step_number, image_path
FROM guide_steps
WHERE guide_id = 1
ORDER BY step_number;  -- Important to order the steps!

-- Get the translated title of a guide (assuming guide ID 1 and language code 'es')
SELECT translated_text
FROM translations
WHERE table_name = 'guides' AND column_name = 'title' AND row_id = 1 AND language_code = 'es';

-- If no translation found, use the original title:
SELECT COALESCE(
    (SELECT translated_text FROM translations WHERE table_name = 'guides' AND column_name = 'title' AND row_id = 1 AND language_code = 'es'),
    (SELECT title FROM guides WHERE id = 1)
) AS title;
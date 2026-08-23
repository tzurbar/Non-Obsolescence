-- Add a category
INSERT INTO categories (name) VALUES ('Electronics');
INSERT INTO categories (name) VALUES ('Furniture');

-- Add a guide (assuming category ID 1 is 'Electronics')
INSERT INTO guides (category_id, title, date, location, contributor_contact, rating)
VALUES (1, 'How to Fix a Broken Toaster', '2023-11-02', 'London', 'contact@example.com', 4.2);

-- Add steps to the guide (assuming guide ID 1 is the 'Toaster' guide)
INSERT INTO guide_steps (guide_id, step_number, image_path) VALUES (1, 1, 'toaster_step1.jpg');
INSERT INTO guide_steps (guide_id, step_number, image_path) VALUES (1, 2, 'toaster_step2.jpg');

-- Add a translation for the guide title (Spanish)
INSERT INTO translations (table_name, column_name, row_id, language_code, translated_text)
VALUES ('guides', 'title', 1, 'es', 'Cómo arreglar una tostadora rota');
-- Create the categories table
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,  -- SERIAL creates an auto-incrementing integer ID
    name VARCHAR(255) NOT NULL -- Category name (required)
);

-- Create the guides table
CREATE TABLE guides (
    id SERIAL PRIMARY KEY,
    category_id INT REFERENCES categories(id) NOT NULL, -- Foreign key to categories
    title VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    location VARCHAR(255),
    contributor_contact VARCHAR(255),
    rating DECIMAL
);

-- Create the guide_steps table
CREATE TABLE guide_steps (
    id SERIAL PRIMARY KEY,
    guide_id INT REFERENCES guides(id) NOT NULL, -- Foreign key to guides
    step_number INT NOT NULL,
    image_path VARCHAR(255)
);

-- Create the translations table
CREATE TABLE translations (
    id SERIAL PRIMARY KEY,
    table_name VARCHAR(255) NOT NULL,
    column_name VARCHAR(255) NOT NULL,
    row_id INT NOT NULL,
    language_code VARCHAR(2) NOT NULL, -- ISO 639-1 language code (e.g., 'en', 'es')
    translated_text TEXT NOT NULL
);
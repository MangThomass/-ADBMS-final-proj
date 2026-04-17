-- 1. Clean slate: Drop the database if it exists and recreate it
DROP DATABASE IF EXISTS orderna;
CREATE DATABASE orderna;
USE orderna;

-- 2. Categories Table
CREATE TABLE categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL
);

-- 3. Menu Table
CREATE TABLE menu (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    category_id INT,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
);

-- 4. Orders Table
CREATE TABLE orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    status VARCHAR(50) DEFAULT 'Pending',
    time DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 5. Order Items Table
CREATE TABLE order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT,
    menu_id INT,
    quantity INT NOT NULL,
    -- ON DELETE CASCADE means if an order is deleted, its items are deleted automatically
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (menu_id) REFERENCES menu(id) ON DELETE CASCADE
);

-- ==========================================
-- INSERT SAMPLE DATA (Binalot Express Menu)
-- ==========================================

-- Insert Categories First (IDs 1, 2, 3, 4)
INSERT INTO categories (name) VALUES 
('Rice Meal'), 
('Bundles'), 
('Sides'), 
('Drinks');

-- Insert Menu Items (Matching your screenshot)
INSERT INTO menu (name, price, category_id) VALUES 
('1 pcs Chicken Inasal w/ Rice', 125.00, 1),
('Chicken Inasal w/ Palabok', 150.00, 2),
('Sisig w/ Rice', 125.00, 1),
('Bangus Sisig', 135.00, 1),
('Pork Barbeque w/ Palabok', 140.00, 2),
('Pork Barbeque w/ Rice', 120.00, 1);
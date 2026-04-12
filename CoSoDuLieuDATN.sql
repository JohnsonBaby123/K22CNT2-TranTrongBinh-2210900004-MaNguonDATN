CREATE DATABASE BinhSport;
USE BinhSport;

CREATE TABLE User (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50),
    password VARCHAR(255),
    email VARCHAR(100),
    role VARCHAR(20), -- user / admin
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE Category (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100)
);

CREATE TABLE Product (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100),
    price FLOAT,
    description TEXT,
    category_id INT,
    FOREIGN KEY (category_id) REFERENCES Category(id)
);

CREATE TABLE ProductImage (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT,
    image_url VARCHAR(255),
    FOREIGN KEY (product_id) REFERENCES Product(id)
);

CREATE TABLE Cart (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    FOREIGN KEY (user_id) REFERENCES User(id)
);

CREATE TABLE CartItem (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cart_id INT,
    product_id INT,
    quantity INT,
    FOREIGN KEY (cart_id) REFERENCES Cart(id),
    FOREIGN KEY (product_id) REFERENCES Product(id)
);

CREATE TABLE OrderTable (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    total_price FLOAT,
    status VARCHAR(50),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES User(id)
);

CREATE TABLE OrderDetail (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT,
    product_id INT,
    quantity INT,
    price FLOAT,
    FOREIGN KEY (order_id) REFERENCES OrderTable(id),
    FOREIGN KEY (product_id) REFERENCES Product(id)
);

CREATE TABLE Payment (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT,
    method VARCHAR(50), -- COD, Banking
    status VARCHAR(50),
    FOREIGN KEY (order_id) REFERENCES OrderTable(id)
);

CREATE TABLE Review (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    product_id INT,
    rating INT,
    comment TEXT,
    FOREIGN KEY (user_id) REFERENCES User(id),
    FOREIGN KEY (product_id) REFERENCES Product(id)
);

CREATE TABLE Wishlist (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    product_id INT,
    FOREIGN KEY (user_id) REFERENCES User(id),
    FOREIGN KEY (product_id) REFERENCES Product(id)
);

ALTER TABLE product
ADD brand VARCHAR(100),
ADD stock INT DEFAULT 0,
ADD image VARCHAR(255),
ADD status VARCHAR(50) DEFAULT 'available',
ADD weight FLOAT,
ADD material VARCHAR(100),
ADD size VARCHAR(50),
ADD color VARCHAR(50),
ADD created_at DATETIME DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE Product
DROP COLUMN image;
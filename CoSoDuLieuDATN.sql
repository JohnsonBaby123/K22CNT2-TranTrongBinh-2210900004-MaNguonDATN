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
    image VARCHAR(255),
    stock INT DEFAULT 10,
    FOREIGN KEY (category_id) REFERENCES Category(id)
);

CREATE TABLE ProductAttribute (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT,
    attribute_name VARCHAR(100),
    attribute_value VARCHAR(100),
    FOREIGN KEY (product_id) REFERENCES Product(id)
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
ADD status VARCHAR(50) DEFAULT 'available',
ADD created_at DATETIME DEFAULT CURRENT_TIMESTAMP;

SET SQL_SAFE_UPDATES = 1;

INSERT INTO Category (name) VALUES 
('Cầu lông'),
('Bóng bàn'),
('Tennis'),
('Pickleball');

-- Cầu lông (Category ID 1)
INSERT INTO Product (name, price, description, category_id, stock, image)
VALUES 
('Yonex Astrox 99', 4500000, 'Vợt thiên công mạnh mẽ, điểm cân bằng nặng đầu', 1, 10, 'cl1.jpg'),
('Yonex Nanoflare 700', 3200000, 'Vợt thiên thủ, nhẹ nhàng, tốc độ nhanh', 1, 10, 'cl2.jpg'),
('Yonex Arcsaber 11', 3900000, 'Vợt cân bằng giữa công và thủ', 1, 10, 'cl3.jpg'),
('Yonex Astrox 88D', 4200000, 'Vợt chuyên đánh đôi, kiểm soát tốt', 1, 10, 'cl4.jpg'),
('Yonex Nanoray 10F', 1500000, 'Vợt phù hợp người mới bắt đầu', 1, 10, 'cl5.jpg');

-- Bóng bàn (Category ID 2)
INSERT INTO Product (name, price, description, category_id, stock, image)
VALUES
('Butterfly Timo Boll ALC', 4500000, 'Vợt bóng bàn cao cấp, tốc độ cao', 2, 10, 'bb1.jpg'),
('DHS Hurricane Long 5', 3200000, 'Vợt chuyên tấn công, kiểm soát tốt', 2, 10, 'bb2.jpg'),
('Stiga Carbonado 145', 3900000, 'Vợt carbon cao cấp, cân bằng hoàn hảo', 2, 10, 'bb3.jpg'),
('Yasaka Ma Lin Extra', 1800000, 'Vợt thiên công, cảm giác bóng tuyệt vời', 2, 10, 'bb4.jpg'),
('Donic Ovtcharov V1', 2500000, 'Vợt cân bằng, phù hợp người chơi nâng cao', 2, 10, 'bb5.jpg');

-- Tennis (Category ID 3)
INSERT INTO Product (name, price, description, category_id, stock, image)
VALUES
('Wilson Pro Staff RF97', 5500000, 'Vợt tennis cao cấp, kiểm soát tuyệt vời', 3, 10, 'tn1.jpg'),
('Babolat Pure Drive', 4800000, 'Vợt thiên công, lực đánh mạnh', 3, 10, 'tn2.jpg'),
('Head Speed MP', 4600000, 'Vợt cân bằng giữa sức mạnh và kiểm soát', 3, 10, 'tn3.jpg'),
('Yonex Ezone 98', 5000000, 'Vợt trợ lực tốt, dễ đánh', 3, 10, 'tn4.jpg'),
('Prince Textreme Tour', 4200000, 'Vợt nhẹ, linh hoạt, kiểm soát tốt', 3, 10, 'tn5.jpg');

-- Pickleball (Category ID 4)
INSERT INTO Product (name, price, description, category_id, stock, image)
VALUES
('Selkirk Amped S2', 3200000, 'Vợt pickleball cao cấp, kiểm soát tốt', 4, 10, 'pkb1.jpg'),
('Paddletek Tempest Wave Pro', 3500000, 'Vợt thiên kiểm soát, phù hợp thi đấu', 4, 10, 'pkb2.jpg'),
('Onix Z5 Graphite', 2500000, 'Vợt phổ biến, dễ chơi cho người mới', 4, 10, 'pkb3.jpg'),
('Engage Encore Pro', 3300000, 'Vợt cân bằng giữa lực và kiểm soát', 4, 10, 'pkb4.jpg'),
('Head Radical Elite', 2700000, 'Vợt nhẹ, linh hoạt, dễ sử dụng', 4, 10, 'pkb5.jpg');

INSERT INTO User (username, password, email, role) VALUES
('admin01', '123456', 'admin@binhsport.com', 'admin'),
('user01', '123456', 'user@binhsport.com', 'user');

INSERT INTO Cart (user_id) VALUES (2);

SELECT*FROM product
SELECT*FROM productattribute
SELECT*FROM category
SELECT*FROM cart
SELECT*FROM user

-- Cầu lông 
UPDATE Product SET image = 'cl1.jpg' WHERE id = 6;
UPDATE Product SET image = 'cl2.jpg' WHERE id = 7;
UPDATE Product SET image = 'cl3.jpg' WHERE id = 8;
UPDATE Product SET image = 'cl4.jpg' WHERE id = 9;
UPDATE Product SET image = 'cl5.jpg' WHERE id = 10;

-- Bóng bàn 
UPDATE Product SET image = 'bb1.jpg' WHERE id = 16;
UPDATE Product SET image = 'bb2.jpg' WHERE id = 17;
UPDATE Product SET image = 'bb3.jpg' WHERE id = 18;
UPDATE Product SET image = 'bb4.jpg' WHERE id = 19;
UPDATE Product SET image = 'bb5.jpg' WHERE id = 20;

-- Tennis 
UPDATE Product SET image = 'tn1.jpg' WHERE id = 21;
UPDATE Product SET image = 'tn2.jpg' WHERE id = 22;
UPDATE Product SET image = 'tn3.jpg' WHERE id = 23;
UPDATE Product SET image = 'tn4.jpg' WHERE id = 24;
UPDATE Product SET image = 'tn5.jpg' WHERE id = 25;

-- Pickleball 
UPDATE Product SET image = 'pkb1.jpg' WHERE id = 26;
UPDATE Product SET image = 'pkb2.jpg' WHERE id = 27;
UPDATE Product SET image = 'pkb3.jpg' WHERE id = 28;
UPDATE Product SET image = 'pkb4.jpg' WHERE id = 29;
UPDATE Product SET image = 'pkb5.jpg' WHERE id = 30;
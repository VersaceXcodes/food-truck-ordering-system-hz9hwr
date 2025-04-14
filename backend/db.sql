-- ###############################################
-- Create Tables for FoodTruck Express MVP Schema
-- ###############################################

-- 1. Users table
CREATE TABLE IF NOT EXISTS users (
    id                text PRIMARY KEY,
    full_name         text NOT NULL,
    email             text NOT NULL UNIQUE,
    password_hash     text NOT NULL,
    phone             text,
    role              text NOT NULL,
    created_at        bigint NOT NULL,
    updated_at        bigint NOT NULL
);

-- 2. User Addresses table
CREATE TABLE IF NOT EXISTS user_addresses (
    id          text PRIMARY KEY,
    user_id     text NOT NULL,
    address     text NOT NULL,
    city        text NOT NULL,
    state       text NOT NULL,
    zip_code    text NOT NULL,
    is_default  text NOT NULL, -- Expected values: 'true' or 'false'
    created_at  bigint NOT NULL,
    updated_at  bigint NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 3. Food Trucks table
CREATE TABLE IF NOT EXISTS food_trucks (
    id            text PRIMARY KEY,
    operator_id   text NOT NULL,
    truck_name    text NOT NULL,
    description   text,
    cuisine_type  text NOT NULL,
    image_url     text,
    location      text NOT NULL,
    active        text NOT NULL, -- 'true' or 'false'
    created_at    bigint NOT NULL,
    updated_at    bigint NOT NULL,
    FOREIGN KEY (operator_id) REFERENCES users(id)
);

-- 4. Menu Items table
CREATE TABLE IF NOT EXISTS menu_items (
    id             text PRIMARY KEY,
    food_truck_id  text NOT NULL,
    title          text NOT NULL,
    description    text,
    price          numeric(10,2) NOT NULL,
    category       text NOT NULL,
    image_url      text,
    modifiers      text,
    is_sold_out    text NOT NULL, -- 'true' or 'false'
    created_at     bigint NOT NULL,
    updated_at     bigint NOT NULL,
    FOREIGN KEY (food_truck_id) REFERENCES food_trucks(id)
);

-- 5. Orders table
CREATE TABLE IF NOT EXISTS orders (
    id               text PRIMARY KEY,
    customer_id      text NOT NULL,
    food_truck_id    text NOT NULL,
    order_status     text NOT NULL,  -- Valid values: 'pending', 'accepted', 'preparing', 'ready', 'completed', 'cancelled'
    payment_method   text NOT NULL,  -- Expected values: 'online', 'cash'
    total_amount     numeric(10,2) NOT NULL,
    payment_details  text,           -- JSON string with simulated payment transaction details
    created_at       bigint NOT NULL,
    updated_at       bigint NOT NULL,
    FOREIGN KEY (customer_id) REFERENCES users(id),
    FOREIGN KEY (food_truck_id) REFERENCES food_trucks(id)
);

-- 6. Order Items table
CREATE TABLE IF NOT EXISTS order_items (
    id             text PRIMARY KEY,
    order_id       text NOT NULL,
    menu_item_id   text NOT NULL,
    quantity       integer NOT NULL,
    customizations text,
    price_at_time  numeric(10,2) NOT NULL,
    subtotal       numeric(10,2) NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (menu_item_id) REFERENCES menu_items(id)
);

-- 7. Order Status History table
CREATE TABLE IF NOT EXISTS order_status_history (
    id         text PRIMARY KEY,
    order_id   text NOT NULL,
    status     text NOT NULL,   -- Same valid values as order_status in orders table
    changed_at bigint NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id)
);

-- 8. Reviews table
CREATE TABLE IF NOT EXISTS reviews (
    id             text PRIMARY KEY,
    order_id       text NOT NULL,
    customer_id    text NOT NULL,
    food_truck_id  text NOT NULL,
    rating         integer NOT NULL, -- Scale from 1 to 5
    review_text    text,
    created_at     bigint NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (customer_id) REFERENCES users(id),
    FOREIGN KEY (food_truck_id) REFERENCES food_trucks(id)
);

-- 9. Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id                 text PRIMARY KEY,
    user_id            text NOT NULL,
    notification_type  text NOT NULL,  -- e.g., 'order_update'
    message            text NOT NULL,
    reference_id       text,           -- Optional reference to an associated entity (like orders.id)
    is_read            text NOT NULL,  -- 'true' or 'false'
    created_at         bigint NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 10. System Logs table
CREATE TABLE IF NOT EXISTS system_logs (
    id          text PRIMARY KEY,
    user_id     text,              -- Optional: identifies the actor if applicable
    log_type    text NOT NULL,     -- e.g., 'error', 'info'
    log_details text,              -- JSON string with additional log details
    created_at  bigint NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- ###############################################
-- Seed Data for FoodTruck Express MVP
-- ###############################################

-- Seed Users
INSERT INTO users (id, full_name, email, password_hash, phone, role, created_at, updated_at) VALUES
('user1', 'Alice Admin', 'alice.admin@example.com', 'hashed_password', '1234567890', 'admin', 1697052000, 1697052000),
('user2', 'Bob Operator', 'bob.operator@example.com', 'hashed_password', '2345678901', 'operator', 1697052100, 1697052100),
('user3', 'Carol Operator', 'carol.operator@example.com', 'hashed_password', '3456789012', 'operator', 1697052200, 1697052200),
('user4', 'Dave Customer', 'dave.customer@example.com', 'hashed_password', '4567890123', 'customer', 1697052300, 1697052300),
('user5', 'Eve Customer', 'eve.customer@example.com', 'hashed_password', '5678901234', 'customer', 1697052400, 1697052400);

-- Seed User Addresses (for customers)
INSERT INTO user_addresses (id, user_id, address, city, state, zip_code, is_default, created_at, updated_at) VALUES
('addr1', 'user4', '123 Elm Street', 'Springfield', 'IL', '62704', 'true', 1697052500, 1697052500),
('addr2', 'user4', '456 Oak Avenue', 'Springfield', 'IL', '62705', 'false', 1697052600, 1697052600),
('addr3', 'user5', '789 Pine Road', 'Metropolis', 'NY', '10001', 'true', 1697052700, 1697052700);

-- Seed Food Trucks (assigned to operators)
INSERT INTO food_trucks (id, operator_id, truck_name, description, cuisine_type, image_url, location, active, created_at, updated_at) VALUES
('ft1', 'user2', 'Tasty Tacos', 'The best tacos in town', 'Mexican', 'https://picsum.photos/seed/ft1/300/200', 'Downtown', 'true', 1697052800, 1697052800),
('ft2', 'user3', 'Burger Bus', 'Gourmet burgers on wheels', 'American', 'https://picsum.photos/seed/ft2/300/200', 'Uptown', 'true', 1697052900, 1697052900);

-- Seed Menu Items for Food Trucks
INSERT INTO menu_items (id, food_truck_id, title, description, price, category, image_url, modifiers, is_sold_out, created_at, updated_at) VALUES
('m1', 'ft1', 'Taco', 'Delicious beef taco', 2.50, 'lunch', 'https://picsum.photos/seed/taco/300/200', 'extra salsa', 'false', 1697053000, 1697053000),
('m2', 'ft1', 'Burrito', 'Hearty burrito with beans', 5.00, 'lunch', 'https://picsum.photos/seed/burrito/300/200', 'no onions', 'false', 1697053100, 1697053100),
('m3', 'ft2', 'Burger', 'Juicy beef burger', 7.50, 'dinner', 'https://picsum.photos/seed/burger/300/200', 'add cheese', 'false', 1697053200, 1697053200),
('m4', 'ft2', 'Fries', 'Crispy french fries', 3.00, 'snacks', 'https://picsum.photos/seed/fries/300/200', 'extra salt', 'false', 1697053300, 1697053300);

-- Seed Orders (placed by customers)
INSERT INTO orders (id, customer_id, food_truck_id, order_status, payment_method, total_amount, payment_details, created_at, updated_at) VALUES
('order1', 'user4', 'ft1', 'pending', 'online', 10.00, '{"transaction_id": "txn101"}', 1697053400, 1697053400),
('order2', 'user5', 'ft2', 'completed', 'cash', 10.50, '{"transaction_id": "txn102"}', 1697053500, 1697053600);

-- Seed Order Items (for individual orders)
INSERT INTO order_items (id, order_id, menu_item_id, quantity, customizations, price_at_time, subtotal) VALUES
('oi1', 'order1', 'm1', 2, 'extra hot sauce', 2.50, 5.00),
('oi2', 'order1', 'm2', 1, 'light sauce', 5.00, 5.00),
('oi3', 'order2', 'm3', 1, 'extra pickles', 7.50, 7.50),
('oi4', 'order2', 'm4', 1, 'well-done', 3.00, 3.00);

-- Seed Order Status History (tracking status changes for orders)
INSERT INTO order_status_history (id, order_id, status, changed_at) VALUES
('osh1', 'order1', 'pending', 1697053450),
('osh2', 'order1', 'accepted', 1697053480),
('osh3', 'order1', 'preparing', 1697053500),
('osh4', 'order1', 'ready', 1697053550),
('osh5', 'order2', 'pending', 1697053510),
('osh6', 'order2', 'completed', 1697053600);

-- Seed Reviews (customer feedback)
INSERT INTO reviews (id, order_id, customer_id, food_truck_id, rating, review_text, created_at) VALUES
('rev1', 'order1', 'user4', 'ft1', 4, 'Great food and prompt service!', 1697053600),
('rev2', 'order2', 'user5', 'ft2', 5, 'Delicious burgers, will order again!', 1697053700);

-- Seed Notifications (real-time alerts)
INSERT INTO notifications (id, user_id, notification_type, message, reference_id, is_read, created_at) VALUES
('not1', 'user4', 'order_update', 'Your order order1 is now preparing.', 'order1', 'false', 1697053650),
('not2', 'user2', 'order_update', 'A new order has been placed on your food truck ft1.', 'order1', 'false', 1697053660),
('not3', 'user5', 'order_update', 'Your order order2 has been completed.', 'order2', 'false', 1697053710);

-- Seed System Logs (for administrative oversight)
INSERT INTO system_logs (id, user_id, log_type, log_details, created_at) VALUES
('log1', 'user2', 'info', '{"event":"order_creation", "order_id": "order1"}', 1697053720),
('log2', NULL, 'error', '{"error":"failed_payment", "details": "Payment gateway timeout"}', 1697053730);
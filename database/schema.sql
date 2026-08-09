-- =========================================================
-- KRFLEX Printing Solutions - PostgreSQL Schema
-- Founder: SMD Quadeer
-- Branches: Guntakal (Beside Uma Lodge), Patikonda (Beside Police Station)
-- =========================================================

CREATE TABLE branches (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(100) NOT NULL,
    address     VARCHAR(255) NOT NULL
);

INSERT INTO branches (name, address) VALUES
('Guntakal', 'Beside Uma Lodge, Guntakal'),
('Patikonda', 'Beside Police Station, Patikonda');

-- ---------------------------------------------------------
-- Users (login: admin / user roles)
-- ---------------------------------------------------------
CREATE TABLE users (
    id            SERIAL PRIMARY KEY,
    username      VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name     VARCHAR(100) NOT NULL,
    role          VARCHAR(20) NOT NULL CHECK (role IN ('Admin','User')),
    branch_id     INT REFERENCES branches(id),
    created_at    BIGINT NOT NULL   -- epoch time
);

-- Default admin: SMD Quadeer  (password: Admin@123  -- change after first login)
-- password_hash below is a BCrypt hash placeholder generated at API seed time.

-- ---------------------------------------------------------
-- Employees (HR - "Me" portal)
-- ---------------------------------------------------------
CREATE TABLE employees (
    id            SERIAL PRIMARY KEY,
    name          VARCHAR(100) NOT NULL,
    mobile        VARCHAR(15) NOT NULL,
    email         VARCHAR(100),
    designation   VARCHAR(100),
    branch_id     INT REFERENCES branches(id),
    joining_date  BIGINT NOT NULL,   -- epoch
    salary        NUMERIC(10,2),
    status        VARCHAR(20) DEFAULT 'Active' CHECK (status IN ('Active','Inactive'))
);

-- Daily attendance -> used by Dashboard "employees working today"
CREATE TABLE attendance (
    id            SERIAL PRIMARY KEY,
    employee_id   INT REFERENCES employees(id),
    work_date     DATE NOT NULL,
    status        VARCHAR(20) NOT NULL CHECK (status IN ('Present','Absent','Leave')),
    check_in      BIGINT,   -- epoch
    check_out     BIGINT,   -- epoch
    UNIQUE(employee_id, work_date)
);

-- ---------------------------------------------------------
-- Customers
-- ---------------------------------------------------------
CREATE TABLE customers (
    id            SERIAL PRIMARY KEY,
    name          VARCHAR(100) NOT NULL,
    mobile        VARCHAR(15) NOT NULL,
    email         VARCHAR(100),               -- optional
    address       VARCHAR(255) NOT NULL,
    branch_id     INT REFERENCES branches(id),
    created_at    BIGINT NOT NULL             -- epoch time
);

-- ---------------------------------------------------------
-- Material Stock
-- ---------------------------------------------------------
CREATE TABLE material_stock (
    id            SERIAL PRIMARY KEY,
    media_name    VARCHAR(100) NOT NULL,
    size          VARCHAR(50) NOT NULL,
    no_of_rolls   INT NOT NULL DEFAULT 0,
    media_brand   VARCHAR(100) NOT NULL,
    branch_id     INT REFERENCES branches(id),
    updated_at    BIGINT NOT NULL
);

-- ---------------------------------------------------------
-- Orders
-- ---------------------------------------------------------
CREATE TABLE orders (
    id                SERIAL PRIMARY KEY,
    customer_id       INT REFERENCES customers(id) NOT NULL,
    order_name        VARCHAR(150) NOT NULL,
    material_id       INT REFERENCES material_stock(id) NOT NULL,
    width_ft          NUMERIC(8,2) NOT NULL,
    height_ft         NUMERIC(8,2) NOT NULL,
    sqft              NUMERIC(10,2) GENERATED ALWAYS AS (width_ft * height_ft) STORED,
    order_date        BIGINT NOT NULL,          -- epoch, when order placed
    delivery_datetime BIGINT NOT NULL,          -- epoch, selected delivery date+time
    delivered_datetime BIGINT,                  -- epoch, actual delivered time (nullable)
    status            VARCHAR(20) NOT NULL DEFAULT 'In Progress'
                       CHECK (status IN ('In Progress','Completed','Delivered')),
    branch_id         INT REFERENCES branches(id),
    created_by        INT REFERENCES users(id)
);

-- ---------------------------------------------------------
-- Activity Logs
-- ---------------------------------------------------------
CREATE TABLE activity_logs (
    id            SERIAL PRIMARY KEY,
    user_id       INT REFERENCES users(id),
    action        VARCHAR(100) NOT NULL,      -- e.g. "Order Status Changed", "Stock Updated"
    entity_type   VARCHAR(50),                -- Order / MaterialStock / Customer
    entity_id     INT,
    details       TEXT,
    logged_at     BIGINT NOT NULL             -- epoch
);

-- Helpful indexes
CREATE INDEX idx_orders_date ON orders(order_date);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_attendance_date ON attendance(work_date);
CREATE INDEX idx_activity_logged_at ON activity_logs(logged_at);

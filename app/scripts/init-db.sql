-- scripts/init-db.sql
-- Initial database setup

-- Create database if not exists (handled by Docker, but good for manual setup)
CREATE DATABASE IF NOT EXISTS appdb CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Grant privileges
GRANT ALL PRIVILEGES ON appdb.* TO 'appuser'@'%';
FLUSH PRIVILEGES;

-- Use the database
USE appdb;

-- Any initial seed data can go here
-- INSERT INTO users (email, username, hashed_password) VALUES ...

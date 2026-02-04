-- Users Service DB
CREATE DATABASE IF NOT EXISTS users_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE USER 'users_user'@'%' IDENTIFIED BY 'users_password';
GRANT ALL PRIVILEGES ON users_db.* TO 'users_user'@'%';

-- Tasks Service DB
CREATE DATABASE IF NOT EXISTS tasks_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE USER 'tasks_user'@'%' IDENTIFIED BY 'tasks_password';
GRANT ALL PRIVILEGES on tasks_db.* TO 'tasks_user'@'%';

FLUSH PRIVILEGES;

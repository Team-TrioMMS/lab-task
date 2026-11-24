CREATE DATABASE IF NOT EXISTS lab_equipment_booking
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE lab_equipment_booking;

CREATE TABLE IF NOT EXISTS users (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('student', 'admin') NOT NULL DEFAULT 'student',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS equipment (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    status ENUM('available', 'in_use', 'maintenance') NOT NULL DEFAULT 'available',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS booking_requests (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,
    equipment_id INT UNSIGNED NOT NULL,
    booking_date DATE NOT NULL,
    start_time TIME NOT NULL,
    duration_minutes SMALLINT UNSIGNED NOT NULL,
    deadline DATE,
    urgency ENUM('low', 'medium', 'high') NOT NULL DEFAULT 'low',
    purpose VARCHAR(500),
    status ENUM('pending', 'approved', 'rejected', 'rescheduled', 'cancelled')
        NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_booking_duration CHECK (duration_minutes BETWEEN 1 AND 1440),
    CONSTRAINT fk_booking_user FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT fk_booking_equipment FOREIGN KEY (equipment_id) REFERENCES equipment(id),
    INDEX idx_booking_user_created (user_id, created_at),
    INDEX idx_booking_equipment_status (equipment_id, status)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS schedules (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    booking_id INT UNSIGNED NOT NULL UNIQUE,
    equipment_id INT UNSIGNED NOT NULL,
    starts_at DATETIME NOT NULL,
    ends_at DATETIME NOT NULL,
    CONSTRAINT chk_schedule_interval CHECK (ends_at > starts_at),
    CONSTRAINT fk_schedule_booking FOREIGN KEY (booking_id) REFERENCES booking_requests(id),
    CONSTRAINT fk_schedule_equipment FOREIGN KEY (equipment_id) REFERENCES equipment(id),
    INDEX idx_schedule_equipment_interval (equipment_id, starts_at, ends_at)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS maintenance (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    equipment_id INT UNSIGNED NOT NULL,
    reason TEXT,
    start_date DATETIME NOT NULL,
    end_date DATETIME,
    status ENUM('active', 'completed') NOT NULL DEFAULT 'active',
    CONSTRAINT chk_maintenance_interval CHECK (end_date IS NULL OR end_date > start_date),
    CONSTRAINT fk_maintenance_equipment FOREIGN KEY (equipment_id) REFERENCES equipment(id),
    INDEX idx_maintenance_equipment_interval (equipment_id, status, start_date, end_date)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS notifications (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_notification_user FOREIGN KEY (user_id) REFERENCES users(id),
    INDEX idx_notification_user_created (user_id, created_at)
) ENGINE=InnoDB;

INSERT IGNORE INTO equipment (name, description) VALUES
    ('Microscope', 'Laboratory microscope'),
    ('Centrifuge', 'Laboratory centrifuge'),
    ('Spectrophotometer', 'Laboratory spectrophotometer');

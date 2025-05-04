
-- MySQL schema for Action Central application
-- For migration from PostgreSQL/Supabase to MySQL

-- Users table (replaces Supabase auth.users)
CREATE TABLE IF NOT EXISTS `users` (
  `id` CHAR(36) NOT NULL,
  `email` VARCHAR(255) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `email_verified` BOOLEAN NOT NULL DEFAULT FALSE,
  `full_name` VARCHAR(255),
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Add index for email lookups
CREATE INDEX IF NOT EXISTS `idx_users_email` ON `users` (`email`);

-- Profiles table (similar to PostgreSQL version)
CREATE TABLE IF NOT EXISTS `profiles` (
  `id` CHAR(36) NOT NULL,
  `full_name` VARCHAR(255),
  `avatar_url` TEXT,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_profiles_user_id` FOREIGN KEY (`id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Actions table
CREATE TABLE IF NOT EXISTS `actions` (
  `id` CHAR(36) NOT NULL,
  `description` TEXT NOT NULL,
  `department` ENUM(
    'NTSA/KRA', 'Biashara', 'Agribusiness', 'Business Development & Strategy', 
    'Finance', 'ICT', 'Credit', 'Collections & Settlements', 'Operations', 
    'Sales Support & Data', 'Call Centre', 'Delinquency', 'Legal', 
    'RISK & COMPLIANCE', 'HR & Admin', 'Customer Experience & Marketing', 
    'Asset Finance', 'Checkoff & Personal Loans'
  ) NOT NULL,
  `meeting_date` TIMESTAMP NOT NULL,
  `priority` ENUM('high', 'medium', 'low') NOT NULL,
  `owner_email` VARCHAR(255) NOT NULL,
  `completed` BOOLEAN NOT NULL DEFAULT FALSE,
  `progress_status` ENUM('Not Started', '25%', '50%', '75%', '100%') NOT NULL DEFAULT 'Not Started',
  `notes` TEXT,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `due_date` TIMESTAMP NULL,
  `user_id` CHAR(36) NOT NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_actions_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Add indexes for common queries
CREATE INDEX IF NOT EXISTS `idx_actions_user_id` ON `actions` (`user_id`);
CREATE INDEX IF NOT EXISTS `idx_actions_owner_email` ON `actions` (`owner_email`);
CREATE INDEX IF NOT EXISTS `idx_actions_completed` ON `actions` (`completed`);
CREATE INDEX IF NOT EXISTS `idx_actions_due_date` ON `actions` (`due_date`);

-- Procedure to create a UUID (alternative to PostgreSQL's gen_random_uuid())
DELIMITER //
CREATE FUNCTION IF NOT EXISTS uuid_v4() 
RETURNS CHAR(36)
BEGIN
    RETURN LOWER(CONCAT(
        HEX(RANDOM_BYTES(4)),
        '-',
        HEX(RANDOM_BYTES(2)),
        '-4',
        SUBSTR(HEX(RANDOM_BYTES(2)), 2, 3),
        '-',
        HEX(SUBSTR(MD5(RANDOM_BYTES(3)), 2, 2)),
        '-',
        HEX(RANDOM_BYTES(6))
    ));
END //
DELIMITER ;

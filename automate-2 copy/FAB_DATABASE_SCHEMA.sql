-- FAB Database Schema for Hierarchy Validation System

-- Note: These are existing tables in the database, not to be created
-- FAB system will use these existing tables for validation

-- Plant Master Table (Existing: sd_apps_db.app_vg_plant_master)
-- Structure:
-- id (INT, AUTO_INCREMENT, PRIMARY KEY)
-- code (VARCHAR(60))
-- plant_code (VARCHAR(45)) - Used for validation
-- plant_name (VARCHAR(60))
-- status_id (INT) - 1 = Active, other = Inactive

-- Department Master Table (Existing: sd_apps_db.app_vg_wbs_department_master)  
-- Structure:
-- id (INT, AUTO_INCREMENT, PRIMARY KEY)
-- department_name (VARCHAR(100))
-- wbs_department_code (VARCHAR(100)) - Used for validation
-- status_id (INT) - 1 = Active, other = Inactive
-- Note: This table doesn't have plant_code relationship

-- Users Table (Existing: users)
-- Structure:
-- id (INT, AUTO_INCREMENT, PRIMARY KEY)
-- email_id1 (VARCHAR(100)) - Used for validation
-- first_name (VARCHAR(200))
-- last_name (VARCHAR(200))
-- status_id (INT) - 1 = Active, other = Inactive
-- Note: This is a comprehensive user table with many additional fields

-- Sample Data for Testing (only for plant and department tables)
INSERT INTO sd_apps_db.app_vg_plant_master (plant_code, plant_name, status_id) VALUES
('2031', 'Plant 2031', 1),
('2032', 'Plant 2032', 1),
('2033', 'Plant 2033', 0);

INSERT INTO sd_apps_db.app_vg_wbs_department_master (wbs_department_code, department_name, status_id) VALUES
('CIVIL &MEP', 'Civil & MEP', 1),
('ELECTRICAL', 'Electrical', 1),
('MECHANICAL', 'Mechanical', 1),
('QUALITY', 'Quality', 1);

-- Note: No insert operations for 'users' table as requested
-- The users table should already contain existing user records with proper:
-- - email_id1 (for validation)
-- - first_name, last_name (for display)
-- - status_id (1 = active, other = inactive)

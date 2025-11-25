-- Create AdminUsers table for managing admin role
-- This table stores which users have admin privileges

CREATE TABLE AdminUsers (
    UserId INT PRIMARY KEY,
    CreatedAt DATETIME DEFAULT GETDATE(),
    CreatedBy INT NULL,
    CONSTRAINT FK_AdminUsers_Users FOREIGN KEY (UserId) REFERENCES Users(UserId)
);

-- Create index for faster lookups
CREATE INDEX IX_AdminUsers_UserId ON AdminUsers(UserId);

-- Insert sample admin user (replace with actual admin user ID)
-- Example: INSERT INTO AdminUsers (UserId) VALUES (1);

GO

-- Create a view to easily check if a user is admin
CREATE VIEW vw_UserRoles AS
SELECT 
    u.UserId,
    u.Username,
    u.Role as BaseRole,
    CASE 
        WHEN au.UserId IS NOT NULL THEN 'admin'
        ELSE u.Role
    END AS EffectiveRole,
    CASE 
        WHEN au.UserId IS NOT NULL THEN 1
        ELSE 0
    END AS IsAdmin
FROM Users u
LEFT JOIN AdminUsers au ON u.UserId = au.UserId;

GO

-- Example queries:

-- Get all admin users
-- SELECT * FROM AdminUsers;

-- Check if a specific user is admin
-- SELECT * FROM vw_UserRoles WHERE UserId = 1;

-- Add a user as admin
-- INSERT INTO AdminUsers (UserId) VALUES (123);

-- Remove admin privileges
-- DELETE FROM AdminUsers WHERE UserId = 123;

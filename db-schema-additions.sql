-- ایجاد جدول UserProjectAccess برای مدیریت دسترسی کاربران به پروژه‌ها
CREATE TABLE UserProjectAccess (
    UserId INT NOT NULL,
    ProjectId INT NOT NULL,
    PRIMARY KEY (UserId, ProjectId),
    FOREIGN KEY (UserId) REFERENCES Users(UserId),
    FOREIGN KEY (ProjectId) REFERENCES Projects(Id)
);

-- افزودن کاربران عادی (۵ کاربر)
INSERT INTO Users (Username, PasswordHash, Role) VALUES
('user001', 'hashed_user001', 'user'),
('user002', 'hashed_user002', 'user'),
('user003', 'hashed_user003', 'user'),
('user004', 'hashed_user004', 'user'),
('user005', 'hashed_user005', 'user');

-- افزودن پروژه‌ها (P1000 تا P1015)
INSERT INTO Projects (ProjectName, securityLevel) VALUES
('P1000', 1),
('P1001', 1),
('P1002', 2),
('P1003', 2),
('P1004', 1),
('P1005', 3),
('P1006', 2),
('P1007', 1),
('P1008', 2),
('P1009', 3),
('P1010', 1),
('P1011', 2),
('P1012', 1),
('P1013', 3),
('P1014', 2),
('P1015', 1);

-- تخصیص دسترسی کاربران به پروژه‌ها (هر کاربر به ۳ تا ۸ پروژه به‌صورت تصادفی)
-- فرض: UserId برای user001 تا user005 به‌ترتیب ۱ تا ۵ است (بسته به IDENTITY در جدول Users)
INSERT INTO UserProjectAccess (UserId, ProjectId) VALUES
-- user001 (دسترسی به ۵ پروژه)
(1, 1),  -- P1000
(1, 3),  -- P1002
(1, 5),  -- P1004
(1, 7),  -- P1006
(1, 9),  -- P1008
-- user002 (دسترسی به ۴ پروژه)
(2, 2),  -- P1001
(2, 4),  -- P1003
(2, 6),  -- P1005
(2, 8),  -- P1007
-- user003 (دسترسی به ۶ پروژه)
(3, 1),  -- P1000
(3, 4),  -- P1003
(3, 6),  -- P1005
(3, 9),  -- P1008
(3, 11), -- P1010
(3, 13), -- P1012
-- user004 (دسترسی به ۳ پروژه)
(4, 3),  -- P1002
(4, 7),  -- P1006
(4, 10), -- P1009
-- user005 (دسترسی به ۸ پروژه)
(5, 2),  -- P1001
(5, 5),  -- P1004
(5, 8),  -- P1007
(5, 10), -- P1009
(5, 12), -- P1011
(5, 14), -- P1013
(5, 15), -- P1014
(5, 16); -- P1015

-- تست داده‌ها (برای بررسی)
SELECT u.Username, p.ProjectName
FROM Users u
JOIN UserProjectAccess upa ON u.UserId = upa.UserId
JOIN Projects p ON upa.ProjectId = p.Id
ORDER BY u.Username, p.ProjectName;
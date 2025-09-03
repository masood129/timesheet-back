-- ایجاد جدول Users برای مدیریت کاربران
CREATE TABLE Users (
                       UserId INT PRIMARY KEY IDENTITY(1,1),
                       Username NVARCHAR(100) NOT NULL UNIQUE,
                       PasswordHash NVARCHAR(256) NOT NULL,
                       Role NVARCHAR(50) NOT NULL CHECK (Role IN ('user', 'group_manager', 'general_manager', 'finance_manager', 'admin'))
);

-- ایجاد جدول Groups برای مدیریت گروه‌ها
CREATE TABLE Groups (
                        GroupId INT PRIMARY KEY IDENTITY(1,1),
                        GroupName NVARCHAR(100) NOT NULL UNIQUE,
                        ManagerId INT NOT NULL,
                        FOREIGN KEY (ManagerId) REFERENCES Users(UserId)
);

-- ایجاد جدول UserGroup برای تخصیص کاربران به گروه‌ها
CREATE TABLE UserGroup (
                           UserId INT NOT NULL,
                           GroupId INT NOT NULL,
                           PRIMARY KEY (UserId, GroupId),
                           FOREIGN KEY (UserId) REFERENCES Users(UserId),
                           FOREIGN KEY (GroupId) REFERENCES Groups(GroupId)
);

-- ایجاد جدول Projects برای مدیریت پروژه‌ها
CREATE TABLE Projects (
                          Id INT PRIMARY KEY,
                          ProjectName NVARCHAR(100) NOT NULL,
                          securityLevel INT NOT NULL
);

-- ایجاد جدول UserProjectAccess برای مدیریت دسترسی کاربران به پروژه‌ها
CREATE TABLE UserProjectAccess (
                                   UserId INT NOT NULL,
                                   ProjectId INT NOT NULL,
                                   PRIMARY KEY (UserId, ProjectId),
                                   FOREIGN KEY (UserId) REFERENCES Users(UserId),
                                   FOREIGN KEY (ProjectId) REFERENCES Projects(Id)
);

-- ایجاد جدول UserContractHours برای قراردادهای کاربران
CREATE TABLE UserContractHours (
                                   UserId INT PRIMARY KEY,
                                   ContractArrivalTime NVARCHAR(8) NULL,
                                   ContractLeaveTime NVARCHAR(8) NOT NULL,
                                   MinMonthlyHours INT NOT NULL,
                                   FOREIGN KEY (UserId) REFERENCES Users(UserId)
);

-- ایجاد جدول DailyDetails برای جزئیات روزانه
CREATE TABLE DailyDetails (
                              Id INT PRIMARY KEY IDENTITY(1,1),
                              Date DATE NOT NULL,
                              UserId INT NOT NULL,
                              ArrivalTime NVARCHAR(8) NULL,
                              LeaveTime NVARCHAR(8) NULL,
                              PersonalTime INT NULL, -- در دقیقه
                              Description NVARCHAR(500) NULL,
                              GoCost INT NULL,
                              ReturnCost INT NULL,
                              LeaveType NVARCHAR(50) NULL,
                              FOREIGN KEY (UserId) REFERENCES Users(UserId)
);

-- ایجاد جدول DailyProjectTasks برای وظایف پروژه روزانه
CREATE TABLE DailyProjectTasks (
                                   Id INT PRIMARY KEY IDENTITY(1,1),
                                   Date DATE NOT NULL,
                                   UserId INT NOT NULL,
                                   ProjectId INT NOT NULL,
                                   Duration INT NOT NULL, -- در دقیقه
                                   Description NVARCHAR(500) NULL,
                                   FOREIGN KEY (UserId) REFERENCES Users(UserId),
                                   FOREIGN KEY (ProjectId) REFERENCES Projects(Id)
);

-- ایجاد جدول DailyPersonalCarCosts برای هزینه‌های ماشین شخصی
CREATE TABLE DailyPersonalCarCosts (
                                       Date DATE NOT NULL,
                                       UserId INT NOT NULL,
                                       ProjectId INT NOT NULL,
                                       Kilometers INT NULL,
                                       Cost INT NULL,
                                       Description NVARCHAR(MAX) NULL,
                                       PRIMARY KEY (Date, UserId, ProjectId),
                                       FOREIGN KEY (UserId) REFERENCES Users(UserId),
                                       FOREIGN KEY (ProjectId) REFERENCES Projects(Id)
);

-- ایجاد جدول MonthlyGymCosts برای هزینه‌های ماهیانه ورزش
CREATE TABLE MonthlyGymCosts (
                                 Id INT PRIMARY KEY IDENTITY(1,1),
                                 UserId INT NOT NULL,
                                 Year INT NOT NULL,
                                 Month INT NOT NULL CHECK (Month BETWEEN 1 AND 12),
                                 Cost INT NOT NULL,
                                 GymHours INT NULL, -- تعداد ساعات ورزش در ماه
                                 Description NVARCHAR(500) NULL,
                                 FOREIGN KEY (UserId) REFERENCES Users(UserId)
);

-- ایجاد جدول MonthlyReports برای گزارش‌های ماهیانه
CREATE TABLE MonthlyReports (
                                ReportId INT PRIMARY KEY IDENTITY(1,1),
                                UserId INT NOT NULL,
                                Year INT NOT NULL,
                                Month INT NOT NULL CHECK (Month BETWEEN 1 AND 12),
                                JalaliYear INT NOT NULL,
                                JalaliMonth INT NOT NULL CHECK (JalaliMonth BETWEEN 1 AND 12),
                                TotalHours INT NOT NULL,
                                GymCost INT NOT NULL,
                                Status NVARCHAR(50) NOT NULL CHECK (Status IN ('draft', 'submitted_to_group_manager', 'submitted_to_general_manager', 'submitted_to_finance', 'approved')),
                                GroupId INT NULL,
                                GeneralManagerStatus NVARCHAR(50) NULL DEFAULT 'pending' CHECK (GeneralManagerStatus IN ('pending', 'approved_by_general_manager')),
                                ManagerComment NVARCHAR(500) NULL,
                                FinanceComment NVARCHAR(500) NULL,
                                SubmittedAt DATETIME NULL,
                                ApprovedAt DATETIME NULL,
                                FOREIGN KEY (UserId) REFERENCES Users(UserId),
                                FOREIGN KEY (GroupId) REFERENCES Groups(GroupId)
);

-- ایندکس‌ها برای بهینه‌سازی کوئری‌ها
CREATE INDEX IX_DailyDetails_Date_UserId ON DailyDetails(Date, UserId);
CREATE INDEX IX_DailyProjectTasks_Date_UserId ON DailyProjectTasks(Date, UserId);
CREATE INDEX IX_MonthlyReports_Year_Month ON MonthlyReports(Year, Month);
CREATE INDEX IX_MonthlyReports_JalaliYear_JalaliMonth ON MonthlyReports(JalaliYear, JalaliMonth);

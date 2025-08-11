-- ایجاد جدول Users (گسترش نقش‌ها)
CREATE TABLE Users (
    UserId INT PRIMARY KEY IDENTITY(1,1),
    Username NVARCHAR(100) NOT NULL UNIQUE,
    PasswordHash NVARCHAR(MAX) NOT NULL, -- هش شده
    Role NVARCHAR(50) NOT NULL DEFAULT 'user' -- 'user', 'manager', 'finance', 'admin'
);

-- ایجاد جدول Projects (بدون تغییر)
CREATE TABLE Projects (
    Id INT PRIMARY KEY IDENTITY(1,1),
    ProjectName NVARCHAR(100),
    securityLevel INT
);

-- ایجاد جدول DailyDetails (بدون تغییر عمده)
CREATE TABLE DailyDetails (
    Date DATE,
    UserId INT,
    ArrivalTime NVARCHAR(8), -- HH:MM:SS (اختیاری برای تطبیق با قرارداد)
    LeaveTime NVARCHAR(8),   -- HH:MM:SS
    LeaveType NVARCHAR(50),
    PersonalTime INT,        -- In minutes
    Description NVARCHAR(MAX),
    GoCost INT,
    ReturnCost INT,
    PRIMARY KEY (Date, UserId),
    FOREIGN KEY (UserId) REFERENCES Users(UserId)
);

-- ایجاد جدول DailyProjectTasks (بدون تغییر)
CREATE TABLE DailyProjectTasks (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    Date DATE NOT NULL,
    UserId INT NOT NULL,
    ProjectId INT NOT NULL,
    Duration INT,            -- In minutes
    Description NVARCHAR(MAX),
    FOREIGN KEY (Date, UserId) REFERENCES DailyDetails(Date, UserId),
    FOREIGN KEY (ProjectId) REFERENCES Projects(Id)
);

-- ایجاد جدول DailyPersonalCarCosts (با Kilometers)
CREATE TABLE DailyPersonalCarCosts (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    Date DATE NOT NULL,
    UserId INT NOT NULL,
    ProjectId INT NOT NULL,
    Cost INT NOT NULL,
    Kilometers INT NULL,
    Description NVARCHAR(MAX),
    FOREIGN KEY (Date, UserId) REFERENCES DailyDetails(Date, UserId),
    FOREIGN KEY (ProjectId) REFERENCES Projects(Id)
);

-- جدول جدید: MonthlyGymCosts (هزینه ورزش ماهیانه)
CREATE TABLE MonthlyGymCosts (
    Id INT PRIMARY KEY IDENTITY(1,1),
    UserId INT NOT NULL,
    Year INT NOT NULL,
    Month INT NOT NULL,  -- 1-12
    Cost INT NOT NULL DEFAULT 0,  -- هزینه ماهیانه (مثلاً 500000 تومان)
    Description NVARCHAR(MAX),
    UNIQUE (UserId, Year, Month),  -- هر ماه یک رکورد
    FOREIGN KEY (UserId) REFERENCES Users(UserId)
);

-- جدول گسترش‌یافته: UserContractHours (اضافه MinMonthlyHours)
CREATE TABLE UserContractHours (
    ContractId INT PRIMARY KEY IDENTITY(1,1),
    UserId INT NOT NULL UNIQUE,
    ContractArrivalTime NVARCHAR(8) NULL,  -- اختیاری
    ContractLeaveTime NVARCHAR(8) NOT NULL,
    MinMonthlyHours INT NOT NULL DEFAULT 160,  -- حداقل ساعت کاری ماهیانه
    FOREIGN KEY (UserId) REFERENCES Users(UserId)
);

-- جدول Holidays (بدون تغییر)
CREATE TABLE Holidays (
    HolidayId INT PRIMARY KEY IDENTITY(1,1),
    Date DATE NOT NULL UNIQUE,
    Name NVARCHAR(255) NOT NULL,
    HolidayType NVARCHAR(100),
    IsWorkDay BIT NOT NULL DEFAULT 0
);

-- جدول جدید: MonthlyReports (برای workflow گزارش ماهانه)
CREATE TABLE MonthlyReports (
    ReportId INT PRIMARY KEY IDENTITY(1,1),
    UserId INT NOT NULL,
    Year INT NOT NULL,
    Month INT NOT NULL,  -- 1-12
    TotalHours INT NOT NULL,  -- مجموع ساعات کاری (محاسبه‌شده)
    GymCost INT NOT NULL DEFAULT 0,  -- هزینه ورزش ادغام‌شده
    Status NVARCHAR(50) NOT NULL DEFAULT 'draft',  -- draft, submitted_to_manager, approved_by_manager, submitted_to_finance, approved, rejected
    ManagerComment NVARCHAR(MAX),
    FinanceComment NVARCHAR(MAX),
    SubmittedAt DATETIME NULL,
    ApprovedAt DATETIME NULL,
    UNIQUE (UserId, Year, Month),
    FOREIGN KEY (UserId) REFERENCES Users(UserId)
);
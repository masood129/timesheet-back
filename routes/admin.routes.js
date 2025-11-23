const express = require('express');
const router = express.Router();

// Import controllers
const userManagementController = require('../controllers/admin/userManagementController');
const projectManagementController = require('../controllers/admin/projectManagementController');
const groupManagementController = require('../controllers/admin/groupManagementController');
const reportManagementController = require('../controllers/admin/reportManagementController');
const systemConfigController = require('../controllers/admin/systemConfigController');
const monthPeriodSettingsController = require('../controllers/admin/monthPeriodSettingsController');

// ============================================
// USER MANAGEMENT ROUTES
// ============================================

/**
 * @swagger
 * /admin/users:
 *   get:
 *     summary: Get all users (Admin only)
 *     tags: [Admin - Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *         description: Filter by role
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by username
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *     responses:
 *       200:
 *         description: List of users
 *       403:
 *         description: Access denied
 *       500:
 *         description: Server error
 */
router.get('/users', userManagementController.getAllUsers);

/**
 * @swagger
 * /admin/users/{id}:
 *   get:
 *     summary: Get user by ID (Admin only)
 *     tags: [Admin - Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: User details
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.get('/users/:id', userManagementController.getUserById);

/**
 * @swagger
 * /admin/users:
 *   post:
 *     summary: Create new user (Admin only)
 *     tags: [Admin - Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - UserId
 *               - Username
 *             properties:
 *               UserId:
 *                 type: integer
 *               Username:
 *                 type: string
 *               Role:
 *                 type: string
 *                 enum: [user, group_manager, general_manager, finance_manager, admin]
 *                 default: user
 *     responses:
 *       201:
 *         description: User created
 *       400:
 *         description: Invalid input
 *       500:
 *         description: Server error
 */
router.post('/users', userManagementController.createUser);

/**
 * @swagger
 * /admin/users/{id}:
 *   put:
 *     summary: Update user (Admin only)
 *     tags: [Admin - Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               Username:
 *                 type: string
 *     responses:
 *       200:
 *         description: User updated
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.put('/users/:id', userManagementController.updateUser);

/**
 * @swagger
 * /admin/users/{id}:
 *   delete:
 *     summary: Delete user (Admin only)
 *     tags: [Admin - Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: User deleted
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.delete('/users/:id', userManagementController.deleteUser);

/**
 * @swagger
 * /admin/users/{id}/role:
 *   put:
 *     summary: Update user role (Admin only)
 *     tags: [Admin - Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - Role
 *             properties:
 *               Role:
 *                 type: string
 *                 enum: [user, group_manager, general_manager, finance_manager, admin]
 *     responses:
 *       200:
 *         description: Role updated
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.put('/users/:id/role', userManagementController.updateUserRole);

// ============================================
// PROJECT MANAGEMENT ROUTES
// ============================================

/**
 * @swagger
 * /admin/projects:
 *   get:
 *     summary: Get all projects (Admin only)
 *     tags: [Admin - Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *     responses:
 *       200:
 *         description: List of projects
 *       500:
 *         description: Server error
 */
router.get('/projects', projectManagementController.getAllProjects);

/**
 * @swagger
 * /admin/projects/{id}:
 *   get:
 *     summary: Get project by ID (Admin only)
 *     tags: [Admin - Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Project details
 *       404:
 *         description: Project not found
 *       500:
 *         description: Server error
 */
router.get('/projects/:id', projectManagementController.getProjectById);

/**
 * @swagger
 * /admin/projects:
 *   post:
 *     summary: Create new project (Admin only)
 *     tags: [Admin - Projects]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - Id
 *               - ProjectName
 *             properties:
 *               Id:
 *                 type: integer
 *               ProjectName:
 *                 type: string
 *               securityLevel:
 *                 type: integer
 *                 default: 1
 *     responses:
 *       201:
 *         description: Project created
 *       400:
 *         description: Invalid input
 *       500:
 *         description: Server error
 */
router.post('/projects', projectManagementController.createProject);

/**
 * @swagger
 * /admin/projects/{id}:
 *   put:
 *     summary: Update project (Admin only)
 *     tags: [Admin - Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               ProjectName:
 *                 type: string
 *               securityLevel:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Project updated
 *       404:
 *         description: Project not found
 *       500:
 *         description: Server error
 */
router.put('/projects/:id', projectManagementController.updateProject);

/**
 * @swagger
 * /admin/projects/{id}:
 *   delete:
 *     summary: Delete project (Admin only)
 *     tags: [Admin - Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Project deleted
 *       404:
 *         description: Project not found
 *       500:
 *         description: Server error
 */
router.delete('/projects/:id', projectManagementController.deleteProject);

/**
 * @swagger
 * /admin/projects/{id}/users:
 *   get:
 *     summary: Get users with access to project (Admin only)
 *     tags: [Admin - Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of users
 *       404:
 *         description: Project not found
 *       500:
 *         description: Server error
 */
router.get('/projects/:id/users', projectManagementController.getProjectUsers);

/**
 * @swagger
 * /admin/projects/{id}/users:
 *   post:
 *     summary: Add user access to project (Admin only)
 *     tags: [Admin - Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - UserId
 *             properties:
 *               UserId:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Access granted
 *       400:
 *         description: Invalid input
 *       404:
 *         description: Project or user not found
 *       500:
 *         description: Server error
 */
router.post('/projects/:id/users', projectManagementController.addUserToProject);

/**
 * @swagger
 * /admin/projects/{id}/users/{userId}:
 *   delete:
 *     summary: Remove user access from project (Admin only)
 *     tags: [Admin - Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Access removed
 *       404:
 *         description: Access not found
 *       500:
 *         description: Server error
 */
router.delete('/projects/:id/users/:userId', projectManagementController.removeUserFromProject);

// ============================================
// GROUP MANAGEMENT ROUTES
// ============================================

/**
 * @swagger
 * /admin/groups:
 *   get:
 *     summary: Get all groups (Admin only)
 *     tags: [Admin - Groups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *     responses:
 *       200:
 *         description: List of groups
 *       500:
 *         description: Server error
 */
router.get('/groups', groupManagementController.getAllGroups);

/**
 * @swagger
 * /admin/groups/{id}:
 *   get:
 *     summary: Get group by ID (Admin only)
 *     tags: [Admin - Groups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Group details
 *       404:
 *         description: Group not found
 *       500:
 *         description: Server error
 */
router.get('/groups/:id', groupManagementController.getGroupById);

/**
 * @swagger
 * /admin/groups:
 *   post:
 *     summary: Create new group (Admin only)
 *     tags: [Admin - Groups]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - GroupId
 *               - GroupName
 *             properties:
 *               GroupId:
 *                 type: integer
 *               GroupName:
 *                 type: string
 *               ManagerId:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Group created
 *       400:
 *         description: Invalid input
 *       500:
 *         description: Server error
 */
router.post('/groups', groupManagementController.createGroup);

/**
 * @swagger
 * /admin/groups/{id}:
 *   put:
 *     summary: Update group (Admin only)
 *     tags: [Admin - Groups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               GroupName:
 *                 type: string
 *               ManagerId:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Group updated
 *       404:
 *         description: Group not found
 *       500:
 *         description: Server error
 */
router.put('/groups/:id', groupManagementController.updateGroup);

/**
 * @swagger
 * /admin/groups/{id}:
 *   delete:
 *     summary: Delete group (Admin only)
 *     tags: [Admin - Groups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Group deleted
 *       404:
 *         description: Group not found
 *       500:
 *         description: Server error
 */
router.delete('/groups/:id', groupManagementController.deleteGroup);

/**
 * @swagger
 * /admin/groups/{id}/members:
 *   get:
 *     summary: Get group members (Admin only)
 *     tags: [Admin - Groups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of members
 *       404:
 *         description: Group not found
 *       500:
 *         description: Server error
 */
router.get('/groups/:id/members', groupManagementController.getGroupMembers);

/**
 * @swagger
 * /admin/groups/{id}/members:
 *   post:
 *     summary: Add user to group (Admin only)
 *     tags: [Admin - Groups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - UserId
 *             properties:
 *               UserId:
 *                 type: integer
 *     responses:
 *       201:
 *         description: User added to group
 *       404:
 *         description: Group or user not found
 *       500:
 *         description: Server error
 */
router.post('/groups/:id/members', groupManagementController.addUserToGroup);

/**
 * @swagger
 * /admin/groups/{id}/members/{userId}:
 *   delete:
 *     summary: Remove user from group (Admin only)
 *     tags: [Admin - Groups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: User removed from group
 *       404:
 *         description: User not found in group
 *       500:
 *         description: Server error
 */
router.delete('/groups/:id/members/:userId', groupManagementController.removeUserFromGroup);

/**
 * @swagger
 * /admin/groups/{id}/manager:
 *   put:
 *     summary: Set group manager (Admin only)
 *     tags: [Admin - Groups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - ManagerId
 *             properties:
 *               ManagerId:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Manager set
 *       404:
 *         description: Group or user not found
 *       500:
 *         description: Server error
 */
router.put('/groups/:id/manager', groupManagementController.setGroupManager);

// ============================================
// REPORTS & ANALYTICS ROUTES
// ============================================

/**
 * @swagger
 * /admin/reports/monthly:
 *   get:
 *     summary: Get all monthly reports (Admin only)
 *     tags: [Admin - Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: userId
 *         schema:
 *           type: integer
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *       - in: query
 *         name: month
 *         schema:
 *           type: integer
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *     responses:
 *       200:
 *         description: List of monthly reports
 *       500:
 *         description: Server error
 */
router.get('/reports/monthly', reportManagementController.getAllMonthlyReports);

/**
 * @swagger
 * /admin/reports/daily:
 *   get:
 *     summary: Get all daily details (Admin only)
 *     tags: [Admin - Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: userId
 *         schema:
 *           type: integer
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *     responses:
 *       200:
 *         description: List of daily details
 *       500:
 *         description: Server error
 */
router.get('/reports/daily', reportManagementController.getAllDailyDetails);

/**
 * @swagger
 * /admin/reports/statistics:
 *   get:
 *     summary: Get system statistics (Admin only)
 *     tags: [Admin - Reports]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: System statistics
 *       500:
 *         description: Server error
 */
router.get('/reports/statistics', reportManagementController.getSystemStatistics);

/**
 * @swagger
 * /admin/reports/user/{userId}/summary:
 *   get:
 *     summary: Get user activity summary (Admin only)
 *     tags: [Admin - Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: User activity summary
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.get('/reports/user/:userId/summary', reportManagementController.getUserActivitySummary);

// ============================================
// SYSTEM CONFIGURATION ROUTES
// ============================================

/**
 * @swagger
 * /admin/config/contract-hours:
 *   get:
 *     summary: Get all contract hours (Admin only)
 *     tags: [Admin - Config]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of contract hours
 *       500:
 *         description: Server error
 */
router.get('/config/contract-hours', systemConfigController.getAllContractHours);

/**
 * @swagger
 * /admin/config/contract-hours/{userId}:
 *   get:
 *     summary: Get user contract hours (Admin only)
 *     tags: [Admin - Config]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Contract hours
 *       404:
 *         description: Not found
 *       500:
 *         description: Server error
 */
router.get('/config/contract-hours/:userId', systemConfigController.getUserContractHours);

/**
 * @swagger
 * /admin/config/contract-hours/{userId}:
 *   put:
 *     summary: Update user contract hours (Admin only)
 *     tags: [Admin - Config]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - ContractLeaveTime
 *               - MinMonthlyHours
 *             properties:
 *               ContractArrivalTime:
 *                 type: string
 *               ContractLeaveTime:
 *                 type: string
 *               MinMonthlyHours:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Contract hours updated
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.put('/config/contract-hours/:userId', systemConfigController.updateUserContractHours);

/**
 * @swagger
 * /admin/config/contract-hours/{userId}:
 *   delete:
 *     summary: Delete user contract hours (Admin only)
 *     tags: [Admin - Config]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Contract hours deleted
 *       404:
 *         description: Not found
 *       500:
 *         description: Server error
 */
router.delete('/config/contract-hours/:userId', systemConfigController.deleteUserContractHours);

/**
 * @swagger
 * /admin/config/system:
 *   get:
 *     summary: Get system configuration (Admin only)
 *     tags: [Admin - Config]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: System configuration
 *       500:
 *         description: Server error
 */
router.get('/config/system', systemConfigController.getSystemConfig);

// ============================================
// MONTH PERIOD SETTINGS ROUTES
// ============================================

/**
 * @swagger
 * /admin/month-periods/{year}:
 *   get:
 *     summary: Get all month periods for a year (Admin only)
 *     tags: [Admin - Month Periods]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: year
 *         required: true
 *         schema:
 *           type: integer
 *         description: Jalali year (e.g., 1404)
 *     responses:
 *       200:
 *         description: List of month periods for the year
 *       400:
 *         description: Invalid year
 *       500:
 *         description: Server error
 */
router.get('/month-periods/:year', monthPeriodSettingsController.getAllMonthPeriods);

/**
 * @swagger
 * /admin/month-periods/{year}/{month}:
 *   get:
 *     summary: Get month period for specific year/month (Admin only)
 *     tags: [Admin - Month Periods]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: year
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: month
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 12
 *     responses:
 *       200:
 *         description: Month period details
 *       404:
 *         description: Month period not found
 *       500:
 *         description: Server error
 */
router.get('/month-periods/:year/:month', monthPeriodSettingsController.getMonthPeriod);

/**
 * @swagger
 * /admin/month-periods:
 *   post:
 *     summary: Create new month period (Admin only)
 *     tags: [Admin - Month Periods]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - Year
 *               - Month
 *               - StartDay
 *               - StartMonth
 *               - EndDay
 *               - EndMonth
 *               - CurrentJalaliYear
 *               - CurrentJalaliMonth
 *             properties:
 *               Year:
 *                 type: integer
 *               Month:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 12
 *               StartDay:
 *                 type: integer
 *               StartMonth:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 12
 *               EndDay:
 *                 type: integer
 *               EndMonth:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 12
 *               CurrentJalaliYear:
 *                 type: integer
 *                 description: Current Jalali year for validation
 *               CurrentJalaliMonth:
 *                 type: integer
 *                 description: Current Jalali month for validation
 *     responses:
 *       201:
 *         description: Month period created
 *       400:
 *         description: Invalid input or month is in the past
 *       500:
 *         description: Server error
 */
router.post('/month-periods', monthPeriodSettingsController.createMonthPeriod);

/**
 * @swagger
 * /admin/month-periods/{year}/{month}:
 *   put:
 *     summary: Update month period (Admin only)
 *     tags: [Admin - Month Periods]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: year
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: month
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - StartDay
 *               - StartMonth
 *               - EndDay
 *               - EndMonth
 *               - CurrentJalaliYear
 *               - CurrentJalaliMonth
 *             properties:
 *               StartDay:
 *                 type: integer
 *               StartMonth:
 *                 type: integer
 *               EndDay:
 *                 type: integer
 *               EndMonth:
 *                 type: integer
 *               CurrentJalaliYear:
 *                 type: integer
 *               CurrentJalaliMonth:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Month period updated
 *       404:
 *         description: Month period not found
 *       400:
 *         description: Invalid input or month is in the past
 *       500:
 *         description: Server error
 */
router.put('/month-periods/:year/:month', monthPeriodSettingsController.updateMonthPeriod);

/**
 * @swagger
 * /admin/month-periods/{year}/{month}:
 *   delete:
 *     summary: Delete month period (revert to default) (Admin only)
 *     tags: [Admin - Month Periods]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: year
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: month
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               CurrentJalaliYear:
 *                 type: integer
 *               CurrentJalaliMonth:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Month period deleted (reverted to default)
 *       404:
 *         description: Month period not found
 *       400:
 *         description: Month is in the past
 *       500:
 *         description: Server error
 */
router.delete('/month-periods/:year/:month', monthPeriodSettingsController.deleteMonthPeriod);

module.exports = router;

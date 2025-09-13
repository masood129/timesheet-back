const express = require('express');
const router = express.Router();
const projectController = require('../controllers/project.controller');
const authMiddleware = require('../middlewares/auth.middleware');

// لیست همه پروژه‌ها
router.get('/', authMiddleware, projectController.getProjects);

// ایجاد پروژه جدید
router.post('/', authMiddleware, projectController.createProject);

// گرفتن یک پروژه خاص
router.get('/:id', authMiddleware, projectController.getProjectById);

// بروزرسانی پروژه
router.put('/:id', authMiddleware, projectController.updateProject);

// حذف پروژه
router.delete('/:id', authMiddleware, projectController.deleteProject);

module.exports = router;

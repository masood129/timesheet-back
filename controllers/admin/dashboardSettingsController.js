const pool = require('../../config/db.config');
const logger = require('../../utils/logger.service');

/**
 * دریافت تنظیمات داشبورد
 */
const getDashboardSettings = async (req, res) => {
  try {
    const userId = req.user.personalid;

    // بررسی وجود تنظیمات برای کاربر
    const checkQuery = `
      SELECT settings_data, last_modified
      FROM DashboardSettings
      WHERE user_id = @userId
    `;

    const request = pool.request();
    request.input('userId', userId);
    
    const result = await request.query(checkQuery);

    if (result.recordset.length === 0) {
      // اگر تنظیماتی وجود ندارد، تنظیمات پیش‌فرض را برگردان
      return res.status(200).json({
        success: true,
        message: 'تنظیمات پیش‌فرض',
        data: null,
      });
    }

    const settings = result.recordset[0];

    logger.info(`Dashboard settings retrieved for user ${userId}`, {
      context: 'DashboardSettings',
      userId,
    });

    res.status(200).json({
      success: true,
      data: {
        settings: JSON.parse(settings.settings_data),
        lastModified: settings.last_modified,
      },
    });
  } catch (error) {
    logger.error('Error retrieving dashboard settings', {
      context: 'DashboardSettings',
      error: error.message,
      stack: error.stack,
    });

    res.status(500).json({
      success: false,
      message: 'خطا در دریافت تنظیمات داشبورد',
      error: error.message,
    });
  }
};

/**
 * ذخیره تنظیمات داشبورد
 */
const saveDashboardSettings = async (req, res) => {
  try {
    const userId = req.user.personalid;
    const { settings } = req.body;

    if (!settings) {
      return res.status(400).json({
        success: false,
        message: 'تنظیمات ارسال نشده است',
      });
    }

    // تبدیل تنظیمات به JSON string
    const settingsJson = JSON.stringify(settings);

    // بررسی وجود تنظیمات قبلی
    const checkQuery = `
      SELECT id FROM DashboardSettings WHERE user_id = @userId
    `;

    let request = pool.request();
    request.input('userId', userId);
    const checkResult = await request.query(checkQuery);

    let query;
    if (checkResult.recordset.length === 0) {
      // ایجاد تنظیمات جدید
      query = `
        INSERT INTO DashboardSettings (user_id, settings_data, last_modified)
        VALUES (@userId, @settings, GETDATE())
      `;
    } else {
      // به‌روزرسانی تنظیمات موجود
      query = `
        UPDATE DashboardSettings
        SET settings_data = @settings, last_modified = GETDATE()
        WHERE user_id = @userId
      `;
    }

    request = pool.request();
    request.input('userId', userId);
    request.input('settings', settingsJson);
    await request.query(query);

    logger.info(`Dashboard settings saved for user ${userId}`, {
      context: 'DashboardSettings',
      userId,
    });

    res.status(200).json({
      success: true,
      message: 'تنظیمات با موفقیت ذخیره شد',
    });
  } catch (error) {
    logger.error('Error saving dashboard settings', {
      context: 'DashboardSettings',
      error: error.message,
      stack: error.stack,
    });

    res.status(500).json({
      success: false,
      message: 'خطا در ذخیره تنظیمات داشبورد',
      error: error.message,
    });
  }
};

/**
 * بازنشانی تنظیمات به حالت پیش‌فرض
 */
const resetDashboardSettings = async (req, res) => {
  try {
    const userId = req.user.personalid;

    const query = `
      DELETE FROM DashboardSettings WHERE user_id = @userId
    `;

    const request = pool.request();
    request.input('userId', userId);
    await request.query(query);

    logger.info(`Dashboard settings reset for user ${userId}`, {
      context: 'DashboardSettings',
      userId,
    });

    res.status(200).json({
      success: true,
      message: 'تنظیمات به حالت پیش‌فرض بازگشت',
    });
  } catch (error) {
    logger.error('Error resetting dashboard settings', {
      context: 'DashboardSettings',
      error: error.message,
      stack: error.stack,
    });

    res.status(500).json({
      success: false,
      message: 'خطا در بازنشانی تنظیمات',
      error: error.message,
    });
  }
};

module.exports = {
  getDashboardSettings,
  saveDashboardSettings,
  resetDashboardSettings,
};


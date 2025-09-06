const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { sql, poolPromise } = require('../config/db.config');

// ورود کاربر
exports.login = async (req, res) => {
    const { username, password } = req.body;

    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('username', sql.NVarChar, username)
            .query('SELECT * FROM Users WHERE Username = @username');

        if (result.recordset.length === 0) {
            return res.status(401).json({ message: 'Invalid username or password' });
        }

        const user = result.recordset[0];
        const isPasswordValid = await bcrypt.compare(password, user.PasswordHash);

        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid username or password' });
        }

        const token = jwt.sign(
            { userId: user.UserId, role: user.Role, username: user.Username },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.json({ token });
    } catch (err) {
        console.error('Login error:', err.message);
        res.status(500).send('Server error');
    }
};

// گرفتن پروفایل کاربر لاگین‌شده
exports.profile = async (req, res) => {
    res.json({
        userId: req.user.userId,
        username: req.user.username,
        role: req.user.role
    });
};

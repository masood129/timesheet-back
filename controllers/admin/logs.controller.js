const logger = require('../../utils/logger.service');
const fs = require('fs').promises;
const path = require('path');
const readline = require('readline');

const logsDir = path.join(__dirname, '../../logs');

/**
 * Get list of available log categories and their files
 */
exports.getLogCategories = async (req, res) => {
    try {
        logger.admin.info('Fetching log categories', { userId: req.user.userId });

        const files = await fs.readdir(logsDir);
        const categories = {};

        // Group files by category
        for (const file of files) {
            if (file.endsWith('.log')) {
                const match = file.match(/^(.+?)-(\d{4}-\d{2}-\d{2})\.log$/);
                if (match) {
                    const category = match[1];
                    const date = match[2];

                    if (!categories[category]) {
                        categories[category] = [];
                    }

                    const stats = await fs.stat(path.join(logsDir, file));
                    categories[category].push({
                        date,
                        filename: file,
                        size: stats.size,
                        modified: stats.mtime
                    });
                }
            }
        }

        // Sort dates in descending order for each category
        Object.keys(categories).forEach(cat => {
            categories[cat].sort((a, b) => b.date.localeCompare(a.date));
        });

        res.json(categories);
    } catch (err) {
        logger.errors.error('Error fetching log categories', { error: err.message, userId: req.user.userId });
        res.status(500).json({ error: 'Failed to fetch log categories' });
    }
};

/**
 * Get logs for a specific category with pagination and filtering
 */
exports.getLogsByCategory = async (req, res) => {
    try {
        const { category } = req.params;
        const {
            date,
            level,
            search,
            page = 1,
            limit = 100,
            userId: filterUserId
        } = req.query;

        logger.admin.info('Fetching logs by category', {
            category,
            date,
            level,
            page,
            limit,
            requestUserId: req.user.userId
        });

        // Determine filename
        let filename;
        if (date) {
            filename = `${category}-${date}.log`;
        } else {
            // Get most recent file for this category
            const files = await fs.readdir(logsDir);
            const categoryFiles = files
                .filter(f => f.startsWith(`${category}-`) && f.endsWith('.log'))
                .sort()
                .reverse();

            if (categoryFiles.length === 0) {
                return res.json({ logs: [], total: 0, page: parseInt(page), totalPages: 0 });
            }

            filename = categoryFiles[0];
        }

        const filePath = path.join(logsDir, filename);

        // Check if file exists
        try {
            await fs.access(filePath);
        } catch {
            return res.status(404).json({ error: 'Log file not found' });
        }

        // Read and parse log file
        const logs = await parseLogFile(filePath, {
            level,
            search,
            userId: filterUserId
        });

        // Pagination
        const total = logs.length;
        const totalPages = Math.ceil(total / limit);
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + parseInt(limit);
        const paginatedLogs = logs.slice(startIndex, endIndex);

        res.json({
            logs: paginatedLogs,
            total,
            page: parseInt(page),
            totalPages,
            category,
            filename
        });
    } catch (err) {
        logger.errors.error('Error fetching logs by category', {
            error: err.message,
            category: req.params.category,
            userId: req.user.userId
        });
        res.status(500).json({ error: 'Failed to fetch logs' });
    }
};

/**
 * Search across all logs
 */
exports.searchLogs = async (req, res) => {
    try {
        const {
            query: searchQuery,
            category,
            level,
            startDate,
            endDate,
            userId: filterUserId,
            limit = 100
        } = req.query;

        logger.admin.info('Searching logs', {
            searchQuery,
            category,
            level,
            startDate,
            endDate,
            requestUserId: req.user.userId
        });

        // Search query is optional - if not provided, return all logs with filters

        const files = await fs.readdir(logsDir);
        let allLogs = [];

        // Filter files by category and date range if specified
        const filteredFiles = files.filter(file => {
            if (!file.endsWith('.log')) return false;

            const match = file.match(/^(.+?)-(\d{4}-\d{2}-\d{2})\.log$/);
            if (!match) return false;

            const [, fileCategory, fileDate] = match;

            if (category && fileCategory !== category) return false;
            if (startDate && fileDate < startDate) return false;
            if (endDate && fileDate > endDate) return false;

            return true;
        });

        // Parse each file and collect matching logs
        for (const file of filteredFiles) {
            const filePath = path.join(logsDir, file);
            const logs = await parseLogFile(filePath, {
                level,
                search: searchQuery,
                userId: filterUserId
            });
            allLogs = allLogs.concat(logs.map(log => ({
                ...log,
                sourceFile: file
            })));
        }

        // Sort by timestamp descending
        allLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        // Limit results
        const limitedLogs = allLogs.slice(0, parseInt(limit));

        res.json({
            logs: limitedLogs,
            total: allLogs.length,
            truncated: allLogs.length > limit
        });
    } catch (err) {
        logger.errors.error('Error searching logs', {
            error: err.message,
            userId: req.user.userId
        });
        res.status(500).json({ error: 'Failed to search logs' });
    }
};

/**
 * Download a specific log file
 */
exports.downloadLog = async (req, res) => {
    try {
        const { category, date } = req.params;
        const filename = `${category}-${date}.log`;
        const filePath = path.join(logsDir, filename);

        logger.admin.info('Downloading log file', {
            filename,
            userId: req.user.userId
        });

        // Check if file exists
        try {
            await fs.access(filePath);
        } catch {
            return res.status(404).json({ error: 'Log file not found' });
        }

        res.download(filePath, filename);
    } catch (err) {
        logger.errors.error('Error downloading log file', {
            error: err.message,
            userId: req.user.userId
        });
        res.status(500).json({ error: 'Failed to download log file' });
    }
};

/**
 * Helper function to parse log file with filters
 */
async function parseLogFile(filePath, filters = {}) {
    const { level, search, userId } = filters;
    const logs = [];

    const fileStream = require('fs').createReadStream(filePath);
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });

    for await (const line of rl) {
        if (!line.trim()) continue;

        try {
            const log = JSON.parse(line);

            // Apply filters
            if (level && log.level !== level) continue;
            if (userId && log.userId !== parseInt(userId)) continue;
            if (search) {
                const searchLower = search.toLowerCase();
                const messageMatch = log.message && log.message.toLowerCase().includes(searchLower);
                const metaMatch = JSON.stringify(log).toLowerCase().includes(searchLower);
                if (!messageMatch && !metaMatch) continue;
            }

            logs.push(log);
        } catch (parseErr) {
            // Skip malformed JSON lines
            continue;
        }
    }

    return logs;
}

const db = require('../config/db');

class DownloadHistory {
    static async create(downloadData) {
        const [result] = await db.execute(
            `INSERT INTO download_history 
            (filename, download_date, record_count, filters) 
            VALUES (?, ?, ?, ?)`,
            [
                downloadData.filename,
                new Date(),
                downloadData.record_count,
                JSON.stringify(downloadData.filters || {})
            ]
        );
        return result.insertId;
    }

    static async findById(id) {
        const [rows] = await db.execute(
            'SELECT * FROM download_history WHERE id = ?',
            [id]
        );
        return rows[0];
    }

    static async getTotalDownloads() {
        const [rows] = await db.execute(
            'SELECT COUNT(*) as total FROM download_history'
        );
        return rows[0].total;
    }

    static async getTotalRecordsDownloaded() {
        const [rows] = await db.execute(
            'SELECT SUM(record_count) as total FROM download_history'
        );
        return rows[0].total || 0;
    }

    static async getRecentDownloads(limit = 5) {
        const [rows] = await db.execute(
            `SELECT * FROM download_history 
             ORDER BY download_date DESC 
             LIMIT ?`,
            [limit]
        );
        return rows;
    }

    static async getDownloadsByDateRange(startDate, endDate) {
        const [rows] = await db.execute(
            `SELECT * FROM download_history 
             WHERE download_date BETWEEN ? AND ?
             ORDER BY download_date DESC`,
            [startDate, endDate]
        );
        return rows;
    }

    static async getDownloadStats() {
        const [rows] = await db.execute(
            `SELECT 
                COUNT(*) as total_downloads,
                SUM(record_count) as total_records,
                AVG(record_count) as avg_records_per_download,
                MAX(download_date) as last_download_date
             FROM download_history`
        );
        return rows[0];
    }

    static async getPopularFilters() {
        const [rows] = await db.execute(
            `SELECT filters, COUNT(*) as usage_count 
             FROM download_history 
             WHERE filters IS NOT NULL 
             GROUP BY filters 
             ORDER BY usage_count DESC 
             LIMIT 5`
        );
        return rows.map(row => ({
            ...row,
            filters: JSON.parse(row.filters)
        }));
    }

    static async deleteRecord(id) {
        const [result] = await db.execute(
            'DELETE FROM download_history WHERE id = ?',
            [id]
        );
        return result.affectedRows > 0;
    }

    static async updateRecordCount(id, recordCount) {
        const [result] = await db.execute(
            'UPDATE download_history SET record_count = ? WHERE id = ?',
            [recordCount, id]
        );
        return result.affectedRows > 0;
    }
}

module.exports = DownloadHistory;

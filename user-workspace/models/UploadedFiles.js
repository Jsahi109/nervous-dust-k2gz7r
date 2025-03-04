const db = require('../config/db');

class UploadedFiles {
    static async create(fileData) {
        const [result] = await db.execute(
            `INSERT INTO uploaded_files 
            (filename, vendor_name, upload_date, total_records, duplicate_count, status) 
            VALUES (?, ?, ?, ?, ?, ?)`,
            [
                fileData.filename,
                fileData.vendor_name,
                new Date(),
                fileData.total_records,
                fileData.duplicate_count,
                fileData.status || 'processing'
            ]
        );
        return result.insertId;
    }

    static async updateStatus(id, status) {
        const [result] = await db.execute(
            'UPDATE uploaded_files SET status = ? WHERE id = ?',
            [status, id]
        );
        return result.affectedRows > 0;
    }

    static async findById(id) {
        const [rows] = await db.execute(
            'SELECT * FROM uploaded_files WHERE id = ?',
            [id]
        );
        return rows[0];
    }

    static async getTotalFiles() {
        const [rows] = await db.execute(
            'SELECT COUNT(*) as total FROM uploaded_files'
        );
        return rows[0].total;
    }

    static async getRecentUploads(limit = 5) {
        const [rows] = await db.execute(
            `SELECT * FROM uploaded_files 
             ORDER BY upload_date DESC 
             LIMIT ?`,
            [limit]
        );
        return rows;
    }

    static async getTotalDuplicates() {
        const [rows] = await db.execute(
            'SELECT SUM(duplicate_count) as total FROM uploaded_files'
        );
        return rows[0].total || 0;
    }

    static async getByVendor(vendorName) {
        const [rows] = await db.execute(
            'SELECT * FROM uploaded_files WHERE vendor_name = ?',
            [vendorName]
        );
        return rows;
    }

    static async getUploadStats() {
        const [rows] = await db.execute(
            `SELECT 
                COUNT(*) as total_files,
                SUM(total_records) as total_records,
                SUM(duplicate_count) as total_duplicates,
                COUNT(DISTINCT vendor_name) as unique_vendors
             FROM uploaded_files`
        );
        return rows[0];
    }

    static async deleteFile(id) {
        const [result] = await db.execute(
            'DELETE FROM uploaded_files WHERE id = ?',
            [id]
        );
        return result.affectedRows > 0;
    }

    static async updateDuplicateCount(id, duplicateCount) {
        const [result] = await db.execute(
            'UPDATE uploaded_files SET duplicate_count = ? WHERE id = ?',
            [duplicateCount, id]
        );
        return result.affectedRows > 0;
    }
}

module.exports = UploadedFiles;

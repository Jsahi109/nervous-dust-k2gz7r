const db = require('../config/db');

class Dispositions {
    static async create(dispositionData) {
        const [result] = await db.execute(
            `INSERT INTO dispositions 
            (phone_number, disposition_status, disposition_date) 
            VALUES (?, ?, ?)`,
            [
                dispositionData.phone_number,
                dispositionData.disposition_status,
                dispositionData.disposition_date || new Date()
            ]
        );
        return result.insertId;
    }

    static async findById(id) {
        const [rows] = await db.execute(
            'SELECT * FROM dispositions WHERE id = ?',
            [id]
        );
        return rows[0];
    }

    static async findByPhoneNumber(phoneNumber) {
        const [rows] = await db.execute(
            'SELECT * FROM dispositions WHERE phone_number = ? ORDER BY disposition_date DESC',
            [phoneNumber]
        );
        return rows;
    }

    static async getLatestDisposition(phoneNumber) {
        const [rows] = await db.execute(
            `SELECT * FROM dispositions 
             WHERE phone_number = ? 
             ORDER BY disposition_date DESC 
             LIMIT 1`,
            [phoneNumber]
        );
        return rows[0];
    }

    static async bulkCreate(dispositions) {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            for (const disposition of dispositions) {
                await this.create(disposition);
            }

            await connection.commit();
            return true;
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    static async getDispositionStats() {
        const [rows] = await db.execute(
            `SELECT 
                disposition_status,
                COUNT(*) as count,
                COUNT(DISTINCT phone_number) as unique_numbers
             FROM dispositions 
             GROUP BY disposition_status`
        );
        return rows;
    }

    static async getRecentDispositions(limit = 100) {
        const [rows] = await db.execute(
            `SELECT d.*, m.first_name, m.last_name, m.vendor_name
             FROM dispositions d
             JOIN master_data m ON d.phone_number = m.phone_number
             ORDER BY d.disposition_date DESC
             LIMIT ?`,
            [limit]
        );
        return rows;
    }

    static async updateDisposition(id, status) {
        const [result] = await db.execute(
            `UPDATE dispositions 
             SET disposition_status = ?, 
                 disposition_date = NOW() 
             WHERE id = ?`,
            [status, id]
        );
        return result.affectedRows > 0;
    }

    static async deleteDisposition(id) {
        const [result] = await db.execute(
            'DELETE FROM dispositions WHERE id = ?',
            [id]
        );
        return result.affectedRows > 0;
    }

    static async getDispositionsByDateRange(startDate, endDate) {
        const [rows] = await db.execute(
            `SELECT * FROM dispositions 
             WHERE disposition_date BETWEEN ? AND ?
             ORDER BY disposition_date DESC`,
            [startDate, endDate]
        );
        return rows;
    }

    static async getDispositionsByStatus(status) {
        const [rows] = await db.execute(
            `SELECT d.*, m.first_name, m.last_name, m.vendor_name
             FROM dispositions d
             JOIN master_data m ON d.phone_number = m.phone_number
             WHERE d.disposition_status = ?
             ORDER BY d.disposition_date DESC`,
            [status]
        );
        return rows;
    }

    static async getDailyDispositionCounts(days = 7) {
        const [rows] = await db.execute(
            `SELECT 
                DATE(disposition_date) as date,
                disposition_status,
                COUNT(*) as count
             FROM dispositions
             WHERE disposition_date >= DATE_SUB(CURRENT_DATE, INTERVAL ? DAY)
             GROUP BY DATE(disposition_date), disposition_status
             ORDER BY date DESC, disposition_status`,
            [days]
        );
        return rows;
    }
}

module.exports = Dispositions;

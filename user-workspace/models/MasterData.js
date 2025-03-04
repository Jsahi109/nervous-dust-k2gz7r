const db = require('../config/db');

class MasterData {
    static async getTotalRecords() {
        try {
            const [rows] = await db.query('SELECT COUNT(*) as total FROM master_data');
            return rows[0].total;
        } catch (error) {
            console.error('Error getting total records:', error);
            throw error;
        }
    }

    static async getRecentRecords(limit = 10) {
        try {
            const [rows] = await db.query(
                'SELECT * FROM master_data ORDER BY created_at DESC LIMIT ?',
                [limit]
            );
            return rows;
        } catch (error) {
            console.error('Error getting recent records:', error);
            throw error;
        }
    }

    static async findByPhoneNumber(phoneNumber) {
        try {
            const [rows] = await db.query(
                'SELECT * FROM master_data WHERE phone_number = ?',
                [phoneNumber]
            );
            return rows[0];
        } catch (error) {
            console.error('Error finding record by phone number:', error);
            throw error;
        }
    }

    static async create(data) {
        try {
            const [result] = await db.query(
                `INSERT INTO master_data 
                (phone_number, first_name, last_name, street_address, city, state, zip_code, 
                email, region, county, vendor_name, upload_id) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    data.phone_number,
                    data.first_name,
                    data.last_name,
                    data.street_address,
                    data.city,
                    data.state,
                    data.zip_code,
                    data.email,
                    data.region,
                    data.county,
                    data.vendor_name,
                    data.upload_id
                ]
            );
            return result.insertId;
        } catch (error) {
            console.error('Error creating record:', error);
            throw error;
        }
    }

    static async bulkCreate(records) {
        try {
            const values = records.map(record => [
                record.phone_number,
                record.first_name,
                record.last_name,
                record.street_address,
                record.city,
                record.state,
                record.zip_code,
                record.email,
                record.region,
                record.county,
                record.vendor_name,
                record.upload_id
            ]);

            const [result] = await db.query(
                `INSERT INTO master_data 
                (phone_number, first_name, last_name, street_address, city, state, zip_code, 
                email, region, county, vendor_name, upload_id) 
                VALUES ?`,
                [values]
            );
            return result.affectedRows;
        } catch (error) {
            console.error('Error bulk creating records:', error);
            throw error;
        }
    }

    static async update(id, data) {
        try {
            const [result] = await db.query(
                `UPDATE master_data SET 
                phone_number = ?, first_name = ?, last_name = ?, street_address = ?, 
                city = ?, state = ?, zip_code = ?, email = ?, region = ?, county = ? 
                WHERE id = ?`,
                [
                    data.phone_number,
                    data.first_name,
                    data.last_name,
                    data.street_address,
                    data.city,
                    data.state,
                    data.zip_code,
                    data.email,
                    data.region,
                    data.county,
                    id
                ]
            );
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error updating record:', error);
            throw error;
        }
    }

    static async delete(id) {
        try {
            const [result] = await db.query(
                'DELETE FROM master_data WHERE id = ?',
                [id]
            );
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error deleting record:', error);
            throw error;
        }
    }

    static async searchByZipCodes(zipCodes) {
        try {
            const [rows] = await db.query(
                'SELECT * FROM master_data WHERE zip_code IN (?)',
                [zipCodes]
            );
            return rows;
        } catch (error) {
            console.error('Error searching by zip codes:', error);
            throw error;
        }
    }

    static async getRecordsByVendor(vendorName) {
        try {
            const [rows] = await db.query(
                'SELECT * FROM master_data WHERE vendor_name = ?',
                [vendorName]
            );
            return rows;
        } catch (error) {
            console.error('Error getting records by vendor:', error);
            throw error;
        }
    }

    static async getStats() {
        try {
            const [rows] = await db.query(`
                SELECT 
                    COUNT(*) as total_records,
                    COUNT(DISTINCT vendor_name) as total_vendors,
                    COUNT(DISTINCT zip_code) as total_zip_codes,
                    COUNT(DISTINCT state) as total_states
                FROM master_data
            `);
            return rows[0];
        } catch (error) {
            console.error('Error getting stats:', error);
            throw error;
        }
    }

    static async getDuplicatePhoneNumbers() {
        try {
            const [rows] = await db.query(`
                SELECT phone_number, COUNT(*) as count
                FROM master_data
                GROUP BY phone_number
                HAVING count > 1
            `);
            return rows;
        } catch (error) {
            console.error('Error getting duplicate phone numbers:', error);
            throw error;
        }
    }
}

module.exports = MasterData;

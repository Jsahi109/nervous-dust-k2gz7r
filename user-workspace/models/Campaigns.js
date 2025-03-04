const db = require('../config/db');

class Campaigns {
    static async create(campaignData) {
        const [result] = await db.execute(
            `INSERT INTO campaigns 
            (campaign_name, total_data, remaining_data) 
            VALUES (?, ?, ?)`,
            [
                campaignData.campaign_name,
                campaignData.total_data,
                campaignData.total_data // Initially, remaining_data equals total_data
            ]
        );
        return result.insertId;
    }

    static async findById(id) {
        const [rows] = await db.execute(
            'SELECT * FROM campaigns WHERE id = ?',
            [id]
        );
        return rows[0];
    }

    static async findByName(campaignName) {
        const [rows] = await db.execute(
            'SELECT * FROM campaigns WHERE campaign_name = ?',
            [campaignName]
        );
        return rows[0];
    }

    static async getAllCampaigns() {
        const [rows] = await db.execute(
            'SELECT * FROM campaigns ORDER BY created_at DESC'
        );
        return rows;
    }

    static async updateRemainingData(id, remainingData) {
        const [result] = await db.execute(
            'UPDATE campaigns SET remaining_data = ? WHERE id = ?',
            [remainingData, id]
        );
        return result.affectedRows > 0;
    }

    static async deleteCampaign(id) {
        const [result] = await db.execute(
            'DELETE FROM campaigns WHERE id = ?',
            [id]
        );
        return result.affectedRows > 0;
    }

    static async getActiveCampaigns() {
        const [rows] = await db.execute(
            'SELECT * FROM campaigns WHERE remaining_data > 0'
        );
        return rows;
    }

    static async getCampaignStats() {
        const [rows] = await db.execute(
            `SELECT 
                COUNT(*) as total_campaigns,
                SUM(total_data) as total_records,
                SUM(remaining_data) as remaining_records,
                SUM(total_data - remaining_data) as processed_records
             FROM campaigns`
        );
        return rows[0];
    }

    static async updateCampaign(id, updateData) {
        const updates = [];
        const values = [];

        if (updateData.campaign_name) {
            updates.push('campaign_name = ?');
            values.push(updateData.campaign_name);
        }

        if (updateData.total_data !== undefined) {
            updates.push('total_data = ?');
            values.push(updateData.total_data);
        }

        if (updateData.remaining_data !== undefined) {
            updates.push('remaining_data = ?');
            values.push(updateData.remaining_data);
        }

        if (updates.length === 0) {
            return false;
        }

        values.push(id);

        const [result] = await db.execute(
            `UPDATE campaigns 
             SET ${updates.join(', ')} 
             WHERE id = ?`,
            values
        );
        return result.affectedRows > 0;
    }

    static async decrementRemainingData(id, amount) {
        const [result] = await db.execute(
            `UPDATE campaigns 
             SET remaining_data = GREATEST(0, remaining_data - ?) 
             WHERE id = ?`,
            [amount, id]
        );
        return result.affectedRows > 0;
    }

    static async getCampaignProgress(id) {
        const [rows] = await db.execute(
            `SELECT 
                campaign_name,
                total_data,
                remaining_data,
                (total_data - remaining_data) as processed_data,
                ROUND(((total_data - remaining_data) / total_data) * 100, 2) as progress_percentage
             FROM campaigns 
             WHERE id = ?`,
            [id]
        );
        return rows[0];
    }
}

module.exports = Campaigns;

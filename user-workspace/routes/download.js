const express = require('express');
const router = express.Router();
const { Parser } = require('json2csv');
const MasterData = require('../models/MasterData');
const DownloadHistory = require('../models/DownloadHistory');
const Dispositions = require('../models/Dispositions');
const Campaigns = require('../models/Campaigns');

// Render download form
router.get('/', async (req, res) => {
    try {
        // Get active campaigns for dropdown
        const campaigns = await Campaigns.getActiveCampaigns();
        
        res.render('download', {
            title: 'Download Data',
            campaigns: campaigns
        });
    } catch (error) {
        console.error('Download Page Error:', error);
        res.status(500).render('error', {
            message: 'Error loading download page',
            error: process.env.NODE_ENV === 'development' ? error : {}
        });
    }
});

// Handle data download
router.post('/', async (req, res) => {
    const {
        filename,
        zip_codes,
        campaign_id,
        vendor_name,
        include_dispositions,
        exclude_dispositions
    } = req.body;

    if (!filename) {
        return res.status(400).json({ error: 'Filename is required' });
    }

    try {
        // Build filter conditions
        const filters = {
            zip_codes: zip_codes ? zip_codes.split(',').map(zip => zip.trim()) : [],
            vendor_name: vendor_name || null,
            campaign_id: campaign_id || null
        };

        // Get filtered records
        let records = await MasterData.findByFilters(filters);

        // Handle dispositions if specified
        if (records.length > 0 && (include_dispositions || exclude_dispositions)) {
            const phoneNumbers = records.map(r => r.phone_number);
            const dispositions = await Dispositions.findByPhoneNumbers(phoneNumbers);

            // Create a map of phone numbers to their dispositions
            const dispositionMap = new Map();
            dispositions.forEach(d => {
                dispositionMap.set(d.phone_number, d.disposition_status);
            });

            // Filter records based on dispositions
            records = records.filter(record => {
                const disposition = dispositionMap.get(record.phone_number);
                
                if (include_dispositions) {
                    return include_dispositions.includes(disposition);
                }
                
                if (exclude_dispositions) {
                    return !exclude_dispositions.includes(disposition);
                }

                return true;
            });
        }

        // If no records found
        if (records.length === 0) {
            return res.status(404).json({ error: 'No records found matching the criteria' });
        }

        // Convert records to CSV
        const fields = [
            'phone_number',
            'first_name',
            'last_name',
            'street_address',
            'city',
            'state',
            'zip_code',
            'region',
            'county',
            'email'
        ];

        const json2csvParser = new Parser({ fields });
        const csv = json2csvParser.parse(records);

        // Log download history
        await DownloadHistory.create({
            filename,
            record_count: records.length,
            filters: {
                zip_codes,
                campaign_id,
                vendor_name,
                include_dispositions,
                exclude_dispositions
            }
        });

        // Update campaign remaining data if campaign_id provided
        if (campaign_id) {
            await Campaigns.decrementRemainingData(campaign_id, records.length);
        }

        // Set response headers
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);

        // Send CSV file
        res.send(csv);

    } catch (error) {
        console.error('Download Error:', error);
        res.status(500).json({
            error: 'Error processing download request',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Get download history
router.get('/history', async (req, res) => {
    try {
        const downloads = await DownloadHistory.getRecentDownloads(100);
        res.json(downloads);
    } catch (error) {
        console.error('Download History Error:', error);
        res.status(500).json({
            error: 'Error fetching download history'
        });
    }
});

// Get download details
router.get('/details/:id', async (req, res) => {
    try {
        const download = await DownloadHistory.findById(req.params.id);
        if (!download) {
            return res.status(404).json({ error: 'Download record not found' });
        }
        res.json(download);
    } catch (error) {
        console.error('Download Details Error:', error);
        res.status(500).json({
            error: 'Error fetching download details'
        });
    }
});

// Get available filters
router.get('/filters', async (req, res) => {
    try {
        const [campaigns, popularFilters] = await Promise.all([
            Campaigns.getActiveCampaigns(),
            DownloadHistory.getPopularFilters()
        ]);

        res.json({
            campaigns,
            popularFilters
        });
    } catch (error) {
        console.error('Filters Error:', error);
        res.status(500).json({
            error: 'Error fetching available filters'
        });
    }
});

module.exports = router;

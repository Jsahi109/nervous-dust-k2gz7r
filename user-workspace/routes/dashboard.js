const express = require('express');
const router = express.Router();
const MasterData = require('../models/MasterData');
const UploadedFiles = require('../models/UploadedFiles');
const DownloadHistory = require('../models/DownloadHistory');
const Campaigns = require('../models/Campaigns');

// Dashboard home route
router.get('/', async (req, res) => {
    try {
        // Fetch all dashboard statistics
        const [
            totalRecords,
            uploadStats,
            totalDownloads,
            campaignStats,
            recentUploads,
            recentDownloads
        ] = await Promise.all([
            MasterData.getTotalRecords(),
            UploadedFiles.getUploadStats(),
            DownloadHistory.getTotalRecordsDownloaded(),
            Campaigns.getCampaignStats(),
            UploadedFiles.getRecentUploads(5),
            DownloadHistory.getRecentDownloads(5)
        ]);

        res.render('dashboard', {
            stats: {
                totalRecords,
                uploadStats,
                totalDownloads,
                campaignStats
            },
            recentActivity: {
                uploads: recentUploads,
                downloads: recentDownloads
            }
        });
    } catch (error) {
        console.error('Dashboard Error:', error);
        res.status(500).render('error', {
            message: 'Error loading dashboard',
            error: process.env.NODE_ENV === 'development' ? error : {}
        });
    }
});

// API endpoint for real-time dashboard stats
router.get('/api/stats', async (req, res) => {
    try {
        const [
            totalRecords,
            uploadStats,
            totalDownloads,
            campaignStats
        ] = await Promise.all([
            MasterData.getTotalRecords(),
            UploadedFiles.getUploadStats(),
            DownloadHistory.getTotalRecordsDownloaded(),
            Campaigns.getCampaignStats()
        ]);

        res.json({
            totalRecords,
            uploadStats,
            totalDownloads,
            campaignStats
        });
    } catch (error) {
        console.error('Dashboard API Error:', error);
        res.status(500).json({
            error: 'Error fetching dashboard statistics'
        });
    }
});

// Get recent activity
router.get('/api/recent-activity', async (req, res) => {
    try {
        const [recentUploads, recentDownloads] = await Promise.all([
            UploadedFiles.getRecentUploads(5),
            DownloadHistory.getRecentDownloads(5)
        ]);

        res.json({
            uploads: recentUploads,
            downloads: recentDownloads
        });
    } catch (error) {
        console.error('Recent Activity Error:', error);
        res.status(500).json({
            error: 'Error fetching recent activity'
        });
    }
});

// Get daily stats for charts
router.get('/api/daily-stats', async (req, res) => {
    try {
        // Get stats for the last 7 days
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 7);

        const [uploads, downloads] = await Promise.all([
            UploadedFiles.getByDateRange(startDate, endDate),
            DownloadHistory.getDownloadsByDateRange(startDate, endDate)
        ]);

        res.json({
            uploads,
            downloads
        });
    } catch (error) {
        console.error('Daily Stats Error:', error);
        res.status(500).json({
            error: 'Error fetching daily statistics'
        });
    }
});

module.exports = router;

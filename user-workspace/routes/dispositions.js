const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { parse } = require('csv-parse');
const fs = require('fs');
const Dispositions = require('../models/Dispositions');
const MasterData = require('../models/MasterData');

// Configure multer for file upload
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = 'uploads/dispositions';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'text/csv') {
            cb(null, true);
        } else {
            cb(new Error('Only CSV files are allowed'));
        }
    }
});

// Render dispositions page
router.get('/', async (req, res) => {
    try {
        const recentDispositions = await Dispositions.getRecentDispositions();
        res.render('dispositions', {
            title: 'Call Dispositions',
            dispositions: recentDispositions
        });
    } catch (error) {
        console.error('Dispositions Page Error:', error);
        res.status(500).render('error', {
            message: 'Error loading dispositions',
            error: process.env.NODE_ENV === 'development' ? error : {}
        });
    }
});

// Upload dispositions CSV
router.post('/upload', upload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    try {
        const records = [];
        const errors = [];
        const parser = fs.createReadStream(req.file.path)
            .pipe(parse({
                columns: true,
                skip_empty_lines: true
            }));

        for await (const record of parser) {
            // Validate required fields
            if (!record.phone_number || !record.disposition_status) {
                errors.push(`Missing required fields for record: ${JSON.stringify(record)}`);
                continue;
            }

            // Verify phone number exists in master data
            const masterRecord = await MasterData.findByPhoneNumber(record.phone_number);
            if (!masterRecord) {
                errors.push(`Phone number not found in master data: ${record.phone_number}`);
                continue;
            }

            records.push({
                phone_number: record.phone_number,
                disposition_status: record.disposition_status,
                disposition_date: record.disposition_date || new Date()
            });
        }

        // Bulk create valid dispositions
        if (records.length > 0) {
            await Dispositions.bulkCreate(records);
        }

        res.json({
            success: true,
            totalProcessed: records.length,
            errors: errors
        });

    } catch (error) {
        console.error('Disposition Upload Error:', error);
        res.status(500).json({
            error: 'Error processing dispositions upload',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    } finally {
        // Clean up uploaded file
        if (req.file) {
            fs.unlink(req.file.path, (err) => {
                if (err) console.error('Error deleting uploaded file:', err);
            });
        }
    }
});

// Get disposition history for a phone number
router.get('/phone/:phoneNumber', async (req, res) => {
    try {
        const dispositions = await Dispositions.findByPhoneNumber(req.params.phoneNumber);
        res.json(dispositions);
    } catch (error) {
        console.error('Phone Disposition History Error:', error);
        res.status(500).json({
            error: 'Error fetching disposition history'
        });
    }
});

// Get disposition statistics
router.get('/stats', async (req, res) => {
    try {
        const stats = await Dispositions.getDispositionStats();
        res.json(stats);
    } catch (error) {
        console.error('Disposition Stats Error:', error);
        res.status(500).json({
            error: 'Error fetching disposition statistics'
        });
    }
});

// Update disposition
router.put('/:id', async (req, res) => {
    const { disposition_status } = req.body;

    if (!disposition_status) {
        return res.status(400).json({ error: 'Disposition status is required' });
    }

    try {
        const updated = await Dispositions.updateDisposition(req.params.id, disposition_status);
        if (!updated) {
            return res.status(404).json({ error: 'Disposition not found' });
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Update Disposition Error:', error);
        res.status(500).json({
            error: 'Error updating disposition'
        });
    }
});

// Delete disposition
router.delete('/:id', async (req, res) => {
    try {
        const deleted = await Dispositions.deleteDisposition(req.params.id);
        if (!deleted) {
            return res.status(404).json({ error: 'Disposition not found' });
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Delete Disposition Error:', error);
        res.status(500).json({
            error: 'Error deleting disposition'
        });
    }
});

// Get daily disposition counts
router.get('/daily-counts', async (req, res) => {
    try {
        const days = parseInt(req.query.days) || 7;
        const counts = await Dispositions.getDailyDispositionCounts(days);
        res.json(counts);
    } catch (error) {
        console.error('Daily Counts Error:', error);
        res.status(500).json({
            error: 'Error fetching daily disposition counts'
        });
    }
});

// Get dispositions by status
router.get('/status/:status', async (req, res) => {
    try {
        const dispositions = await Dispositions.getDispositionsByStatus(req.params.status);
        res.json(dispositions);
    } catch (error) {
        console.error('Dispositions By Status Error:', error);
        res.status(500).json({
            error: 'Error fetching dispositions by status'
        });
    }
});

// Get dispositions by date range
router.get('/date-range', async (req, res) => {
    const { start_date, end_date } = req.query;

    if (!start_date || !end_date) {
        return res.status(400).json({ error: 'Start date and end date are required' });
    }

    try {
        const dispositions = await Dispositions.getDispositionsByDateRange(
            new Date(start_date),
            new Date(end_date)
        );
        res.json(dispositions);
    } catch (error) {
        console.error('Date Range Dispositions Error:', error);
        res.status(500).json({
            error: 'Error fetching dispositions by date range'
        });
    }
});

module.exports = router;

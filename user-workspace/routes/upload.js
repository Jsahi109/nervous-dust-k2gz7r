const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { parse } = require('csv-parse');
const fs = require('fs');
const MasterData = require('../models/MasterData');
const UploadedFiles = require('../models/UploadedFiles');

// Configure multer for file upload
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = 'uploads';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir);
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

// Render upload form
router.get('/', (req, res) => {
    res.render('upload', {
        title: 'Upload Data',
        requiredFields: ['phone_number', 'zip_code', 'vendor_name']
    });
});

// Handle file upload
router.post('/', upload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    try {
        const { vendor_name } = req.body;
        if (!vendor_name) {
            return res.status(400).json({ error: 'Vendor name is required' });
        }

        // Create upload record
        const uploadRecord = await UploadedFiles.create({
            filename: req.file.filename,
            vendor_name,
            total_records: 0,
            duplicate_count: 0,
            status: 'processing'
        });

        // Process the CSV file
        const records = [];
        const duplicates = new Set();
        const parser = fs.createReadStream(req.file.path)
            .pipe(parse({
                columns: true,
                skip_empty_lines: true
            }));

        for await (const record of parser) {
            // Validate required fields
            if (!record.phone_number || !record.zip_code) {
                continue;
            }

            // Check for duplicates
            const existingRecord = await MasterData.findByPhoneNumber(record.phone_number);
            if (existingRecord) {
                duplicates.add(record.phone_number);
                continue;
            }

            records.push({
                ...record,
                vendor_name,
                source_filename: req.file.filename
            });
        }

        // Bulk insert valid records
        if (records.length > 0) {
            await MasterData.bulkCreate(records);
        }

        // Update upload record
        await UploadedFiles.updateStatus(uploadRecord, {
            total_records: records.length,
            duplicate_count: duplicates.size,
            status: 'completed'
        });

        res.json({
            success: true,
            totalRecords: records.length,
            duplicates: duplicates.size,
            uploadId: uploadRecord
        });

    } catch (error) {
        console.error('Upload Error:', error);
        res.status(500).json({
            error: 'Error processing upload',
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

// Get upload history
router.get('/history', async (req, res) => {
    try {
        const uploads = await UploadedFiles.getRecentUploads(100);
        res.json(uploads);
    } catch (error) {
        console.error('Upload History Error:', error);
        res.status(500).json({
            error: 'Error fetching upload history'
        });
    }
});

// Get upload details
router.get('/details/:id', async (req, res) => {
    try {
        const upload = await UploadedFiles.findById(req.params.id);
        if (!upload) {
            return res.status(404).json({ error: 'Upload not found' });
        }
        res.json(upload);
    } catch (error) {
        console.error('Upload Details Error:', error);
        res.status(500).json({
            error: 'Error fetching upload details'
        });
    }
});

// Preview CSV columns
router.post('/preview', upload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    try {
        const parser = fs.createReadStream(req.file.path)
            .pipe(parse({
                columns: true,
                skip_empty_lines: true,
                to: 1 // Read only first row for headers
            }));

        const headers = [];
        for await (const record of parser) {
            headers.push(Object.keys(record));
            break;
        }

        res.json({
            success: true,
            headers: headers[0] || [],
            requiredFields: ['phone_number', 'zip_code', 'vendor_name']
        });

    } catch (error) {
        console.error('Preview Error:', error);
        res.status(500).json({
            error: 'Error previewing file'
        });
    } finally {
        // Clean up uploaded file
        if (req.file) {
            fs.unlink(req.file.path, (err) => {
                if (err) console.error('Error deleting preview file:', err);
            });
        }
    }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const Campaigns = require('../models/Campaigns');
const MasterData = require('../models/MasterData');
const UploadedFiles = require('../models/UploadedFiles');

// Get all campaigns
router.get('/', async (req, res) => {
    try {
        const campaigns = await Campaigns.getAllCampaigns();
        res.render('campaigns', {
            title: 'Campaign Management',
            campaigns: campaigns
        });
    } catch (error) {
        console.error('Campaigns Page Error:', error);
        res.status(500).render('error', {
            message: 'Error loading campaigns',
            error: process.env.NODE_ENV === 'development' ? error : {}
        });
    }
});

// Create new campaign
router.post('/', async (req, res) => {
    const { campaign_name, total_data } = req.body;

    if (!campaign_name) {
        return res.status(400).json({ error: 'Campaign name is required' });
    }

    try {
        // Check if campaign name already exists
        const existingCampaign = await Campaigns.findByName(campaign_name);
        if (existingCampaign) {
            return res.status(400).json({ error: 'Campaign name already exists' });
        }

        // Create new campaign
        const campaignId = await Campaigns.create({
            campaign_name,
            total_data: total_data || 0
        });

        const campaign = await Campaigns.findById(campaignId);
        res.json({
            success: true,
            campaign: campaign
        });

    } catch (error) {
        console.error('Create Campaign Error:', error);
        res.status(500).json({
            error: 'Error creating campaign',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Get campaign details
router.get('/:id', async (req, res) => {
    try {
        const campaign = await Campaigns.findById(req.params.id);
        if (!campaign) {
            return res.status(404).json({ error: 'Campaign not found' });
        }

        // Get campaign progress
        const progress = await Campaigns.getCampaignProgress(req.params.id);

        res.json({
            campaign,
            progress
        });
    } catch (error) {
        console.error('Campaign Details Error:', error);
        res.status(500).json({
            error: 'Error fetching campaign details'
        });
    }
});

// Update campaign
router.put('/:id', async (req, res) => {
    const { campaign_name, total_data, remaining_data } = req.body;

    try {
        const campaign = await Campaigns.findById(req.params.id);
        if (!campaign) {
            return res.status(404).json({ error: 'Campaign not found' });
        }

        // Check if new campaign name already exists
        if (campaign_name && campaign_name !== campaign.campaign_name) {
            const existingCampaign = await Campaigns.findByName(campaign_name);
            if (existingCampaign) {
                return res.status(400).json({ error: 'Campaign name already exists' });
            }
        }

        // Update campaign
        const updated = await Campaigns.updateCampaign(req.params.id, {
            campaign_name,
            total_data,
            remaining_data
        });

        if (!updated) {
            return res.status(400).json({ error: 'No updates provided' });
        }

        const updatedCampaign = await Campaigns.findById(req.params.id);
        res.json({
            success: true,
            campaign: updatedCampaign
        });

    } catch (error) {
        console.error('Update Campaign Error:', error);
        res.status(500).json({
            error: 'Error updating campaign'
        });
    }
});

// Delete campaign
router.delete('/:id', async (req, res) => {
    try {
        const campaign = await Campaigns.findById(req.params.id);
        if (!campaign) {
            return res.status(404).json({ error: 'Campaign not found' });
        }

        await Campaigns.deleteCampaign(req.params.id);
        res.json({ success: true });

    } catch (error) {
        console.error('Delete Campaign Error:', error);
        res.status(500).json({
            error: 'Error deleting campaign'
        });
    }
});

// Get campaign statistics
router.get('/stats/overview', async (req, res) => {
    try {
        const stats = await Campaigns.getCampaignStats();
        res.json(stats);
    } catch (error) {
        console.error('Campaign Stats Error:', error);
        res.status(500).json({
            error: 'Error fetching campaign statistics'
        });
    }
});

// Associate uploaded file with campaign
router.post('/:id/files', async (req, res) => {
    const { file_id } = req.body;

    try {
        const [campaign, file] = await Promise.all([
            Campaigns.findById(req.params.id),
            UploadedFiles.findById(file_id)
        ]);

        if (!campaign) {
            return res.status(404).json({ error: 'Campaign not found' });
        }

        if (!file) {
            return res.status(404).json({ error: 'File not found' });
        }

        // Update campaign total and remaining data
        await Campaigns.updateCampaign(req.params.id, {
            total_data: campaign.total_data + file.total_records,
            remaining_data: campaign.remaining_data + file.total_records
        });

        res.json({ success: true });

    } catch (error) {
        console.error('Associate File Error:', error);
        res.status(500).json({
            error: 'Error associating file with campaign'
        });
    }
});

// Get campaign progress
router.get('/:id/progress', async (req, res) => {
    try {
        const progress = await Campaigns.getCampaignProgress(req.params.id);
        if (!progress) {
            return res.status(404).json({ error: 'Campaign not found' });
        }

        res.json(progress);
    } catch (error) {
        console.error('Campaign Progress Error:', error);
        res.status(500).json({
            error: 'Error fetching campaign progress'
        });
    }
});

module.exports = router;

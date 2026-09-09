const ClassConfig = require('../models/ClassConfig');

// Get all class configurations
exports.getAllConfigs = async (req, res) => {
  try {
    const configs = await ClassConfig.find().sort({ standard: 1, section: 1 });
    res.json(configs);
  } catch (err) {
    console.error('Error fetching class configs:', err);
    res.status(500).json({ error: 'Server error fetching class configurations' });
  }
};

// Create a new class configuration (standard + section)
exports.createConfig = async (req, res) => {
  try {
    const { standard, section, subjects } = req.body;
    
    if (!standard || !section) {
      return res.status(400).json({ error: 'Standard and section are required' });
    }

    // Check if exists
    const existing = await ClassConfig.findOne({ standard, section });
    if (existing) {
      return res.status(400).json({ error: 'Configuration for this class and section already exists' });
    }

    const newConfig = new ClassConfig({
      standard,
      section,
      subjects: subjects || []
    });

    await newConfig.save();
    res.status(201).json(newConfig);
  } catch (err) {
    console.error('Error creating class config:', err);
    res.status(500).json({ error: 'Server error creating configuration' });
  }
};

// Update an existing class configuration (primarily subjects)
exports.updateConfig = async (req, res) => {
  try {
    const { id } = req.params;
    const { subjects } = req.body;

    const config = await ClassConfig.findById(id);
    if (!config) {
      return res.status(404).json({ error: 'Configuration not found' });
    }

    config.subjects = subjects || config.subjects;
    await config.save();
    
    res.json(config);
  } catch (err) {
    console.error('Error updating class config:', err);
    res.status(500).json({ error: 'Server error updating configuration' });
  }
};

// Delete a class configuration
exports.deleteConfig = async (req, res) => {
  try {
    const { id } = req.params;
    const config = await ClassConfig.findByIdAndDelete(id);
    if (!config) {
      return res.status(404).json({ error: 'Configuration not found' });
    }
    res.json({ message: 'Configuration deleted successfully' });
  } catch (err) {
    console.error('Error deleting class config:', err);
    res.status(500).json({ error: 'Server error deleting configuration' });
  }
};

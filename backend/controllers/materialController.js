const Material = require('../models/Material');

// Check authorization
const isAuthorizedForClass = (user, standard, section, requireFullAccess = false) => {
  if (!user) return false;
  if (user.role === 'admin') return true;
  if (user.role === 'teacher' && user.assignedClasses) {
    const classAssignment = user.assignedClasses.find(c => c.standard === standard && c.section === section);
    if (!classAssignment) return false;
    if (requireFullAccess && classAssignment.accessLevel === 'view') return false;
    return true;
  }
  return false;
};

// Add material
const addMaterial = async (req, res) => {
  try {
    const { title, description, subject, standard, section, link } = req.body;

    if (!isAuthorizedForClass(req.dbUser, standard, section, true)) {
      return res.status(403).json({ error: 'Not authorized for full access to this class and section' });
    }

    const newMaterial = new Material({
      title,
      description,
      subject,
      standard,
      section,
      link,
      uploadedBy: req.dbUser.name
    });

    await newMaterial.save();
    res.status(201).json({ success: true, data: newMaterial });
  } catch (error) {
    console.error('Error adding material:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get materials by class
const getMaterialsByClass = async (req, res) => {
  try {
    const { standard, section } = req.query;
    if (!standard || !section) {
      return res.status(400).json({ error: 'Standard and section are required parameters' });
    }

    if (standard !== 'All' && section !== 'All' && !isAuthorizedForClass(req.dbUser, standard, section)) {
      return res.status(403).json({ error: 'Not authorized for this class and section' });
    }

    const query = {};
    if (standard !== 'All') query.standard = standard;
    if (section !== 'All') query.section = section;

    const materials = await Material.find(query).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: materials });
  } catch (error) {
    console.error('Error fetching materials:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update material
const updateMaterial = async (req, res) => {
  try {
    const { materialId } = req.params;
    const { title, description, subject, standard, section, link } = req.body;

    const material = await Material.findById(materialId);
    if (!material) {
      return res.status(404).json({ error: 'Material not found' });
    }

    if (!isAuthorizedForClass(req.dbUser, material.standard, material.section, true)) {
      return res.status(403).json({ error: 'Not authorized to update this material' });
    }

    material.title = title || material.title;
    material.description = description !== undefined ? description : material.description;
    material.subject = subject || material.subject;
    material.standard = standard || material.standard;
    material.section = section || material.section;
    material.link = link || material.link;

    await material.save();
    res.status(200).json({ success: true, data: material });
  } catch (error) {
    console.error('Error updating material:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete material
const deleteMaterial = async (req, res) => {
  try {
    const { materialId } = req.params;

    const material = await Material.findById(materialId);
    if (!material) {
      return res.status(404).json({ error: 'Material not found' });
    }

    if (!isAuthorizedForClass(req.dbUser, material.standard, material.section, true)) {
      return res.status(403).json({ error: 'Not authorized to delete this material' });
    }

    await Material.findByIdAndDelete(materialId);
    res.status(200).json({ success: true, message: 'Material deleted successfully' });
  } catch (error) {
    console.error('Error deleting material:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  addMaterial,
  getMaterialsByClass,
  updateMaterial,
  deleteMaterial
};

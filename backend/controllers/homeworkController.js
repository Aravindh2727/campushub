const Homework = require('../models/Homework');

// Check authorization (using similar logic to studentController)
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

// Add homework
const addHomework = async (req, res) => {
  try {
    const { title, description, subject, standard, section, dueDate, photoUrl, photoUrls, voiceUrl, link } = req.body;

    if (!isAuthorizedForClass(req.dbUser, standard, section, true)) {
      return res.status(403).json({ error: 'Not authorized for full access to this class and section' });
    }

    const newHomework = new Homework({
      title,
      description,
      subject,
      standard,
      section,
      dueDate,
      photoUrl,
      photoUrls,
      voiceUrl,
      link,
      assignedBy: req.dbUser.name
    });

    await newHomework.save();
    res.status(201).json({ success: true, data: newHomework });
  } catch (error) {
    console.error('Error adding homework:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get homework by class
const getHomeworkByClass = async (req, res) => {
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

    const homeworkList = await Homework.find(query).sort({ dueDate: 1 });
    res.status(200).json({ success: true, data: homeworkList });
  } catch (error) {
    console.error('Error fetching homework:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete homework
const deleteHomework = async (req, res) => {
  try {
    const { homeworkId } = req.params;

    const homework = await Homework.findById(homeworkId);
    if (!homework) {
      return res.status(404).json({ error: 'Homework not found' });
    }

    if (!isAuthorizedForClass(req.dbUser, homework.standard, homework.section, true)) {
      return res.status(403).json({ error: 'Not authorized to delete this homework' });
    }

    await Homework.findByIdAndDelete(homeworkId);
    res.status(200).json({ success: true, message: 'Homework deleted successfully' });
  } catch (error) {
    console.error('Error deleting homework:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  addHomework,
  getHomeworkByClass,
  deleteHomework
};

const Unit = require('../models/Unit');

exports.getUnitsBySubject = async (req, res) => {
  try {
    const units = await Unit.find({ subjectSlug: req.params.subjectSlug }).sort({ unitNumber: 1 });
    res.json(units);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getUnitBySlug = async (req, res) => {
  try {
    const { subjectSlug, unitSlug } = req.params;
    const unit = await Unit.findOne({ subjectSlug, slug: unitSlug });
    if (!unit) return res.status(404).json({ message: 'Unit not found' });
    res.json(unit);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

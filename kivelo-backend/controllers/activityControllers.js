import Activity from '../models/Activity.js';

// These are examples of how to USE the Activity model in controllers:

// Get all activities for a user
export const getUserActivities = async (req, res) => {
  try {
    const activities = await Activity.find({ assignedTo: req.user.id });
    res.json({ success: true, activities });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create a new activity
export const createActivity = async (req, res) => {
  try {
    const newActivity = await Activity.create({
      title: req.body.title,
      assignedBy: req.user.id,
      assignedTo: req.body.assignedTo,
      description: req.body.description,
      type: req.body.type,
      points: req.body.points,
      dueDate: req.body.dueDate
    });
    res.status(201).json({ success: true, activity: newActivity });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update an activity
export const updateActivity = async (req, res) => {
  try {
    const updatedActivity = await Activity.findByIdAndUpdate(
      req.params.id, 
      req.body,
      { new: true }
    );
    res.json({ success: true, activity: updatedActivity });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete an activity
export const deleteActivity = async (req, res) => {
  try {
    await Activity.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Activity deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
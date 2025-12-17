// controllers/activityController.js

import Activity from "../models/Activity.js";
import User from "../models/User.js";
import Child from "../models/Child.js";
import Notification from "../models/Notification.js";
import { resolveChildAccess } from "../utils/resolveChildAccess.js";

/* ============================================================
   GET ACTIVITIES FOR USER (Child → assigned, Parent → created)
=============================================================== */
export const getUserActivities = async (req, res) => {
  try {
    const userId = req.user._id;
    const role = req.user.role;

    let activities;

    if (role === "child") {
      const child = await Child.findOne({ user: userId });
      if (!child) {
        return res.status(404).json({
          success: false,
          message: "Child profile not found"
        });
      }

      activities = await Activity.find({ assignedTo: child._id })
        .populate("createdBy", "name email")
        .populate("assignedTo", "name")
        .sort({ createdAt: -1 });

    } else if (role === "parent") {
      activities = await Activity.find({ createdBy: userId })
        .populate("assignedTo", "name")
        .sort({ createdAt: -1 });

    } else {
      return res.status(403).json({
        success: false,
        message: "Access denied"
      });
    }

    return res.json({ success: true, activities });

  } catch (err) {
    console.error("getUserActivities:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};


/* ============================================================
   CREATE ACTIVITY (Parent Only)
=============================================================== */
export const createActivity = async (req, res) => {
  try {
    const parentId = req.user._id;

    if (req.user.role !== "parent") {
      return res.status(403).json({
        success: false,
        message: "Only parents can create activities"
      });
    }

    const {
      title,
      description,
      category,
      points,
      duration,
      assignedTo,
      dueDate,
      difficulty,
      tags
    } = req.body;

    if (!title || !description || !category || !points || !duration || !assignedTo) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields"
      });
    }

    let assignedChildren = Array.isArray(assignedTo) ? assignedTo : [assignedTo];

    /* -----------------------------------------------------------
       VALIDATE + RESOLVE EACH CHILD
    ------------------------------------------------------------ */
    const resolvedChildren = [];

    for (const cid of assignedChildren) {
      const resolved = await resolveChildAccess(parentId, cid);

      if (!resolved) {
        return res.status(403).json({
          success: false,
          message: `Child (${cid}) does not belong to you`
        });
      }

      resolvedChildren.push(resolved); // store resolved for notification use
    }

    /* -----------------------------------------------------------
       CREATE ACTIVITY
    ------------------------------------------------------------ */
    const newActivity = await Activity.create({
      title,
      description,
      category,
      points,
      duration,
      assignedTo: assignedChildren,
      createdBy: parentId,
      dueDate: dueDate ? new Date(dueDate) : null,
      difficulty: difficulty || "medium",
      tags: tags || []
    });

    const populatedActivity = await Activity.findById(newActivity._id)
      .populate("createdBy", "name email")
      .populate("assignedTo", "name");

    /* -----------------------------------------------------------
       SEND NOTIFICATIONS TO CHILDREN
    ------------------------------------------------------------ */

    for (const resolvedChild of resolvedChildren) {
      await Notification.create({
        userId: resolvedChild.userId, // child's User ID (NOT Child ID)
        type: "new_activity",
        title: "New Activity Assigned",
        message: `You have a new activity: "${title}"`,
        data: {
          activityId: newActivity._id,
          points,
          dueDate,
          assignedBy: parentId
        }
      });
    }

    /* -----------------------------------------------------------
       RESPONSE
    ------------------------------------------------------------ */
    return res.status(201).json({
      success: true,
      activity: populatedActivity,
      message: "Activity created successfully and notifications sent"
    });

  } catch (err) {
    console.error("createActivity ERROR:", err);
    console.error("createActivity STACK:", err.stack);
    return res.status(500).json({ 
      success: false, 
      message: err.message || "Server error creating activity",
      error: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
};



/* ============================================================
   UPDATE ACTIVITY
=============================================================== */
export const updateActivity = async (req, res) => {
  try {
    const userId = req.user._id;
    const role = req.user.role;
    const { id } = req.params;

    const activity = await Activity.findById(id);

    if (!activity) {
      return res.status(404).json({
        success: false,
        message: "Activity not found"
      });
    }

    /* ---------------------------
       CHILD UPDATING COMPLETION
    ---------------------------- */
    if (role === "child") {
      const child = await Child.findOne({ user: userId });
      if (!child) return res.status(404).json({ success: false, message: "Child profile not found" });

      const isAssigned = activity.assignedTo.some(
        cid => cid.toString() === child._id.toString()
      );

      if (!isAssigned) {
        return res.status(403).json({
          success: false,
          message: "You are not assigned to this activity"
        });
      }

      const updates = {};

      if (req.body.completed !== undefined) {
        updates.completed = req.body.completed;
        updates.completedAt = req.body.completed ? new Date() : null;
        updates.completedBy = req.body.completed ? child._id : null;

        if (req.body.completed && !activity.completed) {
          const user = await User.findById(userId);
          user.points += activity.points;
          await user.save();
          updates.pointsAwarded = activity.points;
        }
      }

      const updated = await Activity.findByIdAndUpdate(id, updates, {
        new: true
      })
        .populate("createdBy", "name email")
        .populate("assignedTo", "name");

      return res.json({
        success: true,
        activity: updated,
        message: "Activity updated successfully"
      });
    }

    /* ---------------------------
       PARENT UPDATING ACTIVITY
    ---------------------------- */
    if (role === "parent") {

      if (activity.createdBy.toString() !== userId.toString()) {
        return res.status(403).json({
          success: false,
          message: "You can only update activities you created"
        });
      }

      const updateData = { ...req.body };

      // Prevent overwriting completion fields
      delete updateData.completed;
      delete updateData.completedAt;
      delete updateData.completedBy;

      // Validate assigned children
      if (updateData.assignedTo) {
        let assignedChildren = Array.isArray(updateData.assignedTo)
          ? updateData.assignedTo
          : [updateData.assignedTo];

        for (const cid of assignedChildren) {
          const resolved = await resolveChildAccess(userId, cid);
          if (!resolved) {
            return res.status(403).json({
              success: false,
              message: `Child (${cid}) does not belong to you`
            });
          }
        }

        updateData.assignedTo = assignedChildren;
      }

      const updated = await Activity.findByIdAndUpdate(id, updateData, {
        new: true
      })
        .populate("createdBy", "name email")
        .populate("assignedTo", "name");

      return res.json({
        success: true,
        activity: updated,
        message: "Activity updated successfully"
      });
    }

    return res.status(403).json({
      success: false,
      message: "Access denied"
    });

  } catch (err) {
    console.error("updateActivity:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};


/* ============================================================
   DELETE ACTIVITY (Creator Only)
=============================================================== */
export const deleteActivity = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    const activity = await Activity.findById(id);

    if (!activity) {
      return res.status(404).json({
        success: false,
        message: "Activity not found"
      });
    }

    if (activity.createdBy.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "You can only delete activities you created"
      });
    }

    await Activity.findByIdAndDelete(id);

    return res.json({
      success: true,
      message: "Activity deleted successfully"
    });

  } catch (err) {
    console.error("deleteActivity:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};


/* ============================================================
   COMPLETE ACTIVITY (Child)
=============================================================== */
export const completeActivity = async (req, res) => {
  try {
    const userId = req.user._id;

    if (req.user.role !== "child") {
      return res.status(403).json({
        success: false,
        message: "Only children can complete activities"
      });
    }

    const child = await Child.findOne({ user: userId });
    if (!child) {
      return res.status(404).json({
        success: false,
        message: "Child profile not found"
      });
    }

    const activity = await Activity.findById(req.params.id);
    if (!activity) {
      return res.status(404).json({
        success: false,
        message: "Activity not found"
      });
    }

    const isAssigned = activity.assignedTo.some(
      cid => cid.toString() === child._id.toString()
    );

    if (!isAssigned) {
      return res.status(403).json({
        success: false,
        message: "You are not assigned to this activity"
      });
    }

    if (activity.completed) {
      return res.status(400).json({
        success: false,
        message: "Activity already completed"
      });
    }

    activity.completed = true;
    activity.completedBy = child._id;
    activity.completedAt = new Date();
    await activity.save();

    const user = await User.findById(userId);
    user.points += activity.points;
    await user.save();

    const parent = await User.findById(activity.createdBy);

    const populated = await Activity.findById(req.params.id)
      .populate("createdBy", "name")
      .populate("assignedTo", "name");

    return res.json({
      success: true,
      activity: populated,
      pointsEarned: activity.points,
      message: "Activity completed"
    });

  } catch (err) {
    console.error("completeActivity:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

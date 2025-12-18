// controllers/activityController.js

import Activity from "../models/Activity.js";
import User from "../models/User.js";
import Child from "../models/Child.js";
import Parent from "../models/Parent.js";
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


/* ============================================================
   SUBMIT ANSWER/RESPONSE (Child)
=============================================================== */
export const submitActivityAnswer = async (req, res) => {
  try {
    const userId = req.user._id;

    if (req.user.role !== "child") {
      return res.status(403).json({
        success: false,
        message: "Only children can submit activity answers"
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

    // Check if child is assigned
    const isAssigned = activity.assignedTo.some(
      cid => cid.toString() === child._id.toString()
    );

    if (!isAssigned) {
      return res.status(403).json({
        success: false,
        message: "You are not assigned to this activity"
      });
    }

    // Check for existing submission from this child
    const existingSubmission = activity.submissions.find(
      sub => sub.childId.toString() === child._id.toString()
    );

    if (existingSubmission && existingSubmission.status !== 'needs_revision') {
      return res.status(400).json({
        success: false,
        message: "You have already submitted this activity"
      });
    }

    const { answers, textResponse, attachments } = req.body;

    // Process answers and auto-grade if possible
    let processedAnswers = [];
    if (answers && activity.questions.length > 0) {
      processedAnswers = answers.map(ans => {
        const question = activity.questions.id(ans.questionId);
        let isCorrect = null;
        
        if (question && question.correctAnswer) {
          isCorrect = question.correctAnswer.toLowerCase().trim() === 
                      ans.answer.toLowerCase().trim();
        }
        
        return {
          questionId: ans.questionId,
          answer: ans.answer,
          isCorrect
        };
      });
    }

    const submissionData = {
      childId: child._id,
      answers: processedAnswers,
      textResponse: textResponse || '',
      attachments: attachments || [],
      submittedAt: new Date(),
      status: 'pending_review'
    };

    // Update existing or add new submission
    if (existingSubmission) {
      Object.assign(existingSubmission, submissionData);
    } else {
      activity.submissions.push(submissionData);
    }

    // If no questions and no requiresSubmission, auto-complete
    if (!activity.requiresSubmission && activity.questions.length === 0) {
      activity.completed = true;
      activity.completedBy = child._id;
      activity.completedAt = new Date();
      
      // Award points
      const user = await User.findById(userId);
      user.points += activity.points;
      await user.save();
    }

    await activity.save();

    // Get child's user info for notification
    const childUser = await User.findById(userId).select('name avatar');

    // Notify parent of submission
    const parent = await User.findById(activity.createdBy);
    if (parent) {
      await Notification.create({
        userId: parent._id,
        type: "activity_submission",
        title: "New Activity Submission",
        message: `${childUser?.name || child.name || 'Your child'} has submitted "${activity.title}"`,
        data: {
          activityId: activity._id,
          childId: child._id,
          childName: childUser?.name || child.name,
          childAvatar: childUser?.avatar?.url || null,
          submittedAt: new Date()
        }
      });
    }

    const populated = await Activity.findById(req.params.id)
      .populate("createdBy", "name")
      .populate("assignedTo", "name")
      .populate("submissions.childId", "name");

    return res.json({
      success: true,
      activity: populated,
      message: "Submission received! Waiting for parent review."
    });

  } catch (err) {
    console.error("submitActivityAnswer:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};


/* ============================================================
   GET ACTIVITY SUBMISSIONS (Parent)
=============================================================== */
export const getActivitySubmissions = async (req, res) => {
  try {
    const userId = req.user._id;

    if (req.user.role !== "parent") {
      return res.status(403).json({
        success: false,
        message: "Only parents can view submissions"
      });
    }

    const { activityId } = req.params;

    const activity = await Activity.findById(activityId)
      .populate("submissions.childId", "name")
      .populate("assignedTo", "name")
      .populate("createdBy", "name");

    if (!activity) {
      return res.status(404).json({
        success: false,
        message: "Activity not found"
      });
    }

    // Verify parent owns this activity
    if (activity.createdBy._id.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "You can only view submissions for activities you created"
      });
    }

    return res.json({
      success: true,
      activity: {
        _id: activity._id,
        title: activity.title,
        description: activity.description,
        questions: activity.questions,
        points: activity.points
      },
      submissions: activity.submissions
    });

  } catch (err) {
    console.error("getActivitySubmissions:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};


/* ============================================================
   GET ALL CHILDREN SUBMISSIONS (Parent)
=============================================================== */
export const getAllChildrenSubmissions = async (req, res) => {
  try {
    const userId = req.user._id;

    if (req.user.role !== "parent") {
      return res.status(403).json({
        success: false,
        message: "Only parents can view submissions"
      });
    }

    // Get parent's children
    const parent = await Parent.findOne({ user: userId });
    if (!parent) {
      return res.status(404).json({
        success: false,
        message: "Parent profile not found"
      });
    }

    // Find all activities with submissions from parent's children
    const activities = await Activity.find({
      createdBy: userId,
      'submissions.0': { $exists: true } // Has at least one submission
    })
      .populate("submissions.childId", "name")
      .populate("assignedTo", "name")
      .sort({ 'submissions.submittedAt': -1 });

    // Flatten submissions with activity info
    const allSubmissions = [];
    for (const activity of activities) {
      for (const submission of activity.submissions) {
        allSubmissions.push({
          activityId: activity._id,
          activityTitle: activity.title,
          category: activity.category,
          points: activity.points,
          questions: activity.questions,
          submission: submission
        });
      }
    }

    // Sort by submission date
    allSubmissions.sort((a, b) => 
      new Date(b.submission.submittedAt) - new Date(a.submission.submittedAt)
    );

    return res.json({
      success: true,
      submissions: allSubmissions,
      totalCount: allSubmissions.length,
      pendingCount: allSubmissions.filter(s => s.submission.status === 'pending_review').length
    });

  } catch (err) {
    console.error("getAllChildrenSubmissions:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};


/* ============================================================
   REVIEW SUBMISSION (Parent)
=============================================================== */
export const reviewSubmission = async (req, res) => {
  try {
    const userId = req.user._id;

    if (req.user.role !== "parent") {
      return res.status(403).json({
        success: false,
        message: "Only parents can review submissions"
      });
    }

    const { activityId, submissionId } = req.params;
    const { status, feedback, pointsAwarded } = req.body;

    if (!['approved', 'needs_revision'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be 'approved' or 'needs_revision'"
      });
    }

    const activity = await Activity.findById(activityId);
    if (!activity) {
      return res.status(404).json({
        success: false,
        message: "Activity not found"
      });
    }

    // Verify parent owns this activity
    if (activity.createdBy.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "You can only review submissions for activities you created"
      });
    }

    const submission = activity.submissions.id(submissionId);
    if (!submission) {
      return res.status(404).json({
        success: false,
        message: "Submission not found"
      });
    }

    // Update submission
    submission.status = status;
    submission.parentFeedback = feedback || '';
    submission.reviewedAt = new Date();
    submission.reviewedBy = userId;

    // Award points if approved
    if (status === 'approved') {
      const points = pointsAwarded !== undefined ? pointsAwarded : activity.points;
      submission.pointsAwarded = points;

      // Get child's user and award points
      const child = await Child.findById(submission.childId);
      if (child) {
        const childUser = await User.findById(child.user);
        if (childUser) {
          childUser.points += points;
          await childUser.save();

          // Notify child
          await Notification.create({
            userId: child.user,
            type: "submission_reviewed",
            title: status === 'approved' ? "Activity Approved! 🎉" : "Activity Needs Revision",
            message: status === 'approved' 
              ? `Your submission for "${activity.title}" was approved! You earned ${points} points!`
              : `Your submission for "${activity.title}" needs some changes. ${feedback || ''}`,
            data: {
              activityId: activity._id,
              status,
              pointsAwarded: points
            }
          });
        }
      }

      // Mark activity as completed
      activity.completed = true;
      activity.completedBy = submission.childId;
      activity.completedAt = new Date();
    } else {
      // Notify child about revision needed
      const child = await Child.findById(submission.childId);
      if (child) {
        await Notification.create({
          userId: child.user,
          type: "submission_reviewed",
          title: "Activity Needs Revision",
          message: `Please revise your submission for "${activity.title}". ${feedback || ''}`,
          data: {
            activityId: activity._id,
            status
          }
        });
      }
    }

    await activity.save();

    const populated = await Activity.findById(activityId)
      .populate("submissions.childId", "name")
      .populate("assignedTo", "name");

    return res.json({
      success: true,
      activity: populated,
      message: status === 'approved' 
        ? "Submission approved and points awarded!" 
        : "Revision requested"
    });

  } catch (err) {
    console.error("reviewSubmission:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};


/* ============================================================
   GET CHILD'S OWN SUBMISSION (Child)
=============================================================== */
export const getMySubmission = async (req, res) => {
  try {
    const userId = req.user._id;

    if (req.user.role !== "child") {
      return res.status(403).json({
        success: false,
        message: "Only children can view their submissions"
      });
    }

    const child = await Child.findOne({ user: userId });
    if (!child) {
      return res.status(404).json({
        success: false,
        message: "Child profile not found"
      });
    }

    const activity = await Activity.findById(req.params.id)
      .populate("createdBy", "name");

    if (!activity) {
      return res.status(404).json({
        success: false,
        message: "Activity not found"
      });
    }

    const mySubmission = activity.submissions.find(
      sub => sub.childId.toString() === child._id.toString()
    );

    return res.json({
      success: true,
      activity: {
        _id: activity._id,
        title: activity.title,
        description: activity.description,
        questions: activity.questions,
        points: activity.points,
        requiresSubmission: activity.requiresSubmission
      },
      submission: mySubmission || null
    });

  } catch (err) {
    console.error("getMySubmission:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

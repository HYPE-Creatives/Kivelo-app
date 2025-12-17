import mongoose from 'mongoose';

// Schema for individual questions in an activity
const questionSchema = new mongoose.Schema({
  questionText: {
    type: String,
    required: true
  },
  questionType: {
    type: String,
    enum: ['text', 'multiple_choice', 'true_false', 'number'],
    default: 'text'
  },
  options: [String], // For multiple choice questions
  correctAnswer: String, // Optional - for auto-grading
  points: {
    type: Number,
    default: 0
  }
}, { _id: true });

// Schema for child submissions/answers
const submissionSchema = new mongoose.Schema({
  childId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Child',
    required: true
  },
  answers: [{
    questionId: mongoose.Schema.Types.ObjectId,
    answer: String,
    isCorrect: Boolean // Auto-populated if correctAnswer exists
  }],
  textResponse: String, // General text response for non-question activities
  attachments: [String], // URLs for any uploaded files/images
  submittedAt: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['pending_review', 'approved', 'needs_revision'],
    default: 'pending_review'
  },
  parentFeedback: String,
  reviewedAt: Date,
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  pointsAwarded: {
    type: Number,
    default: 0
  }
}, { _id: true });

const activitySchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['education', 'physical', 'creative', 'chores', 'social', 'mindfulness'],
    required: true
  },
  points: {
    type: Number,
    required: true,
    min: 1
  },
  duration: {
    type: Number, // in minutes
    required: true
  },
  assignedTo: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Child'
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  dueDate: Date,
  completed: {
    type: Boolean,
    default: false
  },
  completedAt: Date,
  completedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Child'
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium'
  },
  tags: [String],
  // New fields for questions and submissions
  questions: [questionSchema],
  submissions: [submissionSchema],
  requiresSubmission: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Create compound indexes for common queries
activitySchema.index({ createdBy: 1, completed: 1 });
activitySchema.index({ assignedTo: 1, completed: 1 });
activitySchema.index({ category: 1 });
activitySchema.index({ dueDate: 1 });

export default mongoose.model('Activity', activitySchema);
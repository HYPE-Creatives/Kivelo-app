import Joi from 'joi';
export const requireBodyFields = (...fields) => {
  return (req, res, next) => {
    const missing = fields.filter((f) => !req.body[f]);

    if (missing.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missing.join(", ")}`,
      });
    }

    next();
  };
};

// Update journalSchema to handle both parent and child scenarios
export const journalSchema = Joi.object({
  childId: Joi.string()
    .optional() // Make optional for children
    .description('Child document ID (required for parent, optional for child)'),
  type: Joi.string()
    .valid('text', 'audio', 'video', 'drawing', 'mixed')
    .required(),
  content: Joi.string()
    .required()
    .max(10000),
  assets: Joi.array()
    .items(Joi.string())
    .default([]),
  title: Joi.string()
    .max(200)
    .default('Untitled'),
  mood: Joi.string()
    .valid('happy', 'sad', 'angry', 'excited', 'calm', 'anxious', 'neutral')
    .default('neutral'),
  moodIntensity: Joi.number()
    .min(1)
    .max(10)
    .default(5),
  visibility: Joi.string()
    .valid('private', 'parent-only', 'public')
    .default('parent-only'),
  tags: Joi.array()
    .items(Joi.string())
    .default([]),
  aiAnalysis: Joi.object().default({})
});
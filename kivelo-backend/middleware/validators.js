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

export const journalSchema = Joi.object({
  childId: Joi.string().hex().length(24).required(),
  type: Joi.string().valid('text', 'audio', 'video', 'drawing', 'mixed').default('text'),
  content: Joi.string().min(1).max(5000).required(),
  assets: Joi.array().items(Joi.string().uri()).default([]),
  visibility: Joi.string().valid('private', 'parent-only', 'public').default('private'),
  title: Joi.string().max(100).default('Untitled'),
  mood: Joi.string().valid('happy', 'sad', 'angry', 'anxious', 'excited', 'calm', 'tired', 'neutral').default('neutral'),
  moodIntensity: Joi.number().min(1).max(10).default(5),
  tags: Joi.array().items(Joi.string().max(20)).default([]),
  aiAnalysis: Joi.object({
    summary: Joi.string(),
    keywords: Joi.array().items(Joi.string()),
    sentiment: Joi.string().valid('positive', 'neutral', 'negative'),
    suggestions: Joi.array().items(Joi.string())
  }).optional()
});
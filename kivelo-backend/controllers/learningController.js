import Article from '../models/Article.js';
import User from '../models/User.js';

// Get articles for parent learning platform
export const getLearningArticles = async (req, res) => {
  try {
    const { category, difficulty, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;
    
    const query = { isPublished: true };
    if (category) query.category = category;
    if (difficulty) query.difficultyLevel = difficulty;
    
    const articles = await Article.find(query)
      .sort({ publishedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select('title excerpt category readingTime difficultyLevel featuredImage publishedAt');
    
    const total = await Article.countDocuments(query);
    
    // Get user's completed articles
    const user = await User.findById(req.user._id).select('learningProgress');
    const completedArticleIds = user.learningProgress
      .filter(p => p.completed)
      .map(p => p.articleId.toString());
    
    res.json({
      success: true,
      data: articles.map(article => ({
        ...article.toObject(),
        isCompleted: completedArticleIds.includes(article._id.toString())
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Mark article as completed
export const markArticleComplete = async (req, res) => {
  try {
    const { articleId } = req.params;
    const userId = req.user._id;
    
    const article = await Article.findById(articleId);
    if (!article) {
      return res.status(404).json({
        success: false,
        message: 'Article not found'
      });
    }
    
    const user = await User.findById(userId);
    
    // Check if already completed
    const existingProgress = user.learningProgress.find(
      p => p.articleId.toString() === articleId
    );
    
    if (existingProgress) {
      existingProgress.completed = true;
      existingProgress.completedAt = new Date();
    } else {
      user.learningProgress.push({
        articleId,
        completed: true,
        completedAt: new Date()
      });
    }
    
    await user.save();
    
    res.json({
      success: true,
      message: 'Article marked as completed'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get article with quiz
export const getArticleWithQuiz = async (req, res) => {
  try {
    const { articleId } = req.params;
    
    const article = await Article.findById(articleId)
      .populate('quizzes');
    
    if (!article) {
      return res.status(404).json({
        success: false,
        message: 'Article not found'
      });
    }
    
    res.json({
      success: true,
      data: article
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
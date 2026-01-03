// Quick script to seed analytics data for testing
import connectDB from './config/database.js';
import ApiAnalyticsLog from './models/ApiAnalyticsLog.js';
import dotenv from 'dotenv';

dotenv.config();

async function seedAnalytics() {
  try {
    await connectDB();
    console.log('Connected to database');

    // Clear existing data
    await ApiAnalyticsLog.deleteMany({});
    console.log('Cleared existing analytics data');

    const routes = [
      '/api/v1/auth/login',
      '/api/v1/auth/register',
      '/api/v1/children',
      '/api/v1/mood',
      '/api/v1/gamification/stats',
      '/api/v1/activities',
      '/api/v1/learning/articles'
    ];

    const clients = ['mobile-app', 'admin-dashboard', 'internal-service'];
    const statuses = [200, 201, 204, 400, 401, 404, 500];

    const data = [];
    const now = new Date();

    // Generate 100 sample requests across different dates
    for (let i = 0; i < 100; i++) {
      const daysAgo = Math.floor(Math.random() * 7);
      const hoursAgo = Math.floor(Math.random() * 24);
      const timestamp = new Date(now);
      timestamp.setDate(timestamp.getDate() - daysAgo);
      timestamp.setHours(timestamp.getHours() - hoursAgo);

      data.push({
        route: routes[Math.floor(Math.random() * routes.length)],
        method: ['GET', 'POST', 'PUT', 'DELETE'][Math.floor(Math.random() * 4)],
        clientType: clients[Math.floor(Math.random() * clients.length)],
        apiKey: 'seed-key',
        statusCode: statuses[Math.floor(Math.random() * statuses.length)],
        responseTime: Math.floor(Math.random() * 200) + 10,
        ip: '::1',
        timestamp
      });
    }

    await ApiAnalyticsLog.insertMany(data);
    console.log(`✓ Seeded ${data.length} analytics records`);
    
    // Show summary
    const stats = await ApiAnalyticsLog.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          routes: { $addToSet: '$route' },
          clients: { $addToSet: '$clientType' },
          statuses: { $addToSet: '$statusCode' }
        }
      }
    ]);

    console.log('\nSummary:', JSON.stringify(stats[0], null, 2));
    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err);
    process.exit(1);
  }
}

seedAnalytics();

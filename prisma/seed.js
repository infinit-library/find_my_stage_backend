const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

/**
 * Database Seeder for Find My Stage
 * This script populates the database with sample data for testing
 */

const seedDatabase = async () => {
  try {
    console.log('🌱 Starting database seeding...');

    // Clear existing data (optional - comment out if you want to preserve data)
    // await prisma.paymentHistory.deleteMany();
    // await prisma.userTopic.deleteMany();
    // await prisma.event.deleteMany();
    // await prisma.topic.deleteMany();
    // await prisma.user.deleteMany();

    console.log('✅ Database cleared (if enabled)');

    // Seed Topics
    const topics = await prisma.topic.createMany({
      data: [
        {
          name: 'Technology',
          description: 'Technology and innovation events',
          color: '#3B82F6',
          icon: '💻'
        },
        {
          name: 'Business',
          description: 'Business and entrepreneurship events',
          color: '#10B981',
          icon: '💼'
        },
        {
          name: 'Education',
          description: 'Educational and learning events',
          color: '#F59E0B',
          icon: '📚'
        },
        {
          name: 'Health & Wellness',
          description: 'Health, fitness, and wellness events',
          color: '#EF4444',
          icon: '🏥'
        },
        {
          name: 'Arts & Culture',
          description: 'Arts, culture, and entertainment events',
          color: '#8B5CF6',
          icon: '🎨'
        },
        {
          name: 'Science',
          description: 'Scientific research and discovery events',
          color: '#06B6D4',
          icon: '🔬'
        },
        {
          name: 'Environment',
          description: 'Environmental and sustainability events',
          color: '#059669',
          icon: '🌱'
        },
        {
          name: 'Finance',
          description: 'Financial and investment events',
          color: '#DC2626',
          icon: '💰'
        }
      ],
      skipDuplicates: true
    });
    console.log(`✅ Created topics`);

    // Get created topics for reference
    const createdTopics = await prisma.topic.findMany();

    // Seed Sample Users
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash('Password123!', saltRounds);

    const users = await prisma.user.createMany({
      data: [
        {
          email: 'john.doe@example.com',
          firstName: 'John',
          lastName: 'Doe',
          password: hashedPassword,
          fullName: 'John Doe',
          isEmailVerified: true,
          subscriptionStatus: 'PREMIUM',
          emailNotifications: true,
          pushNotifications: true,
          status: 'active'
        },
        {
          email: 'jane.smith@example.com',
          firstName: 'Jane',
          lastName: 'Smith',
          password: hashedPassword,
          fullName: 'Jane Smith',
          isEmailVerified: true,
          subscriptionStatus: 'BASIC',
          emailNotifications: true,
          pushNotifications: false,
          status: 'active'
        },
        {
          email: 'mike.johnson@example.com',
          firstName: 'Mike',
          lastName: 'Johnson',
          password: hashedPassword,
          fullName: 'Mike Johnson',
          isEmailVerified: true,
          subscriptionStatus: 'FREE',
          emailNotifications: true,
          pushNotifications: true,
          status: 'active'
        },
        {
          email: 'sarah.wilson@example.com',
          firstName: 'Sarah',
          lastName: 'Wilson',
          password: hashedPassword,
          fullName: 'Sarah Wilson',
          isEmailVerified: true,
          subscriptionStatus: 'ENTERPRISE',
          emailNotifications: true,
          pushNotifications: true,
          status: 'active'
        }
      ],
      skipDuplicates: true
    });
    console.log(`✅ Created users`);

    // Get created users for reference
    const createdUsers = await prisma.user.findMany();

    // Seed Sample Events
    const events = await prisma.event.createMany({
      data: [
        {
          title: 'Tech Innovation Summit 2024',
          description: 'Join us for the biggest technology innovation event of the year. Learn from industry leaders, discover cutting-edge technologies, and network with fellow tech enthusiasts. This three-day conference will feature keynote speakers, workshops, and networking sessions.',
          date: new Date('2024-06-15T09:00:00Z'),
          location: 'San Francisco Convention Center',
          status: 'UPCOMING',
          maxParticipants: 500,
          currentParticipants: 0,
          price: 299.99,
          imageUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800',
          topicId: createdTopics.find(t => t.name === 'Technology')?.id,
          userId: createdUsers.find(u => u.email === 'john.doe@example.com')?.id
        },
        {
          title: 'Startup Networking Mixer',
          description: 'Connect with fellow entrepreneurs, investors, and startup enthusiasts. Share ideas, find collaborators, and grow your network in this intimate networking event.',
          date: new Date('2024-05-20T18:00:00Z'),
          location: 'Downtown Business Hub',
          status: 'UPCOMING',
          maxParticipants: 100,
          currentParticipants: 0,
          price: 49.99,
          imageUrl: 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=800',
          topicId: createdTopics.find(t => t.name === 'Business')?.id,
          userId: createdUsers.find(u => u.email === 'jane.smith@example.com')?.id
        },
        {
          title: 'Digital Marketing Workshop',
          description: 'Master the fundamentals of digital marketing. Learn SEO, social media marketing, content strategy, and more in this comprehensive workshop.',
          date: new Date('2024-05-25T10:00:00Z'),
          location: 'Online (Zoom)',
          status: 'UPCOMING',
          maxParticipants: 50,
          currentParticipants: 0,
          price: 99.99,
          imageUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800',
          topicId: createdTopics.find(t => t.name === 'Education')?.id,
          userId: createdUsers.find(u => u.email === 'jane.smith@example.com')?.id
        },
        {
          title: 'Wellness & Mindfulness Retreat',
          description: 'A weekend retreat focused on mental health, wellness, and mindfulness practices. Perfect for professionals looking to reduce stress and improve work-life balance.',
          date: new Date('2024-07-10T08:00:00Z'),
          location: 'Mountain View Resort',
          status: 'UPCOMING',
          maxParticipants: 75,
          currentParticipants: 0,
          price: 199.99,
          imageUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
          topicId: createdTopics.find(t => t.name === 'Health & Wellness')?.id,
          userId: createdUsers.find(u => u.email === 'mike.johnson@example.com')?.id
        },
        {
          title: 'AI & Machine Learning Conference',
          description: 'Explore the latest developments in artificial intelligence and machine learning. Features presentations from leading researchers and industry practitioners.',
          date: new Date('2024-08-20T09:00:00Z'),
          location: 'Tech Conference Center',
          status: 'UPCOMING',
          maxParticipants: 300,
          currentParticipants: 0,
          price: 399.99,
          imageUrl: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800',
          topicId: createdTopics.find(t => t.name === 'Technology')?.id,
          userId: createdUsers.find(u => u.email === 'sarah.wilson@example.com')?.id
        }
      ],
      skipDuplicates: true
    });
    console.log(`✅ Created events`);

    // Seed User-Topic relationships (user preferences)
    const userTopics = await prisma.userTopic.createMany({
      data: [
        {
          userId: createdUsers.find(u => u.email === 'john.doe@example.com')?.id,
          topicId: createdTopics.find(t => t.name === 'Technology')?.id,
          priority: 1
        },
        {
          userId: createdUsers.find(u => u.email === 'john.doe@example.com')?.id,
          topicId: createdTopics.find(t => t.name === 'Business')?.id,
          priority: 2
        },
        {
          userId: createdUsers.find(u => u.email === 'jane.smith@example.com')?.id,
          topicId: createdTopics.find(t => t.name === 'Business')?.id,
          priority: 1
        },
        {
          userId: createdUsers.find(u => u.email === 'jane.smith@example.com')?.id,
          topicId: createdTopics.find(t => t.name === 'Education')?.id,
          priority: 2
        },
        {
          userId: createdUsers.find(u => u.email === 'mike.johnson@example.com')?.id,
          topicId: createdTopics.find(t => t.name === 'Health & Wellness')?.id,
          priority: 1
        },
        {
          userId: createdUsers.find(u => u.email === 'sarah.wilson@example.com')?.id,
          topicId: createdTopics.find(t => t.name === 'Technology')?.id,
          priority: 1
        },
        {
          userId: createdUsers.find(u => u.email === 'sarah.wilson@example.com')?.id,
          topicId: createdTopics.find(t => t.name === 'Science')?.id,
          priority: 2
        }
      ],
      skipDuplicates: true
    });
    console.log(`✅ Created user-topic relationships`);

    // Seed Payment History
    const paymentHistory = await prisma.paymentHistory.createMany({
      data: [
        {
          userId: createdUsers.find(u => u.email === 'john.doe@example.com')?.id,
          paidDate: new Date('2024-01-15'),
          type: 'SUBSCRIPTION',
          amount: 2999, // $29.99 in cents
          status: 'COMPLETED',
          currency: 'USD',
          stripePaymentIntentId: 'pi_test_123456789',
          stripeCustomerId: 'cus_test_123456789'
        },
        {
          userId: createdUsers.find(u => u.email === 'jane.smith@example.com')?.id,
          paidDate: new Date('2024-01-20'),
          type: 'SUBSCRIPTION',
          amount: 999, // $9.99 in cents
          status: 'COMPLETED',
          currency: 'USD',
          stripePaymentIntentId: 'pi_test_987654321',
          stripeCustomerId: 'cus_test_987654321'
        },
        {
          userId: createdUsers.find(u => u.email === 'sarah.wilson@example.com')?.id,
          paidDate: new Date('2024-01-10'),
          type: 'SUBSCRIPTION',
          amount: 9999, // $99.99 in cents
          status: 'COMPLETED',
          currency: 'USD',
          stripePaymentIntentId: 'pi_test_456789123',
          stripeCustomerId: 'cus_test_456789123'
        }
      ],
      skipDuplicates: true
    });
    console.log(`✅ Created payment history`);

    console.log('🎉 Database seeding completed successfully!');
    
    // Print summary
    const userCount = await prisma.user.count();
    const topicCount = await prisma.topic.count();
    const eventCount = await prisma.event.count();
    const userTopicCount = await prisma.userTopic.count();
    const paymentCount = await prisma.paymentHistory.count();

    console.log('\n📊 Database Summary:');
    console.log(`   Users: ${userCount}`);
    console.log(`   Topics: ${topicCount}`);
    console.log(`   Events: ${eventCount}`);
    console.log(`   User-Topic Relationships: ${userTopicCount}`);
    console.log(`   Payment Records: ${paymentCount}`);

    console.log('\n🔑 Test Accounts:');
    console.log('   Email: john.doe@example.com, Password: Password123!');
    console.log('   Email: jane.smith@example.com, Password: Password123!');
    console.log('   Email: mike.johnson@example.com, Password: Password123!');
    console.log('   Email: sarah.wilson@example.com, Password: Password123!');

  } catch (error) {
    console.error('❌ Database seeding failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
};

// Run seeder if called directly
if (require.main === module) {
  seedDatabase()
    .then(() => {
      console.log('✅ Seeding completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Seeding failed:', error);
      process.exit(1);
    });
}

module.exports = { seedDatabase };

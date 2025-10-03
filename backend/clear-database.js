const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const clearDatabase = async () => {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('✅ Connected to MongoDB');

    // Get all collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    
    console.log(`📊 Found ${collections.length} collections:`);
    collections.forEach(collection => {
      console.log(`   - ${collection.name}`);
    });

    if (collections.length === 0) {
      console.log('📭 Database is already empty');
      process.exit(0);
    }

    // Drop all collections
    console.log('\n🗑️  Dropping all collections...');
    for (const collection of collections) {
      await mongoose.connection.db.dropCollection(collection.name);
      console.log(`   ✅ Dropped collection: ${collection.name}`);
    }

    console.log('\n🎉 All data has been successfully deleted from the database!');
    console.log('💡 You can now test your Google OAuth implementation with a clean slate.');

  } catch (error) {
    console.error('❌ Error clearing database:', error.message);
    
    if (error.message.includes('ECONNREFUSED')) {
      console.log('\n💡 Make sure MongoDB is running:');
      console.log('   - Start MongoDB service');
      console.log('   - Or run: mongod');
    }
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
    process.exit(0);
  }
};

// Show warning and confirmation
console.log('⚠️  WARNING: This will delete ALL data from your database!');
console.log(`📍 Target database: ${process.env.MONGO_URI || 'mongodb://localhost:27017/contentflow-fyp'}`);
console.log('\n🤔 Are you sure you want to continue?');
console.log('   This action cannot be undone!');

// Add a small delay for the user to read the warning
setTimeout(() => {
  console.log('\n⏳ Starting database cleanup in 3 seconds...');
  console.log('   Press Ctrl+C to cancel');
  
  setTimeout(() => {
    clearDatabase();
  }, 3000);
}, 2000);
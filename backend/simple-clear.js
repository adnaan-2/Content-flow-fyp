// Simple script to connect to MongoDB and clear users
const { MongoClient } = require('mongodb');
require('dotenv').config();

const clearUsers = async () => {
  const client = new MongoClient(process.env.MONGO_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db('contentflow-fyp');
    const usersCollection = db.collection('users');
    
    // Delete the specific user
    const email = 'asifmehsood2233@gmail.com';
    const deleteResult = await usersCollection.deleteOne({ email: email });
    
    console.log(`Deleted ${deleteResult.deletedCount} user(s) with email: ${email}`);
    
    // Show remaining users
    const remainingUsers = await usersCollection.find({}).toArray();
    console.log(`Remaining users in database: ${remainingUsers.length}`);
    
    if (remainingUsers.length > 0) {
      remainingUsers.forEach(user => {
        console.log(`- ${user.name} (${user.email})`);
      });
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
};

clearUsers();
const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected for cleanup');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// User model
const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  profilePicture: { type: String, default: 'default-avatar.png' },
  profilePhoto: { type: String, default: null },
  profilePhotoPublicId: { type: String, default: null },
  isVerified: { type: Boolean, default: false },
  verificationCode: { type: String, default: null },
  verificationCodeExpires: { type: Date, default: null },
  lastLogin: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

const clearUser = async () => {
  await connectDB();
  
  try {
    // Clear the specific user
    const email = 'asifmehsood2233@gmail.com';
    const result = await User.deleteOne({ email: email });
    
    if (result.deletedCount > 0) {
      console.log(`✅ User with email ${email} has been deleted`);
    } else {
      console.log(`❌ No user found with email ${email}`);
    }
    
    // Show all users in the database
    const allUsers = await User.find({}, 'name email isVerified');
    console.log('\n📋 All users in database:');
    if (allUsers.length === 0) {
      console.log('No users found');
    } else {
      allUsers.forEach(user => {
        console.log(`- ${user.name} (${user.email}) - Verified: ${user.isVerified}`);
      });
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
};

clearUser();
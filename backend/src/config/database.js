const mongoose = require('mongoose');

// MongoDB-tilkobling - lytt kun på intern IP
const connectDatabase = async () => {
  try {
    await mongoose.connect(`mongodb://10.12.91.66:27017/vits-generator`, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Koblet til MongoDB');
  } catch (err) {
    console.error('❌ MongoDB tilkoblingsfeil:', err);
    process.exit(1);
  }
};

module.exports = { connectDatabase }; 
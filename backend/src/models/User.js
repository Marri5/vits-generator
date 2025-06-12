const mongoose = require('mongoose');

// Database schema for bruker-tracking
const userSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  ratedJokes: [{
    jokeId: Number,
    rating: Number,
    timestamp: { type: Date, default: Date.now }
  }],
  totalRatings: { type: Number, default: 0 },
  averageGivenRating: { type: Number, default: 0 }
}, {
  timestamps: true
});

// Indeks for raskere søk
userSchema.index({ userId: 1 });
userSchema.index({ username: 1 });

module.exports = mongoose.model('User', userSchema); 
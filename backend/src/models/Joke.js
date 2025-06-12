const mongoose = require('mongoose');

// Database schema for vits-vurderinger
const vitsSchema = new mongoose.Schema({
  jokeId: { type: Number, required: true, unique: true },
  type: String,
  setup: { type: String, required: true },
  punchline: { type: String, required: true },
  ratings: [{
    userId: { type: String, required: true },
    rating: { type: Number, min: 1, max: 5, required: true },
    timestamp: { type: Date, default: Date.now }
  }],
  averageRating: { type: Number, default: 0 },
  totalRatings: { type: Number, default: 0 }
}, { 
  timestamps: true 
});

// Indekser for raskere søk
vitsSchema.index({ jokeId: 1 });
vitsSchema.index({ averageRating: -1 });

module.exports = mongoose.model('Vits', vitsSchema); 
const mongoose = require('mongoose');
const parkingSchema = new mongoose.Schema({
    time: String,
    carNumber: String,
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  });
  
  const Parking = mongoose.model('Parking', parkingSchema);
  module.exports = Parking

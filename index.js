// Import the Express.js module
const express = require('express');
const User = require('./Model/user');
const bodyParser = require('body-parser');
const QRCode = require('qrcode');
const Parking = require('./Model/payment');
const Razorpay = require('razorpay');
var instance = new Razorpay({ key_id: 'rzp_test_mSEHCojzJFuuF0', key_secret: 'dLCAwhEeRENFpKaleJ64dnHx'})

var cors = require('cors');
require('./DB/mongos')
// Create an Express application
const app = express();
app.use(cors());

// Define a route
app.get('/', (req, res) => {
  res.send('Hello, Express!');
});
app.use(bodyParser.json());

// Create a new user
app.post('/api/register', async (req, res) => {
  try {
    const { name, email, phoneNumber } = req.body;

    // Create a new user document
    const user = new User({ name, email, phoneNumber });

    // Save the user to the database
    await user.save();

    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});
    

// create a parking payment 
app.post('/api/parking-payment', async (req, res) => {
    try {
      console.log(req.body);
      const { time, carNumber, name, email, phoneNumber } = req.body;

  
      // Check if the user with the given userId exists
      let user = await User.findOne({email});
  
      // If the user doesn't exist, create a new user
      if (!user) {
        const { name, email, phoneNumber } = req.body;
        user = new User({ name, email, phoneNumber });
        await user.save();
      }
  
      // Create a new parking payment document
      var user_id = user._id
      const parkingPayment = new Parking({ time, carNumber, user_id });
  
      // Save the parking payment to the database
      await parkingPayment.save();
  
      // Generate a QR code from the parking payment data
      const qrCodeData = JSON.stringify({
        parkingPaymentId: parkingPayment._id,
        time: parkingPayment.time,
        carNumber: parkingPayment.carNumber,
        user
      });
  
      const qrCodeBuffer = await QRCode.toBuffer(qrCodeData);
  
      // Respond with the QR code image and other details
      res.status(201).json({
        message: 'Parking payment successful',
        qrCode: "data:image/png;base64,"+qrCodeBuffer.toString('base64'),
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  });


  // Get parking payment data by parkingPaymentId
  app.get('/api/parking-payment/:parkingPaymentId', async (req, res) => {
    try {
      const { parkingPaymentId } = req.params;
  
      // Find the parking payment by its ID
      const parkingPayment = await Parking.findById(parkingPaymentId).populate('user');
  
      if (!parkingPayment) {
        return res.status(404).json({ message: 'Parking payment not found' });
      }
  
      res.json(parkingPayment);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  // Get user data by userId
app.get('/api/user/:userId', async (req, res) => {
    try {
      const { userId } = req.params;
  
      // Find the user by their ID
      const user = await User.findById(userId);
  
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
  
      res.json(user);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  app.post('/api/create/order', async (req, res) => {
    var options=req.body;

        // var options = {
        //     amount: 5*1000,  // amount in the smallest currency unit
        //     currency: "INR",
        //     receipt: "order_rcptid_11"
        //   };
        instance.orders.create(options, function(err, order) {
            if(err){
                console.log(err);
                res.status(404).send({ "message": "Order Creation Failed",err });
            }
            console.log(order);
            res.status(200).send({ "message": "Order Created.", order });
          });
    
  });

// Start the server
const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});


// Import the Express.js module
const express = require('express');
const User = require('./Model/user');
const bodyParser = require('body-parser');
const QRCode = require('qrcode');
const Parking = require('./Model/payment');
const Razorpay = require('razorpay');
const {sendEmail}=require('./mailer');
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
      var imageData = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAQQAAAEECAYAAADOCEoKAAAAAklEQVR4AewaftIAABBfSURBVO3BQY7c2JIAQXei7n9ln1pwEasHEMyU9HvCzH6x1lq/LtZa63ax1lq3i7XWul2stdbtYq21bhdrrXW7WGut28Vaa90u1lrrdrHWWreLtda6Xay11u1irbVuF2utdbtYa63bDy+p/EkVJyonFScqU8Wk8kTFicpU8YbKVDGpfFLFJ6m8UTGpTBVPqJxUnKj8SRVvXKy11u1irbVuF2utdfvhwyo+SeWNiicqTipOVCaVqeJEZap4Q+Wk4pNUpopJ5aTiCZWTiknlpGKqmFTeqPgklU+6WGut28Vaa90u1lrr9sOXqTxR8YTKVPGEyp+k8oTKExVPqLxRMVU8UXGi8oTKScWkcqLyTSpPVHzTxVpr3S7WWut2sdZatx/+n1F5omJSmSomlaliUjmpmFROKk5UTiomlaniCZWTikllqnii4kRlUpkqJpWpYlL5L7tYa63bxVpr3S7WWuv2w3+MyknFpDJVTCpvqDyhclIxqUwVT6icqJxUvFFxUjGpTCpTxRsV/59drLXW7WKttW4Xa611++HLKv6miknlmyomlaliUjmpOKl4ouIJlanipOIJlaliUjmpmFSmiknlROWk4pMq/iUXa611u1hrrdvFWmvdfvgwlb+pYlKZKiaVJyomlanijYpJZaqYVKaKJ1SmiidUpopJZap4o2JSmSomlaliUpkqJpUTlaniROVfdrHWWreLtda6Xay11u1irbVuF2utdbtYa63bDy+p/EkVU8Wk8kkqJxUnKicVk8obFZPKicpUcaIyVUwqU8WkclIxqZxUnKicVJyovKEyVZyoPFHxSRdrrXW7WGut28Vaa91++LCKT1I5UZkqJpVJZaqYVKaKSWVSmSomlaliUpkqnlB5o+KJiknlmypOVKaKE5UnKk4qnlB5omJSOal4omJSmVSmim9SmSreqPikiv8lF2utdbtYa63bxVpr3X54qWJSmSqeUJkqJpU3VKaKSWWqmFSmikllqjhRmSpOKiaVk4o3VE5UpopJ5W9SmSomlZOKJ1SmiknlpGJSOVGZKt64WGut28Vaa90u1lrr9sOXqbyhMlWcqJxUTConKlPFpDJVTCpvqDxRMam8UTGpTBWTylQxqZxUTCpPqJyo/E0VT1RMKlPFJ12stdbtYq21bhdrrXX74S+rmFSmijdU3qh4QmWqmFSmiknlpGJSmVSmiidUJpWpYlKZKt5QOamYVKaKSeWk4gmVT1L5l1ystdbtYq21bhdrrXWzX7yg8kbFicoTFZPKGxWTyknFEypTxaQyVUwqb1R8kspUcaIyVbyh8kbFicpUMalMFZPKVDGpnFR808Vaa90u1lrrdrHWWrcfPqxiUnlCZao4UTmpmFROKiaVk4onVKaKSWWqmFSmiknlpOJEZao4UXlC5QmVJyomlaliUplUpoqpYlI5UTlReULlpOKNi7XWul2stdbtYq21bvaLf4jKScWkclIxqUwVk8oTFZ+kMlW8oXJS8U0qU8WkclJxovJGxaTyJ1U8oTJVfNLFWmvdLtZa63ax1lq3H/4ylZOKk4onKiaVk4oTlZOKE5UnVKaKSeUNlZOKSeWNiknlkyomlUnlpGJSOak4UZlUpopJZar4pou11rpdrLXW7WKttW72iw9SOal4QuWJikllqjhROamYVD6pYlKZKiaVqeJEZap4QmWqmFSeqDhROan4l6mcVEwqJxWTylTxxsVaa90u1lrrdrHWWrcfPqxiUnlCZao4UTmpmFROKiaVk4onVKaKSWWqeONirbVuF2utdbtYa62b/eIFlZOKSeVvqjhROamYVKaKE5UnKp5QeaLiROWk4gmVT6qYVKaKSWWqOFE5qThRmSomlanijYu11rpdrLXW7WKttW72i3+YylTxTSpvVJyoTBVPqEwVJyqfVDGpPFExqUwVk8obFZPKVHGiMlV80sVaa90u1lrrdrHWWjf7xVpr/bpYa63bxVpr3S7WWut2sdZat4u11rpdrLXW7WKttW4/fJnKScWkMlU8oTJVnKicVHySylRxUnFS8YbKVPE3qUwVk8oTFZPKVHFSMalMFScqJxWTyqTyJ12stdbtYq21bhdrrXX74aWKb1KZKt5QmSomlUnlpGJSmSomlZOKE5U3Kp5Q+aaKE5Wp4qTik1ROVE4qJpWTir/pYq21bhdrrXW7WGutm/3iD1J5omJSOamYVJ6omFTeqHhCZao4UTmpmFSmiknlpGJSOan4JJUnKk5UTiomlaliUjmpmFROKk5UTipOVL5JZar4pIu11rpdrLXW7WKttW72ixdUPqniCZVPqnhC5ZMqJpUnKt5QeaLiROWk4gmVT6qYVKaKSWWqOFE5qThRmSomlanijYu11rpdrLXW7WKttW72i3+MpWpYqqYVE5UTiqmiknlDZWpYqqYVE4qJpWTikllqphUJpUnVKaKJ1ROVE4q3lA5qZhUpopJ5aTiCZWpYlKZKt64WGut28Vaa90u1lrrZr/4h6icVJyonFRMKicVJyonFScqU8WkclLxhsobFZPKVHGiMlVMKlPFpHJS8YTKScUTKk9UnKhMFZ90sdZat4u11rpdrLXWzX7xgsoTFZPKVPFNKlPFpPJGxYnKVDGpnFRMKlPFn6QyVZyo/E0Vk8pUMalMFZPKGxUnKlPFpDJVvHGx1lq3i7XWul2stdbNfvFBKicVk8pUMamcVEwq31QxqUwVk8oTFU+onFScqJxUPKFyUvFJKlPFGypTxaTyRMWkclJxonJS8cbFWmvdLtZa63ax1lq3H15SeaPipGJSOak4UZkqJpVJZaqYVKaKSWVSmSomlaliUpkqnlB5o+KJiknlmypOVKaKE5UnKk4qnlB5omJSOal4omJSmVSmim9SmSreqPikiv8lF2utdbtYa63bxVpr3X54qWJSmSqeUJkqJpU3VKaKSWWqmFSmikllqjhRmSpOKiaVk4o3VE5UpopJ5W9SmSomlZOKJ1SmiknlpGJSOVGZKt64WGut28Vaa90u1lrr9sOXqbyhMlWcqJxUTConKlPFpDJVTCpvqDxRMam8UTGpTBWTylQxqZxUTCpPqJyo/E0VT1RMKlPFJ12stdbtYq21bhdrrXX74S+rmFSmijdU3qh4QmWqmFSmiknlpGJSmVSmiidUJpWpYlKZKt5QOamYVKaKSeWk4gmVT1L5l1ystdbtYq21bhdrrXWzX7ygMlVMKlPFpDJVPKEyVUwqJxWTyknFpHJSMamcVDyhMlVMKk9UPKFyUjGpPFExqbxRMalMFScqJxWTyknFpMlVMKicVJyonFZPKGyqfVPFNF2utdbtYa63bxVpr3X74soonVD5JZap4omJSeUJlqjhROamYVCaVE5U3VKaKJyomlaliUjmpmFROKk5UTipOVL5JZar4pIu11rpdrLXW7WKttW72iw9SOal4QuWJikllqjhROamYVD6pYlKZKiaVqeJEZap4QmWqmFSeqDhROan4l6mcVEwqJxWTylTxxsVaa90u1lrrdrHWWrcfPqxiUnlCZao4UTmpmFROKiaVk4onVKaKSWWqeONirbVuF2utdbtYa62b/eIFlZOKSeVvqjhROamYVKaKE5UnKp5QeaLiROWk4gmVT6qYVKaKSWWqOFE5qThRmSomlanijYu11rpdrLXW7WKttW72i3+YylTxTSpvVJyoTBVPqEwVJyqfVDGpPFExqUwVk8obFZPKVHGiMlV80sVaa90u1lrrdrHWWjf7xVpr/bpYa63bxVpr3S7WWut2sdZat4u11rpdrLXW7WKttW4Xa611u1hrrdvFWmvdLtZa63ax1lq3i7XWul2stdbtYq21bv8HZzp/d+3l46MAAAAASUVORK5CYII=';

// Create the email content
const emailContent = `
   <h1>Welcome to Our Service</h1>
   <p>Here's your QR code:</p>
   <img src="${imageData}" alt="QR Code" />
`;
      // const _qrCodeData=qrCodeBuffer.toString('base64');
      // const content=`<!DOCTYPE html>
      // <html>
      // <body>
      //     <h1>Welcome to EasyPark</h1>
      //     <p>We provide parking in an easy and quick way near you.</p>
      //     <p>User Data:</p>
      //     <ul>
      //         <li><strong>Name:</strong> ${name}</li>
      //         <li><strong>Email:</strong> ${email}</li>
      //         <li><strong>Phone Number:</strong> ${phoneNumber}</li>
      //         <li><strong>Car Number:</strong> ${carNumber}</li>
      //     </ul>
      //     <a href="data:image/png;base64,${_qrCodeData}" alt="QR Code">Open Qr</a>
      // </body>
      // </html>
      // `;
      // Base64 encoded image data
      

      sendEmail(email,"Payment successful",emailContent);
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

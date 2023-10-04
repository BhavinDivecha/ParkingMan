const nodemailer = require('nodemailer');

// Create a transporter object using SMTP settings
const transporter = nodemailer.createTransport({
    service: 'gmail',
    host: 'smtp.gmail.com',
  port: 465,
//   auth: {
//     user: "support@venkykrishnan.com",
//     pass: "pYmw2bW0Tf8b",
//   },
  // service: 'Gmail',
  auth: {
    user: 'bhavin.divecha09@gmail.com',
    pass: 'gvcvozhoswuodgdn',
  },
});

// Prepare email message
const sendEmail = (to, subject, text) => {
  const mailOptions = {
    from: 'bhavin.divecha09@gmail.com',
    to,
    subject,
    html:text,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error('Error sending email:', error);
    } else {
      console.log('Email sent:', info.response);
    }
  });
};

module.exports = {
  sendEmail,
};

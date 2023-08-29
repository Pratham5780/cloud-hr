require("dotenv").config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const app = express();
const multer = require('multer');
const fs = require('fs');
const ejs = require('ejs');
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded data
app.use(express.json()); // Parse JSON data
const nodemailer = require('nodemailer');
const uri = "mongodb+srv://khandelwalg578:37msOV8muzJQskOt@cluster0.kkkhy.mongodb.net/?retryWrites=true&w=majority";


// Connect to MongoDB
mongoose.connect(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const db = mongoose.connection;

db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
  console.log('Connected to MongoDB');
});

// Create a schema for the job application
const jobApplicationSchema = new mongoose.Schema({
  email: String,
  name: String,
  date: Date,
  position: String,
  address: String,
  contact: String,
  joining: Date,
  ending: Date,
  duration: String,
  resume: String,
});

const JobApplication = mongoose.model('JobApplication', jobApplicationSchema);

// Handle form submission
app.post('/submit', async (req, res) => {
  try {
    const newApplication = new JobApplication({
      email: req.body.email,
      name: req.body.name,
      date: req.body.date,
      position: req.body.position === 'Other' ? req.body.customPosition : req.body.position,
      address: req.body.address,
      contact: req.body.contact,
      joining: req.body.joining,
      ending: req.body.ending,
      duration: req.body.duration,
      resume: req.body.resumePath,
    });

    await newApplication.save();
    res.status(201).json({ message: 'Application submitted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred' });
  }
});


const PORT = process.env.PORT || 3333;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

//Existing routes
app.get('/display', async (req, res) => {
    try {
      const applications = await JobApplication.find(); // Fetch all applications
      res.render('display.ejs', { applications });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'An error occurred' });
    }
});


  app.set('view engine', 'ejs');
  app.set('views', path.join(__dirname, 'views'));

  const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
      user: 'khandelwalg578@gmail.com',
      pass: 'kxcelkcylgijpste',
    },
  });
//SENDING OFFER LETTER
const pdf = require('html-pdf'); // Require the html-pdf library

app.post('/send-offer-letter', async (req, res) => {
  try {
    const recipientEmail = req.body.email;

    const transporter = nodemailer.createTransport({
      service: 'Gmail', // Use your email service provider here
      auth: {
        user: 'khandelwalg578@gmail.com',
      pass: 'kxcelkcylgijpste', // Your email password
      },
    });

    const application = await JobApplication.findOne({ email: recipientEmail });
    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }

    // Render the EJS template with dynamic values
    const ejsTemplate = fs.readFileSync('./views/index2.ejs', 'utf-8');
    const renderedHtml = ejs.render(ejsTemplate, {
      internName: application.name,
      internRole: application.position,
    });

    // Generate PDF from rendered HTML
    const pdfOptions = { format: 'A4' };
    const pdfBuffer = await new Promise((resolve, reject) => {
      pdf.create(renderedHtml, pdfOptions).toBuffer((err, buffer) => {
        if (err) {
          reject(err);
        } else {
          resolve(buffer);
        }
      });
    });

    const mailOptions = {
      from: 'your_email@example.com',
      to: recipientEmail,
      subject: 'Offer Letter',
      text: 'Congratulations! Here is your offer letter.',
      attachments: [
        {
          filename: 'OfferLetter.pdf',
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
      ],
    };

    // Send the email
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error(error);
        res.status(500).json({ error: 'An error occurred while sending the email' });
      } else {
        console.log('Email sent:', info.response);
        res.status(200).json({ message: 'Offer letter sent successfully' });
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred' });
  }
});

app.get('/view-offer-letter/:id', async (req, res) => {
  try {
      const application = await JobApplication.findById(req.params.id);
      if (!application) {
          return res.status(404).json({ error: 'Application not found' });
      }

      res.render('index2.ejs', { internName: application.name, internRole: application.position });
  } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'An error occurred' });
  }
});

// Add this route at the end of your server.js file
app.use((error, req, res, next) => {
  console.error(error.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

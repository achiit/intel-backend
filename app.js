const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const VoiceResponse = require('twilio').twiml.VoiceResponse;
const { Sequelize } = require("sequelize");
const app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json()); // Parse JSON bodies
app.use(cors());
// Create PostgreSQL connection pool


const port = process.env.PORT || 3000;
app.use(express.json());

const sequelize = new Sequelize('postgres://root:WDGvRSZ2krtrJZdMc8GIUjm9UV1wPOP1@dpg-cll4b0cjtl8s73f7f13g-a.oregon-postgres.render.com/calllist', {

  dialect: "postgres",
  logging: false,
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false,
    },
  },
});

sequelize
  .sync()
  .then(() => {
    console.log("Database connected");
  })
  .catch((err) => {
    console.log(err);
    console.log("Unable to connect to database");
  });


// Function to handle Twilio call
function handleTwilioCall(req, res) {
  const twiml = new VoiceResponse();

  twiml.say('Welcome to our customer care. Please provide your name, orderId, and the issue you are facing.');

  // Handle user input using Gather
  twiml.gather({
    input: 'speech',
    timeout: 3,
    action: '/handle-response',
    method: 'POST',
  });

  res.type('text/xml');
  res.send(twiml.toString());
}

// Function to handle JSON data
function handleJsonData(req, res) {
  const isTwilioRequest = req.body.hasOwnProperty('SpeechResult'); // Check if it's a Twilio request

  if (isTwilioRequest) {
    // Handle Twilio request
    const { SpeechResult } = req.body;
    const name = SpeechResult;
    const orderId = '12345'; // Extract orderId from user input
    const issue = 'Delivery Issue'; // Extract issue from user input

    // Perform NLP and ML analysis here to determine priority

    // Simulate urgency check
    const isUrgent = true; // Replace with your urgency determination logic

    if (isUrgent) {
      // Insert data into PostgreSQL
      const CustomerCare = sequelize.define('customer_care', {
        name: Sequelize.STRING,
        order_id: Sequelize.STRING,
        issue: Sequelize.STRING,
      });
      CustomerCare.sync()
        .then(() => {
          console.log('CustomerCare table created (if not existed)');
        })
        .catch((error) => {
          console.error('Error creating CustomerCare table:', error);
        });
      CustomerCare.create({ name, order_id: orderId, issue })
        .then((result) => {
          console.log('Data inserted into PostgreSQL');
          res.status(200).json({ message: 'Data inserted successfully' });
        })
        .catch((err) => {
          console.error('Error inserting data into PostgreSQL: ', err);
          res.status(500).json({ error: 'Internal Server Error' });
        });

    } else {
      res.status(200).json({ message: 'Data processed successfully' });
    }
  } else {
    // Handle direct JSON input
    const { name, orderId, issue } = req.body;

    // Insert data into PostgreSQL
    const CustomerCare = sequelize.define('customer_care', {
      name: Sequelize.STRING,
      order_id: Sequelize.STRING,
      issue: Sequelize.STRING,
    });
    CustomerCare.sync()
      .then(() => {
        console.log('CustomerCare table created (if not existed)');
      })
      .catch((error) => {
        console.error('Error creating CustomerCare table:', error);
      });
    CustomerCare.create({ name, order_id: orderId, issue })
      .then((result) => {
        console.log('Data inserted into PostgreSQL');
        res.status(200).json({ message: 'Data inserted successfully' });
      })
      .catch((err) => {
        console.error('Error inserting data into PostgreSQL: ', err);
        res.status(500).json({ error: 'Internal Server Error' });
      });
  }
}
function getAllData(req, res) {
  const CustomerCare = sequelize.define('customer_care', {
    name: Sequelize.STRING,
    order_id: Sequelize.STRING,
    issue: Sequelize.STRING,
  });

  CustomerCare.findAll()
    .then((data) => {
      res.status(200).json(data);
    })
    .catch((err) => {
      console.error('Error retrieving data from PostgreSQL: ', err);
      res.status(500).json({ error: 'Internal Server Error' });
    });
}

app.post('/voice', handleTwilioCall);
app.post('/handle-response', handleJsonData);
app.get('/get-all-data', getAllData);

app.listen(3000, '0.0.0.0', () => {
  console.log('Server is running on port 3000');
});


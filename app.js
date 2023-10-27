const mysql = require('mysql');
const express = require('express');
const bodyParser = require('body-parser');
const aws = require('aws-sdk');
const app = express();
const port = 3000;
const multer = require('multer');
require('dotenv').config();
const dbHost = process.env.DB_HOST;
const dbUser = process.env.DB_USER;
const dbPassword = process.env.DB_PASSWORD;
const awsID = process.env.AWS_KEY_ID;
const awsKEY = process.env.AWS_SECRET_KEY;
const awsRegion = process.env.AWS_REGION;

const s3 = new aws.S3();

const connection = mysql.createConnection({
  host: dbHost,
  user: dbUser,
  password: dbPassword,
  database: 'message',
  port: 3306, // MySQL default port
});

// Configure AWS SDK
aws.config.update({
  accessKeyId: awsID,
  secretAccessKey:awsKEY,
  region:awsRegion
});

//connect with db and create table
connection.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL:', err);
    return;
  }
  console.log('Connected to MySQL');

  const createQuery = `
    CREATE TABLE IF NOT EXISTS message (
      id INT AUTO_INCREMENT PRIMARY KEY,
      text VARCHAR(255),
      image VARCHAR(255)
    )
  `;

connection.query(createQuery, (createErr, results) => {
  if (createErr) throw createErr;
    console.log('Table created or already exists:', results);

  });
});


const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 128 * 128 }, // Limit file size to 5MB
});


app.use(bodyParser.json());

app.get('/data',(req,res)=>{
  const selectQuery = 'SELECT * FROM message'
  let returnData;
  connection.query(selectQuery, (insertErr, results) => {
    if (insertErr) throw insertErr;

    returnData = { "results":[] }
    for(let i = 0; i < results.length;i++){
      returnData.results.push({"id":results[i].id,"text":results[i].text,"image":results[i].image})
    }  
    
    // Close the connection when done
  // connection.end((endErr) => {
  //     if (endErr) {
  //       console.error('Error closing connection:', endErr);
  //       return;
  //     }
  //     console.log('Connection closed');
  //   // Return the S3 URL of the uploaded image
  // });
  return res.status(200).json(returnData);

});

})

// Route for handling image uploads
app.post('/upload', upload.single('image'), (req, res) => {
  const file = req.file; // Assuming files are sent as part of the request
  let requestText = req.body.text;
  // Upload image to S3
  const params = {
    Bucket: 'cchbucket',
    Key: `uploads/${Date.now()}-${file.originalname}`,
    Body: file.buffer,
    ACL: 'public-read',
  };

  s3.upload(params, (err, data) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Error uploading image to S3' });
    }
      // Example: Insert data into a table
    const insertQuery = 'INSERT INTO message (text, image) VALUES (?, ?)';
    const values = [requestText, data.Location];
    connection.query(insertQuery, values, (insertErr, results) => {
      if (insertErr) throw insertErr;
    });

  return res.status(200).json({"ok":true});

})
});

app.use(express.static('public', { 'index.js': 'application/javascript' }));


app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

// export AWS_SDK_LOAD_CONFIG=1;
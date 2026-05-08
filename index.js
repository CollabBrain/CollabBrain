require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const { helmetMiddleware } = require('./middlewares/securityMiddleware');
const userRoutes = require('./routes/userRoutes');
const { sequelize } = require('./models');

const app = express();

// Security Middlewares
app.use(helmetMiddleware); // Protect against common web vulnerabilities by setting HTTP headers

// Parsers
app.use(bodyParser.json({ limit: '10kb' })); // Limit body payload to 10kb to prevent DoS attacks
app.use(bodyParser.urlencoded({ extended: true, limit: '10kb' }));

// Routes
app.use('/api/users', userRoutes);

// Basic Route
app.get('/', (req, res) => {
  res.send('Remote Meeting API - Secure Version');
});

// Start Server & Connect to DB
const PORT = process.env.PORT || 3000;

app.listen(PORT, async () => {
  console.log(`Server is running on port ${PORT}`);
  try {
    await sequelize.authenticate();
    console.log('Database connection has been established successfully.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
});

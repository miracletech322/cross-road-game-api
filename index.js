const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();
const swaggerUi = require('swagger-ui-express');
const morgan = require('morgan');

const apiRoutes = require('./routes/index.route');
const { swaggerSpec } = require('./swagger/swagger');

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan('combined'));

const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/cross-road-game-api';

mongoose
  .connect(mongoUri)
  .then(() => {
    // eslint-disable-next-line no-console
    console.log(`[server] MongoDB connected: ${mongoUri}`);
  })
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error('[server] MongoDB connection error:', err);
    process.exit(1);
  });

app.use('/api', apiRoutes);
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, { explorer: true }));
app.get('/api/docs.json', (req, res) => res.json(swaggerSpec));

app.get('/health', (req, res) => {
  res.json({ ok: true });
});

// Central error handler for controllers/services.
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'Internal Server Error';

  if (process.env.NODE_ENV !== 'production') {
    return res.status(statusCode).json({ message, error: err.stack });
  }
  return res.status(statusCode).json({ message });
});

const port = process.env.PORT || 3000;
app.listen(port, '0.0.0.0', () => {
  // eslint-disable-next-line no-console
  console.log(`[server] listening on :${port}`);
});
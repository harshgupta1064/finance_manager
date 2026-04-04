import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './src/config/swagger.js';
import { errorHandler } from './src/middleware/errorHandler.js';
import { globalLimiter } from './src/middleware/rateLimit.js';

import authRoutes      from './src/routes/auth.routes.js';
import userRoutes      from './src/routes/user.routes.js';
import recordRoutes    from './src/routes/record.routes.js';
import dashboardRoutes from './src/routes/dashboard.routes.js';

const app = express();

app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(globalLimiter);

app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use('/api/auth',      authRoutes);
app.use('/api/users',     userRoutes);
app.use('/api/records',   recordRoutes);
app.use('/api/dashboard', dashboardRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.use(errorHandler); // must be last

export default app;

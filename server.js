import app from './app.js';
import { env } from './src/config/env.js';

app.listen(env.PORT, () => {
  console.log(`Server running on http://localhost:${env.PORT}`);
  console.log(`Swagger docs at http://localhost:${env.PORT}/api/docs`);
});

import app from './app';
import { logger } from './config';

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  logger.info(`Timesheet server running on port ${PORT}`);
  console.log(`Server running on port ${PORT}`);
});
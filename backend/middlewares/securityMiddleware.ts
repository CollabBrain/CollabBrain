import rateLimit from 'express-rate-limit';
import helmet from 'helmet';

// Rate limiting for API to prevent brute-force or DDoS attacks
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
  message: 'Quá nhiều yêu cầu từ IP này, vui lòng thử lại sau 15 phút',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

export const helmetMiddleware = helmet();

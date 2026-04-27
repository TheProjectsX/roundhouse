// import * as helmet from 'helmet';
// import { Request, Response, NextFunction } from 'express';

// export function helmetMiddleware() {
//   return (req: Request, res: Response, next: NextFunction) => {
//     // Protect against various vulnerabilities via HTTP headers
//     helmet({
//       // Prevent clickjacking by disallowing iframe embedding
//       frameguard: {
//         action: 'deny',
//       },
//       // Enable HTTP Strict Transport Security (only in production)
//       hsts: {
//         maxAge: 31536000, // 1 year
//         includeSubDomains: true,
//         preload: true,
//       },
//       // Disable X-Powered-By header
//       hidePoweredBy: true,
//       // Mitigate MIME-type sniffing
//       noSniff: true,
//       // Disables caching (useful for sensitive endpoints)
//       noCache: false,
//       // Set Cross-Origin Resource Policy
//       crossOriginResourcePolicy: {
//         policy: 'same-site',
//       },
//     })(req, res, next);
//   };
// }

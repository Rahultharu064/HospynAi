import type { TokenPayload } from './authTypes';

// Make Express.User compatible with our TokenPayload so existing Request.user?: User
// declarations remain valid but include the JWT payload fields used in handlers.
declare global {
  namespace Express {
    // Extend the Express.User shape with fields from TokenPayload
    interface User extends TokenPayload {}

    // Only add sessionId to Request to avoid conflicting with other libs that declare `user`
    interface Request {
      sessionId?: string;
    }
  }
}

export {};

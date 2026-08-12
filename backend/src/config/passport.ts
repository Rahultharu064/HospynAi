<<<<<<< Updated upstream
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import { config } from './index';
import prisma from '../config/prisma';
import { TokenPayload, GoogleProfile } from '../types/authTypes';
import { AuthProvider, UserRole, UserStatus } from '@prisma/client';
import logger from '../utils/logger';

// JWT Strategy
const jwtOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: config.jwt.accessTokenSecret,
  issuer: config.jwt.issuer,
  audience: config.jwt.audience,
};

passport.use(
  'jwt',
  new JwtStrategy(jwtOptions, async (payload: TokenPayload, done) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
      });

      if (!user) {
        return done(null, false, { message: 'User not found' });
      }

      if (user.status === UserStatus.SUSPENDED) {
        return done(null, false, { message: 'Account is suspended' });
      }

      if (user.status === UserStatus.INACTIVE) {
        return done(null, false, { message: 'Account is inactive' });
      }

      // Check if session is still valid
      const session = await prisma.session.findUnique({
        where: { id: payload.sessionId },
      });

      if (!session || session.expiresAt < new Date()) {
        return done(null, false, { message: 'Session expired' });
      }

      return done(null, payload);
    } catch (error) {
      logger.error('JWT Strategy Error:', error);
      return done(error, false);
    }
  })
);

// Google Strategy
passport.use(
  'google',
  new GoogleStrategy(
    {
      clientID: config.google.clientId,
      clientSecret: config.google.clientSecret,
      callbackURL: config.google.callbackUrl,
      scope: ['profile', 'email'],
      passReqToCallback: true,
    },
    async (req: any, accessToken: string, refreshToken: string, profile: GoogleProfile, done: any) => {
      try {
        const email = profile.emails?.[0]?.value;
        const googleId = profile.id;
        const firstName = profile.name?.givenName || '';
        const lastName = profile.name?.familyName || '';
        const avatarUrl = profile.photos?.[0]?.value || null;

        if (!email) {
          return done(new Error('No email from Google profile'), false);
        }

        // Check if user exists
        let user = await prisma.user.findUnique({
          where: { email: email.toLowerCase() },
        });

        if (user) {
          // Check if suspended
          if (user.status === UserStatus.SUSPENDED) {
            return done(null, false, { message: 'Account is suspended' });
          }

          // Update user with Google info if not already linked
          if (!user.googleId) {
            user = await prisma.user.update({
              where: { id: user.id },
              data: {
                googleId,
                authProvider: AuthProvider.GOOGLE,
                isEmailVerified: true,
                avatarUrl: user.avatarUrl || avatarUrl,
                status: user.status === UserStatus.PENDING_VERIFICATION 
                  ? UserStatus.ACTIVE 
                  : user.status,
              },
            });
          }

          // Update avatar if not set
          if (!user.avatarUrl && avatarUrl) {
            user = await prisma.user.update({
              where: { id: user.id },
              data: { avatarUrl },
            });
          }
        } else {
          // Create new user
          user = await prisma.user.create({
            data: {
              email: email.toLowerCase(),
              googleId,
              firstName,
              lastName,
              avatarUrl,
              authProvider: AuthProvider.GOOGLE,
              isEmailVerified: true,
              status: UserStatus.ACTIVE,
              role: UserRole.PATIENT,
            },
          });

          logger.info(`New user created via Google: ${email}`);
        }

        const userData = {
          id: user.id,
          email: user.email,
          role: user.role,
          firstName: user.firstName,
          lastName: user.lastName,
          avatarUrl: user.avatarUrl,
          isNewUser: user.createdAt.getTime() === user.updatedAt.getTime(),
        };

        return done(null, userData);
      } catch (error) {
        logger.error('Google Strategy Error:', error);
        return done(error, false);
      }
    }
  )
);

=======
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import { config } from './index';
import prisma from '../config/prisma';
import { TokenPayload, GoogleProfile } from '../types/authTypes';
import { AuthProvider, UserRole, UserStatus } from '@prisma/client';
import logger from '../utils/logger';

// JWT Strategy
const jwtOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: config.jwt.accessTokenSecret,
  issuer: config.jwt.issuer,
  audience: config.jwt.audience,
};

passport.use(
  'jwt',
  new JwtStrategy(jwtOptions, async (payload: TokenPayload, done) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
      });

      if (!user) {
        return done(null, false, { message: 'User not found' });
      }

      if (user.status === UserStatus.SUSPENDED) {
        return done(null, false, { message: 'Account is suspended' });
      }

      if (user.status === UserStatus.INACTIVE) {
        return done(null, false, { message: 'Account is inactive' });
      }

      // Check if session is still valid
      const session = await prisma.session.findUnique({
        where: { id: payload.sessionId },
      });

      if (!session || session.expiresAt < new Date()) {
        return done(null, false, { message: 'Session expired' });
      }

      return done(null, payload);
    } catch (error) {
      logger.error('JWT Strategy Error:', error);
      return done(error, false);
    }
  })
);

// Google Strategy
passport.use(
  'google',
  new GoogleStrategy(
    {
      clientID: config.google.clientId,
      clientSecret: config.google.clientSecret,
      callbackURL: config.google.callbackUrl,
      scope: ['profile', 'email'],
      passReqToCallback: true,
    },
    async (req: any, accessToken: string, refreshToken: string, profile: GoogleProfile, done: any) => {
      try {
        const email = profile.emails?.[0]?.value;
        const googleId = profile.id;
        const firstName = profile.name?.givenName || '';
        const lastName = profile.name?.familyName || '';
        const avatarUrl = profile.photos?.[0]?.value || null;

        if (!email) {
          return done(new Error('No email from Google profile'), false);
        }

        // Check if user exists
        let user = await prisma.user.findUnique({
          where: { email: email.toLowerCase() },
        });

        if (user) {
          // Check if suspended
          if (user.status === UserStatus.SUSPENDED) {
            return done(null, false, { message: 'Account is suspended' });
          }

          // Update user with Google info if not already linked
          if (!user.googleId) {
            user = await prisma.user.update({
              where: { id: user.id },
              data: {
                googleId,
                authProvider: AuthProvider.GOOGLE,
                isEmailVerified: true,
                avatarUrl: user.avatarUrl || avatarUrl,
                status: user.status === UserStatus.PENDING_VERIFICATION 
                  ? UserStatus.ACTIVE 
                  : user.status,
              },
            });
          }

          // Update avatar if not set
          if (!user.avatarUrl && avatarUrl) {
            user = await prisma.user.update({
              where: { id: user.id },
              data: { avatarUrl },
            });
          }
        } else {
          // Create new user
          user = await prisma.user.create({
            data: {
              email: email.toLowerCase(),
              googleId,
              firstName,
              lastName,
              avatarUrl,
              authProvider: AuthProvider.GOOGLE,
              isEmailVerified: true,
              status: UserStatus.ACTIVE,
              role: UserRole.PATIENT,
            },
          });

          logger.info(`New user created via Google: ${email}`);
        }

        const userData = {
          id: user.id,
          email: user.email,
          role: user.role,
          firstName: user.firstName,
          lastName: user.lastName,
          avatarUrl: user.avatarUrl,
          isNewUser: user.createdAt.getTime() === user.updatedAt.getTime(),
        };

        return done(null, userData);
      } catch (error) {
        logger.error('Google Strategy Error:', error);
        return done(error, false);
      }
    }
  )
);

// Serialize user for session (if using sessions)
passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await prisma.user.findUnique({ where: { id } });
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

>>>>>>> Stashed changes
export default passport;
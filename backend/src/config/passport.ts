import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import { config } from './index';
import prisma from '../config/prisma';
import { TokenPayload, GoogleProfile } from '../types/authTypes';
import { UserStatus } from '@prisma/client';
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

      // Check if session is still valid. payload.sessionId holds the Session's
      // opaque `token` value (see SessionService.createSession), not its DB `id`.
      const session = await prisma.session.findUnique({
        where: { token: payload.sessionId },
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
//
// This deliberately does no database work — AuthService.googleLogin() is the single
// source of truth for find-or-create, session creation, and token issuance. It expects
// the raw Google profile shape (profile.emails[0].value, profile.name.givenName, ...),
// so this callback must hand that profile through unchanged rather than pre-normalizing
// it into a different shape.
passport.use(
  'google',
  new GoogleStrategy(
    {
      clientID: config.google.clientId,
      clientSecret: config.google.clientSecret,
      callbackURL: config.google.callbackUrl,
      scope: ['profile', 'email'],
    },
    async (accessToken: string, refreshToken: string, profile: GoogleProfile, done: any) => {
      try {
        const email = profile.emails?.[0]?.value;
        if (!email) {
          return done(new Error('No email from Google profile'), false);
        }

        const existingUser = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
        if (existingUser?.status === UserStatus.SUSPENDED) {
          return done(null, false, { message: 'Account is suspended' });
        }

        return done(null, profile);
      } catch (error) {
        logger.error('Google Strategy Error:', error);
        return done(error, false);
      }
    }
  )
);

export default passport;
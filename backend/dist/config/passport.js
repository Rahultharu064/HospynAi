"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const passport_1 = __importDefault(require("passport"));
const passport_google_oauth20_1 = require("passport-google-oauth20");
const passport_jwt_1 = require("passport-jwt");
const index_1 = require("./index");
const prisma_1 = __importDefault(require("../config/prisma"));
const client_1 = require("@prisma/client");
const logger_1 = __importDefault(require("../utils/logger"));
// JWT Strategy
const jwtOptions = {
    jwtFromRequest: passport_jwt_1.ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: index_1.config.jwt.accessTokenSecret,
    issuer: index_1.config.jwt.issuer,
    audience: index_1.config.jwt.audience,
};
passport_1.default.use('jwt', new passport_jwt_1.Strategy(jwtOptions, async (payload, done) => {
    try {
        const user = await prisma_1.default.user.findUnique({
            where: { id: payload.userId },
        });
        if (!user) {
            return done(null, false, { message: 'User not found' });
        }
        if (user.status === client_1.UserStatus.SUSPENDED) {
            return done(null, false, { message: 'Account is suspended' });
        }
        if (user.status === client_1.UserStatus.INACTIVE) {
            return done(null, false, { message: 'Account is inactive' });
        }
        // Check if session is still valid. payload.sessionId holds the Session's
        // opaque `token` value (see SessionService.createSession), not its DB `id`.
        const session = await prisma_1.default.session.findUnique({
            where: { token: payload.sessionId },
        });
        if (!session || session.expiresAt < new Date()) {
            return done(null, false, { message: 'Session expired' });
        }
        return done(null, payload);
    }
    catch (error) {
        logger_1.default.error('JWT Strategy Error:', error);
        return done(error, false);
    }
}));
// Google Strategy
//
// This deliberately does no database work — AuthService.googleLogin() is the single
// source of truth for find-or-create, session creation, and token issuance. It expects
// the raw Google profile shape (profile.emails[0].value, profile.name.givenName, ...),
// so this callback must hand that profile through unchanged rather than pre-normalizing
// it into a different shape.
passport_1.default.use('google', new passport_google_oauth20_1.Strategy({
    clientID: index_1.config.google.clientId,
    clientSecret: index_1.config.google.clientSecret,
    callbackURL: index_1.config.google.callbackUrl,
    scope: ['profile', 'email'],
}, async (accessToken, refreshToken, profile, done) => {
    try {
        const email = profile.emails?.[0]?.value;
        if (!email) {
            return done(new Error('No email from Google profile'), false);
        }
        const existingUser = await prisma_1.default.user.findUnique({ where: { email: email.toLowerCase() } });
        if (existingUser?.status === client_1.UserStatus.SUSPENDED) {
            return done(null, false, { message: 'Account is suspended' });
        }
        return done(null, profile);
    }
    catch (error) {
        logger_1.default.error('Google Strategy Error:', error);
        return done(error, false);
    }
}));
exports.default = passport_1.default;
//# sourceMappingURL=passport.js.map
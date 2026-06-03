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
        // Check if session is still valid
        const session = await prisma_1.default.session.findUnique({
            where: { id: payload.sessionId },
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
passport_1.default.use('google', new passport_google_oauth20_1.Strategy({
    clientID: index_1.config.google.clientId,
    clientSecret: index_1.config.google.clientSecret,
    callbackURL: index_1.config.google.callbackUrl,
    scope: ['profile', 'email'],
    passReqToCallback: true,
}, async (req, accessToken, refreshToken, profile, done) => {
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
        let user = await prisma_1.default.user.findUnique({
            where: { email: email.toLowerCase() },
        });
        if (user) {
            // Check if suspended
            if (user.status === client_1.UserStatus.SUSPENDED) {
                return done(null, false, { message: 'Account is suspended' });
            }
            // Update user with Google info if not already linked
            if (!user.googleId) {
                user = await prisma_1.default.user.update({
                    where: { id: user.id },
                    data: {
                        googleId,
                        authProvider: client_1.AuthProvider.GOOGLE,
                        isEmailVerified: true,
                        avatarUrl: user.avatarUrl || avatarUrl,
                        status: user.status === client_1.UserStatus.PENDING_VERIFICATION
                            ? client_1.UserStatus.ACTIVE
                            : user.status,
                    },
                });
            }
            // Update avatar if not set
            if (!user.avatarUrl && avatarUrl) {
                user = await prisma_1.default.user.update({
                    where: { id: user.id },
                    data: { avatarUrl },
                });
            }
        }
        else {
            // Create new user
            user = await prisma_1.default.user.create({
                data: {
                    email: email.toLowerCase(),
                    googleId,
                    firstName,
                    lastName,
                    avatarUrl,
                    authProvider: client_1.AuthProvider.GOOGLE,
                    isEmailVerified: true,
                    status: client_1.UserStatus.ACTIVE,
                    role: client_1.UserRole.PATIENT,
                },
            });
            logger_1.default.info(`New user created via Google: ${email}`);
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
    }
    catch (error) {
        logger_1.default.error('Google Strategy Error:', error);
        return done(error, false);
    }
}));
// Serialize user for session (if using sessions)
passport_1.default.serializeUser((user, done) => {
    done(null, user.id);
});
// Deserialize user from session
passport_1.default.deserializeUser(async (id, done) => {
    try {
        const user = await prisma_1.default.user.findUnique({ where: { id } });
        done(null, user);
    }
    catch (error) {
        done(error, null);
    }
});
exports.default = passport_1.default;
//# sourceMappingURL=passport.js.map
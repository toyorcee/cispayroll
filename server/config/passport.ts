// config/passport.ts
import passport from "passport";
import { Strategy as GoogleStrategy, Profile } from "passport-google-oauth20";
import { Strategy as LocalStrategy } from "passport-local";
import bcrypt from "bcrypt";
import User, { IUser } from "../models/User.js";
import dotenv from "dotenv";

dotenv.config();

// ------------------------------
// 1) GOOGLE OAUTH STRATEGY
// ------------------------------
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: "/auth/google/callback",
    },
    async (
      _accessToken: string,
      _refreshToken: string,
      profile: Profile,
      done: (error: any, user?: IUser | false, info?: any) => void
    ) => {
      try {
        let user = await User.findOne({ googleId: profile.id });

        if (!user) {
          user = new User({
            googleId: profile.id,
            email: profile.emails?.[0]?.value,
            username: profile.displayName,
          });
          await user.save();
        }

        return done(null, user);
      } catch (error) {
        return done(error as Error, false);
      }
    }
  )
);

// ------------------------------
// 2) LOCAL STRATEGY (USERNAME/PASSWORD)
// ------------------------------
passport.use(
  new LocalStrategy(
    {
      usernameField: "username", // Change to 'email' if preferred
      passwordField: "password",
    },
    async (
      username: string,
      password: string,
      done: (
        error: any,
        user?: IUser | false,
        info?: { message: string }
      ) => void
    ) => {
      try {
        const user = await User.findOne({ username });
        if (!user) {
          return done(null, false, { message: "User not found" });
        }

        const isMatch = await bcrypt.compare(password, user.password!);
        if (!isMatch) {
          return done(null, false, { message: "Invalid password" });
        }

        return done(null, user);
      } catch (error) {
        return done(error as Error, false);
      }
    }
  )
);
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const db = require("../models"); // { User, ... }

function configurePassport() {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.CLIENT_SECRET,
        callbackURL: process.env.CALLBACK_URL,
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value;
          if (!email) return done(new Error("No email from Google"));

          // try to find or create a record using googleId first
          const [user, created] = await db.User.findOrCreate({
            where: { googleId: profile.id },
            defaults: {
              googleId: profile.id,
              name: profile.displayName || email.split("@")[0],
              email,
              isGoogleAuth: true,
              role: "user",
            },
          });

          // if the user already existed by googleId but some fields were missing or stale,
          // update them now. also cover case where a user exists by email with no googleId.
          if (!created) {
            let changed = false;
            if (!user.googleId) {
              user.googleId = profile.id;
              changed = true;
            }
            if (user.email !== email) {
              user.email = email;
              changed = true;
            }
            if (!user.name) {
              user.name = profile.displayName || email.split("@")[0];
              changed = true;
            }
            if (!user.isGoogleAuth) {
              user.isGoogleAuth = true;
              changed = true;
            }
            if (changed) {
              await user.save();
            }
          }

          console.log("[passport] google user", { id: user.id, email: user.email, created });
          return done(null, user);
        } catch (err) {
          console.error("[passport] google strategy error", err);
          return done(err);
        }
      }
    )
  );
}

module.exports = configurePassport;

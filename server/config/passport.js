const passport = require("passport");
const GitHubStrategy = require("passport-github2").Strategy;
const prisma = require("../db");

passport.use(
  new GitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: process.env.GITHUB_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const user = await prisma.user.upsert({
          where: { githubId: profile.id },
          update: {
            username: profile.username,
            name: profile.displayName || profile.username,
            avatarUrl: profile.photos?.[0]?.value,
          },
          create: {
            githubId: profile.id,
            username: profile.username,
            name: profile.displayName || profile.username,
            avatarUrl: profile.photos?.[0]?.value,
          },
        });
        done(null, user);
      } catch (err) {
        done(err);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await prisma.user.findUnique({ where: { id } });
    done(null, user);
  } catch (err) {
    done(err);
  }
});

module.exports = passport;

require("dotenv/config");
const path = require("path");
const express = require("express");
const session = require("express-session");
const cors = require("cors");
const passport = require("./config/passport");
const authRouter = require("./routes/auth");
const postsRouter = require("./routes/posts");
const followsRouter = require("./routes/follows");
const usersRouter = require("./routes/users");

const app = express();

if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  })
);
app.use(express.json());

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 * 7,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    },
  })
);
app.use(passport.initialize());
app.use(passport.session());

app.use("/api/auth", authRouter);
app.use("/api/posts", postsRouter);
app.use("/api/follows", followsRouter);
app.use("/api/users", usersRouter);

app.get("/api/health", (req, res) => {
  res.json({ ok: true });
});

if (process.env.NODE_ENV === "production") {
  const clientDist = path.join(__dirname, "../client/dist");
  app.use(express.static(clientDist));
  app.get("/{*splat}", (req, res) => {
    res.sendFile(path.join(clientDist, "index.html"));
  });
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});

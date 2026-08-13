const { Router } = require("express");
const prisma = require("../db");
const ensureAuthenticated = require("../middleware/ensureAuthenticated");

const router = Router();

const authorSelect = {
  id: true,
  username: true,
  name: true,
  avatarUrl: true,
};

router.get("/", ensureAuthenticated, async (req, res) => {
  const users = await prisma.user.findMany({
    where: { id: { not: req.user.id } },
    select: authorSelect,
    orderBy: { username: "asc" },
  });

  const outgoing = await prisma.follow.findMany({
    where: { requesterId: req.user.id },
    select: { addresseeId: true, status: true },
  });
  const statusByUserId = new Map(outgoing.map((f) => [f.addresseeId, f.status]));

  const result = users.map((u) => ({
    ...u,
    followStatus:
      statusByUserId.get(u.id) === "ACCEPTED"
        ? "following"
        : statusByUserId.get(u.id) === "PENDING"
          ? "pending"
          : "none",
  }));

  res.json(result);
});

router.patch("/me", ensureAuthenticated, async (req, res) => {
  const { bio } = req.body;
  const user = await prisma.user.update({
    where: { id: req.user.id },
    data: { bio },
  });
  res.json(user);
});

router.get("/:id", ensureAuthenticated, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.params.id },
    select: {
      id: true,
      username: true,
      name: true,
      avatarUrl: true,
      bio: true,
      createdAt: true,
    },
  });
  if (!user) return res.status(404).json({ error: "User not found" });

  const posts = await prisma.post.findMany({
    where: { authorId: user.id },
    orderBy: { createdAt: "desc" },
    include: {
      author: { select: authorSelect },
      _count: { select: { likes: true, comments: true } },
    },
  });

  const myLikes = await prisma.like.findMany({
    where: { userId: req.user.id, postId: { in: posts.map((p) => p.id) } },
    select: { postId: true },
  });
  const likedPostIds = new Set(myLikes.map((l) => l.postId));
  const postsWithLikeState = posts.map((p) => ({ ...p, likedByMe: likedPostIds.has(p.id) }));

  const [followerCount, followingCount] = await Promise.all([
    prisma.follow.count({ where: { addresseeId: user.id, status: "ACCEPTED" } }),
    prisma.follow.count({ where: { requesterId: user.id, status: "ACCEPTED" } }),
  ]);

  res.json({ ...user, followerCount, followingCount, posts: postsWithLikeState });
});

module.exports = router;

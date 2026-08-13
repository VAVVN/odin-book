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

async function attachLikedByMe(posts, userId) {
  const postIds = posts.map((p) => p.id);
  const likes = await prisma.like.findMany({
    where: { userId, postId: { in: postIds } },
    select: { postId: true },
  });
  const likedSet = new Set(likes.map((l) => l.postId));
  return posts.map((p) => ({ ...p, likedByMe: likedSet.has(p.id) }));
}

router.get("/feed", ensureAuthenticated, async (req, res) => {
  const following = await prisma.follow.findMany({
    where: { requesterId: req.user.id, status: "ACCEPTED" },
    select: { addresseeId: true },
  });
  const authorIds = [req.user.id, ...following.map((f) => f.addresseeId)];

  const posts = await prisma.post.findMany({
    where: { authorId: { in: authorIds } },
    orderBy: { createdAt: "desc" },
    include: {
      author: { select: authorSelect },
      _count: { select: { likes: true, comments: true } },
    },
  });

  res.json(await attachLikedByMe(posts, req.user.id));
});

router.post("/", ensureAuthenticated, async (req, res) => {
  const { content } = req.body;
  if (!content || !content.trim()) {
    return res.status(400).json({ error: "Content is required" });
  }

  const post = await prisma.post.create({
    data: { content: content.trim(), authorId: req.user.id },
    include: {
      author: { select: authorSelect },
      _count: { select: { likes: true, comments: true } },
    },
  });

  res.status(201).json({ ...post, likedByMe: false });
});

router.get("/:id", ensureAuthenticated, async (req, res) => {
  const post = await prisma.post.findUnique({
    where: { id: req.params.id },
    include: {
      author: { select: authorSelect },
      comments: {
        orderBy: { createdAt: "asc" },
        include: { author: { select: authorSelect } },
      },
      _count: { select: { likes: true } },
    },
  });
  if (!post) return res.status(404).json({ error: "Post not found" });

  const like = await prisma.like.findUnique({
    where: { userId_postId: { userId: req.user.id, postId: post.id } },
  });

  res.json({ ...post, likedByMe: Boolean(like) });
});

router.post("/:id/comments", ensureAuthenticated, async (req, res) => {
  const { content } = req.body;
  if (!content || !content.trim()) {
    return res.status(400).json({ error: "Content is required" });
  }

  const post = await prisma.post.findUnique({ where: { id: req.params.id } });
  if (!post) return res.status(404).json({ error: "Post not found" });

  const comment = await prisma.comment.create({
    data: {
      content: content.trim(),
      postId: post.id,
      authorId: req.user.id,
    },
    include: { author: { select: authorSelect } },
  });

  res.status(201).json(comment);
});

router.post("/:id/like", ensureAuthenticated, async (req, res) => {
  const post = await prisma.post.findUnique({ where: { id: req.params.id } });
  if (!post) return res.status(404).json({ error: "Post not found" });

  await prisma.like.upsert({
    where: { userId_postId: { userId: req.user.id, postId: post.id } },
    update: {},
    create: { userId: req.user.id, postId: post.id },
  });

  const count = await prisma.like.count({ where: { postId: post.id } });
  res.status(201).json({ likedByMe: true, likeCount: count });
});

router.delete("/:id/like", ensureAuthenticated, async (req, res) => {
  await prisma.like.deleteMany({
    where: { userId: req.user.id, postId: req.params.id },
  });

  const count = await prisma.like.count({ where: { postId: req.params.id } });
  res.json({ likedByMe: false, likeCount: count });
});

module.exports = router;

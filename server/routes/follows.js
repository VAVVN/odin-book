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

router.get("/requests", ensureAuthenticated, async (req, res) => {
  const requests = await prisma.follow.findMany({
    where: { addresseeId: req.user.id, status: "PENDING" },
    include: { requester: { select: authorSelect } },
    orderBy: { createdAt: "desc" },
  });
  res.json(requests);
});

router.post("/:userId", ensureAuthenticated, async (req, res) => {
  const { userId } = req.params;
  if (userId === req.user.id) {
    return res.status(400).json({ error: "Cannot follow yourself" });
  }

  const target = await prisma.user.findUnique({ where: { id: userId } });
  if (!target) return res.status(404).json({ error: "User not found" });

  try {
    const follow = await prisma.follow.create({
      data: { requesterId: req.user.id, addresseeId: userId },
    });
    res.status(201).json(follow);
  } catch (err) {
    if (err.code === "P2002") {
      return res.status(409).json({ error: "Follow request already exists" });
    }
    throw err;
  }
});

router.post("/:userId/accept", ensureAuthenticated, async (req, res) => {
  const result = await prisma.follow.updateMany({
    where: {
      requesterId: req.params.userId,
      addresseeId: req.user.id,
      status: "PENDING",
    },
    data: { status: "ACCEPTED" },
  });

  if (result.count === 0) {
    return res.status(404).json({ error: "No pending request found" });
  }
  res.json({ ok: true });
});

router.delete("/:userId", ensureAuthenticated, async (req, res) => {
  await prisma.follow.deleteMany({
    where: {
      OR: [
        { requesterId: req.user.id, addresseeId: req.params.userId },
        { requesterId: req.params.userId, addresseeId: req.user.id },
      ],
    },
  });
  res.status(204).end();
});

module.exports = router;

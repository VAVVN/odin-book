require("dotenv/config");
const { faker } = require("@faker-js/faker");
const prisma = require("../db");

const NUM_USERS = 20;
const MAX_POSTS_PER_USER = 4;
const MAX_COMMENTS_PER_POST = 3;

function sample(array, count) {
  return [...array].sort(() => Math.random() - 0.5).slice(0, count);
}

async function main() {
  console.log("Clearing previous data...");
  await prisma.like.deleteMany({});
  await prisma.comment.deleteMany({});
  await prisma.post.deleteMany({});
  await prisma.follow.deleteMany({});
  await prisma.user.deleteMany({ where: { githubId: { startsWith: "seed-" } } });

  const realUsers = await prisma.user.findMany({});
  console.log(`Keeping ${realUsers.length} real user(s):`, realUsers.map((u) => u.username));

  console.log(`Creating ${NUM_USERS} fake users...`);
  const fakeUsers = [];
  for (let i = 0; i < NUM_USERS; i++) {
    const user = await prisma.user.create({
      data: {
        githubId: `seed-${i}`,
        username: faker.internet.username().toLowerCase() + i,
        name: faker.person.fullName(),
        avatarUrl: faker.image.avatarGitHub(),
        bio: faker.person.bio(),
      },
    });
    fakeUsers.push(user);
  }

  const allUsers = [...fakeUsers, ...realUsers];

  console.log("Creating posts...");
  const posts = [];
  for (const user of fakeUsers) {
    const postCount = faker.number.int({ min: 1, max: MAX_POSTS_PER_USER });
    for (let i = 0; i < postCount; i++) {
      const post = await prisma.post.create({
        data: {
          content: faker.lorem.sentences({ min: 1, max: 3 }),
          authorId: user.id,
        },
      });
      posts.push(post);
    }
  }
  console.log(`Created ${posts.length} posts.`);

  console.log("Creating comments and likes...");
  for (const post of posts) {
    const commenters = sample(allUsers, faker.number.int({ min: 0, max: MAX_COMMENTS_PER_POST }));
    for (const commenter of commenters) {
      await prisma.comment.create({
        data: {
          content: faker.lorem.sentence(),
          postId: post.id,
          authorId: commenter.id,
        },
      });
    }

    const likers = sample(allUsers, faker.number.int({ min: 0, max: allUsers.length }));
    if (likers.length) {
      await prisma.like.createMany({
        data: likers.map((liker) => ({ userId: liker.id, postId: post.id })),
        skipDuplicates: true,
      });
    }
  }

  console.log("Creating follow relationships...");
  for (const user of fakeUsers) {
    const candidates = allUsers.filter((u) => u.id !== user.id);
    const toFollow = sample(candidates, faker.number.int({ min: 2, max: 6 }));
    for (const target of toFollow) {
      const status = Math.random() < 0.85 ? "ACCEPTED" : "PENDING";
      await prisma.follow.create({
        data: { requesterId: user.id, addresseeId: target.id, status },
      }).catch(() => {});
    }
  }

  // Make sure every real (logged-in) user has some accepted follows and
  // pending incoming requests so the feed and requests UI aren't empty.
  for (const realUser of realUsers) {
    const toFollow = sample(fakeUsers, 5);
    for (const target of toFollow) {
      await prisma.follow
        .create({ data: { requesterId: realUser.id, addresseeId: target.id, status: "ACCEPTED" } })
        .catch(() => {});
    }

    const toRequestMe = sample(fakeUsers, 3);
    for (const requester of toRequestMe) {
      await prisma.follow
        .create({ data: { requesterId: requester.id, addresseeId: realUser.id, status: "PENDING" } })
        .catch(() => {});
    }
  }

  console.log("Seed complete.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

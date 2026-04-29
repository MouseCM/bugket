/* lib/prisma.js — Singleton Prisma client */
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
module.exports = prisma;

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function main() {
  const dataPath = path.join(__dirname, '../data/words.json');
  if (!fs.existsSync(dataPath)) {
    console.error("No words.json found.");
    return;
  }
  const raw = fs.readFileSync(dataPath, 'utf8');
  const words = JSON.parse(raw);

  console.log(`Seeding ${words.length} words...`);

  // Using upsert or createMany
  for (const w of words) {
    await prisma.word.upsert({
      where: { english: w.english },
      update: {},
      create: {
        english: w.english,
        vietnamese: w.vietnamese,
        level: w.level,
        ipa: w.ipa || null,
        example: w.example || null,
      },
    });
  }

  console.log("Seeding completed.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

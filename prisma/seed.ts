// prisma/seed.ts
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
    await prisma.role.createMany({
        data: [{ name: "ADMIN" }, { name: "USER" }]
    });
}

main()
    .then(() => console.log("Seed complete"))
    .catch(console.error)
    .finally(() => prisma.$disconnect());

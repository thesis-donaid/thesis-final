import { prisma } from "@/lib/prisma";




async function main() {
    // Create admin user
    const admin = await prisma.user.upsert({
        where: { email: "pusongamainc@gmail.com" },
        update: {
            role: "admin",  // Update role if user exists
            name: "System Admin",
        },
        create: {
            email: "pusongamainc@gmail.com",
            name: "System Admin",
            role: "admin",
            emailVerified: new Date(),
        },
    });

    console.log("Admin created/updated:", admin);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    })
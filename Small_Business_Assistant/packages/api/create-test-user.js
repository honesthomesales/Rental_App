const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createTestUser() {
  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: 'honesthomesales@gmail.com' },
    });

    if (existingUser) {
      console.log('Test user already exists:', existingUser.email);
      return;
    }

    // Create test user
    const user = await prisma.user.create({
      data: {
        email: 'honesthomesales@gmail.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'worker',
      },
    });

    console.log('Test user created successfully:', user);
    console.log('You can now login with:');
    console.log('Email: honesthomesales@gmail.com');
    console.log('Password: any password (for testing)');
  } catch (error) {
    console.error('Error creating test user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestUser(); 
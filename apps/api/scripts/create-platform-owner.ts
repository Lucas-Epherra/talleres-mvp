import 'dotenv/config';
import {
  MembershipStatus,
  PlatformRole,
  PrismaClient,
  UserStatus,
  WorkshopRole,
  WorkshopStatus,
} from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const PLATFORM_WORKSHOP_SLUG = 'mi-taller-360-platform';
const PLATFORM_WORKSHOP_NAME = 'Mi Taller 360 Platform';

type PlatformOwnerInput = {
  name: string;
  email: string;
  password: string;
};

/**
 * Reads and validates the environment variables required to create the platform
 * owner account.
 */
function getPlatformOwnerInput(): PlatformOwnerInput {
  const name = process.env.PLATFORM_OWNER_NAME?.trim() || 'Lucas';
  const email = normalizeEmail(process.env.PLATFORM_OWNER_EMAIL ?? '');
  const password = process.env.PLATFORM_OWNER_PASSWORD ?? '';

  if (!email) {
    throw new Error('PLATFORM_OWNER_EMAIL is required.');
  }

  if (!isValidEmail(email)) {
    throw new Error('PLATFORM_OWNER_EMAIL must be a valid email.');
  }

  if (!password) {
    throw new Error('PLATFORM_OWNER_PASSWORD is required.');
  }

  if (password.length < 12) {
    throw new Error('PLATFORM_OWNER_PASSWORD must be at least 12 characters.');
  }

  return {
    name,
    email,
    password,
  };
}

/**
 * Normalizes an email before persisting or querying it.
 */
function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Performs a basic email format validation for script input.
 */
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Creates the platform owner account and assigns it to an internal platform
 * workshop so the current workshop-first auth flow remains compatible.
 */
async function main(): Promise<void> {
  const input = getPlatformOwnerInput();
  const passwordHash = await bcrypt.hash(input.password, 12);

  const platformWorkshop = await prisma.workshop.upsert({
    where: {
      slug: PLATFORM_WORKSHOP_SLUG,
    },
    update: {
      name: PLATFORM_WORKSHOP_NAME,
      status: WorkshopStatus.ACTIVE,
    },
    create: {
      name: PLATFORM_WORKSHOP_NAME,
      slug: PLATFORM_WORKSHOP_SLUG,
      status: WorkshopStatus.ACTIVE,
    },
  });

  const platformOwner = await prisma.user.upsert({
    where: {
      email: input.email,
    },
    update: {
      name: input.name,
      passwordHash,
      platformRole: PlatformRole.OWNER,
      status: UserStatus.ACTIVE,
    },
    create: {
      name: input.name,
      email: input.email,
      passwordHash,
      platformRole: PlatformRole.OWNER,
      status: UserStatus.ACTIVE,
    },
  });

  await prisma.workshopMember.upsert({
    where: {
      workshopId_userId: {
        workshopId: platformWorkshop.id,
        userId: platformOwner.id,
      },
    },
    update: {
      role: WorkshopRole.OWNER,
      status: MembershipStatus.ACTIVE,
    },
    create: {
      workshopId: platformWorkshop.id,
      userId: platformOwner.id,
      role: WorkshopRole.OWNER,
      status: MembershipStatus.ACTIVE,
    },
  });

  console.log('Platform owner account created or updated successfully.');
  console.log(`Email: ${platformOwner.email}`);
  console.log(`Platform role: ${PlatformRole.OWNER}`);
  console.log(`Internal workshop: ${platformWorkshop.slug}`);
}

main()
  .catch((error) => {
    console.error('Failed to create platform owner account.');
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
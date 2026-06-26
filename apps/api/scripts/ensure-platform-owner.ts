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

const PLATFORM_OWNER_EMAIL =
  process.env.PLATFORM_OWNER_EMAIL ?? 'lucas@mitaller360.com';

const PLATFORM_OWNER_PASSWORD = process.env.PLATFORM_OWNER_PASSWORD;

const PLATFORM_WORKSHOP_SLUG = 'mi-taller-360-platform';

async function main(): Promise<void> {
  if (!PLATFORM_OWNER_PASSWORD) {
    throw new Error('PLATFORM_OWNER_PASSWORD is required.');
  }

  const passwordHash = await bcrypt.hash(PLATFORM_OWNER_PASSWORD, 12);

  const platformWorkshop = await prisma.workshop.upsert({
    where: {
      slug: PLATFORM_WORKSHOP_SLUG,
    },
    update: {
      name: 'Mi Taller 360 Platform',
      status: WorkshopStatus.ACTIVE,
    },
    create: {
      name: 'Mi Taller 360 Platform',
      slug: PLATFORM_WORKSHOP_SLUG,
      status: WorkshopStatus.ACTIVE,
    },
    select: {
      id: true,
      slug: true,
      status: true,
    },
  });

  const user = await prisma.user.upsert({
    where: {
      email: PLATFORM_OWNER_EMAIL,
    },
    update: {
      passwordHash,
      platformRole: PlatformRole.OWNER,
      status: UserStatus.ACTIVE,
    },
    create: {
      name: 'Lucas',
      email: PLATFORM_OWNER_EMAIL,
      passwordHash,
      platformRole: PlatformRole.OWNER,
      status: UserStatus.ACTIVE,
    },
    select: {
      id: true,
      email: true,
      platformRole: true,
      status: true,
    },
  });

  const membership = await prisma.workshopMember.upsert({
    where: {
      workshopId_userId: {
        workshopId: platformWorkshop.id,
        userId: user.id,
      },
    },
    update: {
      role: WorkshopRole.OWNER,
      status: MembershipStatus.ACTIVE,
    },
    create: {
      workshopId: platformWorkshop.id,
      userId: user.id,
      role: WorkshopRole.OWNER,
      status: MembershipStatus.ACTIVE,
    },
    select: {
      id: true,
      role: true,
      status: true,
    },
  });

  console.log('Platform owner ready:', {
    user,
    platformWorkshop,
    membership,
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    void prisma.$disconnect();
  });
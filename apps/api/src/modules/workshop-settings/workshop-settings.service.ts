import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateWorkshopSettingsDto } from './dto/update-workshop-settings.dto';
import type { UploadedLogoFile } from './types/uploaded-logo-file.type';
import { WorkshopLogoStorageService } from './workshop-logo-storage.service';

type WorkshopSettingsRecord = {
  id: string;
  name: string;
  slug: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  logoUrl: string | null;
  logoObjectKey: string | null;
  businessHours: string | null;
  description: string | null;
  updatedAt: Date;
};

type NormalizedWorkshopSettingsUpdateData = {
  name?: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  businessHours?: string | null;
  description?: string | null;
};

const workshopSettingsSelect = {
  id: true,
  name: true,
  slug: true,
  phone: true,
  email: true,
  address: true,
  logoUrl: true,
  logoObjectKey: true,
  businessHours: true,
  description: true,
  updatedAt: true,
} satisfies Prisma.WorkshopSelect;

/**
 * Handles authenticated workshop settings.
 *
 * Every query is scoped by the authenticated user's workshopId. The frontend
 * must never decide which workshop is being updated.
 */
@Injectable()
export class WorkshopSettingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logoStorage: WorkshopLogoStorageService,
  ) {}

  /**
   * Returns the settings for the authenticated workshop.
   */
  async getSettings(workshopId: string) {
    const workshop = await this.findWorkshopSettings(workshopId);

    return {
      data: serializeWorkshopSettings(workshop),
    };
  }

  /**
   * Updates the text-based settings for the authenticated workshop.
   */
  async updateSettings(workshopId: string, dto: UpdateWorkshopSettingsDto) {
    await this.ensureWorkshopExists(workshopId);

    const data = normalizeWorkshopSettingsUpdateData(dto);

    if (data.name) {
      await this.assertWorkshopNameIsAvailable(workshopId, data.name);
    }

    if (Object.keys(data).length === 0) {
      return this.getSettings(workshopId);
    }

    const workshop = await this.prisma.workshop.update({
      where: {
        id: workshopId,
      },
      data,
      select: workshopSettingsSelect,
    });

    return {
      data: serializeWorkshopSettings(workshop),
    };
  }

  /**
   * Uploads a new logo for the authenticated workshop.
   *
   * The logo is processed and stored in R2. The previous object is deleted after
   * the database points to the new logo, so the UI never references a missing
   * asset.
   */
  async uploadLogo(workshopId: string, file: UploadedLogoFile) {
    const workshop = await this.findWorkshopSettings(workshopId);
    const uploadedLogo = await this.logoStorage.uploadWorkshopLogo(
      workshopId,
      file,
    );

    let updatedWorkshop: WorkshopSettingsRecord;

    try {
      updatedWorkshop = await this.prisma.workshop.update({
        where: {
          id: workshopId,
        },
        data: {
          logoUrl: uploadedLogo.publicUrl,
          logoObjectKey: uploadedLogo.objectKey,
        },
        select: workshopSettingsSelect,
      });
    } catch (error) {
      await this.logoStorage.deleteObject(uploadedLogo.objectKey);
      throw error;
    }

    if (
      workshop.logoObjectKey &&
      workshop.logoObjectKey !== uploadedLogo.objectKey
    ) {
      await this.logoStorage.deleteObject(workshop.logoObjectKey).catch(() => undefined);
    }

    return {
      data: serializeWorkshopSettings(updatedWorkshop),
    };
  }

  /**
   * Deletes the current logo for the authenticated workshop.
   */
  async deleteLogo(workshopId: string) {
    const workshop = await this.findWorkshopSettings(workshopId);

    if (workshop.logoObjectKey) {
      await this.logoStorage.deleteObject(workshop.logoObjectKey);
    }

    const updatedWorkshop = await this.prisma.workshop.update({
      where: {
        id: workshopId,
      },
      data: {
        logoUrl: null,
        logoObjectKey: null,
      },
      select: workshopSettingsSelect,
    });

    return {
      data: serializeWorkshopSettings(updatedWorkshop),
    };
  }

  /**
   * Returns workshop settings or throws a domain-friendly 404.
   */
  private async findWorkshopSettings(
    workshopId: string,
  ): Promise<WorkshopSettingsRecord> {
    const workshop = await this.prisma.workshop.findFirst({
      where: {
        id: workshopId,
      },
      select: workshopSettingsSelect,
    });

    if (!workshop) {
      throw new NotFoundException('No se encontró el taller.');
    }

    return workshop;
  }

  /**
   * Ensures the authenticated workshop still exists.
   */
  private async ensureWorkshopExists(workshopId: string) {
    const workshop = await this.prisma.workshop.findFirst({
      where: {
        id: workshopId,
      },
      select: {
        id: true,
      },
    });

    if (!workshop) {
      throw new NotFoundException('No se encontró el taller.');
    }
  }

  /**
   * Keeps workshop names unique at business level.
   */
  private async assertWorkshopNameIsAvailable(
    workshopId: string,
    name: string,
  ) {
    const existingWorkshop = await this.prisma.workshop.findFirst({
      where: {
        name: {
          equals: name,
          mode: Prisma.QueryMode.insensitive,
        },
        NOT: {
          id: workshopId,
        },
      },
      select: {
        id: true,
      },
    });

    if (existingWorkshop) {
      throw new ConflictException('Ya existe otro taller con ese nombre.');
    }
  }
}

/**
 * Normalizes update input before persistence.
 */
function normalizeWorkshopSettingsUpdateData(
  dto: UpdateWorkshopSettingsDto,
): NormalizedWorkshopSettingsUpdateData {
  return {
    name: normalizeRequiredText(dto.name, 'El nombre del taller', 120),
    phone: normalizeOptionalText(dto.phone, 'El teléfono', 40),
    email: normalizeOptionalEmail(dto.email),
    address: normalizeOptionalText(dto.address, 'La dirección', 180),
    businessHours: normalizeOptionalMultilineText(
      dto.businessHours,
      'Los horarios',
      700,
    ),
    description: normalizeOptionalMultilineText(
      dto.description,
      'La descripción',
      500,
    ),
  };
}

/**
 * Converts database records into API-safe JSON.
 */
function serializeWorkshopSettings(workshop: WorkshopSettingsRecord) {
  return {
    id: workshop.id,
    name: workshop.name,
    slug: workshop.slug,
    phone: workshop.phone,
    email: workshop.email,
    address: workshop.address,
    logoUrl: workshop.logoUrl,
    businessHours: workshop.businessHours,
    description: workshop.description,
    updatedAt: workshop.updatedAt.toISOString(),
  };
}

function normalizeRequiredText(
  value: string | null | undefined,
  label: string,
  maxLength: number,
): string | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    throw new BadRequestException(`${label} es obligatorio.`);
  }

  const normalizedValue = value.trim();

  if (!normalizedValue) {
    throw new BadRequestException(`${label} es obligatorio.`);
  }

  if (normalizedValue.length > maxLength) {
    throw new BadRequestException(
      `${label} no puede superar ${maxLength} caracteres.`,
    );
  }

  return normalizedValue;
}

function normalizeOptionalText(
  value: string | null | undefined,
  label: string,
  maxLength: number,
): string | null | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  const normalizedValue = value.trim();

  if (!normalizedValue) {
    return null;
  }

  if (normalizedValue.length > maxLength) {
    throw new BadRequestException(
      `${label} no puede superar ${maxLength} caracteres.`,
    );
  }

  return normalizedValue;
}

function normalizeOptionalMultilineText(
  value: string | null | undefined,
  label: string,
  maxLength: number,
): string | null | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  const normalizedValue = value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .join('\n');

  if (!normalizedValue) {
    return null;
  }

  if (normalizedValue.length > maxLength) {
    throw new BadRequestException(
      `${label} no puede superar ${maxLength} caracteres.`,
    );
  }

  return normalizedValue;
}

function normalizeOptionalEmail(
  value: string | null | undefined,
): string | null | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  const normalizedValue = value.trim().toLowerCase();

  if (!normalizedValue) {
    return null;
  }

  if (normalizedValue.length > 160) {
    throw new BadRequestException('El email no puede superar 160 caracteres.');
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedValue)) {
    throw new BadRequestException('Ingresá un email válido.');
  }

  return normalizedValue;
}

import {
  BadGatewayException,
  BadRequestException,
  Injectable,
} from '@nestjs/common';
import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import type { UploadedLogoFile } from './types/uploaded-logo-file.type';
import sharp = require('sharp');

const MAX_LOGO_UPLOAD_BYTES = 1024 * 1024;
const LOGO_OUTPUT_MAX_SIZE = 512;
const LOGO_OUTPUT_QUALITY = 85;
const ALLOWED_LOGO_MIME_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
]);

type R2Config = {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
  publicBaseUrl: string;
};

type UploadedWorkshopLogo = {
  objectKey: string;
  publicUrl: string;
};

/**
 * Handles workshop logo storage in Cloudflare R2.
 *
 * The browser never receives R2 credentials. It uploads the file to the NestJS
 * API, and the API validates, compresses and stores the final asset.
 */
@Injectable()
export class WorkshopLogoStorageService {
  private client: S3Client | null = null;

  /**
   * Validates, converts and uploads a workshop logo to R2.
   */
  async uploadWorkshopLogo(
    workshopId: string,
    file: UploadedLogoFile,
  ): Promise<UploadedWorkshopLogo> {
    this.assertValidLogoFile(file);

    const config = this.getR2Config();
    const objectKey = this.buildLogoObjectKey(workshopId);
    const processedBuffer = await this.processLogoImage(file.buffer);

    try {
      await this.getClient(config).send(
        new PutObjectCommand({
          Bucket: config.bucketName,
          Key: objectKey,
          Body: processedBuffer,
          ContentType: 'image/webp',
          CacheControl: 'public, max-age=31536000, immutable',
        }),
      );
    } catch {
      throw new BadGatewayException(
        'No se pudo subir el logo. Revisá la configuración de Cloudflare R2.',
      );
    }

    return {
      objectKey,
      publicUrl: `${config.publicBaseUrl}/${objectKey}`,
    };
  }

  /**
   * Deletes a previously uploaded object from R2.
   */
  async deleteObject(objectKey: string): Promise<void> {
    const config = this.getR2Config();

    try {
      await this.getClient(config).send(
        new DeleteObjectCommand({
          Bucket: config.bucketName,
          Key: objectKey,
        }),
      );
    } catch {
      throw new BadGatewayException(
        'No se pudo eliminar el logo anterior en Cloudflare R2.',
      );
    }
  }

  /**
   * Validates file size, file presence and MIME type before image processing.
   */
  private assertValidLogoFile(file: UploadedLogoFile): void {
    if (!file?.buffer) {
      throw new BadRequestException('Seleccioná una imagen para subir.');
    }

    if (file.size > MAX_LOGO_UPLOAD_BYTES) {
      throw new BadRequestException('El logo no puede superar 1 MB.');
    }

    if (!ALLOWED_LOGO_MIME_TYPES.has(file.mimetype)) {
      throw new BadRequestException(
        'El logo debe ser una imagen PNG, JPG, JPEG o WEBP.',
      );
    }
  }

  /**
   * Converts the input image into a small WEBP suitable for UI, PDF and email.
   */
  private async processLogoImage(buffer: Buffer): Promise<Buffer> {
    try {
      return await sharp(buffer)
        .rotate()
        .resize({
          width: LOGO_OUTPUT_MAX_SIZE,
          height: LOGO_OUTPUT_MAX_SIZE,
          fit: 'inside',
          withoutEnlargement: true,
        })
        .webp({
          quality: LOGO_OUTPUT_QUALITY,
        })
        .toBuffer();
    } catch {
      throw new BadRequestException(
        'No se pudo procesar la imagen. Probá con otro PNG, JPG o WEBP.',
      );
    }
  }

  /**
   * Lazily builds the S3-compatible R2 client.
   */
  private getClient(config: R2Config): S3Client {
    if (this.client) {
      return this.client;
    }

    this.client = new S3Client({
      region: 'auto',
      endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    });

    return this.client;
  }

  /**
   * Reads required R2 environment variables and normalizes public URL.
   */
  private getR2Config(): R2Config {
    const accountId = process.env.R2_ACCOUNT_ID;
    const accessKeyId = process.env.R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
    const bucketName = process.env.R2_BUCKET_NAME;
    const publicBaseUrl = process.env.R2_PUBLIC_BASE_URL?.replace(/\/$/, '');

    if (
      !accountId ||
      !accessKeyId ||
      !secretAccessKey ||
      !bucketName ||
      !publicBaseUrl
    ) {
      throw new BadRequestException(
        'Falta configurar las variables de Cloudflare R2.',
      );
    }

    return {
      accountId,
      accessKeyId,
      secretAccessKey,
      bucketName,
      publicBaseUrl,
    };
  }

  /**
   * Generates immutable object keys to avoid browser/CDN cache conflicts.
   */
  private buildLogoObjectKey(workshopId: string): string {
    return `workshops/${workshopId}/logos/logo-${Date.now()}.webp`;
  }
}

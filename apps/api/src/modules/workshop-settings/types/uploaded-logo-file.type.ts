/**
 * Minimal uploaded file shape used by workshop logo upload.
 *
 * We intentionally avoid Express.Multer.File here because depending on the
 * global Express namespace augmentation can be brittle across TS/Nest setups.
 */
export type UploadedLogoFile = {
  buffer: Buffer;
  size: number;
  mimetype: string;
  originalname: string;
};
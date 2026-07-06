export type WorkshopSettings = {
  id: string;
  name: string;
  slug: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  logoUrl: string | null;
  businessHours: string | null;
  description: string | null;
  updatedAt: string;
};

export type WorkshopSettingsResponse = {
  data: WorkshopSettings;
};

export type UpdateWorkshopSettingsInput = {
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  businessHours: string | null;
  description: string | null;
};

import { Injectable } from '@nestjs/common';

type HealthCheckResponse = {
  status: 'ok';
  service: 'talleres-api';
  timestamp: string;
};

/**
 * Provides root-level application utilities.
 */
@Injectable()
export class AppService {
  /**
   * Returns a minimal health-check response for infrastructure and local checks.
   */
  getHealth(): HealthCheckResponse {
    return {
      status: 'ok',
      service: 'talleres-api',
      timestamp: new Date().toISOString(),
    };
  }
}

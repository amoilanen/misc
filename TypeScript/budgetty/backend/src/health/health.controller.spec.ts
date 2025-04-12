import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';
import { TerminusModule } from '@nestjs/terminus';

describe('HealthController', () => {
  let controller: HealthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [TerminusModule], // Import TerminusModule for health checks
      controllers: [HealthController],
      // No need to mock dependencies for the basic health check
    }).compile();

    controller = module.get<HealthController>(HealthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('check', () => {
    it('should return health status', async () => {
      // The actual health check logic is handled by @nestjs/terminus
      // We just need to ensure the controller method exists and can be called
      const result = await controller.check();
      expect(result).toBeDefined();
      // You could add more specific checks if you have custom health indicators
      // For example, expect(result.status).toEqual('ok');
      // expect(result.info).toBeDefined();
    });
  });
});

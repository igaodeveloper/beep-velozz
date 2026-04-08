import { IndustrialScannerController } from '../../utils/scannerController';
import { ScannerState } from '../../types/scanner';

describe('IndustrialScannerController', () => {
  let controller: IndustrialScannerController;
  const mockConfig = {
    maxAllowedScans: {
      shopee: 10,
      mercado_livre: 10,
      avulso: 10,
    },
    debounceMs: 100,
    onStateChange: jest.fn(),
    onStatsUpdate: jest.fn(),
  };

  beforeEach(() => {
    controller = new IndustrialScannerController(mockConfig);
  });

  afterEach(() => {
    controller.reset();
  });

  describe('Initialization', () => {
    it('should initialize with correct state', () => {
      expect(controller.getState()).toBe(ScannerState.ACTIVE);
      expect(controller.getCounts()).toEqual({ shopee: 0, mercado_livre: 0, avulso: 0, unknown: 0 });
    });

    it('should initialize with correct limits', () => {
      const limits = controller.getLimits();
      expect(limits).toEqual(mockConfig.maxAllowedScans);
    });
  });

  describe('Scan Processing', () => {
    it('should accept valid Shopee code', async () => {
      const result = await controller.processScan('BR123456789');
      expect(result.success).toBe(true);
      expect(result.type).toBe('shopee');
      expect(result.code).toBe('BR123456789');
    });

    it('should accept valid Mercado Livre code', async () => {
      const result = await controller.processScan('2200D1241459785');
      expect(result.success).toBe(true);
      expect(result.type).toBe('mercado_livre');
      expect(result.code).toBe('2200D1241459785');
    });

    it('should accept valid Avulso code', async () => {
      const result = await controller.processScan('LM123456');
      expect(result.success).toBe(true);
      expect(result.type).toBe('avulso');
      expect(result.code).toBe('LM123456');
    });

    it('should reject invalid code', async () => {
      const result = await controller.processScan('INVALID');
      expect(result.success).toBe(false);
      expect(result.reason).toBe('invalid');
    });

    it('should reject duplicate code', async () => {
      // First scan
      await controller.processScan('BR123456789');

      // Duplicate scan
      const result = await controller.processScan('BR123456789');
      expect(result.success).toBe(false);
      expect(result.reason).toBe('duplicate');
    });

    it('should enforce limits', async () => {
      const smallConfig = {
        ...mockConfig,
        maxAllowedScans: { shopee: 1, mercado_livre: 10, avulso: 10 },
      };
      const limitedController = new IndustrialScannerController(smallConfig);

      // First scan should succeed
      const result1 = await limitedController.processScan('BR111111111');
      expect(result1.success).toBe(true);

      // Second scan should fail due to limit
      const result2 = await limitedController.processScan('BR222222222');
      expect(result2.success).toBe(false);
      expect(result2.reason).toBe('limit_reached');
    });
  });

  describe('State Management', () => {
    it('should change state when limit reached', async () => {
      const smallConfig = {
        ...mockConfig,
        maxAllowedScans: { shopee: 1, mercado_livre: 0, avulso: 0 },
      };
      const limitedController = new IndustrialScannerController(smallConfig);

      await limitedController.processScan('BR123456789');

      expect(limitedController.getState()).toBe(ScannerState.LIMIT_REACHED);
      expect(mockConfig.onStateChange).toHaveBeenCalledWith(ScannerState.LIMIT_REACHED);
    });

    it('should pause and resume scanning', () => {
      controller.pause();
      expect(controller.getState()).toBe(ScannerState.PAUSED);

      controller.resume();
      expect(controller.getState()).toBe(ScannerState.ACTIVE);
    });
  });

  describe('Statistics', () => {
    it('should track scan statistics', async () => {
      await controller.processScan('BR123456789');
      await controller.processScan('2200D1241459785');

      const stats = controller.getStats();
      expect(stats.validScans).toBe(2);
      expect(stats.totalScans).toBe(2);
      expect(stats.duplicates).toBe(0);
    });

    it('should track duplicate statistics', async () => {
      await controller.processScan('BR123456789');
      await controller.processScan('BR123456789'); // duplicate

      const stats = controller.getStats();
      expect(stats.validScans).toBe(1);
      expect(stats.duplicates).toBe(1);
      expect(stats.totalScans).toBe(2);
    });
  });
});
import { Test, TestingModule } from '@nestjs/testing';
import { ServicesController } from './services.controller';
import { ServicesService } from './services.service';

describe('ServicesController', () => {
  let controller: ServicesController;

  const servicesService = {
    listAll: vi.fn(),
    listPublic: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    deactivate: vi.fn(),
  };

  beforeEach(async () => {
    vi.resetAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ServicesController],
      providers: [
        {
          provide: ServicesService,
          useValue: servicesService,
        },
      ],
    }).compile();

    controller = module.get<ServicesController>(ServicesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('returns public services list', async () => {
    servicesService.listPublic.mockResolvedValue([
      {
        id: 'svc-1',
        slug: 'initial-consult',
        name: 'Initial Consult',
        description: 'Intro Session',
        duration_minutes: 60,
        price_amount: '2500.00',
        currency: 'PHP',
        is_active: true,
      },
    ]);

    const result = await controller.listPublic();

    expect(result).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'svc-1',
          slug: 'initial-consult',
          name: 'Initial Consult',
          description: 'Intro Session',
          duration_minutes: 60,
          price_amount: '2500.00',
          currency: 'PHP',
          is_active: true,
        }),
      ]),
    );
  });

  it('returns all services for management', async () => {
    servicesService.listAll.mockResolvedValue([
      {
        id: 'svc-1',
        slug: 'initial-consult',
        name: 'Initial Consult',
        description: 'Intro Session',
        duration_minutes: 60,
        price_amount: '2500.00',
        currency: 'PHP',
        is_active: true,
      },
    ]);

    const result = await controller.listAll();

    expect(result).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'svc-1',
          slug: 'initial-consult',
          name: 'Initial Consult',
          description: 'Intro Session',
          duration_minutes: 60,
          price_amount: '2500.00',
          currency: 'PHP',
          is_active: true,
        }),
      ]),
    );
  });

  it('creates a new service', async () => {
    const createServiceDto = {
      slug: 'initial-consult',
      name: 'Initial Consult',
      description: 'Intro Session',
      duration_minutes: 60,
      price_amount: '2500.00',
      currency: 'PHP',
      is_active: true,
    };

    servicesService.create.mockResolvedValue({
      id: 'svc-1',
      ...createServiceDto,
    });

    const result = await controller.create(createServiceDto);

    expect(result).toEqual(
      expect.objectContaining({
        id: 'svc-1',
        slug: 'initial-consult',
        name: 'Initial Consult',
        description: 'Intro Session',
        duration_minutes: 60,
        price_amount: '2500.00',
        currency: 'PHP',
        is_active: true,
      }),
    );
  });

  it('updates an existing service', async () => {
    const updateServiceDto = {
      slug: 'updated-slug',
      name: 'Updated Service',
      description: 'Updated Description',
      duration_minutes: 90,
      price_amount: '3000.00',
      currency: 'PHP',
      is_active: true,
    };

    servicesService.update.mockResolvedValue({
      id: 'svc-1',
      ...updateServiceDto,
    });

    const result = await controller.update('svc-1', updateServiceDto);

    expect(result).toEqual(
      expect.objectContaining({
        id: 'svc-1',
        slug: 'updated-slug',
        name: 'Updated Service',
        description: 'Updated Description',
        duration_minutes: 90,
        price_amount: '3000.00',
        currency: 'PHP',
        is_active: true,
      }),
    );
  });
});

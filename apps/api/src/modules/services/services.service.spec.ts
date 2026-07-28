import { Test, TestingModule } from '@nestjs/testing';
import { ServicesService } from './services.service';
import { ServicesRepository } from './services.repository';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ConflictException, NotFoundException } from '@nestjs/common';
describe('ServicesService', () => {
  let service: ServicesService;
  const servicesRepository = {
    create: vi.fn(),
    listAll: vi.fn(),
    listActive: vi.fn(),
    findById: vi.fn(),
    findBySlug: vi.fn(),
    update: vi.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ServicesService, { provide: ServicesRepository, useValue: servicesRepository }],
    }).compile();

    service = module.get<ServicesService>(ServicesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('lists all services for management', async () => {
    servicesRepository.listAll.mockResolvedValue([
      {
        id: 'svc-1',
        slug: 'initial-consult',
        name: 'Initial Consult',
      },
    ]);

    const result = await service.listAll();
    expect(result).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'svc-1',
          slug: 'initial-consult',
          name: 'Initial Consult',
        }),
      ]),
    );
  });

  it('lists only active services for public catalog', async () => {
    servicesRepository.listActive.mockResolvedValue([
      {
        id: 'svc-1',
        slug: 'initial-consult',
        name: 'Initial Consult',
      },
    ]);

    const result = await service.listPublic();

    expect(result).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'svc-1',
          slug: 'initial-consult',
          name: 'Initial Consult',
        }),
      ]),
    );
  });

  it('gets service by id', async () => {
    servicesRepository.findById.mockResolvedValue({
      id: 'svc-1',
      slug: 'initial-consult',
      name: 'Initial Consult',
    });

    const result = await service.getById('svc-1');

    expect(servicesRepository.findById).toHaveBeenCalledWith('svc-1');
    expect(result).toEqual(
      expect.objectContaining({
        id: 'svc-1',
        slug: 'initial-consult',
        name: 'Initial Consult',
      }),
    );
  });

  it('throws not found when service does not exist', async () => {
    servicesRepository.findById.mockResolvedValue(undefined);

    await expect(service.getById('missing-id')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('creates service when slug is unique', async () => {
    servicesRepository.findBySlug.mockResolvedValue(undefined);
    servicesRepository.create.mockResolvedValue({
      id: 'svc-1',
      slug: 'initial-consult',
      name: 'Initial Consult',
    });

    const result = await service.create({
      slug: 'initial-consult',
      name: 'Initial Consult',
      description: 'Intro Session',
      duration_minutes: 60,
      price_amount: '2500.00',
      currency: 'PHP',
      is_active: true,
    });

    expect(servicesRepository.create).toHaveBeenCalledWith({
      slug: 'initial-consult',
      name: 'Initial Consult',
      description: 'Intro Session',
      duration_minutes: 60,
      price_amount: '2500.00',
      currency: 'PHP',
      is_active: true,
    });

    expect(result).toEqual(
      expect.objectContaining({
        id: 'svc-1',
        slug: 'initial-consult',
        name: 'Initial Consult',
      }),
    );
  });

  it('throws conflict when creating service with duplicate slug', async () => {
    servicesRepository.findBySlug.mockResolvedValue({
      id: 'svc-1',
      slug: 'initial-consult',
      name: 'Initial Consult',
    });

    await expect(
      service.create({
        slug: 'initial-consult',
        name: 'Initial Consult',
        description: 'Intro session',
        duration_minutes: 60,
        price_amount: '2500.00',
        currency: 'PHP',
        is_active: true,
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('updates service when found and new slug is available', async () => {
    servicesRepository.findById.mockResolvedValue({
      id: 'svc-1',
      slug: 'initial-consult',
      name: 'Initial Consultation',
    });
    servicesRepository.findBySlug.mockResolvedValue(undefined);
    servicesRepository.update.mockResolvedValue(undefined);
    servicesRepository.findById
      .mockResolvedValueOnce({
        id: 'svc-1',
        slug: 'initial-consult',
        name: 'Initial Consultation',
      })
      .mockResolvedValueOnce({
        id: 'svc-1',
        slug: 'updated-slug',
        name: 'Updated Service',
      });

    const result = await service.update('svc-1', {
      slug: 'updated-slug',
      name: 'Updated Service',
      duration_minutes: 90,
    });

    expect(servicesRepository.update).toHaveBeenCalledWith('svc-1', {
      slug: 'updated-slug',
      name: 'Updated Service',
      duration_minutes: 90,
    });

    expect(result).toEqual({
      id: 'svc-1',
      slug: 'updated-slug',
      name: 'Updated Service',
    });
  });

  it('throws conflict when updating to a slug that already exists', async () => {
    servicesRepository.findById.mockResolvedValue({
      id: 'svc-1',
      slug: 'initial-consult',
      name: 'Initial Consult',
    });

    servicesRepository.findBySlug.mockResolvedValue({
      id: 'svc-2',
      slug: 'taken-slug',
      name: 'Psych Consult',
    });

    await expect(
      service.update('svc-1', {
        slug: 'taken-slug',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('deactivates a service', async () => {
    servicesRepository.findById
      .mockResolvedValueOnce({
        id: 'svc-1',
        slug: 'initial-consult',
        is_active: true,
      })
      .mockResolvedValueOnce({
        id: 'svc-1',
        slug: 'initial-consult',
        is_active: false,
      });
    servicesRepository.update.mockResolvedValue(undefined);

    const result = await service.deactivate('svc-1');

    expect(servicesRepository.update).toHaveBeenCalledWith('svc-1', {
      is_active: false,
    });
    expect(result.is_active).toBe(false);
  });
});

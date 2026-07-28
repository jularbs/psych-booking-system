import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { ServicesRepository } from './services.repository';

@Injectable()
export class ServicesService {
  constructor(private readonly servicesRepository: ServicesRepository) {}

  listAll() {
    return this.servicesRepository.listAll();
  }

  listPublic() {
    return this.servicesRepository.listActive();
  }

  async getById(id: string) {
    const service = await this.servicesRepository.findById(id);

    if (!service) {
      throw new NotFoundException('Service not found');
    }

    return service;
  }

  async create(params: CreateServiceDto) {
    const existing = await this.servicesRepository.findBySlug(params.slug);

    if (existing) {
      throw new ConflictException('Service slug already exists');
    }

    return this.servicesRepository.create(params);
  }

  async update(id: string, params: UpdateServiceDto) {
    const existing = await this.servicesRepository.findById(id);

    if (!existing) throw new NotFoundException('Service not found');

    if (params.slug && params.slug !== existing.slug) {
      const slugOwner = await this.servicesRepository.findBySlug(params.slug);

      if (slugOwner && slugOwner.id !== id) {
        throw new ConflictException('Service slug already exists');
      }
    }

    await this.servicesRepository.update(id, params);

    return this.getById(id);
  }

  async deactivate(id: string) {
    return await this.update(id, { is_active: false });
  }
}

import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

const allowedCategoryStatuses = ['active', 'inactive'];

type NormalizedCategoryData = {
  name?: string;
  status?: string;
};

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateCategoryDto) {
    const data = this.normalizeCategoryData(dto);

    if (!data.name) {
      throw new BadRequestException('Category name is required');
    }

    return this.prisma.category
      .create({
        data: {
          name: data.name,
          status: data.status,
        },
      })
      .catch((error: unknown) => {
        this.handlePrismaError(error);
      });
  }

  findAll() {
    return this.prisma.category.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const category = await this.prisma.category.findUnique({ where: { id } });

    if (!category) {
      throw new NotFoundException(`Category ${id} not found`);
    }

    return category;
  }

  async update(id: string, dto: UpdateCategoryDto) {
    await this.findOne(id);

    const data = this.normalizeCategoryData(dto);

    return this.prisma.category
      .update({
        where: { id },
        data,
      })
      .catch((error: unknown) => {
        this.handlePrismaError(error);
      });
  }

  updateStatus(id: string, status: string) {
    return this.update(id, { status });
  }

  async remove(id: string) {
    await this.findOne(id);

    await this.prisma.category.delete({ where: { id } });

    return { id };
  }

  private normalizeCategoryData(
    dto: CreateCategoryDto | UpdateCategoryDto,
  ): NormalizedCategoryData {
    const data: NormalizedCategoryData = {};

    if (typeof dto.name === 'string') {
      data.name = dto.name.trim();

      if (!data.name) {
        throw new BadRequestException('Category name is required');
      }
    }

    if (typeof dto.status === 'string') {
      data.status = dto.status.trim().toLowerCase();

      if (!allowedCategoryStatuses.includes(data.status)) {
        throw new BadRequestException('Status must be active or inactive');
      }
    }

    return data;
  }

  private handlePrismaError(error: unknown): never {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new BadRequestException('Category name already exists');
    }

    throw error;
  }
}

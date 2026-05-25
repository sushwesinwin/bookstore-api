import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBookDto } from './dto/create-book.dto';
import { UpdateBookDto } from './dto/update-book.dto';

@Injectable()
export class BooksService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateBookDto) {
    return this.prisma.book.create({
      data: dto,
    });
  }

  findAll() {
    return this.prisma.book.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const book = await this.prisma.book.findUnique({ where: { id } });

    if (!book) {
      throw new NotFoundException(`Book ${id} not found`);
    }

    return book;
  }

  async update(id: string, dto: UpdateBookDto) {
    await this.findOne(id);

    return this.prisma.book.update({
      where: { id },
      data: dto,
    });
  }

  async updateBestSeller(id: string, isBestSeller: boolean) {
    if (typeof isBestSeller !== 'boolean') {
      throw new BadRequestException('isBestSeller must be a boolean');
    }

    await this.findOne(id);

    return this.prisma.book.update({
      where: { id },
      data: { isBestSeller },
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    await this.prisma.book.delete({ where: { id } });

    return { id };
  }
}

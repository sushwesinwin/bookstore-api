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
    const { author, categoryId, ...data } = dto;

    return this.prisma.book.create({
      data: {
        ...data,
        author: {
          connectOrCreate: {
            where: { name: author },
            create: { name: author },
          },
        },
        ...(categoryId ? { category: { connect: { id: categoryId } } } : {}),
      },
      include: { category: true },
    });
  }

  findAll() {
    return this.prisma.book.findMany({
      include: { category: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const book = await this.prisma.book.findUnique({
      where: { id },
      include: { category: true },
    });

    if (!book) {
      throw new NotFoundException(`Book ${id} not found`);
    }

    return book;
  }

  async update(id: string, dto: UpdateBookDto) {
    await this.findOne(id);
    const { author, categoryId, ...data } = dto;

    return this.prisma.book.update({
      where: { id },
      data: {
        ...data,
        ...(author
          ? {
              author: {
                connectOrCreate: {
                  where: { name: author },
                  create: { name: author },
                },
              },
            }
          : {}),
        ...(categoryId ? { category: { connect: { id: categoryId } } } : {}),
      },
      include: { category: true },
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
      include: { category: true },
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    await this.prisma.book.delete({ where: { id } });

    return { id };
  }
}

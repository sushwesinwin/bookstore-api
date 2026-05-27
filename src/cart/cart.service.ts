import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';

const cartInclude = {
  items: {
    include: {
      book: {
        include: {
          category: true,
        },
      },
    },
    orderBy: {
      createdAt: 'asc' as const,
    },
  },
};

@Injectable()
export class CartService {
  constructor(private readonly prisma: PrismaService) {}

  create() {
    return this.prisma.cart.create({
      data: {},
      include: cartInclude,
    });
  }

  async findOne(id: string) {
    const cart = await this.prisma.cart.findUnique({
      where: { id },
      include: cartInclude,
    });

    if (!cart) {
      throw new NotFoundException(`Cart ${id} not found`);
    }

    return cart;
  }

  async addItem(id: string, dto: AddCartItemDto) {
    const quantity = this.normalizeQuantity(dto.quantity ?? 1);

    if (!dto.bookId) {
      throw new BadRequestException('bookId is required');
    }

    await this.findOne(id);

    const book = await this.prisma.book.findUnique({
      where: { id: dto.bookId },
    });

    if (!book) {
      throw new NotFoundException(`Book ${dto.bookId} not found`);
    }

    const existingItem = await this.prisma.cartItem.findUnique({
      where: {
        cartId_bookId: {
          cartId: id,
          bookId: dto.bookId,
        },
      },
    });

    const nextQuantity = (existingItem?.quantity ?? 0) + quantity;
    this.assertInStock(nextQuantity, book.stock);

    if (existingItem) {
      await this.prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: nextQuantity },
      });
    } else {
      await this.prisma.cartItem.create({
        data: {
          cartId: id,
          bookId: dto.bookId,
          quantity,
        },
      });
    }

    return this.findOne(id);
  }

  async updateItem(id: string, itemId: string, dto: UpdateCartItemDto) {
    const quantity = this.normalizeQuantity(dto.quantity);
    const item = await this.findCartItem(id, itemId);

    this.assertInStock(quantity, item.book.stock);

    await this.prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity },
    });

    return this.findOne(id);
  }

  async removeItem(id: string, itemId: string) {
    await this.findCartItem(id, itemId);
    await this.prisma.cartItem.delete({ where: { id: itemId } });

    return this.findOne(id);
  }

  async clear(id: string) {
    await this.findOne(id);
    await this.prisma.cartItem.deleteMany({ where: { cartId: id } });

    return this.findOne(id);
  }

  private async findCartItem(cartId: string, itemId: string) {
    const item = await this.prisma.cartItem.findFirst({
      where: {
        id: itemId,
        cartId,
      },
      include: {
        book: true,
      },
    });

    if (!item) {
      throw new NotFoundException(`Cart item ${itemId} not found`);
    }

    return item;
  }

  private normalizeQuantity(quantity: number) {
    if (!Number.isInteger(quantity) || quantity < 1) {
      throw new BadRequestException('Quantity must be a positive integer');
    }

    return quantity;
  }

  private assertInStock(quantity: number, stock: number) {
    if (stock < 1) {
      throw new BadRequestException('Book is out of stock');
    }

    if (quantity > stock) {
      throw new BadRequestException('Quantity exceeds available stock');
    }
  }
}

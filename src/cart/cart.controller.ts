import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { CartService } from './cart.service';

@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Post()
  create() {
    return this.cartService.create();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.cartService.findOne(id);
  }

  @Post(':id/items')
  addItem(@Param('id') id: string, @Body() dto: AddCartItemDto) {
    return this.cartService.addItem(id, dto);
  }

  @Patch(':id/items/:itemId')
  updateItem(
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @Body() dto: UpdateCartItemDto,
  ) {
    return this.cartService.updateItem(id, itemId, dto);
  }

  @Delete(':id/items/:itemId')
  removeItem(@Param('id') id: string, @Param('itemId') itemId: string) {
    return this.cartService.removeItem(id, itemId);
  }

  @Delete(':id/items')
  clear(@Param('id') id: string) {
    return this.cartService.clear(id);
  }
}

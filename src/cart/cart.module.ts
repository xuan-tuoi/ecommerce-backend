import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductsModule } from 'src/products/products.module';
import { UsersModule } from 'src/users/users.module';
import { CartController } from './cart.controller';
import { CartService } from './cart.service';
import { CartEntity } from './entities/cart.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([CartEntity]),
    // KeytokenModule,
    // JwtModule.registerAsync({
    //   imports: [ConfigModule],
    //   inject: [ConfigService],
    //   useFactory: async (configService: ConfigService) => ({
    //     secret: configService.get('JWT_SECRET'),
    //     signOptions: {
    //       expiresIn: `${configService.get('JWT_EXPIRATION_TIME')}s`,
    //     },
    //   }),
    // }),
    UsersModule,
    ProductsModule,
  ],
  controllers: [CartController],
  providers: [CartService],
  exports: [CartService],
})
export class CartModule {}

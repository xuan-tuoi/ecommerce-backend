import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from './entities/user.entity';
import { User } from './user.interface';
import * as fs from 'fs';
import * as createCsvWriter from 'csv-writer';
import * as dotenv from 'dotenv';
import axios from 'axios';
import { ProductsService } from 'src/products/products.service';
import { UpdateUserDto } from './dto/update-user.dto';

dotenv.config();

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity>,
  ) {}

  async findOne(options?: object): Promise<User> {
    try {
      const user = await this.usersRepository.findOne({
        where: options,
      });
      return user;
    } catch (error) {
      throw new BadRequestException(error);
    }
  }

  async getUserById(id: string): Promise<User> {
    const user = await this.usersRepository
      .findOne({
        where: { id },
      })
      .catch((err) => {
        throw new BadRequestException(err);
      });
    if (!user) {
      throw new BadRequestException('User not found');
    }
    return user;
  }

  async createUser(userDto) {
    if (!userDto.username) {
      userDto.username = userDto.email;
    }
    const user = await this.usersRepository.save(userDto).catch((err) => {
      throw new BadRequestException(err);
    });
    return user;
  }

  async updateUser(id: string, userDto: UpdateUserDto) {
    const user = await this.getUserById(id);
    const updatedUser = await this.usersRepository
      .save({ ...user, ...userDto })
      .catch((err) => {
        throw new BadRequestException(err);
      });
    return updatedUser;
  }

  async save(user: User): Promise<User> {
    return await this.usersRepository.save(user);
  }

  async crawlDataUser() {
    try {
      const csvData = fs.readFileSync(
        'F:\\Graduation\\Backend\\beauty-ecommerce\\public\\files\\Customers.csv',
        'utf8',
      );
      const data = csvData.split(/\r?\n/);
      const headers = data[0].split(',');
      const users = [];
      for (let i = 1; i < data.length; i++) {
        const obj = {};
        const currentline = data[i].split(',');
        for (let j = 0; j < headers.length; j++) {
          obj[headers[j]] = currentline[j];
        }
        users.push(obj);
      }
      const promises = users.map(async (user, index) => {
        const username = `Customer_${user.CustomerID}`;
        const email = `${username}@gmail.com`;
        const role = 'USER';
        const avatar =
          'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS6xiTpb6Tyc-CTn4FJmXyNBuPze14R-qIJNIDHj2uQbidXRFY1Otr27ZQd69L5_drFaDY&usqp=CAU';
        const password = username + '123456';
        return await this.usersRepository
          .save({
            username: username,
            email,
            role,
            avatar,
            gender: user.Gender,
            age: user.Age,
            password,
          })
          .catch((err) => {
            // throw new BadRequestException(err);
          });
      });
      return await Promise.all(promises);
    } catch (error) {
      throw new BadRequestException(error);
    }
  }

  public async getAllCustomer() {
    try {
      const users = await this.usersRepository.find({
        where: { role: 'USER' },
      });
      return users;
    } catch (error) {
      throw new BadRequestException(error);
    }
  }

  public async getHistoryOrdersOfUser() {
    try {
      const listCategory = await this.usersRepository.query(`
      SELECT DISTINCT product_category FROM products
      `);

      const queryCategory = listCategory.map((category) => {
        return `MAX(CASE WHEN product_category = '${
          category.product_category
        }' THEN total_quantity_purchased ELSE 0 END) AS ${category.product_category.replace(
          ' ',
          '_',
        )}`;
      });

      const query = `
          SELECT  u.age, u.gender, pvt.*
              FROM Users u
              LEFT JOIN (
              SELECT user_id,
              ${queryCategory.join(',')}
          FROM (
              SELECT u.id AS user_id,
                    p.product_category AS product_category,
                    SUM(op.quantity) AS total_quantity_purchased
              FROM users u
              INNER JOIN orders o ON u.id = o.user_id
              INNER JOIN order_product op ON o.id = op.order_id
              INNER JOIN products p ON op.product_id = p.id
              GROUP BY u.id, p.product_category
          ) AS subquery
          GROUP BY user_id
      ) AS pvt ON u.id = pvt.user_id
      where u."role"='USER'
            `;
      const result = await this.usersRepository.query(query);
      // save into csv file
      const csvWriter = createCsvWriter.createObjectCsvWriter({
        path: 'F:\\Graduation\\Backend\\beauty-ecommerce\\public\\files\\history_orders.csv',
        header: [
          { id: 'age', title: 'age' },
          { id: 'gender', title: 'gender' },
          { id: 'user_id', title: 'user_id' },
          ...listCategory.map((category) => {
            return {
              id: category.product_category.toLowerCase().replace(' ', '_'),
              title: category.product_category.toLowerCase().replace(' ', '_'),
            };
          }),
        ],
      });
      await csvWriter.writeRecords(result);
      return result;
    } catch (error) {
      throw new BadRequestException(error);
    }
  }

  public async traningModel() {
    const flaskServerUrl = 'http://127.0.0.1:5000';
    const url = `${flaskServerUrl}/train`;
  }
}

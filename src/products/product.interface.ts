import { User } from 'src/users/user.interface';

export interface ProductInterface {
  id: string;
  product_listImages: string[];
  product_thumbnail: string;
  product_attribute: object;
  product_price: number;
  product_quantity: number;
  product_category: string;
  product_ratingsAverage: number;
  product_name: string;
  product_description: string;
  user: User;
  reviews: any[];
}

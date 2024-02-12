import { User } from 'src/users/user.interface';

export interface ProductInterface {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  product_thumbnail: string;
  product_attribute: object;
  product_price: number;
  product_original_price: number;
  product_quantity: number;
  product_category: string;
  product_ratingsAverage: number;
  product_name: string;
  product_description: string;
  product_status: string;
  product_listImages: string[];
  user: User;
  isDraft: boolean;
  isPublished: boolean;
  isDeleted: boolean;
  reviews: any[];
  orderProduct: any[];
}

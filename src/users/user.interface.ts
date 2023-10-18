export interface User {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  username: string;
  gender: string;
  age: string;
  password: string;
  email: string;
  status: string;
  avatar: string;
  verify: boolean;
  role: string;
  products: any[];
  reviews: any[];
  vouchers: any[];
  historyVoucher: any[];
  shopVouchers: any[];
  cart: any;
  attribute: object;
  isDeleted: boolean;
  order: any;
}

export interface Voucher {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  voucher_name: string;
  voucher_status: string;
  voucher_code: string;
  voucher_description: string;
  voucher_type: string;
  voucher_value: number;
  voucher_start_date: Date;
  voucher_end_date: Date;
  voucher_max_use: number;
  voucher_uses_count: number;
  voucher_max_use_per_user: number;
  voucher_min_order_value: number;
  buyer: any;
  voucher_scope: string;
}

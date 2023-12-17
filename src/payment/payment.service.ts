import { Injectable } from '@nestjs/common';
import { Request, Response } from 'express';
import { checkoutVNPay } from 'src/common/config/vnpay.config';
import { VNPay } from 'vn-payments';

@Injectable()
export class PaymentService {
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  constructor() {}

  TEST_CONFIG: any = VNPay.TEST_CONFIG;
  vnpay = new VNPay({
    paymentGateway: this.TEST_CONFIG.paymentGateway || '',
    merchant: this.TEST_CONFIG.merchant || '',
    secureSecret: this.TEST_CONFIG.secureSecret || '',
  });

  public async createPaymentUrl(req: Request, res: Response) {
    const userAgent = req.headers['user-agent'];
    console.log('userAgent', userAgent);

    const params: any = req.body;

    const clientIp = req.headers['X-Client-Id'];

    const amount = parseInt(params.amount.replace(/,/g, ''), 10);
    const now = new Date();

    // NOTE: only set the common required fields and optional fields from all gateways here, redundant fields will invalidate the payload schema checker
    const checkoutData = {
      amount,
      clientIp: clientIp.length > 15 ? '127.0.0.1' : clientIp,
      locale: 'vn',
      billingCity: params.billingCity || '',
      billingPostCode: params.billingPostCode || '',
      billingStateProvince: params.billingStateProvince || '',
      billingStreet: params.billingStreet || '',
      billingCountry: params.billingCountry || '',
      deliveryAddress: params.billingStreet || '',
      deliveryCity: params.billingCity || '',
      deliveryCountry: params.billingCountry || '',
      currency: 'VND',
      deliveryProvince: params.billingStateProvince || '',
      customerEmail: params.email,
      customerPhone: params.phoneNumber,
      orderId: `node-${now.toISOString()}`,
      // returnUrl: ,
      transactionId: `node-${now.toISOString()}`, // same as orderId (we don't have retry mechanism)
      customerId: params.email,
    };

    // pass checkoutData to gateway middleware via res.locals
    // res.json(checkoutData, 200);
    res.locals.checkoutData = checkoutData;

    // Note: these handler are asynchronous
    const asyncCheckout = checkoutVNPay(req, res);

    if (asyncCheckout) {
      asyncCheckout
        .then((checkoutUrl) => {
          console.log('checkoutUrl', checkoutUrl);
          res.writeHead(301, { Location: checkoutUrl.href });
          res.end();
        })
        .catch((err) => {
          res.status(500).send(err.message);
        });
    } else {
      res.status(404).json('Payment method not found');
      // res.send('Payment method not found');
    }
  }

  public async success() {
    return 'Payment success';
  }

  public async fail() {
    return 'Payment fail';
  }
}

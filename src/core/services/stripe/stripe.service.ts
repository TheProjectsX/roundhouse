import config from "@/config";
import { Injectable } from "@nestjs/common";
import Stripe from "stripe";

@Injectable()
export class StripeService {
    private stripe: Stripe;

    constructor() {
        this.stripe = new Stripe(config.stripe.secret_key, {
            apiVersion: "2025-08-27.basil", // Use the latest API version
        });
    }

    async createPaymentIntent({
        amount,
        currency,
        metadata,
    }: {
        amount: number;
        currency: string;
        metadata: Stripe.MetadataParam;
    }) {
        return await this.stripe.paymentIntents.create({
            amount: amount, // Amount in cents
            currency: currency,
            payment_method_types: ["card"],
            metadata,
        });
    }

    async createCheckoutSession({
        line_items,
        client,
        metadata,
    }: {
        line_items: Stripe.Checkout.SessionCreateParams.LineItem[];
        client: {
            id?: string;
            email?: string;
        };
        metadata: Stripe.MetadataParam;
    }) {
        return this.stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            line_items: [...line_items],
            mode: "payment",
            allow_promotion_codes: true,
            success_url: config.url.payment_success,
            cancel_url: config.url.payment_success,
            client_reference_id: client.id,
            customer_email: client.email,
            metadata: { ...metadata },
            payment_intent_data: {
                metadata: { ...metadata },
            },
        });
    }

    async createCharge(data: Stripe.ChargeCreateParams) {
        return await this.stripe.charges.create(data);
    }

    async retrieveCharge(id: string) {
        return await this.stripe.charges.retrieve(id);
    }

    async constructEvent(
        payload: string | Buffer<ArrayBufferLike>,
        sig: string,
    ): Promise<Stripe.Event> {
        const webhookSecret = config.stripe.webhook_secret;

        // console.log(sig, webhookSecret);

        return this.stripe.webhooks.constructEvent(payload, sig, webhookSecret);
    }
}

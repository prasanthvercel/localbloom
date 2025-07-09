
'use server';

import Razorpay from 'razorpay';
import crypto from 'crypto';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
const keySecret = process.env.RAZORPAY_KEY_SECRET;

if (!keyId || !keySecret) {
    console.warn("Razorpay keys are not configured. Payment will not work.");
}

const razorpayInstance = new Razorpay({
  key_id: keyId!,
  key_secret: keySecret!,
});

type CreateOrderParams = {
    amountInPaise: number;
    plan: string;
};

export async function createRazorpayOrder({ amountInPaise, plan }: CreateOrderParams) {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error("User not authenticated.");
    }
    
    if (!keyId || !keySecret) {
        throw new Error("Razorpay not configured on the server.");
    }

    const options = {
        amount: amountInPaise,
        currency: 'INR',
        receipt: `receipt_order_${new Date().getTime()}`,
        notes: {
            userId: user.id,
            plan: plan
        }
    };

    try {
        const order = await razorpayInstance.orders.create(options);
        return order;
    } catch (error) {
        console.error("Error creating Razorpay order:", error);
        return null;
    }
}


type VerifyPaymentParams = {
    orderId: string;
    paymentId: string;
    signature: string;
    plan: string;
};

export async function verifyPaymentAndUpdateProfile({ orderId, paymentId, signature, plan }: VerifyPaymentParams) {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { success: false, error: 'User not authenticated.' };
    }
    
    if (!keySecret) {
        return { success: false, error: 'Razorpay secret key not configured.' };
    }

    const body = orderId + "|" + paymentId;
    const expectedSignature = crypto
        .createHmac('sha256', keySecret)
        .update(body.toString())
        .digest('hex');

    if (expectedSignature === signature) {
        // Payment is authentic, update user profile
        const { error } = await supabase
            .from('profiles')
            .update({ subscription_tier: plan })
            .eq('id', user.id);

        if (error) {
            console.error('Error updating profile:', error);
            return { success: false, error: 'Failed to update your subscription status.' };
        }

        revalidatePath('/account');
        revalidatePath('/nutrition');
        revalidatePath('/scanner');
        
        return { success: true };
    } else {
        return { success: false, error: 'Payment verification failed.' };
    }
}

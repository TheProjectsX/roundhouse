/* eslint-disable @typescript-eslint/no-explicit-any */

import sgMail from "@sendgrid/mail";
import config from "@/config";

sgMail.setApiKey(config.sendGrid.api_key as string);

const emailSender = async ({
    email,
    subject,
    html,
}: {
    email: string;
    subject: string;
    html: string;
}) => {
    const msg = {
        to: email,
        from: config.sendGrid.sender,
        subject: subject,
        html: html,
    };

    try {
        await sgMail.send(msg);
    } catch (error: any) {
        console.error("Error sending email:", error?.response?.body);
    }
};

export default emailSender;

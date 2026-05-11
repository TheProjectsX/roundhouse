import config from "@/config";
import { Resend } from "resend";

// Initialize Resend with API key from environment variables
const resend = new Resend(config.resend.api_key);

export const resendSendEmail = async ({
    email,
    subject,
    html,
}: {
    email: string | string[];
    subject: string;
    html: string;
}) => {
    try {
        // Ensure recipients array
        const recipients = Array.isArray(email) ? email : [email];

        // Send email
        const data = await resend.emails.send({
            from: config.resend.sender,
            to: recipients,
            subject,
            html,
        });

        console.log("Email sent:", data.data.id);
    } catch (error: unknown) {
        console.error("Email sending failed:", error);
    }
};

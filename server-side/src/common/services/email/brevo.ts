import config from "@/config";

const endpoint = "https://api.brevo.com/v3/smtp/email";

export async function sendBrevoEmail({
    email,
    subject,
    html,
}: {
    email: string;
    subject: string;
    html: string;
}) {
    const payload = {
        sender: config.brevo.sender,
        to: email,
        subject: subject,
        htmlContent: html,
    };

    try {
        const response = await fetch(endpoint, {
            method: "POST",
            headers: {
                "api-key": config.brevo.api_key,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
        });

        console.log("Email sent:", await response.json());
    } catch (error) {
        console.log("Failed to send email:", error);
    }
}

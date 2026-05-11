import config from "@/config";

const baseEmailTemplate = (title: string, content: string) => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title}</title>
</head>
<body style="margin:0;padding:32px;background:#f1f5f9;font-family:Segoe UI,Tahoma,Verdana,sans-serif;color:#334155;">
    <div style="max-width:600px;margin:auto;background:#ffffff;border-radius:10px;overflow:hidden;box-shadow:0 10px 25px rgba(0,0,0,.08);">

        <div style="background:linear-gradient(135deg,#2563eb,#1e40af);padding:24px;text-align:center;">
            <h2 style="margin:0;color:#ffffff;font-size:24px;">${title}</h2>
        </div>

        <div style="padding:32px;text-align:center;">
            ${content}
        </div>

        <div style="background:#f8fafc;padding:16px;text-align:center;font-size:12px;color:#64748b;">
            This is an automated message, please do not reply.<br /><br />
            © ${new Date().getFullYear()} ${config.company_name}. All rights reserved.
        </div>

    </div>
</body>
</html>
`;

export const generateEmailVerifyTemplate = (link: string) =>
    baseEmailTemplate(
        "Verify Your Email",
        `
        <p style="font-size:15px;color:#64748b;margin-bottom:24px;">
            Please confirm your email address to complete your registration.
        </p>

        <a href="${link}"
           style="display:inline-block;padding:14px 28px;background:#2563eb;color:#ffffff;
                  text-decoration:none;border-radius:8px;font-weight:600;">
            Verify Email
        </a>

        <p style="font-size:13px;color:#64748b;margin-top:24px;">
            This link is valid for <strong>15 minutes</strong>.
        </p>
        `,
    );

export const generateVerifyOTPTemplate = (otp: string) =>
    baseEmailTemplate(
        "Verify Your Email",
        `
        <p style="font-size:15px;color:#64748b;margin-bottom:24px;">
            Use the OTP below to verify your email address:
        </p>

        <div style="display:inline-block;padding:16px 40px;background:#2563eb;color:#ffffff;
                    font-size:26px;font-weight:700;letter-spacing:4px;border-radius:8px;">
            ${otp}
        </div>

        <p style="font-size:13px;color:#64748b;margin-top:24px;">
            This code is valid for <strong>15 minutes</strong>.
        </p>
        `,
    );

export const generateForgetPasswordTemplate = (link: string) =>
    baseEmailTemplate(
        "Reset Your Password",
        `
        <p style="font-size:15px;color:#64748b;margin-bottom:24px;">
            We received a request to reset your password.
        </p>

        <a href="${link}"
           style="display:inline-block;padding:14px 28px;background:#2563eb;
                  color:#ffffff;text-decoration:none;border-radius:8px;font-weight:600;">
            Reset Password
        </a>

        <p style="font-size:13px;color:#64748b;margin-top:24px;">
            This link is valid for <strong>15 minutes</strong>.
        </p>
        `,
    );

export const generateForgotPasswordOTPTemplate = (otp: string) =>
    baseEmailTemplate(
        "Reset Your Password",
        `
        <p style="font-size:15px;color:#64748b;margin-bottom:24px;">
            Use the OTP below to continue resetting your password.
        </p>

        <div style="display:inline-block;padding:16px 40px;background:#2563eb;color:#ffffff;
                    font-size:26px;font-weight:700;letter-spacing:4px;border-radius:8px;">
            ${otp}
        </div>

        <p style="font-size:13px;color:#64748b;margin-top:24px;">
            This OTP is valid for <strong>15 minutes</strong>.
        </p>
        `,
    );

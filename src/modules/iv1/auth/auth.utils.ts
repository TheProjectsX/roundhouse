export const generateOTP = (length = 6, expiryMinutes = 15) => {
    const min = 10 ** (length - 1);
    const max = 10 ** length - 1;

    const otp = Math.floor(min + Math.random() * (max - min + 1)).toString();
    const otpExpiry = new Date(Date.now() + expiryMinutes * 60 * 1000);

    return { otp, otpExpiry };
};

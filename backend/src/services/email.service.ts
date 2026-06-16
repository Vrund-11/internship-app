import axios from "axios";

export const emailService = {
  async sendResetPasswordEmail(email: string, resetLink: string) {
    const apiKey = process.env.RESEND_API_KEY;

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #f0f0f0; border-radius: 8px;">
        <h2 style="color: #CC00BE; text-align: center;">Canovet Password Reset</h2>
        <p>Hello,</p>
        <p>We received a request to reset your password for your Canovet account. If you did not make this request, you can safely ignore this email.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetLink}" style="background-color: #CC00BE; color: white; padding: 12px 24px; text-decoration: none; font-weight: bold; border-radius: 24px; display: inline-block;">
            Reset Password
          </a>
        </div>
        <p>Or copy and paste this URL into your browser:</p>
        <p style="word-break: break-all; color: #666;"><a href="${resetLink}">${resetLink}</a></p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="font-size: 12px; color: #999; text-align: center;">
          This link will expire in 1 hour.<br/>
          Premium Pet Care Platform • Canovet
        </p>
      </div>
    `;

    if (!apiKey) {
      console.warn("\n=== [SANDBOX EMAIL FALLBACK] ===");
      console.warn(`To: ${email}`);
      console.warn("Subject: Reset your Canovet password");
      console.warn(`Reset Link: ${resetLink}`);
      console.warn("=================================\n");
      return { success: true, sandbox: true };
    }

    try {
      const response = await axios.post(
        "https://api.resend.com/emails",
        {
          from: "Canovet <onboarding@resend.dev>",
          to: [email],
          subject: "Reset your Canovet password",
          html: htmlContent,
        },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
        }
      );
      return { success: true, id: response.data?.id };
    } catch (err) {
      console.error("[EMAIL_SERVICE] Failed to send email via Resend:", err);
      throw new Error("Failed to send password reset email");
    }
  },
};

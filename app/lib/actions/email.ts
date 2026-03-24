"use server";

import DrawgetherAuthEmail from "@/app/components/email/EmailTemplate";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY!);

export async function sendVerificationEmail(
  email: string,
  token: string,
  type: "verification" | "reset",
  username: string,
) {
  try {
    const { data, error } = await resend.emails.send({
      from: "Drawgether Auth <no-reply@lukarakic.me>",
      to: email,
      subject:
        type === "verification"
          ? "Verify your email for Drawgether"
          : "Reset your Drawgether password",
      react: DrawgetherAuthEmail({
        otpCode: token,
        type,
        username,
      }),
    });

    if (error) {
      console.error("Failed to send email:", error);
      return { error: "Failed to send email" };
    }

    return { success: true };
  } catch (error) {
    console.error("Failed to send email:", error);
    return { error: "Failed to send email" };
  }
}

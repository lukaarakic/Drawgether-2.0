import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
  Tailwind,
  Img,
} from "@react-email/components";

interface DrawgetherAuthEmailProps {
  username: string;
  otpCode: string;
  type: "verification" | "reset";
}

export const DrawgetherAuthEmail = ({
  username,
  otpCode,
  type = "verification",
}: DrawgetherAuthEmailProps) => {
  const isReset = type === "reset";

  return (
    <Html>
      <Head />
      <Preview>
        {isReset
          ? "Reset your Drawgether password"
          : "Confirm your email address"}
      </Preview>
      <Tailwind>
        <Body className="bg-[#f4f4f5] my-auto mx-auto font-sans">
          <Container className="bg-white border border-solid border-[#e5e7eb] rounded-xl my-[40px] mx-auto p-[32px] w-[465px] shadow-sm">
            <Section className="text-center mb-8">
              <Img
                src="https://i.imgur.com/BCs3V2B.png"
                width="120"
                height="120"
                alt="Drawgether Logo"
              />
            </Section>

            <Section>
              <Text className="text-[#18181b] text-[16px] font-semibold">
                {isReset ? "Password Reset Request" : "Verify Your Email"}
              </Text>
              <Text className="text-[#3f3f46] text-[14px] leading-[24px]">
                Hello {username},
                {isReset
                  ? "We received a request to reset your password. Use the code below to proceed:"
                  : "To finish setting up your account and start drawing, please use the following verification code:"}
              </Text>
            </Section>

            {/* THE OTP BOX */}
            <Section className="bg-[#f9fafb] rounded-lg p-[24px] mt-[24px] mb-[24px] text-center border border-solid border-[#e5e7eb]">
              <Text className="text-[#71717a] text-[12px] uppercase tracking-widest font-bold mb-2">
                Your Security Code
              </Text>
              <Text className="text-[32px] font-mono font-bold tracking-[10px] text-blue-600 m-0">
                {otpCode}
              </Text>
            </Section>

            <Text className="text-[#71717a] text-[13px] leading-[20px]">
              This code will expire in 15 minutes. If you did not request this,
              you can safely ignore this email.
            </Text>

            <Hr className="border border-solid border-[#eaeaea] my-[26px] mx-0 w-full" />

            <Section className="text-center">
              <Text className="text-[#a1a1aa] text-[12px]">
                &copy; 2026 Drawgether 2.0 • Luka Rakić
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default DrawgetherAuthEmail;

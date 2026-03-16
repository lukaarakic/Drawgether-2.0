import {
  Body,
  Container,
  Head,
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
        <Body
          style={{
            backgroundColor: "#f0f0f0",
            fontFamily: "system-ui, sans-serif",
          }}
        >
          <Container style={{ maxWidth: "480px", margin: "40px auto" }}>
            <div
              style={{
                background: "#496eb5",
                border: "2.5px solid #212121",
                borderRadius: "12px",
                overflow: "hidden",
                boxShadow: "5px 5px 0 #212121",
              }}
            >
              <Section
                style={{
                  background: "#496eb5",
                  padding: "32px 36px 24px",
                  textAlign: "center",
                  borderBottom: "2.5px solid #212121",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{
                      fontSize: "26px",
                      fontWeight: 900,
                      color: "#de6b9b",
                      margin: 0,
                      textShadow: "2px 2px 0 #212121",
                      display: "inline",
                    }}
                  >
                    Draw
                  </Text>
                  <Text
                    style={{
                      fontSize: "26px",
                      fontWeight: 900,
                      color: "#ffffff",
                      margin: 0,
                      textShadow: "2px 2px 0 #212121",
                      display: "inline",
                    }}
                  >
                    gether
                  </Text>
                </div>
              </Section>

              <div style={{ background: "#ffffff", padding: "28px 36px 32px" }}>
                <div
                  style={{
                    display: "inline-block",
                    background: "#de6b9b",
                    border: "2px solid #212121",
                    borderRadius: "6px",
                    padding: "4px 12px",
                    fontSize: "11px",
                    fontWeight: 700,
                    color: "#ffffff",
                    letterSpacing: "1.5px",
                    textTransform: "uppercase",
                    marginBottom: "20px",
                    boxShadow: "2px 2px 0 #212121",
                  }}
                >
                  {isReset ? "Password Reset" : "Verify your email"}
                </div>

                <Text
                  style={{
                    fontSize: "15px",
                    color: "#212121",
                    lineHeight: "1.7",
                    margin: "0 0 6px",
                    fontWeight: 700,
                  }}
                >
                  Hello {username},
                </Text>
                <Text
                  style={{
                    fontSize: "14px",
                    color: "#444",
                    lineHeight: "1.8",
                    margin: "0 0 24px",
                  }}
                >
                  {isReset
                    ? "We received a request to reset your Drawgether password. Use the code below to proceed:"
                    : "To finish setting up your account and start drawing with others, please use the verification code below."}
                </Text>

                <div
                  style={{
                    background: "#496eb5",
                    border: "2.5px solid #212121",
                    borderRadius: "10px",
                    padding: "24px 20px",
                    textAlign: "center",
                    marginBottom: "20px",
                    boxShadow: "3px 3px 0 #212121",
                  }}
                >
                  <Text
                    style={{
                      fontSize: "11px",
                      fontWeight: 700,
                      color: "#c8d9f5",
                      letterSpacing: "3px",
                      textTransform: "uppercase",
                      margin: "0 0 10px",
                    }}
                  >
                    Your security code
                  </Text>
                  <Text
                    style={{
                      fontSize: "40px",
                      fontFamily: "'Courier New', monospace",
                      fontWeight: 700,
                      letterSpacing: "14px",
                      color: "#ffffff",
                      textShadow: "2px 2px 0 #212121",
                      margin: 0,
                      paddingLeft: "14px",
                    }}
                  >
                    {otpCode}
                  </Text>
                  <Text
                    style={{
                      fontSize: "11px",
                      color: "#c8d9f5",
                      fontFamily: "'Courier New', monospace",
                      margin: "10px 0 0",
                    }}
                  >
                    expires in 15 minutes
                  </Text>
                </div>

                <div
                  style={{
                    background: "#fff5f9",
                    border: "1.5px solid #de6b9b",
                    borderLeft: "4px solid #de6b9b",
                    borderRadius: "6px",
                    padding: "12px 14px",
                    marginBottom: "28px",
                  }}
                >
                  <Text
                    style={{
                      fontSize: "12px",
                      color: "#9a3a5e",
                      lineHeight: "1.6",
                      margin: 0,
                    }}
                  >
                    If you did not request this, you can safely ignore this
                    email. Never share your code with anyone.
                  </Text>
                </div>

                <div
                  style={{
                    borderTop: "2px solid #212121",
                    paddingTop: "16px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{
                      fontSize: "11px",
                      color: "#888",
                      fontFamily: "'Courier New', monospace",
                      margin: 0,
                    }}
                  >
                    drawgether.app
                  </Text>
                  <Text style={{ fontSize: "11px", color: "#aaa", margin: 0 }}>
                    &copy; 2026 Drawgether 2.0 &bull; Luka Rakić
                  </Text>
                </div>
              </div>
            </div>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default DrawgetherAuthEmail;

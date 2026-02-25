import z from "zod";

const VerifySchema = z.object({
  token: z.string().length(6, "Invalid verification code"),
});

export async function Verify(prevState: any, formData: FormData) {
  //

  const result = VerifySchema.safeParse(Object.fromEntries(formData));

  if (!result.success) {
    return {
      errors: result.error.flatten().fieldErrors,
      message: "Something went wrong",
    };
  }
}

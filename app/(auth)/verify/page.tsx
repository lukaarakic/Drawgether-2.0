/* eslint-disable react/no-unescaped-entities */
import BoxButton from "@/app/components/ui/BoxButton";
import HoneypotField from "@/app/components/ui/HoneypotField";

const Verify = () => {
  return (
    <div className="flex flex-col items-center md:-mt-20">
      <div className="mb-20 text-center">
        <h1
          className="text-border md:text-border-lg block text-45 text-white md:text-90"
          data-text="Check your email"
        >
          Check your email
        </h1>
        <p
          className="text-border md:text-border-lg text-22 text-white opacity-90 md:-mt-4 md:text-40"
          data-text="We've sent you a code to verify your email adderss"
        >
          We've sent you a code to verify your email adderss
        </p>
      </div>

      <form>
        <HoneypotField />
        <div className="flex flex-col items-center xs:flex-row">
          <div className="text-center">
            <input
              type="text"
              className="input mb-4 w-full md:w-220"
              placeholder="Your code goes here"
            />
          </div>

          <BoxButton
            type="submit"
            className="ml-8 h-min w-min"
            // disabled={isPending}
          >
            <p className="px-8 py-1 text-40">Submit</p>
          </BoxButton>
        </div>
      </form>
      {/* <ErrorList errors={form.errors} id={form.errorId} /> */}
    </div>
  );
};
export default Verify;

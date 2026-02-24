export default function HoneypotField() {
  return (
    <div className="sr-only" aria-hidden="true">
      <label htmlFor="hp_email">Do not fill this field</label>
      <input
        id="hp_email"
        type="text"
        name="hp_email"
        tabIndex={-1}
        autoComplete="off"
      />
    </div>
  );
}

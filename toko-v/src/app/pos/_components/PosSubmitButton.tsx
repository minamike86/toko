type PosSubmitButtonProps = {
  disabled: boolean;
  isSubmitting: boolean;
  onSubmit: () => void;
};

export function PosSubmitButton({
  disabled,
  isSubmitting,
  onSubmit,
}: PosSubmitButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onSubmit}
      className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
    >
      {isSubmitting ? "Menyimpan order..." : "Buat Order"}
    </button>
  );
}
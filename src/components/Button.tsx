interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  type?: 'button' | 'submit';
  disabled?: boolean;
  fullWidth?: boolean;
  ariaLabel?: string;
}

export function Button({
  children,
  onClick,
  variant = 'primary',
  type = 'button',
  disabled = false,
  fullWidth = false,
  ariaLabel,
}: ButtonProps) {
  const classes = ['ts-btn', `ts-btn--${variant}`];
  if (fullWidth) classes.push('ts-btn--full');
  if (disabled) classes.push('ts-btn--disabled');

  return (
    <button
      type={type}
      className={classes.join(' ')}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
    >
      {children}
    </button>
  );
}

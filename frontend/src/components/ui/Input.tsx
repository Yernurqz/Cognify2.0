import React from 'react';
import styles from './Input.module.css';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', icon, ...props }, ref) => {
    return (
      <div className={`${styles.container} ${className}`}>
        {label && <label className={styles.label}>{label}</label>}
        <div className={styles.inputWrapper}>
          {icon && <span className={styles.icon}>{icon}</span>}
          <input
            ref={ref}
            className={`${styles.input} ${icon ? styles.hasIcon : ''}`}
            {...props}
          />
        </div>
        {error && <span className={styles.errorInfo}>{error}</span>}
      </div>
    );
  }
);

Input.displayName = 'Input';

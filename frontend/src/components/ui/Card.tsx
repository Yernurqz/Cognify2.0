import React from 'react';
import styles from './Card.module.css';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  interactive?: boolean;
}

export const Card = ({ children, className = '', interactive = false, ...props }: CardProps) => {
  return (
    <div className={`${styles.card} ${interactive ? styles.interactive : ''} ${className}`} {...props}>
      {children}
    </div>
  );
};

export const CardHeader = ({ children, className = '', ...props }: CardProps) => (
  <div className={`${styles.header} ${className}`} {...props}>{children}</div>
);

export const CardTitle = ({ children, className = '', ...props }: CardProps) => (
  <h3 className={`${styles.title} ${className}`} {...props}>{children}</h3>
);

export const CardSubtitle = ({ children, className = '', ...props }: CardProps) => (
  <p className={`${styles.subtitle} ${className}`} {...props}>{children}</p>
);

export const CardBody = ({ children, className = '', ...props }: CardProps) => (
  <div className={`${styles.body} ${className}`} {...props}>{children}</div>
);

export const CardFooter = ({ children, className = '', ...props }: CardProps) => (
  <div className={`${styles.footer} ${className}`} {...props}>{children}</div>
);

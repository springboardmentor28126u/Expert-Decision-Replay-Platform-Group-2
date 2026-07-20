import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hoverable?: boolean;
}

const Card: React.FC<CardProps> = ({
  children,
  className = '',
  onClick,
  hoverable = false,
}) => {
  return (
    <div
      onClick={onClick}
      className={`glass-card ${
        hoverable
          ? 'hover:-translate-y-0.5 hover:border-border-hover hover:bg-surface-hover/50 cursor-pointer shadow-sm hover:shadow-md'
          : ''
      } ${className}`}
    >
      {children}
    </div>
  );
};

export default Card;

import { cn } from '@/lib/utils';
import React from 'react';

enum VaraintColor {
  orange = 'orange',
  blue = 'blue',
  green = 'green',
}

const GlowButton = ({
  children,
  variant = VaraintColor.orange,
  className,
  onClick,
  type = 'button',
}: {
  children: React.ReactNode;
  variant?: string;
  disableChevron?: boolean;
  className?: string;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
}) => {
  return (
    <button
      type={type}
      onClick={onClick}
      className={cn(
        "font-poppins relative flex items-center overflow-hidden rounded-[1.1rem] border px-4 font-extralight text-blue-50 before:absolute before:inset-0 before:z-20 before:rounded-[1rem] before:content-[''] after:absolute after:inset-0 after:z-10 after:rounded-[1rem] after:[box-shadow:0_0_15px_-1px_#ffffff90_inset] after:content-[''] hover:opacity-[0.90]",
        variant === VaraintColor.orange
          ? 'border-[#f8d4b3]/80 bg-[#DE732C] [box-shadow:0_0_100px_-10px_#DE732C] before:[box-shadow:0_0_4px_-1px_#fff_inset]'
          : variant === VaraintColor.blue
            ? 'border-[#9ec4ff]/90 bg-[#126fff] [box-shadow:0_0_100px_-10px_#0165FF] before:[box-shadow:0_0_7px_-1px_#d5e5ff_inset]'
            : 'border-[#c0f1d3]/70 bg-[#176635] [box-shadow:0_0_100px_-10px_#21924c] before:[box-shadow:0_0_7px_-1px_#91e6b2_inset]',
        className
      )}
    >
      <p>{children}</p>
    </button>
  );
};

export default GlowButton;

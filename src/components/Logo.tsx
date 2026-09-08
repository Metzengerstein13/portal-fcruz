import React from 'react';
import logoImage from '../assets/logo-cruz.png';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showSubtitle?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ 
  className = '', 
  size = 'md',
}) => {
  const sizeMap = {
    sm: 'h-8 sm:h-9',
    md: 'h-10 sm:h-12',
    lg: 'h-14 sm:h-16',
    xl: 'h-20 sm:h-24'
  };

  const currentHeight = sizeMap[size];

  return (
    <div className={`inline-flex items-center select-none ${className}`}>
      <img 
        src={logoImage} 
        alt="Logo Ferretería Cruz" 
        className={`${currentHeight} w-auto object-contain`}
      />
    </div>
  );
};






import React from 'react';
import { motion } from 'framer-motion';

interface BrandLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
}

const BrandLogo: React.FC<BrandLogoProps> = ({ 
  className = '', 
  size = 'md',
  animated = true
}) => {
  // Size mappings
  const sizeMap = {
    sm: 'h-8',
    md: 'h-12',
    lg: 'h-16'
  };

  const iconVariants = {
    initial: { scale: 0.9, opacity: 0 },
    animate: { 
      scale: 1, 
      opacity: 1,
      transition: { duration: 0.5 }
    }
  };

  const pathVariants = {
    initial: { pathLength: 0 },
    animate: { 
      pathLength: 1,
      transition: { duration: 1, delay: 0.2, ease: "easeInOut" }
    }
  };

  const textVariants = {
    initial: { opacity: 0, y: 5 },
    animate: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.5, delay: 0.7 }
    }
  };

  return (
    <motion.div 
      className={`flex items-center ${className}`}
      initial={animated ? "initial" : "animate"}
      animate="animate"
      variants={iconVariants}
    >
      <div className={`relative ${sizeMap[size]}`}>
        {/* Use the SVG logo style with the colors from the uploaded image */}
        <motion.svg 
          viewBox="0 0 240 80" 
          className={`${sizeMap[size]}`}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          width={(size === 'sm' ? 120 : size === 'md' ? 180 : 240)}
          height={(size === 'sm' ? 40 : size === 'md' ? 60 : 80)}
        >
          <motion.text
            x="10"
            y="60"
            fontFamily="Arial"
            fontWeight="bold"
            fontSize="60"
            fill="#ffc821" // Gold/yellow color
            variants={animated ? pathVariants : {}}
          >
            Tath
          </motion.text>
          <motion.text
            x="120"
            y="60"
            fontFamily="Arial"
            fontWeight="bold"
            fontSize="60"
            fill="#ffffff" // White color
            variants={animated ? pathVariants : {}}
          >
            kart
          </motion.text>
          <motion.circle
            cx="190"
            cy="65"
            r="10"
            fill="#ffffff" // White color
            variants={animated ? pathVariants : {}}
          />
          <motion.circle
            cx="230"
            cy="65"
            r="10"
            fill="#ffffff" // White color
            variants={animated ? pathVariants : {}}
          />
        </motion.svg>
      </div>
    </motion.div>
  );
};

export default BrandLogo;

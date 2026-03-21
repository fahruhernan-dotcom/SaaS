import React from 'react';
import { motion } from 'framer-motion';

const LoadingScreen = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="fixed inset-0 bg-[#06090F] z-[9999] flex flex-col items-center justify-center gap-5"
    >
      {/* CSS Keyframes for the sweep animation */}
      <style>
        {`
          @keyframes sweep {
            0% { left: -70px; }
            100% { left: 170px; }
          }
        `}
      </style>

      {/* Logo Row */}
      <div className="flex items-center gap-[7px]">
        {/* Logo Box */}
        <div className="w-[22px] h-[22px] bg-[#10B981] rounded-md flex items-center justify-center">
          <div className="w-[10px] h-[10px] bg-[#06090F] rounded opacity-70" />
        </div>
        
        {/* Text */}
        <span className="font-display text-[14px] font-semibold text-[#F1F5F9] tracking-[-0.2px]">
          TernakOS
        </span>
      </div>

      {/* Sweep Line */}
      <div className="w-[100px] h-[2px] bg-[#162230] rounded overflow-hidden relative">
        <div 
          className="absolute top-0 bottom-0 w-[70px]"
          style={{
            background: 'linear-gradient(90deg, transparent, #34D399, transparent)',
            animation: 'sweep 2s linear infinite'
          }}
        />
      </div>
    </motion.div>
  );
};

export default LoadingScreen;

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';

const modules = [
  {
    title: 'Payroll ',
    description: 'Employee Record Management database here',
    icon: 'https://cdn-icons-png.flaticon.com/512/1256/1256650.png',
    path: '/dashboard'
  },
  {
    title: 'Revenue',
    description: 'Track and Manage Finances',
    icon: 'https://cdn-icons-png.flaticon.com/512/2830/2830312.png',
    path: '/dashboard/payroll'
  },
  {
    title: 'Security',
    description: 'Manage security related activities here',
    icon: 'https://cdn-icons-png.flaticon.com/512/2888/2888407.png',
    path: '/dashboard/settings/security'
  },
  {
    title: 'Settings',
    description: 'Configure system settings',
    icon: 'https://cdn-icons-png.flaticon.com/512/126/126472.png',
    path: '/dashboard/settings'
  },
];

function Landing() {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = React.useState(1);
  const [direction, setDirection] = React.useState(0);

  const getVisibleModules = () => {
    const visibleIndexes = [];
    for (let i = -2; i <= 2; i++) {
      const index = (currentIndex + i + modules.length) % modules.length;
      visibleIndexes.push({ index, offset: i });
    }
    return visibleIndexes;
  };

  const navigateSlide = (newDirection: number) => {
    setDirection(newDirection);
    setCurrentIndex((prev) => {
      const nextIndex = prev + newDirection;
      if (nextIndex < 0) return modules.length - 1;
      if (nextIndex >= modules.length) return 0;
      return nextIndex;
    });
  };

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0,
      scale: 0.5,
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 1000 : -1000,
      opacity: 0,
      scale: 0.5,
    }),
  };

  return (
    <div className="min-h-screen w-full bg-gray-50 flex flex-col items-center justify-center pt-16">
      <div className="w-full max-w-[1600px] mx-auto flex flex-col items-center px-4">
        <h1 className="text-4xl font-bold text-gray-800 mb-16">CHOOSE A MODULE</h1>
        
        <div className="relative w-full flex items-center justify-center mb-16">
          <button
            onClick={() => navigateSlide(-1)}
            className="absolute left-4 lg:left-20 z-30 p-3 rounded-full bg-white shadow-md hover:shadow-lg transition-all duration-300"
          >
            <ChevronLeftIcon className="h-6 w-6 text-emerald-500" />
          </button>

          <div className="relative flex items-center justify-center w-full h-[460px] overflow-hidden">
            <AnimatePresence initial={false} custom={direction} mode="popLayout">
              {getVisibleModules().map(({ index, offset }) => {
                const module = modules[index];
                const xOffset = offset * 320;
                const zIndex = 20 - Math.abs(offset);
                const opacity = offset === 0 ? 1 : 0.65;
                const scale = offset === 0 ? 1 : 0.9;
                
                return (
                  <motion.div
                    key={`${module.title}-${offset}`}
                    custom={direction}
                    variants={variants}
                    initial="enter"
                    animate={{
                      x: xOffset,
                      scale,
                      opacity,
                      zIndex,
                    }}
                    exit="exit"
                    transition={{
                      x: { type: "spring", stiffness: 300, damping: 30 },
                      opacity: { duration: 0.2 },
                      scale: { duration: 0.2 }
                    }}
                    style={{ 
                      position: 'absolute',
                      boxShadow: offset === 0 ? '0 4px 20px rgba(0, 0, 0, 0.1)' : '0 2px 10px rgba(0, 0, 0, 0.05)'
                    }}
                    className={`w-[300px] h-[400px] bg-white rounded-2xl p-8 flex flex-col items-center justify-center transform border-2 border-emerald-500
                              ${offset === 0 ? 'ring-2 ring-emerald-500 ring-opacity-90' : ''}`}
                  >
                    <div className="w-28 h-28 mb-6 rounded-full bg-emerald-50 flex items-center justify-center p-6">
                      <img 
                        src={module.icon} 
                        alt={module.title} 
                        className="w-full h-full object-contain"
                        style={{ filter: 'brightness(0) saturate(100%) invert(72%) sepia(67%) saturate(458%) hue-rotate(118deg) brightness(90%) contrast(87%)' }}
                      />
                    </div>
                    <h2 className="text-2xl font-semibold text-emerald-600 mb-3">{module.title}</h2>
                    <p className="text-base text-gray-600 text-center mb-8">{module.description}</p>
                    <button 
                      onClick={() => navigate(module.path)}
                      className="bg-emerald-500 text-white px-10 py-2.5 rounded-full text-lg font-medium 
                               hover:bg-emerald-600 transition-all duration-300 shadow-sm hover:shadow-md 
                               w-full max-w-[180px] transform hover:scale-[1.02]"
                    >
                      Enter
                    </button>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          <button
            onClick={() => navigateSlide(1)}
            className="absolute right-4 lg:right-20 z-30 p-3 rounded-full bg-white shadow-md hover:shadow-lg transition-all duration-300"
          >
            <ChevronRightIcon className="h-6 w-6 text-emerald-500" />
          </button>
        </div>

        <div className="text-sm text-emerald-600 text-center">
          Powered by Century Information Systems. All rights Reserved
        </div>
        <div className="text-sm text-gray-400 mt-1">
          Version 1.0
        </div>
      </div>
    </div>
  );
}

export default Landing;

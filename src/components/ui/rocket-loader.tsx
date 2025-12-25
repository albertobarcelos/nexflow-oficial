import { motion } from "framer-motion";

interface RocketLoaderProps {
  className?: string;
}

/**
 * Componente de animação de foguete SVG para carregamento
 */
export function RocketLoader({ className }: RocketLoaderProps) {
  return (
    <div className={`flex flex-col items-center justify-center ${className || ""}`}>
      <motion.div
        initial={{ y: 0, rotate: 0 }}
        animate={{
          y: [-10, -30, -10],
          rotate: [0, 5, -5, 0],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="relative"
      >
        <svg
          width="80"
          height="120"
          viewBox="0 0 80 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="drop-shadow-lg"
        >
          {/* Corpo do foguete */}
          <motion.path
            d="M40 20 L50 60 L40 100 L30 60 Z"
            fill="url(#rocketGradient)"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1 }}
          />
          
          {/* Janela do foguete */}
          <circle cx="40" cy="50" r="8" fill="#60A5FA" opacity="0.8" />
          
          {/* Asas */}
          <path
            d="M30 60 L20 70 L30 75 Z"
            fill="#3B82F6"
            opacity="0.7"
          />
          <path
            d="M50 60 L60 70 L50 75 Z"
            fill="#3B82F6"
            opacity="0.7"
          />
          
          {/* Chama */}
          <motion.g
            animate={{
              opacity: [0.6, 1, 0.6],
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 0.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <path
              d="M35 100 Q40 110 45 100 Q40 115 35 100"
              fill="#F59E0B"
              opacity="0.9"
            />
            <path
              d="M35 100 Q40 105 45 100 Q40 110 35 100"
              fill="#FBBF24"
              opacity="0.7"
            />
            <path
              d="M38 100 Q40 108 42 100 Q40 112 38 100"
              fill="#FCD34D"
              opacity="0.8"
            />
          </motion.g>
          
          {/* Estrelas de fundo */}
          <motion.circle
            cx="15"
            cy="25"
            r="2"
            fill="#FCD34D"
            animate={{
              opacity: [0.3, 1, 0.3],
              scale: [1, 1.5, 1],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              delay: 0,
            }}
          />
          <motion.circle
            cx="65"
            cy="35"
            r="1.5"
            fill="#FCD34D"
            animate={{
              opacity: [0.3, 1, 0.3],
              scale: [1, 1.5, 1],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              delay: 0.5,
            }}
          />
          <motion.circle
            cx="20"
            cy="90"
            r="1.5"
            fill="#FCD34D"
            animate={{
              opacity: [0.3, 1, 0.3],
              scale: [1, 1.5, 1],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              delay: 1,
            }}
          />
          
          {/* Gradiente para o corpo do foguete */}
          <defs>
            <linearGradient id="rocketGradient" x1="40" y1="20" x2="40" y2="100" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#60A5FA" />
              <stop offset="50%" stopColor="#3B82F6" />
              <stop offset="100%" stopColor="#2563EB" />
            </linearGradient>
          </defs>
        </svg>
      </motion.div>
      
      {/* Texto de carregamento */}
      <motion.p
        className="mt-4 text-sm text-muted-foreground"
        animate={{
          opacity: [0.5, 1, 0.5],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        Carregando oportunidades...
      </motion.p>
    </div>
  );
}

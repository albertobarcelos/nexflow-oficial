import { motion } from "framer-motion";

export function CardCelebrationSparkles() {
  return (
    <motion.div
      className="pointer-events-none absolute inset-0 rounded-2xl border-2 border-amber-300/60"
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: [0, 1, 0], scale: [0.85, 1.15, 1.35] }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.9 }}
    >
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-amber-200/30 via-transparent to-sky-200/30 blur-sm" />
      <motion.span
        className="absolute right-4 top-3 h-1.5 w-1.5 rounded-full bg-white"
        initial={{ scale: 0 }}
        animate={{ scale: [0, 1, 0], opacity: [0, 1, 0] }}
        transition={{ duration: 0.8 }}
      />
      <motion.span
        className="absolute left-4 bottom-4 h-2 w-2 rounded-full bg-white/80"
        initial={{ scale: 0 }}
        animate={{ scale: [0, 1, 0], opacity: [0, 1, 0] }}
        transition={{ duration: 0.9, delay: 0.1 }}
      />
    </motion.div>
  );
}


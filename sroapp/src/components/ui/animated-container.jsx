import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

const fadeInUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

const noMotion = {
  initial: { opacity: 1 },
  animate: { opacity: 1 },
  exit: { opacity: 1 },
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.06,
    },
  },
};

const noStagger = {
  animate: {},
};

function AnimatedContainer({ className, children, delay = 0, ...props }) {
  const prefersReduced = useReducedMotion();
  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={prefersReduced ? noMotion : fadeInUp}
      transition={prefersReduced ? { duration: 0 } : { duration: 0.3, ease: "easeOut", delay }}
      className={cn(className)}
      {...props}
    >
      {children}
    </motion.div>
  );
}

function StaggerContainer({ className, children, ...props }) {
  const prefersReduced = useReducedMotion();
  return (
    <motion.div
      initial="initial"
      animate="animate"
      variants={prefersReduced ? noStagger : staggerContainer}
      className={cn(className)}
      {...props}
    >
      {children}
    </motion.div>
  );
}

function StaggerItem({ className, children, ...props }) {
  const prefersReduced = useReducedMotion();
  return (
    <motion.div
      variants={prefersReduced ? noMotion : fadeInUp}
      transition={prefersReduced ? { duration: 0 } : { duration: 0.3, ease: "easeOut" }}
      className={cn(className)}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export { AnimatedContainer, StaggerContainer, StaggerItem, fadeInUp, staggerContainer };

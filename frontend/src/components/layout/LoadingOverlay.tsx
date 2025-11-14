import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { WelcomeScreen } from "@/components/WelcomeScreen";

interface LoadingOverlayProps {
  isLoading: boolean;
  progress: number;
}

export function LoadingOverlay({ isLoading, progress }: LoadingOverlayProps) {
  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          key="welcome-screen"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="absolute inset-0 z-50"
        >
          <WelcomeScreen progress={progress} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

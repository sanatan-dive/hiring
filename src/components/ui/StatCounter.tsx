import { useMotionValue, useTransform, animate, useInView } from "framer-motion";
import React, { useEffect, useState, useRef } from "react";

const StatCounter = ({
  value,
  suffix = "",
}: {
  value: number;
  suffix?: string;
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "0px 0px -100px 0px" }); 
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => Math.floor(latest));
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (isInView) {
      const controls = animate(count, value, {
        duration: 2,
        ease: "easeOut",
      });

      return controls.stop;
    }
  }, [isInView, value, count]);

  useEffect(() => {
    const unsubscribe = rounded.on("change", (latest) => {
      setDisplayValue(latest);
    });
    return unsubscribe;
  }, [rounded]);

  return (
    <div 
      ref={ref}
      className="text-3xl sm:text-4xl font-bold text-blue-600 mb-2"
    >
      {displayValue}
      {suffix}
    </div>
  );
};

export default StatCounter;

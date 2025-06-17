"use client";

import React, { useEffect, useState, JSX } from "react";
import { motion } from "motion/react";

function getRandomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomColor() {
  const colors = [
    "pink",
    "purple",
    "blue",
    "teal",
    "cyan",
    "yellow",
    "orange",
    "red",
  ];
  return colors[getRandomInt(0, colors.length - 1)];
}

function getRandomShape() {
  const shapes = ["circle", "square", "triangle"];
  return shapes[getRandomInt(0, shapes.length - 1)];
}

// Initial static shapes for SSR
const initialShapes = Array.from({ length: 3 }).map((_, index) => (
  <div
    key={index}
    className="blur-3xl animate-pulse absolute"
    style={{
      top: "20%",
      left: "30%",
      width: "400px",
      height: "400px",
      background: "linear-gradient(to right, purple, blue, teal)",
      animation: "gradientAnimation 5s ease infinite",
    }}
  ></div>
));

export default function Background() {
  const [shapes, setShapes] = useState<JSX.Element[]>(initialShapes);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);

    const generatedShapes = Array.from({ length: 3 }).map((_, index) => {
      const size = getRandomInt(300, 600);
      const fromColor = getRandomColor();
      const viaColor = getRandomColor();
      const toColor = getRandomColor();
      const shape = getRandomShape();

      const shapeStyle: React.CSSProperties = {
        top: `${getRandomInt(0, 70)}%`,
        left: `${getRandomInt(0, 100)}%`,
        width: `${size}px`,
        height: `${size}px`,
        background: `linear-gradient(to right, ${fromColor}, ${viaColor}, ${toColor})`,
        animation: `gradientAnimation 5s ease infinite`,
      };

      if (shape === "circle") {
        shapeStyle.borderRadius = "50%";
      } else if (shape === "triangle") {
        shapeStyle.width = 0;
        shapeStyle.height = 0;
        shapeStyle.borderLeft = `${size / 2}px solid transparent`;
        shapeStyle.borderRight = `${size / 2}px solid transparent`;
        shapeStyle.borderBottom = `${size}px solid ${fromColor}`;
        shapeStyle.background = "none";
      }

      return (
        <div
          key={index}
          className="blur-3xl animate-pulse absolute"
          style={shapeStyle}
        ></div>
      );
    });

    setShapes(generatedShapes);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, delay: 1.6 }}
      className="absolute inset-0 -z-10 overflow-hidden"
    >
      {isMounted ? shapes : initialShapes}
    </motion.div>
  );
}

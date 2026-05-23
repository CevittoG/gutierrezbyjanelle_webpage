"use client";

import React from "react";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { cn } from "@/utils";
import { Button } from "@/components/ui/button";

interface StationeryHeroProps {
  title: React.ReactNode;
  description: React.ReactNode;
  buttonText: string;
  buttonLink: string;
  /** First vertical card image (front — invitation). */
  imageUrl1: string;
  /** Second vertical card image (back). */
  imageUrl2: string;
  className?: string;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.2 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const cardsVariants = {
  hidden: { opacity: 0, x: 50 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.8, ease: "easeOut", staggerChildren: 0.3 },
  },
};

const cardItemVariants = {
  hidden: { opacity: 0, x: 50 },
  visible: { opacity: 1, x: 0 },
};

export const StationeryHero = ({
  title,
  description,
  buttonText,
  buttonLink,
  imageUrl1,
  imageUrl2,
  className,
}: StationeryHeroProps) => {
  return (
    <section
      className={cn(
        "relative w-full overflow-hidden text-foreground",
        className
      )}
    >
      <motion.div
        className="relative max-w-6xl mx-auto flex min-h-[80vh] items-center justify-center px-8 md:px-12 py-20 lg:flex-row flex-col gap-12 lg:gap-20"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        {/* Left: Text — right-aligned so it leans toward the cards */}
        <div className="flex flex-col items-center text-center lg:items-end lg:text-right lg:w-1/2 lg:max-w-lg">
          <motion.h1
            className="font-squarepeg text-5xl leading-tight sm:text-6xl md:text-7xl text-balance"
            variants={itemVariants}
          >
            {title}
          </motion.h1>
          <motion.p
            className="mt-6 max-w-lg text-lg text-foreground/80 leading-relaxed"
            variants={itemVariants}
          >
            {description}
          </motion.p>
          <motion.div variants={itemVariants} className="mt-8">
            <Button asChild size="lg" className="h-12 px-8 text-base">
              <a href={buttonLink}>
                {buttonText}
                <ArrowRight className="ml-2 h-5 w-5" />
              </a>
            </Button>
          </motion.div>
        </div>

        {/* Right: Two vertical cards side by side, left smaller than right */}
        <motion.div
          className="lg:w-1/2 w-full flex items-center justify-center py-8"
          variants={cardsVariants}
        >
          <div className="flex flex-row items-center">
            {/* Left card — smaller */}
            <motion.img
              src={imageUrl1}
              alt="Invitation design"
              variants={cardItemVariants}
              whileHover={{ y: -10, rotate: -5, transition: { duration: 0.3 } }}
              className="h-[17rem] w-44 md:h-[22rem] md:w-56 rounded-xl shadow-2xl object-cover rotate-[-3deg] relative z-10 cursor-pointer"
            />
            {/* Right card — larger, slight overlap */}
            <motion.img
              src={imageUrl2}
              alt="Stationery design"
              variants={cardItemVariants}
              whileHover={{ y: -10, rotate: 5, transition: { duration: 0.3 } }}
              className="h-72 w-48 md:h-96 md:w-64 rounded-xl shadow-2xl object-cover rotate-[3deg] -ml-6 md:-ml-8 cursor-pointer"
            />
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
};

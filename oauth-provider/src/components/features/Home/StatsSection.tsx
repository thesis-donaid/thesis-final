"use client"
import { Users, Heart, Globe, Award } from 'lucide-react'
import { useRef, useState, useEffect } from "react";
import { LucideProps } from "lucide-react";
import { ForwardRefExoticComponent, RefAttributes } from "react";

interface StatItem {
  icon: ForwardRefExoticComponent<Omit<LucideProps, "ref"> & RefAttributes<SVGSVGElement>>;
  value: number;
  label: string;
  suffix?: string;
}

interface AnimatedCounterProps {
  value: number;
  isVisible: boolean;
  duration?: number;
}

function Counter({ value, isVisible, duration = 2000 }: AnimatedCounterProps) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isVisible) return;
    let startTime: number | null = null;
    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 4);
      setCount(Math.floor(eased * value));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [isVisible, value, duration]);

  return <span>{count}</span>;
}

export default function StatsSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  const stats: StatItem[] = [
    { icon: Users, value: 1000, label: "People Helped", suffix: "+" },
    { icon: Heart, value: 250, label: "Volunteers", suffix: "+" },
    { icon: Globe, value: 15, label: "Communities", suffix: "+" },
    { icon: Award, value: 21, label: "Years of Service", suffix: "+" },
  ];

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setIsVisible(true); },
      { threshold: 0.3 }
    );
    const el = sectionRef.current;
    if (el) observer.observe(el);
    return () => { if (el) observer.unobserve(el); };
  }, []);

  return (
    <section ref={sectionRef} className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="group relative flex flex-col items-center justify-center text-center p-8 rounded-2xl border border-red-100 bg-white shadow-sm hover:shadow-md hover:border-red-300 transition-all duration-300"
            >
              {/* Top accent bar */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-[3px] rounded-full bg-red-600 group-hover:w-16 transition-all duration-300" />

              {/* Icon */}
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50 border border-red-100 group-hover:bg-red-600 transition-colors duration-300">
                <stat.icon
                  className="h-6 w-6 text-red-600 group-hover:text-white transition-colors duration-300"
                  strokeWidth={1.8}
                />
              </div>

              {/* Number */}
              <div className="text-4xl font-bold text-gray-900 leading-none">
                <Counter value={stat.value} isVisible={isVisible} />
                <span className="text-red-500">{stat.suffix}</span>
              </div>

              {/* Label */}
              <p className="mt-2 text-sm text-gray-500 font-medium tracking-wide">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
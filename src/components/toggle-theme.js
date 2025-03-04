"use client";

import React from "react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

export default function ThemeToggle() {
  const { setTheme, theme } = useTheme();

  return (
    <div className="flex items-center border dark:border-gray-700 dark:bg-gray-800 rounded-full p-1">
      <Button
        variant="ghost"
        size="icon"
        className={`rounded-full hover:bg-muted ${
          theme === "light"
            ? "bg-[#3673F5] hover:bg-[#3673F5] text-white hover:text-white"
            : ""
        }`}
        onClick={() => setTheme("light")}
      >
        <SunIcon className="h-5 w-5" />
        <span className="sr-only">Light mode</span>
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className={`rounded-full hover:bg-muted ${
          theme === "dark"
            ? "bg-[#3673F5] hover:bg-[#3673F5] text-white hover:text-white"
            : ""
        }`}
        onClick={() => setTheme("dark")}
      >
        <MoonIcon className="h-5 w-5" />
        <span className="sr-only">Dark mode</span>
      </Button>
    </div>
  );
}

// Custom Sun icon component using the provided SVG
const SunIcon = ({ className }) => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <g clipPath="url(#clip0_sun)">
      <path
        d="M10 17.5V19.1667"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M15.3 15.3L16.4834 16.4833"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M3.51672 16.4833L4.70006 15.3"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M17.5 10H19.1667"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M0.833374 10H2.50004"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10 14.1666C12.3012 14.1666 14.1667 12.3012 14.1667 9.99998C14.1667 7.69879 12.3012 5.83331 10 5.83331C7.69885 5.83331 5.83337 7.69879 5.83337 9.99998C5.83337 12.3012 7.69885 14.1666 10 14.1666Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M15.3 4.7L16.4834 3.51666"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M3.51672 3.51666L4.70006 4.7"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10 0.833313V2.49998"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </g>
    <defs>
      <clipPath id="clip0_sun">
        <rect width="20" height="20" fill="currentColor" />
      </clipPath>
    </defs>
  </svg>
);

// Custom Moon icon component using the provided SVG
const MoonIcon = ({ className }) => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M17.5 10.6583C17.369 12.0768 16.8366 13.4287 15.9652 14.5557C15.0939 15.6826 13.9196 16.5382 12.5798 17.0221C11.24 17.5061 9.79003 17.5984 8.39962 17.2884C7.00922 16.9784 5.73587 16.2788 4.72856 15.2715C3.72125 14.2642 3.02166 12.9908 2.71163 11.6004C2.4016 10.21 2.49397 8.76007 2.97792 7.42025C3.46188 6.08042 4.3174 4.90614 5.44438 4.03479C6.57137 3.16345 7.9232 2.63109 9.34171 2.5C8.51122 3.62356 8.11158 5.00787 8.21548 6.40118C8.31939 7.79448 8.91992 9.10422 9.90788 10.0922C10.8958 11.0801 12.2056 11.6807 13.5989 11.7846C14.9922 11.8885 16.3765 11.4888 17.5 10.6583V10.6583Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

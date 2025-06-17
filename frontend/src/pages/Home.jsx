import React, { useState, useEffect } from "react";
import { Moon, Sun, PlayCircle, ChevronDown, Code } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useColorMode, useColorModeValue } from "@chakra-ui/react";

export default function Home() {
      const Navigate = useNavigate();
      const { colorMode, toggleColorMode } = useColorMode();
      // Local state for persistence, use Chakra's colorMode as fallback
      const [localDarkMode, setLocalDarkMode] = useState(() => {
            const storedMode = localStorage.getItem("darkMode");
            return storedMode ? JSON.parse(storedMode) : colorMode === "dark";
      });
      const [scrolled, setScrolled] = useState(false);

      // Keep Chakra and local state in sync
      useEffect(() => {
            if (localDarkMode && colorMode !== "dark") {
                  toggleColorMode();
            } else if (!localDarkMode && colorMode !== "light") {
                  toggleColorMode();
            }
            localStorage.setItem("darkMode", JSON.stringify(localDarkMode));
            if (localDarkMode) {
                  document.documentElement.classList.add("dark");
            } else {
                  document.documentElement.classList.remove("dark");
            }
            // eslint-disable-next-line
      }, [localDarkMode]); // don't add colorMode/toggleColorMode to avoid infinite loop

      useEffect(() => {
            const handleScroll = () => {
                  setScrolled(window.scrollY > 50);
            };
            window.addEventListener("scroll", handleScroll);
            return () => window.removeEventListener("scroll", handleScroll);
      }, []);

      // Chakra color mode values - always at top level
      const darkMode = useColorModeValue(false, true);
      const bg = useColorModeValue("bg-blue-50", "bg-gray-900");
      const textColor = useColorModeValue("text-gray-900", "text-white");
      const gradientBg = useColorModeValue(
            "bg-gradient-to-br from-blue-100 via-white to-purple-100",
            "bg-gradient-to-br from-blue-900 via-black to-purple-900"
      );
      const overlayOpacity = useColorModeValue("opacity-20", "opacity-50");
      const particleColor = useColorModeValue("bg-blue-600", "bg-blue-500");
      const particleOpacity = useColorModeValue(0.4, 0.2);
    const headerBgColor = useColorModeValue("bg-white bg-opacity-80", "bg-black bg-opacity-80");
const headerBg = scrolled ? headerBgColor : "";
      const logoColor = useColorModeValue("text-gray-900", "text-white");
      const accentColor = useColorModeValue("text-blue-600", "text-blue-500");
      const toggleBtnBg = useColorModeValue(
            "bg-blue-100 text-blue-900 hover:bg-blue-200",
            "bg-gray-700 text-yellow-300 hover:bg-gray-600"
      );
      const headingGradient = useColorModeValue(
            "text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-700",
            "text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500"
      );
      const subheadingColor = useColorModeValue("text-gray-800", "text-white");
      const taglineColor = useColorModeValue("text-blue-700", "text-blue-200");
      const primaryBtnBg = "bg-blue-600";
      const primaryBtnText = "text-white";
      const primaryBtnHoverGradient = useColorModeValue(
            "bg-gradient-to-r from-blue-700 to-blue-500",
            "bg-gradient-to-r from-blue-600 to-blue-400"
      );
      const secondaryBtnBorder = useColorModeValue(
            "text-blue-700 border border-blue-700 hover:bg-blue-700 hover:text-white",
            "text-white border border-white hover:bg-white hover:text-blue-900"
      );
      const scrollIndicatorColor = useColorModeValue(
            "text-blue-800 opacity-75",
            "text-white opacity-75"
      );

      const handleToggleDarkMode = () => {
            setLocalDarkMode((prev) => !prev);
      };

      return (
            <div
                  className={`min-h-screen flex flex-col justify-center items-center relative transition-colors duration-500 ${bg} ${textColor}`}
            >
                  {/* Background */}
                  <div className="absolute inset-0 z-0 overflow-hidden">
                        <div className={`absolute inset-0 transition-all duration-500 ${gradientBg}`} />
                        <div
                              className={`absolute inset-0 transition-opacity duration-500 ${overlayOpacity}`}
                              style={{
                                    backgroundImage: "url('/api/placeholder/1920/1080')",
                                    backgroundSize: "cover",
                                    backgroundPosition: "center",
                              }}
                        />
                        <div className="absolute inset-0 overflow-hidden">
                              {[...Array(15)].map((_, i) => (
                                    <div
                                          key={i}
                                          className={`absolute rounded-full transition-colors duration-500 ${particleColor}`}
                                          style={{
                                                width: `${Math.random() * 8 + 4}px`,
                                                height: `${Math.random() * 8 + 4}px`,
                                                top: `${Math.random() * 100}%`,
                                                left: `${Math.random() * 100}%`,
                                                opacity: particleOpacity,
                                                animation: `float ${Math.random() * 10 + 10}s linear infinite`,
                                          }}
                                    />
                              ))}
                        </div>
                  </div>

                  {/* Header */}
                  <div
                        className={`fixed top-0 left-0 right-0 py-4 px-6 flex justify-between items-center z-20 transition-all duration-300 ${headerBg} ${scrolled ? "shadow-lg" : ""
                              }`}
                  >
                        <div className={`flex items-center text-xl font-bold tracking-wider ${logoColor}`}>
                              <Code className="mr-2" size={24} />
                              <span>
                                    TECH<span className={accentColor}>NOVA</span>
                              </span>
                        </div>
                        <div className="flex items-center space-x-4">
                              <button
                                    onClick={handleToggleDarkMode}
                                    className={`p-2 rounded-full transition-colors duration-300 ${toggleBtnBg}`}
                              >
                                    {darkMode ? <Sun size={20} /> : <Moon size={20} />}
                              </button>
                        </div>
                  </div>

                  {/* Main Content */}
                  <div className="flex flex-col items-center text-center z-10 px-6 max-w-4xl">
                        <div className="mb-6 overflow-hidden">
                              <h1
                                    className={`text-5xl md:text-6xl font-bold mb-6 animate-slide-up transition-colors duration-500 ${headingGradient}`}
                              >
                                    COLLABORATIVE EXCELLENCE
                              </h1>
                        </div>
                        <div className="mb-8 overflow-hidden">
                              <h2
                                    className={`text-2xl md:text-3xl font-bold animate-slide-up-delay transition-colors duration-500 ${subheadingColor}`}
                              >
                                    SPEED UP INNOVATION THRU QUALITY
                              </h2>
                        </div>
                        <div className="overflow-hidden mb-10">
                              <p
                                    className={`text-xl md:text-2xl font-light animate-slide-up-delay-2 transition-colors duration-500 ${taglineColor}`}
                              >
                                    One Team One Mission!
                              </p>
                        </div>
                        <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-6 mt-4 animate-fade-in-delay">
                              <button
                                    className={`group relative overflow-hidden px-8 py-3 rounded-lg transform transition-all hover:scale-105 hover:shadow-lg ${primaryBtnBg} ${primaryBtnText}`}
                                    onClick={() => Navigate("/AboutUs")}
                              >
                                    <div
                                          className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity ${primaryBtnHoverGradient}`}
                                    />
                                    <span className="relative">About Us</span>
                              </button>
                              {/* <a
                                    href="https://www.youtube.com/watch?v=Y7f98aduVJ8"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={`group flex items-center justify-center px-8 py-3 rounded-lg transform transition-all hover:scale-105 hover:shadow-lg ${secondaryBtnBorder}`}
                              >
                                    <PlayCircle className="mr-2" size={20} />
                                    <span>Watch Video</span>
                              </a> */}
                        </div>
                  </div>

                  {/* Scroll Indicator */}
                  <div className="absolute bottom-8 left-0 right-0 flex justify-center animate-bounce z-10">
                        <ChevronDown size={32} className={`transition-colors duration-500 ${scrollIndicatorColor}`} />
                  </div>

                  {/* CSS Animations */}
                  <style>{`
        @keyframes float {
          0% {
            transform: translateY(0) rotate(0deg);
          }
          50% {
            transform: translateY(-40px) rotate(180deg);
          }
          100% {
            transform: translateY(0) rotate(360deg);
          }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideUp {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        .animate-fade-in {
          animation: fadeIn 1s ease-out;
        }

        .animate-fade-in-delay {
          animation: fadeIn 1.5s ease-out 0.5s;
          animation-fill-mode: both;
        }

        .animate-slide-up {
          animation: slideUp 1s ease-out;
        }

        .animate-slide-up-delay {
          animation: slideUp 1s ease-out 0.3s;
          animation-fill-mode: both;
        }

        .animate-slide-up-delay-2 {
          animation: slideUp 1s ease-out 0.6s;
          animation-fill-mode: both;
        }
      `}</style>
            </div>
      );
}
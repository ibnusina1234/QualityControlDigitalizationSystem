import { useState, useEffect } from "react";
import { LineChart, ResponsiveContainer, Line, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { Users, Microscope, Package, Clipboard, Award, ChevronDown, ChevronUp } from "lucide-react";
import axios from "axios";
import { useColorModeValue } from "@chakra-ui/react";

// Sample data for chart
const performanceData = [
  { month: "Jan", inspections: 120, compliance: 98 },
  { month: "Feb", inspections: 132, compliance: 97 },
  { month: "Mar", inspections: 125, compliance: 99 },
  { month: "Apr", inspections: 143, compliance: 96 },
  { month: "May", inspections: 156, compliance: 98 },
  { month: "Jun", inspections: 165, compliance: 99 }
];

// Personnel and Divisions Data
const personnel = [
  { name: "Agus Triyantoro", role: "Quality Head", image: "" },
  { name: "Carla Kuntari", role: "Quality Control", image: "" },
  { name: "Cindy Manuela", role: "Finish Good Supervisor", image: "" },
  { name: "Lusiani Srinita", role: "Packaging Material & Stability Supervisor", image: "" },
  { name: "Felicia Kowe", role: "Raw Material & Microbiology Supervisor", image: "" },   
];

const divisions = [
  { name: "Finish Good Team", icon: <Clipboard size={24} />, color: "bg-blue-500" },
  { name: "Raw Material Team", icon: <Package size={24} />, color: "bg-emerald-500" },
  { name: "Packaging Material Team", icon: <Box size={24} />, color: "bg-purple-500" },
  { name: "Microbiology Team", icon: <Microscope size={24} />, color: "bg-amber-500" },
  { name: "Administration Team", icon: <Users size={24} />, color: "bg-rose-500" },
];

// Custom Box icon component
function Box(props) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={props.size || 24} 
      height={props.size || 24} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="M21 8V21H3V8"></path>
      <path d="M1 3h22v5H1z"></path>
      <path d="M10 12h4"></path>
    </svg>
  );
}

export default function AboutUs() {
  const [showAll, setShowAll] = useState(false);
  const [count, setCount] = useState(null);

  // Chakra color mode values at top-level
  const bgMain = useColorModeValue("bg-gray-50", "bg-gray-900");
  const textMain = useColorModeValue("text-gray-800", "text-gray-200");
  const heroOverlay = useColorModeValue("bg-gradient-to-r from-blue-900/90 to-indigo-900/90", "bg-gradient-to-r from-blue-900/95 to-indigo-900/90");
  const heroText = "text-white";
  const aboutSectionBg = useColorModeValue("bg-white", "bg-gray-800");
  const aboutSectionShadow = useColorModeValue("shadow-lg", "shadow-2xl");
  const personnelSectionBg = useColorModeValue("bg-gradient-to-b from-gray-50 to-gray-100", "bg-gradient-to-b from-gray-900 to-gray-800");
  const personnelCardBg = useColorModeValue("bg-white", "bg-gray-800");
  const personnelCardText = useColorModeValue("text-blue-600", "text-blue-400");
  const divisionCardBg = useColorModeValue("bg-white", "bg-gray-800");
  const divisionCardShadow = useColorModeValue("shadow", "shadow-xl");
  const mottoBg = useColorModeValue("bg-blue-600", "bg-blue-800");
  const mottoText = "text-white";
  const footerBg = useColorModeValue("bg-gray-900", "bg-black");
  const footerText = useColorModeValue("text-gray-300", "text-gray-400");
  const footerTitle = useColorModeValue("text-white", "text-blue-100");

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const res = await axios.get( `${process.env.REACT_APP_API_BASE_URL}/users/countQcUser`);
        setCount(res.data.count);
      } catch (err) {
        console.error('Gagal mengambil jumlah user QC:', err);
        setCount('Error');
      }
    };
    fetchCount();
  }, []);
  
  return (
    <div className={`min-h-screen ${bgMain} ${textMain}`}>
      {/* Hero Section */}
      <div className="relative h-screen">
        <div className={`absolute inset-0 ${heroOverlay} z-10`}></div>
        <div className="absolute inset-0 bg-cover bg-center opacity-40"></div>
        
        <div className={`relative z-20 h-full flex flex-col items-center justify-center px-4 text-center ${heroText}`}>
          <div className="animate-fade-in-down max-w-3xl mx-auto">
            <h1 className="text-5xl md:text-6xl font-bold mb-6">Quality Control Team</h1>
            <p className="text-xl md:text-2xl mb-8">Driven by the spirit of <span className="font-bold text-cyan-300">Collaborative Excellence</span></p>
            
            <div className="flex flex-wrap justify-center gap-8 mt-12">
              <StatCard icon={<Award size={28} />} label="Quality Rate" value="99.8%" />
              <StatCard icon={<Clipboard size={28} />} label="Inspections" value="12,500+" />
              <StatCard icon={<Users size={28} />} label="Team Members" value={count !== null ? count : 'Loading...'} />
            </div>
            
            <div className="mt-16">
              <button 
                onClick={() => window.scrollTo({top: window.innerHeight, behavior: 'smooth'})} 
                className="flex items-center gap-2 px-6 py-3 mx-auto bg-white text-blue-900 rounded-full font-semibold hover:bg-blue-50 transition-colors"
              >
                Learn More <ChevronDown size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* About Section */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">About Us</h2>
            <div className="h-1 w-24 bg-blue-500 mx-auto mb-8"></div>
            <p className="text-lg max-w-3xl mx-auto">
              We are the <strong>Quality Control</strong> team, united to uphold quality and accelerate innovation at every step.
              Through collaboration, testing, and continuous improvement, we ensure that every detail meets
              the highest standards before moving forward.
            </p>
          </div>
          
          {/* Performance Chart */}
          <div className={`${aboutSectionBg} ${aboutSectionShadow} rounded-xl p-6 mb-16`}>
            <h3 className="text-2xl font-semibold mb-6 text-center">Performance Metrics</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={performanceData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Line yAxisId="left" type="monotone" dataKey="inspections" stroke="#3b82f6" name="Inspections" />
                  <Line yAxisId="right" type="monotone" dataKey="compliance" stroke="#10b981" name="Compliance %" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </section>

      {/* Personnel Section - with smaller cards */}
      <section className={`py-20 px-4 ${personnelSectionBg}`}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Key Personnel</h2>
            <div className="h-1 w-24 bg-blue-500 mx-auto mb-8"></div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {(showAll ? personnel : personnel.slice(0, 5)).map((person, idx) => (
              <div 
                key={person.name}
                className={`${personnelCardBg} rounded-lg shadow p-4 text-center transition-all duration-300 hover:shadow-md hover:-translate-y-1`}
              >
                <img 
                  src={person.image} 
                  alt={person.name} 
                  className="w-16 h-16 rounded-full mx-auto mb-3 border-2 border-blue-500" 
                />
                <h3 className="font-semibold text-sm">{person.name}</h3>
                <p className={`text-xs mt-1 ${personnelCardText}`}>{person.role}</p>
              </div>
            ))}
          </div>

          {personnel.length > 5 && (
            <div className="text-center mt-8">
              <button
                onClick={() => setShowAll(!showAll)}
                className="flex items-center gap-2 px-4 py-2 mx-auto bg-blue-600 text-white rounded-full text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                {showAll ? "Show Less" : "View All"}
                {showAll ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Divisions Section */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Our Divisions</h2>
            <div className="h-1 w-24 bg-blue-500 mx-auto mb-8"></div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {divisions.map((division, idx) => (
              <div 
                key={division.name}
                className={`${divisionCardBg} ${divisionCardShadow} rounded-xl p-6 text-center transition-all duration-300 hover:shadow-lg hover:-translate-y-1`}
              >
                <div className={`w-16 h-16 ${division.color} rounded-full flex items-center justify-center text-white mx-auto mb-4`}>
                  {division.icon}
                </div>
                <h3 className="font-semibold">{division.name}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Motto Section */}
      <section className={`py-16 px-4 ${mottoBg} ${mottoText}`}>
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6">Our Mission</h2>
          <p className="text-xl font-light italic">
            "One Team, One Mission — Together, we strive to deliver outstanding products and the best possible experience for everyone."
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className={`py-12 px-4 ${footerBg} ${footerText}`}>
        <div className="max-w-7xl mx-auto text-center">
          <h3 className={`text-2xl font-bold mb-2 ${footerTitle}`}>Quality Control</h3>
          <p className="mb-8">Innovation · Collaboration · Transformation</p>
          <p className="text-sm">&copy; {new Date().getFullYear()} All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

// Stat Card Component
function StatCard({ icon, label, value }) {
  return (
    <div className="flex flex-col items-center bg-white/10 backdrop-blur-sm p-6 rounded-xl">
      <div className="mb-3 text-cyan-300">
        {icon}
      </div>
      <div className="text-3xl font-bold mb-1">{value}</div>
      <div className="text-sm opacity-80">{label}</div>
    </div>
  );
}
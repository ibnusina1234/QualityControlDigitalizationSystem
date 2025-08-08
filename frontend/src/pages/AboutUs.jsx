import { useState, useEffect, useMemo } from "react";
import { Users, Microscope, Package, Clipboard, ChevronDown, ChevronUp, X } from "lucide-react";
import axios from "axios";
import { useColorModeValue } from "@chakra-ui/react";

// Utility function for consistent image handling
const getImageUrl = (url) => {
  const placeholder = '/default-profile.png';
  if (!url) return placeholder;

if (url.startsWith('http')) {
    const match = url.match(/\/file\/d\/([^/]+)/) || url.match(/id=([^&]+)/);
    if (match) {
      return `${process.env.REACT_APP_API_BASE_URL}/homeEditing/stream/${match[1]}`;
    }
    return url;
  }

  return `${process.env.REACT_APP_API_BASE_URL}/homeEditing/stream/${url}`;
};

// Custom Box icon component
const Box = (props) => (
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

// Icon mapping for divisions
const iconMap = {
  'Clipboard': Clipboard,
  'Package': Package,
  'Box': Box,
  'Microscope': Microscope,
  'Users': Users
};

// Lucide animated icon wrapper
const AnimatedIcon = ({ IconComponent, className = "", ...props }) => (
  <span className="lucide-animate">
    <IconComponent className={className} {...props} />
  </span>
);

// Stat Card Component with animation
const StatCard = ({ icon, label, value, delay = 0 }) => {
  const cardBg = useColorModeValue("bg-white/10", "bg-white/10");
  return (
    <div
      className={`flex flex-col items-center ${cardBg} backdrop-blur-sm p-6 rounded-xl transform transition-all duration-500 animate-stat-fade-in hover:bg-white/15`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="mb-3 text-cyan-300">
        {icon}
      </div>
      <div className="text-3xl font-bold mb-1">{value}</div>
      <div className="text-sm opacity-80">{label}</div>
    </div>
  );
};

// Company Image Card Component
const CompanyImageCard = ({ image, index }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const cardBg = useColorModeValue("bg-white", "bg-gray-800");
  const shadow = useColorModeValue("shadow-lg", "shadow-2xl");
  const textTitle = useColorModeValue("text-gray-900", "text-white");
  const textDesc = useColorModeValue("text-gray-700", "text-gray-200");

  return (
    <div 
      className={`relative group overflow-hidden rounded-2xl ${cardBg} ${shadow} hover:shadow-xl transition-all duration-500 animate-fade-in-up`}
      style={{ animationDelay: `${index * 150}ms` }}
    >
      <div className="aspect-w-16 aspect-h-10 relative overflow-hidden">
        {!imageLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        )}
        <img
          src={getImageUrl(image.url)}
          alt={image.title}
          className={`w-full h-64 object-cover transition-transform duration-700 ${!imageLoaded ? 'opacity-0' : 'opacity-100 group-hover:scale-110'}`}
          onLoad={() => setImageLoaded(true)}
          onError={(e) => {
            e.target.src = '/default-facility.jpg';
            setImageLoaded(true);
          }}
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 p-6 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
        <h3 className={`text-lg font-semibold mb-2 ${textTitle}`}>{image.title}</h3>
        <p className={`text-sm opacity-90 ${textDesc}`}>{image.description}</p>
      </div>
    </div>
  );
};

// Team Member Card Component
const TeamMemberCard = ({ member, colors, textColor }) => {
  const [imageLoaded, setImageLoaded] = useState(false);

  return (
    <div className={`bg-gray-50 dark:bg-gray-700 rounded-xl p-4 text-center transition-all duration-300 hover:shadow-lg hover:-translate-y-1 animate-member-fade-in group`}>
      <div className="relative mb-4">
        {!imageLoaded && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        )}
        <img 
          src={getImageUrl(member.image_url)} 
          alt={member.name}
          className={`w-20 h-20 rounded-full mx-auto border-4 border-white shadow-lg object-cover transition-opacity duration-300 ${!imageLoaded ? 'opacity-0' : 'opacity-100 group-hover:scale-105'}`}
          onLoad={() => setImageLoaded(true)}
          onError={(e) => {
            e.target.src = '/default-profile.png';
            setImageLoaded(true);
          }}
          loading="lazy"
        />
        <div className={`absolute inset-0 w-20 h-20 rounded-full mx-auto ${colors.color} opacity-0 group-hover:opacity-20 scale-0 group-hover:scale-110 transition-all duration-300`}></div>
      </div>
      <h3 className={`font-semibold text-sm mb-1 ${textColor} group-hover:${colors.textColor} transition-colors duration-300`}>
        {member.name}
      </h3>
      <p className={`text-xs ${colors.textColor} opacity-70`}>{member.role}</p>
    </div>
  );
};

// Personnel Card Component
const PersonnelCard = ({ person, personnelCardBg, personnelCardText, personnelNameHover }) => {
  const [imageLoaded, setImageLoaded] = useState(false);

  return (
    <div 
      className={`${personnelCardBg} rounded-lg shadow-md p-4 text-center transition-all duration-300 hover:shadow-lg hover:-translate-y-2 animate-fade-in group`}
    >
      <div className="relative mb-3">
        {!imageLoaded && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        )}
        <img 
          src={getImageUrl(person.image_url)} 
          alt={person.name} 
          className={`w-16 h-16 rounded-full mx-auto border-2 border-blue-500 object-cover transition-opacity duration-300 ${!imageLoaded ? 'opacity-0' : 'opacity-100 group-hover:border-blue-600'}`}
          onLoad={() => setImageLoaded(true)}
          onError={(e) => {
            e.target.src = '/default-profile.png';
            setImageLoaded(true);
          }}
          loading="lazy"
        />
        <div className="absolute inset-0 w-16 h-16 rounded-full mx-auto bg-blue-500/10 scale-0 group-hover:scale-110 transition-transform duration-300"></div>
      </div>
      <h3 className={`font-semibold text-sm group-hover:text-blue-600 transition-colors duration-300 ${personnelNameHover}`}>{person.name}</h3>
      <p className={`text-xs mt-1 ${personnelCardText}`}>{person.role}</p>
    </div>
  );
};

// Team Gallery Modal Component
const TeamGalleryModal = ({ division, members, isOpen, onClose }) => {
  const modalBg = useColorModeValue("bg-white", "bg-gray-800");
  const overlayBg = useColorModeValue("bg-black/50", "bg-black/70");
    const textColor = useColorModeValue("text-gray-800", "text-white");
  
  if (!isOpen || !division) return null;

  // Get division color based on name
  const getDivisionColors = (divisionName) => {
    const name = divisionName.toLowerCase();
    if (name.includes('finish')) return {
      color: "bg-gradient-to-br from-blue-500 to-blue-600",
      bgColor: "from-blue-50 to-blue-100",
      textColor: "text-blue-700"
    };
    if (name.includes('raw') || name.includes('material')) return {
      color: "bg-gradient-to-br from-emerald-500 to-emerald-600",
      bgColor: "from-emerald-50 to-emerald-100", 
      textColor: "text-emerald-700"
    };
    if (name.includes('packaging')) return {
      color: "bg-gradient-to-br from-purple-500 to-purple-600",
      bgColor: "from-purple-50 to-purple-100",
      textColor: "text-purple-700"
    };
    if (name.includes('microbiology')) return {
      color: "bg-gradient-to-br from-amber-500 to-amber-600",
      bgColor: "from-amber-50 to-amber-100",
      textColor: "text-amber-700"
    };
    return {
      color: "bg-gradient-to-br from-rose-500 to-rose-600",
      bgColor: "from-rose-50 to-rose-100",
      textColor: "text-rose-700"
    };
  };

  const colors = getDivisionColors(division.name);
  const IconComponent = iconMap[division.icon] || Users;


  return (
    <div className={`fixed inset-0 z-50 ${overlayBg} backdrop-blur-sm flex items-center justify-center p-4 animate-modal-fade-in`}>
      <div className={`${modalBg} rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden shadow-2xl animate-modal-slide-up`}>
        {/* Header */}
        <div className={`bg-gradient-to-r ${colors.bgColor} p-6 relative overflow-hidden`}>
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-4 right-4 w-32 h-32 rounded-full bg-white/20"></div>
            <div className="absolute bottom-2 left-8 w-20 h-20 rounded-full bg-white/15"></div>
          </div>
          <div className="relative flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className={`w-16 h-16 ${colors.color} rounded-xl flex items-center justify-center text-white shadow-lg`}>
                <IconComponent size={28} />
              </div>
              <div>
                <h2 className={`text-3xl font-bold ${colors.textColor}`}>{division.name}</h2>
                <p className={`${colors.textColor} opacity-80`}>{members.length} Team Members</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors duration-200"
            >
              <X size={24} className={colors.textColor} />
            </button>
          </div>
        </div>

        {/* Team Members Grid */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {members.map((member, index) => (
              <TeamMemberCard
                key={member.id}
                member={member}
                colors={colors}
                textColor={textColor}
                style={{ animationDelay: `${index * 50}ms` }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const AboutUs = () => {
  const [showAll, setShowAll] = useState(false);
  const [count, setCount] = useState(null);
  const [selectedDivision, setSelectedDivision] = useState(null);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [personnel, setPersonnel] = useState([]);
  const [companyImages, setCompanyImages] = useState([]);
  const [divisions, setDivisions] = useState([]);
  const [divisionMembers, setDivisionMembers] = useState([]);
  const [pageContent, setPageContent] = useState({
    hero_title: 'Quality Control Team',
    hero_subtitle: 'Driven by the spirit of Collaborative Excellence',
    about_description: 'We are the Quality Control team, united to uphold quality and accelerate innovation at every step.',
    mission_text: 'One Team, One Mission — Together, we strive to deliver outstanding products.'
  });

  // Memoize color mode values
  const bgMain = useColorModeValue("bg-gray-50", "bg-gray-900");
  const textMain = useColorModeValue("text-gray-800", "text-gray-200");
  const heroOverlay = useColorModeValue("bg-gradient-to-r from-blue-900/90 to-indigo-900/90", "bg-gradient-to-r from-blue-900/95 to-indigo-900/90");
  const heroText = "text-white";
  const personnelSectionBg = useColorModeValue("bg-gradient-to-b from-gray-50 to-gray-100", "bg-gradient-to-b from-gray-900 to-gray-800");
  const personnelCardBg = useColorModeValue("bg-white", "bg-gray-800");
  const personnelCardText = useColorModeValue("text-blue-600", "text-blue-400");
  const divisionCardBg = useColorModeValue("bg-white", "bg-gray-800");
  const divisionCardShadow = useColorModeValue("shadow-md", "shadow-xl");
  const mottoBg = useColorModeValue("bg-blue-600", "bg-blue-800");
  const mottoText = "text-white";
  const footerBg = useColorModeValue("bg-gray-900", "bg-black");
  const footerText = useColorModeValue("text-gray-300", "text-gray-400");
  const footerTitle = useColorModeValue("text-white", "text-blue-100");
  const facilitiesSectionBg = useColorModeValue("py-20 px-4 bg-gray-100", "py-20 px-4 bg-gray-900");
  const facilitiesText = useColorModeValue("text-lg max-w-2xl mx-auto text-gray-600 animate-fade-in-delay", "text-lg max-w-2xl mx-auto text-gray-300 animate-fade-in-delay");
  const personnelNameHover = useColorModeValue("", "text-blue-300");
  const divisionNameHover = useColorModeValue("", "text-blue-300");

  // Memoize division colors calculation
  const getDivisionColors = useMemo(() => (divisionName) => {
    const name = divisionName.toLowerCase();
    if (name.includes('finish')) return {
      color: "bg-gradient-to-br from-blue-500 to-blue-600",
      bgColor: "from-blue-50 to-blue-100",
      textColor: "text-blue-700"
    };
    if (name.includes('raw') || name.includes('material')) return {
      color: "bg-gradient-to-br from-emerald-500 to-emerald-600",
      bgColor: "from-emerald-50 to-emerald-100",
      textColor: "text-emerald-700"
    };
    if (name.includes('packaging')) return {
      color: "bg-gradient-to-br from-purple-500 to-purple-600",
      bgColor: "from-purple-50 to-purple-100",
      textColor: "text-purple-700"
    };
    if (name.includes('microbiology')) return {
      color: "bg-gradient-to-br from-amber-500 to-amber-600",
      bgColor: "from-amber-50 to-amber-100",
      textColor: "text-amber-700"
    };
    return {
      color: "bg-gradient-to-br from-rose-500 to-rose-600",
      bgColor: "from-rose-50 to-rose-100",
      textColor: "text-rose-700"
    };
  }, []);

  // Fetch all data
useEffect(() => {
  const fetchData = async () => {
    try {
      setLoading(true);

      const [homePageResponse, countResponse] = await Promise.all([
        axios.get(`${process.env.REACT_APP_API_BASE_URL}/homeEditing/HomePages`),
        axios.get(`${process.env.REACT_APP_API_BASE_URL}/users/countQcUser`)
      ]);

      const data = homePageResponse.data;
      setPersonnel(data.personnel || []);
      setCompanyImages(data.companyImages || []);
      setDivisions(data.divisions || []);
      setDivisionMembers(data.divisionMembers || []);
      
      // Use the initial pageContent as fallback, not the state
      setPageContent(data.pageContent || {
        hero_title: 'Quality Control Team',
        hero_subtitle: 'Driven by the spirit of Collaborative Excellence',
        about_description: 'We are the Quality Control team, united to uphold quality and accelerate innovation at every step.',
        mission_text: 'One Team, One Mission — Together, we strive to deliver outstanding products.'
      });
      
      setCount(countResponse.data.count);

    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load data');
      setCount('Error');
    } finally {
      setLoading(false);
    }
  };

  fetchData();
}, []);// Add pageContent as dependency since it's used in fallback

  const handleDivisionClick = (division) => {
    setSelectedDivision(division);
    const members = divisionMembers.filter(member => member.division_id === division.id);
    setSelectedMembers(members);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setTimeout(() => {
      setSelectedDivision(null);
      setSelectedMembers([]);
    }, 300);
  };

  if (loading) {
    return (
      <div className={`min-h-screen ${bgMain} flex items-center justify-center`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className={textMain}>Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`min-h-screen ${bgMain} flex items-center justify-center`}>
        <div className="text-center">
          <p className="text-red-500 text-xl mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${bgMain} ${textMain}`}>
      {/* Hero Section */}
      <div className="relative h-screen">
        <div className={`absolute inset-0 ${heroOverlay} z-10`}></div>
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: 'url(https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=1920&h=1080&fit=crop)',
            filter: 'brightness(0.7)'
          }}
        ></div>

        <div className={`relative z-20 h-full flex flex-col items-center justify-center px-4 text-center ${heroText}`}>
          <div className="animate-fade-in-down max-w-3xl mx-auto">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 animate-slide-down-gradient-text" style={{ animationFillMode: "forwards" }}>
              {pageContent.hero_title}
            </h1>
            <p className="text-xl md:text-2xl mb-8 animate-fade-in-delay" style={{ animationFillMode: "forwards" }}>
              {pageContent.hero_subtitle}
            </p>

            <div className="flex flex-wrap justify-center gap-8 mt-12">
              <StatCard icon={<AnimatedIcon IconComponent={Users} size={28} />} label="Team Members" value={count !== null ? count : 'Loading...'} delay={240} />
            </div>

            <div className="mt-16">
              <button
                onClick={() => window.scrollTo({ top: window.innerHeight, behavior: 'smooth' })}
                className="flex items-center gap-2 px-6 py-3 mx-auto bg-white text-blue-900 rounded-full font-semibold hover:bg-blue-50 transition-all duration-300 group hover:scale-105"
              >
                Learn More <AnimatedIcon IconComponent={ChevronDown} size={20} className="group-hover:animate-bounce" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* About Section */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 animate-slide-up" style={{ animationFillMode: "forwards" }}>About Us</h2>
            <div className="h-1 w-24 bg-blue-500 mx-auto mb-8"></div>
            <p className="text-lg max-w-3xl mx-auto animate-fade-in-delay" style={{ animationFillMode: "forwards" }}>
              {pageContent.about_description}
            </p>
          </div>
        </div>
      </section>

      {/* Company Images Section */}
      {companyImages.length > 0 && (
        <section className={facilitiesSectionBg}>
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-4 animate-slide-up" style={{ animationFillMode: "forwards" }}>Our Facilities</h2>
              <div className="h-1 w-24 bg-blue-500 mx-auto mb-8"></div>
              <p className={facilitiesText} style={{ animationFillMode: "forwards" }}>
                Take a look inside our world-class facilities where innovation meets precision
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {companyImages.map((image, index) => (
                <CompanyImageCard key={image.id} image={image} index={index} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Personnel Section */}
      {personnel.length > 0 && (
        <section className={`py-20 px-4 ${personnelSectionBg}`}>
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-4 animate-slide-up-delay" style={{ animationFillMode: "forwards" }}>Key Personnel</h2>
              <div className="h-1 w-24 bg-blue-500 mx-auto mb-8"></div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
              {(showAll ? personnel : personnel.slice(0, 5)).map((person, idx) => (
                <PersonnelCard
                  key={person.id}
                  person={person}
                  personnelCardBg={personnelCardBg}
                  personnelCardText={personnelCardText}
                  personnelNameHover={personnelNameHover}
                  style={{ animationDelay: `${idx * 60}ms`, animationFillMode: "forwards" }}
                />
              ))}
            </div>

            {personnel.length > 5 && (
              <div className="text-center mt-8">
                <button
                  onClick={() => setShowAll(!showAll)}
                  className="flex items-center gap-2 px-4 py-2 mx-auto bg-blue-600 text-white rounded-full text-sm font-medium hover:bg-blue-700 transition-all duration-300 group hover:scale-105"
                >
                  {showAll ? "Show Less" : "View All"}
                  {showAll
                    ? <AnimatedIcon IconComponent={ChevronUp} size={16} className="group-hover:animate-bounce" />
                    : <AnimatedIcon IconComponent={ChevronDown} size={16} className="group-hover:animate-bounce" />}
                </button>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Divisions Section */}
      {divisions.length > 0 && (
        <section className="py-20 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-4 animate-slide-up" style={{ animationFillMode: "forwards" }}>Our Divisions</h2>
              <div className="h-1 w-24 bg-blue-500 mx-auto mb-8"></div>
              <p className="text-lg text-gray-600 mb-4">Click on any division to view team members</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {divisions.map((division, idx) => {
                const IconComponent = iconMap[division.icon] || Users;
                const colors = getDivisionColors(division.name);
                const memberCount = divisionMembers.filter(member => member.division_id === division.id).length;

                return (
                  <div
                    key={division.id}
                    onClick={() => handleDivisionClick(division)}
                    className={`${divisionCardBg} ${divisionCardShadow} rounded-xl p-6 text-center transition-all duration-300 hover:shadow-xl hover:-translate-y-2 animate-fade-in group cursor-pointer relative overflow-hidden`}
                    style={{ animationDelay: `${idx * 80}ms`, animationFillMode: "forwards" }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-transparent to-gray-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="relative">
                      <div className={`w-16 h-16 ${colors.color} rounded-full flex items-center justify-center text-white mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                        <AnimatedIcon IconComponent={IconComponent} size={24} />
                      </div>
                      <h3 className={`font-semibold mb-2 group-hover:text-blue-600 transition-colors duration-300 ${divisionNameHover}`}>
                        {division.name}
                      </h3>
                      <p className="text-sm text-gray-500 group-hover:text-gray-700 transition-colors duration-300">
                        {memberCount} Members
                      </p>
                      <div className="mt-3 text-xs text-blue-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        Click to view team →
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Team Gallery Modal */}
      <TeamGalleryModal
        division={selectedDivision}
        members={selectedMembers}
        isOpen={isModalOpen}
        onClose={closeModal}
      />

      {/* Motto Section */}
      <section className={`py-16 px-4 ${mottoBg} ${mottoText}`}>
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6 animate-slide-up" style={{ animationFillMode: "forwards" }}>Our Mission</h2>
          <p className="text-xl font-light italic animate-fade-in-delay" style={{ animationFillMode: "forwards" }}>
            "{pageContent.mission_text}"
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

      {/* Animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes fadeInUp {
          from { 
            opacity: 0; 
            transform: translateY(30px);
          }
          to { 
            opacity: 1; 
            transform: translateY(0);
          }
        }
        
        @keyframes fadeInDown {
          from { 
            opacity: 0; 
            transform: translateY(-30px);
          }
          to { 
            opacity: 1; 
            transform: translateY(0);
          }
        }
        
        @keyframes slideUp {
          from { 
            opacity: 0; 
            transform: translateY(50px);
          }
          to { 
            opacity: 1; 
            transform: translateY(0);
          }
        }
        
        @keyframes slideDown {
          from { 
            opacity: 0; 
            transform: translateY(-50px);
          }
          to { 
            opacity: 1; 
            transform: translateY(0);
          }
        }
        
        @keyframes modalFadeIn {
          from { 
            opacity: 0; 
          }
          to { 
            opacity: 1; 
          }
        }
        
        @keyframes modalSlideUp {
          from { 
            opacity: 0; 
            transform: scale(0.9) translateY(30px);
          }
          to { 
            opacity: 1; 
            transform: scale(1) translateY(0);
          }
        }
        
        @keyframes memberFadeIn {
          from { 
            opacity: 0; 
            transform: translateY(20px) scale(0.95);
          }
          to { 
            opacity: 1; 
            transform: translateY(0) scale(1);
          }
        }
        
        @keyframes gradientText {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        
        @keyframes statFadeIn {
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        
        @keyframes bounce {
          0%, 20%, 53%, 80%, 100% {
            transform: translate3d(0,0,0);
          }
          40%, 43% {
            transform: translate3d(0,-8px,0);
          }
          70% {
            transform: translate3d(0,-4px,0);
          }
          90% {
            transform: translate3d(0,-2px,0);
          }
        }
        
        .lucide-animate svg {
          animation: lucide-bounce 1.2s infinite alternate;
          display: inline-block;
          vertical-align: middle;
        }
        
        @keyframes lucide-bounce {
          0% { transform: translateY(0) scale(1);}
          50% { transform: translateY(-8px) scale(1.08);}
          100% { transform: translateY(0) scale(1);}
        }
        
        /* Animation Classes */
        .animate-fade-in {
          animation: fadeIn 0.8s ease-out forwards;
          opacity: 0;
        }
        
        .animate-fade-in-up {
          animation: fadeInUp 0.8s ease-out forwards;
          opacity: 0;
        }
        
        .animate-fade-in-down {
          animation: fadeInDown 0.8s ease-out forwards;
          opacity: 0;
        }
        
        .animate-fade-in-delay {
          animation: fadeIn 1s ease-out 0.3s forwards;
          opacity: 0;
        }
        
        .animate-slide-up {
          animation: slideUp 0.8s ease-out forwards;
          opacity: 0;
        }
        
        .animate-slide-up-delay {
          animation: slideUp 0.8s ease-out 0.2s forwards;
          opacity: 0;
        }
        
        .animate-slide-down-gradient-text {
          animation: slideDown 1s ease-out forwards;
          background: linear-gradient(-45deg, #ffffff, #60a5fa, #3b82f6, #1d4ed8);
          background-size: 400% 400%;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          opacity: 0;
          animation-fill-mode: forwards;
        }
        
        .animate-modal-fade-in {
          animation: modalFadeIn 0.3s ease-out forwards;
        }
        
        .animate-modal-slide-up {
          animation: modalSlideUp 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }
        
        .animate-member-fade-in {
          animation: memberFadeIn 0.5s ease-out forwards;
          opacity: 0;
        }
        
        .animate-stat-fade-in {
          opacity: 0;
          transform: translateY(30px) scale(0.95);
          animation: statFadeIn 0.7s cubic-bezier(.4,0,.2,1) forwards;
        }
        
        /* Responsive adjustments */
        @media (max-width: 768px) {
          .animate-slide-down-gradient-text {
            font-size: 2.5rem;
          }
        }
      `}</style>
    </div>
  );
};

export default AboutUs;
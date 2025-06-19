import React, { useEffect, useState, useCallback } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
      IconButton,
      Box,
      Button,
      useColorMode,
      Image,
      Text,
      Avatar,
      Menu,
      MenuButton,
      MenuList,
      MenuItem,
      Badge,
      Flex,
      HStack,
      Divider,
      useDisclosure,
      Drawer,
      DrawerBody,
      DrawerHeader,
      DrawerOverlay,
      DrawerContent,
      DrawerCloseButton,
      VStack,
      Tooltip,
      Container,
      Collapse,
      useColorModeValue
} from "@chakra-ui/react";
import {
      FiBell,
      FiMenu,
      FiHome,
      FiUser,
      FiSettings,
      FiLogOut,
} from "react-icons/fi";
import { MoonIcon, SunIcon } from "@chakra-ui/icons";
import { RiDashboardLine, RiHistoryLine } from "react-icons/ri";
import axios from "axios";
import { useSelector } from "react-redux";

function Navbar({ handleLogout }) {
      const [pendingUsers, setPendingUsers] = useState([]);
      const navigate = useNavigate();
      const location = useLocation();
      const { colorMode, toggleColorMode } = useColorMode();
      const { isOpen, onOpen, onClose } = useDisclosure();
      const isLoggedIn = useSelector((state) => state.user.isLoggedIn);
      const user = useSelector((state) => state.user.user);
      const isAdmin = isLoggedIn && user?.userrole === "admin";
      const [open, setOpen] = useState(false);
      const [openKS, setOpenKS] = useState(false);
      const [openKKM, setOpenKKM] = useState(false);
      const [openFG, setOpenFG] = useState(false);
      const [openPM, setOpenPM] = useState(false);
      const [openMicro, setOpenMicro] = useState(false);

      // Create a local logout handler that calls the API then the prop function
      const handleLocalLogout = async () => {
            try {
                  // Call the logout API
                  await axios.post(`${process.env.REACT_APP_API_BASE_URL}/users/logout`, {}, {
                        withCredentials: true,
                  });

                  // Then call the parent's handleLogout function
                  handleLogout();
            } catch (error) {
                  console.error("Error during logout:", error);
                  // Still call the parent's handleLogout function even if API fails
                  handleLogout();
            }
      };

      const isLoginOrRegister =
            location.pathname === "/Login" || location.pathname === "/Register";
      const isHomeOrDashboardOrHistorical =
            location.pathname === "/Home" ||
            location.pathname === "/Dashboard" ||
            location.pathname === "/DashboardInstrument" ||
            location.pathname === "/Create" ||
            location.pathname === "/QCDepartmentPage" ||
            location.pathname === "/reset-password" ||
            location.pathname === "/AboutUs" ||
            location.pathname === "/DashboardSampelRMPM";

      const fetchPendingUsers = useCallback(async () => {
            if (!user?.id) return;
            try {
                  const response = await axios.get(
                        `${process.env.REACT_APP_API_BASE_URL}/users/pendingUsers`,
                        {
                              params: { userId: user.id },
                              withCredentials: true,
                        }
                  );
                  setPendingUsers(response.data);
            } catch (error) {
                  console.error("Error fetching pending users:", error);
            }
      }, [user]);

      console.log("Redux:", isLoggedIn, user);

      useEffect(() => {
            if (!isLoggedIn && !isLoginOrRegister && !isHomeOrDashboardOrHistorical) {
                  navigate("/Home");
            }
      }, [isLoggedIn, isLoginOrRegister, isHomeOrDashboardOrHistorical, navigate]);

      useEffect(() => {
            let interval;
            const allowedRoles = ["admin", "super admin"];

            if (isLoggedIn && allowedRoles.includes(user?.userrole)) {
                  fetchPendingUsers();
                  interval = setInterval(() => {
                        fetchPendingUsers();
                  }, 10000);
            }

            return () => clearInterval(interval);
      }, [isLoggedIn, user, fetchPendingUsers]);


      const navbarBg = colorMode === "light" ? "white" : "gray.800";
      const accentColor = colorMode === "light" ? "teal.500" : "teal.300";
      const logoSrc = colorMode === "light" ? "/kch.png" : "/sakahitam.png";
      const menuHoverBg = useColorModeValue('teal.50', 'teal.700');
      const menuHoverColor = useColorModeValue('teal.600', 'teal.200');
      const submenuBg = useColorModeValue("gray.50", "gray.700");
      const submenuColor = useColorModeValue("gray.800", "gray.100");

      const handleNavigate = (path) => {
            navigate(path);
            onClose();
      };

      const MobileNavigation = () => (
            <>
                  <IconButton
                        display={{ base: "flex", md: "none" }}
                        aria-label="Open menu"
                        icon={<FiMenu />}
                        onClick={onOpen}
                        variant="ghost"
                        size="sm"
                  />
                  <Drawer isOpen={isOpen} placement="left" onClose={onClose}>
                        <DrawerOverlay />
                        <DrawerContent>
                              <DrawerCloseButton />
                              <DrawerHeader borderBottomWidth="1px">
                                    <Image
                                          src={logoSrc}
                                          fallbackSrc="/default-profile.png"
                                          alt="logo"
                                          height="10"
                                    />
                              </DrawerHeader>
                              <DrawerBody>
                                    <VStack spacing={4} align="stretch" mt={4}>
                                          <Button
                                                leftIcon={<FiHome />}
                                                justifyContent="flex-start"
                                                variant="ghost"
                                                onClick={() => handleNavigate("/Home")}
                                          >
                                                Home
                                          </Button>

                                          <Text fontWeight="bold" fontSize="sm" color="gray.500" pl={2} mt={2}>
                                                DASHBOARD
                                          </Text>
                                          <Button
                                                leftIcon={<RiDashboardLine />}
                                                justifyContent="flex-start"
                                                variant="ghost"
                                                onClick={() => handleNavigate("/Dashboard")}
                                          >
                                                Dashboard Temperature dan RH
                                          </Button>
                                          {/* <Button
                                                leftIcon={<RiDashboardLine />}
                                                justifyContent="flex-start"
                                                variant="ghost"
                                                onClick={() => handleNavigate("/DashboardInstrument")}
                                          >
                                                Dashboard Instrument
                                          </Button> */}
                                          <Button
                                                leftIcon={<RiDashboardLine />}
                                                justifyContent="flex-start"
                                                variant="ghost"
                                                onClick={() => handleNavigate("/DashboardSampelRMPM")}
                                          >
                                                Dashboard Sampel RMPM
                                          </Button>

                                          {isAdmin && (
                                                <>
                                                      <Text fontWeight="bold" fontSize="sm" color="gray.500" pl={2} mt={2}>
                                                            DATA & TOOLS
                                                      </Text>
                                                      <Button
                                                            leftIcon={<RiHistoryLine />}
                                                            justifyContent="flex-start"
                                                            variant="ghost"
                                                            onClick={() => handleNavigate("/HistoricalPLC")}
                                                      >
                                                            Historical
                                                      </Button>

                                                      <Divider my={3} />

                                                      <Button
                                                            leftIcon={<FiUser />}
                                                            justifyContent="flex-start"
                                                            variant="ghost"
                                                            onClick={() => handleNavigate("/Profile")}
                                                      >
                                                            Profile
                                                      </Button>
                                                      <Button
                                                            leftIcon={<FiSettings />}
                                                            justifyContent="flex-start"
                                                            variant="ghost"
                                                            onClick={() => handleNavigate("/AdminPages")}
                                                      >
                                                            Settings
                                                      </Button>
                                                      <Button
                                                            leftIcon={<FiLogOut />}
                                                            justifyContent="flex-start"
                                                            variant="ghost"
                                                            colorScheme="red"
                                                            onClick={() => {
                                                                  handleLogout();
                                                                  onClose();
                                                            }}
                                                      >
                                                            Logout
                                                      </Button>
                                                </>
                                          )}
                                    </VStack>
                              </DrawerBody>
                        </DrawerContent>
                  </Drawer>
            </>
      );

      return (
            <Box
                  as="nav"
                  position="fixed"
                  top="0"
                  left="0"
                  width="100%"
                  bg={navbarBg}
                  boxShadow="0 2px 10px rgba(0,0,0,0.05)"
                  py={{ base: 2, md: 3 }}
                  px={{ base: 3, md: 4 }}
                  zIndex="1000"
                  minH={{ base: "60px", md: "70px" }}
            >
                  <Container maxW="container.xl" p={0}>
                        <Flex
                              justifyContent="space-between"
                              alignItems="center"
                              h="100%"
                              minH={{ base: "44px", md: "54px" }}
                        >
                              {/* Logo and Mobile Menu */}
                              <HStack spacing={{ base: 2, md: 4 }} flex="0 0 auto">
                                    <MobileNavigation />
                                    <Image
                                          src={logoSrc}
                                          fallbackSrc="/default-profile.png"
                                          alt="logo-saka"
                                          height={{ base: "8", md: "10" }}
                                          cursor="pointer"
                                          onClick={() => navigate("/Home")}
                                          flexShrink={0}
                                    />
                                    {/* Welcome text - responsive visibility and sizing */}
                                    {isLoggedIn && typeof user === "object" && user?.nama_lengkap && (
                                          <Text
                                                display={{ base: "none", sm: "none", md: "none", lg: "block" }}
                                                color={accentColor}
                                                fontWeight="600"
                                                fontSize={{ base: "xs", sm: "sm", md: "md", lg: "md" }}
                                                whiteSpace="nowrap"
                                                overflow="hidden"
                                                textOverflow="ellipsis"
                                                maxW={{ base: "120px", sm: "150px", md: "180px", lg: "200px" }}
                                          >
                                                Hi, {user.nama_lengkap}
                                          </Text>
                                    )}
                              </HStack>

                              {/* Desktop Navigation - Center */}
                              <HStack
                                    spacing={{ base: 0, md: 1, lg: 2 }}
                                    display={{ base: "none", md: "flex" }}
                                    alignItems="center"
                                    flex="1"
                                    justifyContent="center"
                                    maxW="600px"
                              >
                                    <Tooltip label="Home" placement="bottom">
                                          <Button
                                                variant="ghost"
                                                colorScheme="teal"
                                                size={{ base: "sm", md: "sm", lg: "md" }}
                                                fontSize={{ base: "xs", md: "sm", lg: "md" }}
                                                px={{ base: 2, md: 3, lg: 4 }}
                                                onClick={() => navigate("/Home")}
                                          >
                                                Home
                                          </Button>
                                    </Tooltip>

                                    <Menu>
                                          <Tooltip label="Dashboard" placement="bottom">
                                                <MenuButton
                                                      as={Button}
                                                      variant="ghost"
                                                      colorScheme="teal"
                                                      size={{ base: "sm", md: "sm", lg: "md" }}
                                                      fontSize={{ base: "xs", md: "sm", lg: "md" }}
                                                      px={{ base: 2, md: 3, lg: 4 }}
                                                >
                                                      Dashboard
                                                </MenuButton>
                                          </Tooltip>
                                          <MenuList shadow="lg" p={1}>
                                                {/* Submenu trigger with hover */}
                                                <Box
                                                      onMouseEnter={() => setOpen(true)}
                                                      onMouseLeave={() => setOpen(false)}
                                                >
                                                      <MenuItem
                                                            icon={<RiDashboardLine />}
                                                            _focus={{ bg: "teal.50", color: "teal.600" }}
                                                            borderRadius="md"
                                                            p={3}
                                                            fontSize={{ base: "sm", md: "md" }}
                                                      >
                                                            Temperature dan RH
                                                      </MenuItem>

                                                      <Collapse in={open} animateOpacity>
                                                            <Box pl={8} py={1} bg={submenuBg} color={submenuColor} rounded="md">
                                                                  <Button
                                                                        as={Link}
                                                                        to="/Dashboard"
                                                                        variant="ghost"
                                                                        width="100%"
                                                                        justifyContent="flex-start"
                                                                        size="sm"
                                                                        mb={1}
                                                                        _hover={{
                                                                              bg: menuHoverBg,
                                                                              color: menuHoverColor,
                                                                        }}
                                                                        onClick={e => e.stopPropagation()}
                                                                  >
                                                                        Dashboard
                                                                  </Button>
                                                                  <Button
                                                                        as={Link}
                                                                        to="/HistoricalPLC"
                                                                        variant="ghost"
                                                                        width="100%"
                                                                        justifyContent="flex-start"
                                                                        size="sm"
                                                                        _hover={{
                                                                              bg: menuHoverBg,
                                                                              color: menuHoverColor,
                                                                        }}
                                                                        onClick={e => e.stopPropagation()}
                                                                  >
                                                                        Historical
                                                                  </Button>
                                                            </Box>
                                                      </Collapse>
                                                </Box>
                                                {/* Menu lainnya */}
                                                {/* <MenuItem
                                                      icon={<RiDashboardLine />}
                                                      as={Link}
                                                      to="/DashboardInstrument"
                                                      _hover={{ bg: "teal.50", color: "teal.600" }}
                                                      borderRadius="md"
                                                      p={3}
                                                      fontSize={{ base: "sm", md: "md" }}
                                                >
                                                      Dashboard Instrument
                                                </MenuItem> */}
                                                <MenuItem
                                                      icon={<RiDashboardLine />}
                                                      as={Link}
                                                      to="/DashboardSampelRMPM"
                                                      _hover={{ bg: "teal.50", color: "teal.600" }}
                                                      borderRadius="md"
                                                      p={3}
                                                      fontSize={{ base: "sm", md: "md" }}
                                                >
                                                      Dashboard Sampel RMPM
                                                </MenuItem>
                                          </MenuList>
                                    </Menu>
                                    {isLoggedIn && (
                                          <>
                                                <Menu>
                                                      <Tooltip label="Dashboard" placement="bottom">
                                                            <MenuButton
                                                                  as={Button}
                                                                  variant="ghost"
                                                                  colorScheme="teal"
                                                                  size={{ base: "sm", md: "sm", lg: "md" }}
                                                                  fontSize={{ base: "xs", md: "sm", lg: "md" }}
                                                                  px={{ base: 2, md: 3, lg: 4 }}
                                                            >
                                                                  Document
                                                            </MenuButton>
                                                      </Tooltip>
                                                      <MenuList shadow="lg" p={1}>
                                                            {/* Submenu trigger with hover */}
                                                            <Box
                                                                  onMouseEnter={() => setOpenKS(true)}
                                                                  onMouseLeave={() => setOpenKS(false)}
                                                            >
                                                                  <MenuItem
                                                                        icon={<RiDashboardLine />}
                                                                        _focus={{ bg: menuHoverBg, color: menuHoverColor }}
                                                                        borderRadius="md"
                                                                        p={3}
                                                                  >
                                                                        Sampling Card
                                                                  </MenuItem>
                                                                  <Collapse in={openKS} animateOpacity>
                                                                        <Box pl={8} py={1} bg={submenuBg} color={submenuColor} rounded="md">
                                                                              <Button
                                                                                    as={Link}
                                                                                    to="/ListSamplingCard"
                                                                                    variant="ghost"
                                                                                    width="100%"
                                                                                    justifyContent="flex-start"
                                                                                    size="sm"
                                                                                    mb={1}
                                                                                    _hover={{ bg: menuHoverBg, color: menuHoverColor }}
                                                                                    onClick={e => e.stopPropagation()}
                                                                              >
                                                                                    List Sampling Card
                                                                              </Button>
                                                                              <Button
                                                                                    as={Link}
                                                                                    to="/EditSamplingCard"
                                                                                    variant="ghost"
                                                                                    width="100%"
                                                                                    justifyContent="flex-start"
                                                                                    size="sm"
                                                                                    mb={1}
                                                                                    _hover={{ bg: menuHoverBg, color: menuHoverColor }}
                                                                                    onClick={e => e.stopPropagation()}
                                                                              >
                                                                                    Create Sampling Card
                                                                              </Button>
                                                                              <Button
                                                                                    as={Link}
                                                                                    to="/ApprovalsSamplingCard"
                                                                                    variant="ghost"
                                                                                    width="100%"
                                                                                    justifyContent="flex-start"
                                                                                    size="sm"
                                                                                    _hover={{ bg: menuHoverBg, color: menuHoverColor }}
                                                                                    onClick={e => e.stopPropagation()}
                                                                              >
                                                                                    Approval Sampling Card
                                                                              </Button>
                                                                        </Box>
                                                                  </Collapse>
                                                            </Box>

                                                            {/* Submenu Keluhan Kualitas Material */}
                                                            <Box
                                                                  onMouseEnter={() => setOpenKKM(true)}
                                                                  onMouseLeave={() => setOpenKKM(false)}
                                                            >
                                                                  <MenuItem
                                                                        icon={<RiDashboardLine />}
                                                                        _focus={{ bg: menuHoverBg, color: menuHoverColor }}
                                                                        borderRadius="md"
                                                                        p={3}
                                                                  >
                                                                        Keluhan Kualitas Material
                                                                  </MenuItem>
                                                                  <Collapse in={openKKM} animateOpacity>
                                                                        <Box pl={8} py={1} bg={submenuBg} color={submenuColor} rounded="md">
                                                                              <Button
                                                                                    as={Link}
                                                                                    to="/ListKKM"
                                                                                    variant="ghost"
                                                                                    width="100%"
                                                                                    justifyContent="flex-start"
                                                                                    size="sm"
                                                                                    mb={1}
                                                                                    _hover={{ bg: menuHoverBg, color: menuHoverColor }}
                                                                                    onClick={e => e.stopPropagation()}
                                                                              >
                                                                                    List KKM
                                                                              </Button>
                                                                              <Button
                                                                                    as={Link}
                                                                                    to="/CreateKKM"
                                                                                    variant="ghost"
                                                                                    width="100%"
                                                                                    justifyContent="flex-start"
                                                                                    size="sm"
                                                                                    mb={1}
                                                                                    _hover={{ bg: menuHoverBg, color: menuHoverColor }}
                                                                                    onClick={e => e.stopPropagation()}
                                                                              >
                                                                                    Create KKM
                                                                              </Button>
                                                                              <Button
                                                                                    as={Link}
                                                                                    to="/ApprovalKKM"
                                                                                    variant="ghost"
                                                                                    width="100%"
                                                                                    justifyContent="flex-start"
                                                                                    size="sm"
                                                                                    _hover={{ bg: menuHoverBg, color: menuHoverColor }}
                                                                                    onClick={e => e.stopPropagation()}
                                                                              >
                                                                                    Approval KKM
                                                                              </Button>
                                                                        </Box>
                                                                  </Collapse>
                                                            </Box>
                                                      </MenuList>
                                                </Menu>

                                          </>
                                    )}
                                    {isLoggedIn && (
                                          <>
                                                <Menu>
                                                      {/* <Tooltip label="Dashboard" placement="bottom">
                                                            <MenuButton
                                                                  as={Button}
                                                                  variant="ghost"
                                                                  colorScheme="teal"
                                                                  size={{ base: "sm", md: "sm", lg: "md" }}
                                                                  fontSize={{ base: "xs", md: "sm", lg: "md" }}
                                                                  px={{ base: 2, md: 3, lg: 4 }}
                                                            >
                                                                  Logbook
                                                            </MenuButton>
                                                      </Tooltip> */}
                                                      <MenuList shadow="lg" p={1}>
                                                            {/* Submenu trigger with hover */}
                                                            <Box
                                                                  onMouseEnter={() => setOpenFG(true)}
                                                                  onMouseLeave={() => setOpenFG(false)}
                                                            >
                                                                  <MenuItem
                                                                        icon={<RiDashboardLine />}
                                                                        _focus={{ bg: menuHoverBg, color: menuHoverColor }}
                                                                        borderRadius="md"
                                                                        p={3}
                                                                  >
                                                                        Analyst
                                                                  </MenuItem>
                                                                  <Collapse in={openFG} animateOpacity>
                                                                        <Box pl={8} py={1} bg={submenuBg} color={submenuColor} rounded="md">
                                                                              <Button
                                                                                    as={Link}
                                                                                    to="/LogbookLabQC"
                                                                                    variant="ghost"
                                                                                    width="100%"
                                                                                    justifyContent="flex-start"
                                                                                    size="sm"
                                                                                    mb={1}
                                                                                    _hover={{ bg: menuHoverBg, color: menuHoverColor }}
                                                                                    onClick={e => e.stopPropagation()}
                                                                              >
                                                                                    XPR 204 (C)
                                                                              </Button>
                                                                              <Button
                                                                                    as={Link}
                                                                                    to="/CreateSamplingCard"
                                                                                    variant="ghost"
                                                                                    width="100%"
                                                                                    justifyContent="flex-start"
                                                                                    size="sm"
                                                                                    mb={1}
                                                                                    _hover={{ bg: menuHoverBg, color: menuHoverColor }}
                                                                                    onClick={e => e.stopPropagation()}
                                                                              >
                                                                                    XPR 204 (C)
                                                                              </Button>
                                                                              <Button
                                                                                    as={Link}
                                                                                    to="/ApprovalSamplingCard"
                                                                                    variant="ghost"
                                                                                    width="100%"
                                                                                    justifyContent="flex-start"
                                                                                    size="sm"
                                                                                    _hover={{ bg: menuHoverBg, color: menuHoverColor }}
                                                                                    onClick={e => e.stopPropagation()}
                                                                              >
                                                                                    XPR 105
                                                                              </Button>
                                                                              <Button
                                                                                    as={Link}
                                                                                    to="/ApprovalSamplingCard"
                                                                                    variant="ghost"
                                                                                    width="100%"
                                                                                    justifyContent="flex-start"
                                                                                    size="sm"
                                                                                    _hover={{ bg: menuHoverBg, color: menuHoverColor }}
                                                                                    onClick={e => e.stopPropagation()}
                                                                              >
                                                                                    Micro Balance
                                                                              </Button>
                                                                              <Button
                                                                                    as={Link}
                                                                                    to="/ApprovalSamplingCard"
                                                                                    variant="ghost"
                                                                                    width="100%"
                                                                                    justifyContent="flex-start"
                                                                                    size="sm"
                                                                                    _hover={{ bg: menuHoverBg, color: menuHoverColor }}
                                                                                    onClick={e => e.stopPropagation()}
                                                                              >
                                                                                    XPR 225
                                                                              </Button>
                                                                              <Button
                                                                                    as={Link}
                                                                                    to="/ApprovalSamplingCard"
                                                                                    variant="ghost"
                                                                                    width="100%"
                                                                                    justifyContent="flex-start"
                                                                                    size="sm"
                                                                                    _hover={{ bg: menuHoverBg, color: menuHoverColor }}
                                                                                    onClick={e => e.stopPropagation()}
                                                                              >
                                                                                    Semi Micro
                                                                              </Button>
                                                                        </Box>
                                                                  </Collapse>
                                                            </Box>

                                                            {/* Submenu Microbiology */}
                                                            <Box
                                                                  onMouseEnter={() => setOpenMicro(true)}
                                                                  onMouseLeave={() => setOpenMicro(false)}
                                                            >
                                                                  <MenuItem
                                                                        icon={<RiDashboardLine />}
                                                                        _focus={{ bg: menuHoverBg, color: menuHoverColor }}
                                                                        borderRadius="md"
                                                                        p={3}
                                                                  >
                                                                        Microbiology
                                                                  </MenuItem>
                                                                  <Collapse in={openMicro} animateOpacity>
                                                                        <Box pl={8} py={1} bg={submenuBg} color={submenuColor} rounded="md">
                                                                              <Button
                                                                                    as={Link}
                                                                                    to="/ListKKM"
                                                                                    variant="ghost"
                                                                                    width="100%"
                                                                                    justifyContent="flex-start"
                                                                                    size="sm"
                                                                                    mb={1}
                                                                                    _hover={{ bg: menuHoverBg, color: menuHoverColor }}
                                                                                    onClick={e => e.stopPropagation()}
                                                                              >
                                                                                    Logbook A
                                                                              </Button>
                                                                              <Button
                                                                                    as={Link}
                                                                                    to="/CreateKKM"
                                                                                    variant="ghost"
                                                                                    width="100%"
                                                                                    justifyContent="flex-start"
                                                                                    size="sm"
                                                                                    mb={1}
                                                                                    _hover={{ bg: menuHoverBg, color: menuHoverColor }}
                                                                                    onClick={e => e.stopPropagation()}
                                                                              >
                                                                                    Logbook B
                                                                              </Button>
                                                                              <Button
                                                                                    as={Link}
                                                                                    to="/ApprovalKKM"
                                                                                    variant="ghost"
                                                                                    width="100%"
                                                                                    justifyContent="flex-start"
                                                                                    size="sm"
                                                                                    _hover={{ bg: menuHoverBg, color: menuHoverColor }}
                                                                                    onClick={e => e.stopPropagation()}
                                                                              >
                                                                                    Logbook C
                                                                              </Button>
                                                                        </Box>

                                                                  </Collapse>
                                                            </Box>
                                                            {/* Submenu Inspector*/}
                                                            <Box
                                                                  onMouseEnter={() => setOpenPM(true)}
                                                                  onMouseLeave={() => setOpenPM(false)}
                                                            >
                                                                  <MenuItem
                                                                        icon={<RiDashboardLine />}
                                                                        _focus={{ bg: menuHoverBg, color: menuHoverColor }}
                                                                        borderRadius="md"
                                                                        p={3}
                                                                  >
                                                                        Inspector
                                                                  </MenuItem>
                                                                  <Collapse in={openPM} animateOpacity>
                                                                        <Box pl={8} py={1} bg={submenuBg} color={submenuColor} rounded="md">
                                                                              <Button
                                                                                    as={Link}
                                                                                    to="/ListKKM"
                                                                                    variant="ghost"
                                                                                    width="100%"
                                                                                    justifyContent="flex-start"
                                                                                    size="sm"
                                                                                    mb={1}
                                                                                    _hover={{ bg: menuHoverBg, color: menuHoverColor }}
                                                                                    onClick={e => e.stopPropagation()}
                                                                              >
                                                                                    XPR 3200
                                                                              </Button>
                                                                              <Button
                                                                                    as={Link}
                                                                                    to="/CreateKKM"
                                                                                    variant="ghost"
                                                                                    width="100%"
                                                                                    justifyContent="flex-start"
                                                                                    size="sm"
                                                                                    mb={1}
                                                                                    _hover={{ bg: menuHoverBg, color: menuHoverColor }}
                                                                                    onClick={e => e.stopPropagation()}
                                                                              >
                                                                                    Logbook Passbox
                                                                              </Button>
                                                                              <Button
                                                                                    as={Link}
                                                                                    to="/ApprovalKKM"
                                                                                    variant="ghost"
                                                                                    width="100%"
                                                                                    justifyContent="flex-start"
                                                                                    size="sm"
                                                                                    _hover={{ bg: menuHoverBg, color: menuHoverColor }}
                                                                                    onClick={e => e.stopPropagation()}
                                                                              >
                                                                                    Logbook LAF
                                                                              </Button>
                                                                              <Button
                                                                                    as={Link}
                                                                                    to="/ApprovalKKM"
                                                                                    variant="ghost"
                                                                                    width="100%"
                                                                                    justifyContent="flex-start"
                                                                                    size="sm"
                                                                                    _hover={{ bg: menuHoverBg, color: menuHoverColor }}
                                                                                    onClick={e => e.stopPropagation()}
                                                                              >
                                                                                    Logbook Thickness
                                                                              </Button>
                                                                        </Box>

                                                                  </Collapse>
                                                            </Box>
                                                      </MenuList>
                                                </Menu>

                                          </>
                                    )}
                              </HStack>

                              {/* Right Side - User Menu, Notifications, Theme Toggle */}
                              <HStack spacing={{ base: 1, md: 2 }} flex="0 0 auto">
                                    {!isLoginOrRegister && !isLoggedIn && (
                                          <Button
                                                colorScheme="teal"
                                                size={{ base: "sm", md: "md" }}
                                                fontSize={{ base: "xs", md: "sm" }}
                                                variant="solid"
                                                onClick={() => navigate("/Login")}
                                                borderRadius="full"
                                                px={{ base: 3, md: 4, lg: 6 }}
                                                _hover={{ transform: "translateY(-2px)", boxShadow: "md" }}
                                                transition="all 0.2s"
                                          >
                                                Login
                                          </Button>
                                    )}

                                    {isLoggedIn && typeof user === "object" && user?.nama_lengkap && (
                                          <>
                                                {/* Notifications */}
                                                <Menu>
                                                      <MenuButton
                                                            as={IconButton}
                                                            aria-label="Notifications"
                                                            icon={<FiBell />}
                                                            variant="ghost"
                                                            fontSize={{ base: "md", md: "lg", lg: "xl" }}
                                                            size={{ base: "sm", md: "md" }}
                                                            position="relative"
                                                            isRound
                                                      >
                                                            {pendingUsers?.length > 0 && (
                                                                  <Badge
                                                                        colorScheme="red"
                                                                        position="absolute"
                                                                        top="-2px"
                                                                        right="-2px"
                                                                        borderRadius="full"
                                                                        boxSize={{ base: "1rem", md: "1.2rem", lg: "1.4rem" }}
                                                                        display="flex"
                                                                        alignItems="center"
                                                                        justifyContent="center"
                                                                        fontSize={{ base: "2xs", md: "xs" }}
                                                                        fontWeight="bold"
                                                                        border="2px solid"
                                                                        borderColor={navbarBg}
                                                                  >
                                                                        {pendingUsers.length}
                                                                  </Badge>
                                                            )}
                                                      </MenuButton>
                                                      <MenuList shadow="lg" p={2}>
                                                            <Box px={3} py={2} fontWeight="medium" fontSize="sm" color="gray.500">
                                                                  Notifications
                                                            </Box>
                                                            <Divider my={2} />
                                                            {pendingUsers.length === 0 ? (
                                                                  <MenuItem textAlign="center" py={4} opacity={0.7} fontSize={{ base: "sm", md: "md" }}>
                                                                        No new notifications
                                                                  </MenuItem>
                                                            ) : (
                                                                  pendingUsers.map((user) => (
                                                                        <MenuItem
                                                                              key={user.id}
                                                                              onClick={() => navigate(`/AdminApproval/${user.id}`)}
                                                                              p={3}
                                                                              borderRadius="md"
                                                                              _hover={{ bg: "teal.50" }}
                                                                        >
                                                                              <HStack>
                                                                                    <Avatar size="sm" name={user.nama_lengkap} />
                                                                                    <Box>
                                                                                          <Text fontWeight="medium" fontSize={{ base: "sm", md: "md" }}>
                                                                                                {user.nama_lengkap}
                                                                                          </Text>
                                                                                          <Text fontSize={{ base: "xs", md: "xs" }} color="gray.500">
                                                                                                Waiting for approval
                                                                                          </Text>
                                                                                    </Box>
                                                                              </HStack>
                                                                        </MenuItem>
                                                                  ))
                                                            )}
                                                      </MenuList>
                                                </Menu>

                                                {/* User Avatar Menu */}
                                                <Menu>
                                                      <MenuButton
                                                            as={Button}
                                                            rounded="full"
                                                            variant="link"
                                                            cursor="pointer"
                                                            minW={0}
                                                            p={1}
                                                      >
                                                            <Avatar
                                                                  src={user.img || "/default-profile.png"}
                                                                  name={user?.nama_lengkap}
                                                                  size={{ base: "sm", md: "md" }}
                                                                  boxShadow="md"
                                                            />
                                                      </MenuButton>

                                                      <MenuList shadow="lg" p={2}>
                                                            <Box px={3} py={2}>
                                                                  <Text
                                                                        fontWeight="bold"
                                                                        fontSize={{ base: "xs", md: "sm" }}
                                                                        noOfLines={1}
                                                                  >
                                                                        {user?.nama_lengkap}
                                                                  </Text>
                                                            </Box>
                                                            <Divider my={2} />
                                                            <MenuItem
                                                                  icon={<FiUser />}
                                                                  onClick={() => navigate("/Profile")}
                                                                  borderRadius="md"
                                                                  _hover={{ bg: "teal.50", color: "teal.600" }}
                                                                  p={3}
                                                                  fontSize={{ base: "sm", md: "md" }}
                                                            >
                                                                  Profile
                                                            </MenuItem>
                                                            <MenuItem
                                                                  icon={<FiSettings />}
                                                                  onClick={() => navigate("/AdminPages")}
                                                                  borderRadius="md"
                                                                  _hover={{ bg: "teal.50", color: "teal.600" }}
                                                                  p={3}
                                                                  fontSize={{ base: "sm", md: "md" }}
                                                            >
                                                                  Settings
                                                            </MenuItem>
                                                            <Divider my={2} />
                                                            <MenuItem
                                                                  icon={<FiLogOut />}
                                                                  onClick={handleLocalLogout}
                                                                  borderRadius="md"
                                                                  _hover={{ bg: "red.50", color: "red.500" }}
                                                                  p={3}
                                                                  fontSize={{ base: "sm", md: "md" }}
                                                            >
                                                                  Logout
                                                            </MenuItem>
                                                      </MenuList>
                                                </Menu>
                                          </>
                                    )}

                                    {/* Theme Toggle */}
                                    <Tooltip label={colorMode === "light" ? "Dark Mode" : "Light Mode"}>
                                          <IconButton
                                                onClick={toggleColorMode}
                                                icon={colorMode === "light" ? <MoonIcon /> : <SunIcon />}
                                                isRound
                                                variant="ghost"
                                                aria-label="Toggle color mode"
                                                fontSize={{ base: "sm", md: "md", lg: "lg" }}
                                                size={{ base: "sm", md: "md" }}
                                          />
                                    </Tooltip>
                              </HStack>
                        </Flex>
                  </Container>
            </Box>
      );
}

export default Navbar;
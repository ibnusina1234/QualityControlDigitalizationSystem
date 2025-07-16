import React, { useState, useEffect, useRef } from "react";
import {
      Box, SimpleGrid, Stat, StatLabel, StatNumber, Heading,
      Icon, Flex, Text, useColorModeValue, Badge, Divider,
      useBreakpointValue
} from "@chakra-ui/react";
import { TbTemperatureSnow } from "react-icons/tb";
import { AiOutlineWarning } from "react-icons/ai";
import { WiHumidity } from "react-icons/wi";
import { keyframes } from "@emotion/react";
import { motion } from "framer-motion";
import { Line } from "react-chartjs-2";
import {
      Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement,
      TimeScale, Title, Tooltip, Legend, Filler
} from "chart.js";
import "chartjs-adapter-date-fns";

// Tambahkan plugin annotation
import annotationPlugin from "chartjs-plugin-annotation";

ChartJS.register(
      CategoryScale, LinearScale, PointElement, LineElement, TimeScale, Title, Tooltip, Legend, Filler,
      annotationPlugin // register annotation plugin
);

const rooms = [
      "Ruang Preparasi", "Ruang Timbang", "Ruang Instrument",
      "Ruang Reagen 1", "Ruang Reagen 2", "Ruang Reagen 3",
      "Ruang ICP", "Ruang Retained", "Ruang Timbang Mikrobiologi"
];

// Palette warna yang lebih menarik dan bervariasi
const roomColors = {
      "Ruang Preparasi": "#FF6384",
      "Ruang Timbang": "#36A2EB",
      "Ruang Instrument": "#4BC0C0",
      "Ruang Reagen 1": "#9966FF",
      "Ruang Reagen 2": "#FF9F40",
      "Ruang Reagen 3": "#FFCD56",
      "Ruang ICP": "#8884d8",
      "Ruang Retained": "#F06292",
      "Ruang Timbang Mikrobiologi": "#66BB6A"
};

// Definisi animasi berkedip untuk alert
const blink = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
`;

// Definisi animasi pulsasi untuk kartu yang dipilih
const pulse = keyframes`
  0% { box-shadow: 0 0 0 0 rgba(72, 187, 120, 0.7); }
  70% { box-shadow: 0 0 0 10px rgba(72, 187, 120, 0); }
  100% { box-shadow: 0 0 0 0 rgba(72, 187, 120, 0); }
`;

const Dashboard = () => {
      const bg = useColorModeValue("gray.50", "gray.900");
      const boxBg = useColorModeValue("white", "gray.800");
      const headingColor = useColorModeValue("teal.600", "teal.400");
      const cardBorder = useColorModeValue("teal.100", "teal.700");
      const selectedBg = useColorModeValue("teal.50", "teal.900");
      const xTickColor = useColorModeValue("#666", "#ccc");
      const textColor = useColorModeValue("#666", "#ccc");

      const socketRef = useRef(null);
      const [selectedRoom, setSelectedRoom] = useState(null);
      const [lastAlertSent, setLastAlertSent] = useState({});
      const [data, setData] = useState(
            Object.fromEntries(rooms.map((room) => [room, { Temperature: "N/A", RH: "N/A", updatedAt: null }]))
      );

      const [chartData, setChartData] = useState({
            datasets: rooms.map((room) => ({
                  label: room,
                  data: [],
                  borderColor: roomColors[room],
                  backgroundColor: `${roomColors[room]}33`,
                  borderWidth: 2,
                  fill: selectedRoom === room ? true : false,
                  tension: 0.4,
                  pointRadius: 0,
                  pointHoverRadius: 5,
            })),
      });

      const [rhChartData, setRhChartData] = useState({
            datasets: rooms.map((room) => ({
                  label: room,
                  data: [],
                  borderColor: roomColors[room],
                  backgroundColor: `${roomColors[room]}33`,
                  borderWidth: 2,
                  fill: selectedRoom === room ? true : false,
                  tension: 0.4,
                  pointRadius: 0,
                  pointHoverRadius: 5,
            })),
      });

      const sendAlertToBackend = async ({ room, temperature, time }) => {
            try {
                  // 🔁 Kirim ke backend utama
                  await fetch("http://10.126.15.141:8081/users/alert", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ room, temperature, time }),
                  });

                  // 🔔 Kirim juga ke Python TTS alarm speaker
                  await fetch("http://10.126.7.220:5005/alert", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ room, temperature, time }),
                  });

                  console.log("✅ Alert dikirim ke kedua server");
            } catch (error) {
                  console.error("❌ Gagal mengirim alert:", error);
            }
      };

      useEffect(() => {
            // Mengatur height fullscreen
            document.body.style.margin = '0';
            document.body.style.padding = '0';
            document.body.style.overflow = 'hidden';

            socketRef.current = new WebSocket("ws://10.126.15.197:1880/ws/qc");

            socketRef.current.onopen = () => console.log("WebSocket connected");

            socketRef.current.onmessage = (event) => {
                  try {
                        const message = JSON.parse(event.data);
                        const timestamp = new Date();

                        setData((prevData) => {
                              const updatedData = { ...prevData };
                              Object.keys(message).forEach((key) => {
                                    const match = key.match(/(Temperature|RH)_(Ruang_.*)/);
                                    if (match) {
                                          const [, type, rawRoom] = match;
                                          const room = rawRoom.replace(/_/g, " ");
                                          if (!updatedData[room]) updatedData[room] = { Temperature: "N/A", RH: "N/A", updatedAt: null };
                                          updatedData[room][type] = message[key];
                                          updatedData[room].updatedAt = timestamp.toISOString();

                                          if (type === "Temperature") {
                                                const temperature = parseFloat(message[key]);
                                                const lastSent = lastAlertSent[room];
                                                const oneHour = 60 * 60 * 1000;

                                                if (!isNaN(temperature) && (temperature < 20 || temperature > 24)) {
                                                      if (!lastSent || timestamp - new Date(lastSent) > oneHour) {
                                                            sendAlertToBackend({ room, temperature, time: timestamp.toISOString() });
                                                            setLastAlertSent((prev) => ({
                                                                  ...prev,
                                                                  [room]: timestamp.toISOString(),
                                                            }));
                                                      }
                                                }
                                          }
                                    }
                              });
                              return updatedData;
                        });

                        const updateChart = (prevChartData, typeKey, defaultY) => ({
                              datasets: rooms.map((room) => {
                                    const roomKey = room.replace(/ /g, "_");
                                    const rawValue = message[`${typeKey}_${roomKey}`];
                                    const newValue = parseFloat(rawValue);
                                    const dataset = prevChartData.datasets.find((d) => d.label === room);
                                    const oldData = dataset?.data || [];

                                    // Menyimpan dengan 1 desimal untuk perubahan yang lebih terlihat
                                    const valueToAdd = isNaN(newValue)
                                          ? (oldData[oldData.length - 1]?.y || defaultY)
                                          : parseFloat(newValue.toFixed(1));

                                    return {
                                          ...dataset,
                                          data: [
                                                ...oldData,
                                                {
                                                      x: timestamp,
                                                      y: valueToAdd,
                                                },
                                          ].slice(-40),
                                          fill: selectedRoom === room ? true : false,
                                          hidden: selectedRoom && selectedRoom !== room,
                                    };
                              }),
                        });

                        setChartData((prev) => updateChart(prev, "Temperature", 22.5));
                        setRhChartData((prev) => updateChart(prev, "RH", 50));
                  } catch (error) {
                        console.error("WebSocket error", error);
                  }
            };

            return () => {
                  socketRef.current?.close();
                  document.body.style.overflow = '';
            };
      }, [lastAlertSent, selectedRoom]);

      useEffect(() => {
            setChartData(prev => ({
                  datasets: prev.datasets.map(dataset => ({
                        ...dataset,
                        fill: selectedRoom === dataset.label,
                        hidden: selectedRoom && selectedRoom !== dataset.label,
                  }))
            }));

            setRhChartData(prev => ({
                  datasets: prev.datasets.map(dataset => ({
                        ...dataset,
                        fill: selectedRoom === dataset.label,
                        hidden: selectedRoom && selectedRoom !== dataset.label,
                  }))
            }));
      }, [selectedRoom]);

      const temperatureChart = {
            datasets: chartData.datasets,
      };

      const rhChart = {
            datasets: rhChartData.datasets,
      };

      const commonOptions = {
            responsive: true,
            maintainAspectRatio: false,
            animation: { duration: 500, easing: "easeOutQuad" },
            plugins: {
                  legend: {
                        position: "top",
                        labels: {
                              usePointStyle: true,
                              boxWidth: 10,
                              padding: 10,
                              font: {
                                    size: 11
                              }
                        }
                  },
                  tooltip: {
                        mode: 'index',
                        intersect: false,
                        callbacks: {
                              label: function (context) {
                                    let label = context.dataset.label || '';
                                    if (label) {
                                          label += ': ';
                                    }
                                    if (context.parsed.y !== null) {
                                          label += context.parsed.y.toFixed(1);
                                          if (context.parsed.y < 30) {
                                                label += '°C';
                                          } else {
                                                label += '%';
                                          }
                                    }
                                    return label;
                              }
                        }
                  }
            },
            interaction: {
                  mode: 'nearest',
                  axis: 'x',
                  intersect: false
            },
            elements: {
                  point: {
                        radius: 0,
                        hoverRadius: 5,
                        hitRadius: 10,
                  }
            },
            scales: {
                  x: {
                        type: "time",
                        time: {
                              unit: "second",
                              tooltipFormat: "HH:mm:ss",
                              displayFormats: {
                                    second: "HH:mm:ss",
                                    minute: "HH:mm"
                              },
                        },
                        ticks: {
                              autoSkip: true,
                              maxTicksLimit: 8,
                              color: useColorModeValue("#666", "#ccc"),
                              font: {
                                    size: 10
                              }
                        },
                        grid: {
                              display: true,
                              color: useColorModeValue("#f0f0f0", "#333"),
                        },
                        border: {
                              display: true,
                        },
                  },
            },
      };

      const getStatusColor = (temp) => {
            if (isNaN(temp)) return "gray.500";
            if (temp > 24) return "red.500";
            if (temp < 20) return "blue.500";
            return "green.500";
      };

      const getStatusText = (temp) => {
            if (isNaN(temp)) return "Tidak ada data";
            if (temp > 24) return "Suhu Tinggi";
            if (temp < 20) return "Suhu Rendah";
            return "Normal";
      };

      // Format waktu terakhir update
      const formatLastUpdate = (timestamp) => {
            if (!timestamp) return "Belum ada data";
            const date = new Date(timestamp);
            return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      };

      // Mendapatkan waktu sekarang untuk header
      const currentTime = new Date().toLocaleString('id-ID', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
      });

      // Opsi Temperature Chart (tambahkan annotation garis merah di 20 dan 28 °C)
      const tempChartOptions = {
            ...commonOptions,
            scales: {
                  ...commonOptions.scales,
                  y: {
                        min: 20,
                        max: 24,
                        ticks: {
                              stepSize: 1,
                              callback: function (value) { return value + '°C'; },
                              color: useColorModeValue("#666", "#ccc"),
                              font: { size: 10 }
                        },
                        grid: { color: useColorModeValue("#f0f0f0", "#333") },
                        border: { display: true },
                  },
            },
            plugins: {
                  ...commonOptions.plugins,
                  annotation: {
                        annotations: {
                              limitAtas: {
                                    type: 'line',
                                    yMin: 24,
                                    yMax: 24,
                                    borderColor: 'red',
                                    borderWidth: 2,
                                    borderDash: [6, 4],
                                    label: {
                                          content: 'Limit Atas (24°C)',
                                          enabled: true,
                                          position: "start",
                                          color: 'red',
                                          backgroundColor: 'white',
                                          font: {
                                                weight: 'bold',
                                                size: 10
                                          },
                                          yAdjust: -8,
                                          xAdjust: 40,
                                    }
                              },
                              limitBawah: {
                                    type: 'line',
                                    yMin: 20,
                                    yMax: 20,
                                    borderColor: 'red', // diganti jadi merah
                                    borderWidth: 2,
                                    borderDash: [6, 4],
                                    label: {
                                          content: 'Limit Bawah (20°C)',
                                          enabled: true,
                                          position: "start",
                                          color: 'red', // juga merah
                                          backgroundColor: 'white',
                                          font: {
                                                weight: 'bold',
                                                size: 10
                                          },
                                          yAdjust: -8,
                                          xAdjust: 40,
                                    }
                              }
                        }
                  },
                  title: {
                        display: true,
                        text: 'Range: 20°C - 24°C',
                        position: 'bottom',
                        padding: {
                              top: 2,
                              bottom: 0
                        },
                        font: {
                              size: 10,
                              style: 'italic'
                        },
                        color: useColorModeValue("#666", "#ccc"),
                  }
            }
      };

      // Detect desktop (lg and up) or not
      const isDesktop = useBreakpointValue({ base: false, lg: true });

      return (
            <Box
                  w="100vw"
                  h="100vh"
                  bg={bg}
                  mt={5}
                  overflow="hidden"
                  display="flex"
                  flexDirection="column"
            >
                  {/* Header */}
                  <Flex
                        bg={useColorModeValue("teal.600", "teal.800")}
                        color="white"
                        p={3}
                        px={5}
                        justifyContent="space-between"
                        alignItems="center"
                        boxShadow="md"
                  >
                        <Heading size="lg">PEMANTAUAN SUHU & RH</Heading>
                        <Text fontSize="sm">{currentTime}</Text>
                  </Flex>

                  {/* Main Content */}
                  <Box flex="1" overflow="hidden" p={4}>
                        <Flex h="100%" direction="column">
                              {/* Grafik Area - Tampil hanya di desktop */}
                              {isDesktop && (
                                    <Box h="40%" mb={4}>
                                          <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={4} h="100%">
                                                <Box
                                                      p={3}
                                                      bg={boxBg}
                                                      rounded="lg"
                                                      shadow="md"
                                                      borderWidth="1px"
                                                      borderColor={cardBorder}
                                                      display="flex"
                                                      flexDirection="column"
                                                >
                                                      <Heading size="sm" mb={2} color={headingColor}>
                                                            {selectedRoom ? `Grafik Suhu - ${selectedRoom}` : "Grafik Suhu Real-time"}
                                                      </Heading>
                                                      <Divider mb={2} />
                                                      <Box flex="1" position="relative">
                                                            <Line
                                                                  data={temperatureChart}
                                                                  options={tempChartOptions}
                                                            />
                                                      </Box>
                                                </Box>

                                                <Box
                                                      p={3}
                                                      bg={boxBg}
                                                      rounded="lg"
                                                      shadow="md"
                                                      borderWidth="1px"
                                                      borderColor={cardBorder}
                                                      display="flex"
                                                      flexDirection="column"
                                                >
                                                      <Heading size="sm" mb={2} color={headingColor}>
                                                            {selectedRoom ? `Grafik RH - ${selectedRoom}` : "Grafik Kelembaban Real-time"}
                                                      </Heading>
                                                      <Divider mb={2} />
                                                      <Box flex="1" position="relative">
                                                            <Line
                                                                  data={rhChart}
                                                                  options={{
                                                                        ...commonOptions,
                                                                        scales: {
                                                                              ...commonOptions.scales,
                                                                              y: {
                                                                                    min: 50,
                                                                                    max: 100,
                                                                                    ticks: {
                                                                                          stepSize: 5,
                                                                                          callback: function (value) {
                                                                                                return value + '%';
                                                                                          },
                                                                                          color: xTickColor,
                                                                                          font: {
                                                                                                size: 10
                                                                                          }
                                                                                    },
                                                                                    grid: {
                                                                                          color: xTickColor,
                                                                                    },
                                                                                    border: {
                                                                                          display: true,
                                                                                    },
                                                                              },
                                                                        },
                                                                        plugins: {
                                                                              ...commonOptions.plugins,
                                                                              title: {
                                                                                    display: true,
                                                                                    text: 'Range: 50% - 100%',
                                                                                    position: 'bottom',
                                                                                    padding: {
                                                                                          top: 2,
                                                                                          bottom: 0
                                                                                    },
                                                                                    font: {
                                                                                          size: 10,
                                                                                          style: 'italic'
                                                                                    },
                                                                                    color: textColor,
                                                                              }
                                                                        }
                                                                  }}
                                                            />
                                                      </Box>
                                                </Box>
                                          </SimpleGrid>
                                    </Box>
                              )}

                              {/* Filter Badge */}
                              {selectedRoom && (
                                    <Box mb={3} textAlign="center">
                                          <Badge
                                                colorScheme="teal"
                                                p={2}
                                                fontSize="sm"
                                                borderRadius="md"
                                                onClick={() => setSelectedRoom(null)}
                                                cursor="pointer"
                                          >
                                                × Reset Filter: {selectedRoom}
                                          </Badge>
                                    </Box>
                              )}

                              {/* Cards Area - Menggunakan ruang yang tersisa */}
                              <Box flex="1" overflow="auto" pb={2}>
                                    <SimpleGrid
                                          columns={{ base: 1, sm: 2, md: 3, lg: 4, xl: 4 }}
                                          spacing={4}
                                    >
                                          {Object.entries(data).map(([room, values], index) => {
                                                const temperature = parseFloat(values.Temperature);
                                                const humidity = parseFloat(values.RH);
                                                const isWarning = !isNaN(temperature) && (temperature < 20 || temperature > 24);
                                                const statusColor = getStatusColor(temperature);
                                                const statusText = getStatusText(temperature);

                                                return (
                                                      <motion.div
                                                            key={index}
                                                            whileHover={{ scale: 1.03, transition: { duration: 0.2 } }}
                                                            whileTap={{ scale: 0.98 }}
                                                            onClick={() => setSelectedRoom(room === selectedRoom ? null : room)}
                                                      >
                                                            <Box
                                                                  p={4}
                                                                  bg={
                                                                        isWarning
                                                                              ? "red.50"
                                                                              : selectedRoom === room
                                                                                    ? selectedBg
                                                                                    : boxBg
                                                                  }
                                                                  rounded="lg"
                                                                  shadow="md"
                                                                  cursor="pointer"
                                                                  borderWidth="1px"
                                                                  borderColor={
                                                                        isWarning
                                                                              ? "red.200"
                                                                              : selectedRoom === room
                                                                                    ? "teal.200"
                                                                                    : cardBorder
                                                                  }
                                                                  animation={
                                                                        isWarning
                                                                              ? `${blink} 1.5s infinite`
                                                                              : selectedRoom === room
                                                                                    ? `${pulse} 2s infinite`
                                                                                    : "none"
                                                                  }
                                                                  position="relative"
                                                                  overflow="hidden"
                                                                  height="100%"
                                                            >
                                                                  {selectedRoom === room && (
                                                                        <Box
                                                                              position="absolute"
                                                                              top={0}
                                                                              right={0}
                                                                              bg="teal.400"
                                                                              color="white"
                                                                              px={2}
                                                                              py={0.5}
                                                                              fontSize="xs"
                                                                              borderBottomLeftRadius="md"
                                                                        >
                                                                              Terpilih
                                                                        </Box>
                                                                  )}

                                                                  <Flex align="center" mb={2} justify="space-between">
                                                                        <Flex align="center">
                                                                              <Icon
                                                                                    as={TbTemperatureSnow}
                                                                                    w={6}
                                                                                    h={6}
                                                                                    color={statusColor}
                                                                              />
                                                                              <Text fontSize="md" fontWeight="bold" ml={2} noOfLines={1}>
                                                                                    {room}
                                                                              </Text>
                                                                        </Flex>
                                                                        {isWarning && (
                                                                              <Icon
                                                                                    as={AiOutlineWarning}
                                                                                    w={5}
                                                                                    h={5}
                                                                                    color="red.500"
                                                                                    animation={`${blink} 1s infinite`}
                                                                              />
                                                                        )}
                                                                  </Flex>

                                                                  <Divider mb={2} />

                                                                  <Box>
                                                                        <Stat size="sm">
                                                                              <StatLabel fontSize="xs">Temperature</StatLabel>
                                                                              <Flex align="center" justify="space-between">
                                                                                    <StatNumber fontSize="xl" color={statusColor}>
                                                                                          {isNaN(temperature)
                                                                                                ? "N/A"
                                                                                                : `${temperature.toFixed(1)}°C`}
                                                                                    </StatNumber>
                                                                                    <Badge colorScheme={
                                                                                          isWarning ? "red" : (isNaN(temperature) ? "gray" : "green")
                                                                                    } fontSize="xs">
                                                                                          {statusText}
                                                                                    </Badge>
                                                                              </Flex>

                                                                              <Divider my={2} />

                                                                              <Flex align="center" mt={1}>
                                                                                    <Icon as={WiHumidity} w={5} h={5} color="blue.400" mr={1} />
                                                                                    <Text fontSize="sm" fontWeight="medium">Humidity:</Text>
                                                                                    <Text ml={1} fontSize="sm" fontWeight="bold" color="blue.500">
                                                                                          {isNaN(humidity) ? "N/A" : `${humidity.toFixed(1)}%`}
                                                                                    </Text>
                                                                              </Flex>
                                                                        </Stat>
                                                                  </Box>

                                                                  <Text fontSize="xs" color="gray.500" mt={2} textAlign="right">
                                                                        Update: {formatLastUpdate(values.updatedAt)}
                                                                  </Text>
                                                            </Box>
                                                      </motion.div>
                                                );
                                          })}
                                    </SimpleGrid>
                              </Box>
                        </Flex>
                  </Box>

                  {/* Footer */}
                  <Box
                        bg={useColorModeValue("gray.200", "gray.700")}
                        p={1.5}
                        textAlign="center"
                        boxShadow="inner"
                  >
                        <Text fontSize="xs">QC Laboratory Monitoring System © 2025</Text>
                  </Box>
            </Box>
      );
};

export default Dashboard;
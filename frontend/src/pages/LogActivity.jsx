import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import {
  Box,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Input,
  Heading,
  Spinner,
  Text,
  Alert,
  AlertIcon,
  Flex,
  Button,
} from "@chakra-ui/react";
import { DownloadIcon } from "@chakra-ui/icons";
import { jsPDF } from "jspdf";
import "jspdf-autotable";

const LogActivity = () => {
  const [logs, setLogs] = useState([]);
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${process.env.REACT_APP_API_BASE_URL}/users/searchUserLogs`);
        if (!res.ok) throw new Error(`Failed to fetch logs: ${res.statusText}`);
        const data = await res.json();
        setLogs(data);
      } catch (err) {
        setError("Failed to fetch logs");
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, []);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await axios.get( `${process.env.REACT_APP_API_BASE_URL}/users/getUsers`);
        if (Array.isArray(res.data)) {
          setUsers(res.data);
        } else {
          console.error("Data users tidak berbentuk array", res.data);
        }
      } catch {
        setError("Failed to fetch users");
      }
    };

    fetchUsers();
  }, []);

  const getUserName = (userId) => {
    if (!Array.isArray(users) || !userId) return "Unknown";
    const user = users.find((u) => u.id === userId);
    return user?.nama_lengkap || "Unknown";
  };

  const filteredLogs = useMemo(() => {
    const keyword = search.toLowerCase();
    return logs.filter((log) => {
      const createdAt = new Date(log.created_at);
      const matchKeyword =
        log.activity.toLowerCase().includes(keyword) ||
        log.user_id.toString().includes(keyword);
      const isAfterStart = startDate ? createdAt >= new Date(startDate) : true;
      const isBeforeEnd = endDate ? createdAt <= new Date(endDate + "T23:59:59") : true;
      return matchKeyword && isAfterStart && isBeforeEnd;
    });
  }, [logs, search, startDate, endDate]);

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text("Laporan Log Aktivitas", 14, 15);

    const tableColumn = ["ID", "Nama Lengkap", "Aktivitas", "IP", "User Agent", "Waktu"];
    const tableRows = filteredLogs.map((log) => [
      log.id,
      getUserName(log.user_id),
      log.activity,
      log.ip_address,
      log.user_agent,
      new Date(log.created_at).toLocaleString("id-ID"),
    ]);

    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 20,
      margin: { top: 30 },
      theme: "striped",
      headStyles: {
        fillColor: [22, 160, 133],
        textColor: 255,
        fontStyle: "bold",
        halign: "center",
      },
      bodyStyles: {
        fillColor: [255, 255, 255],
        textColor: 0,
        halign: "center",
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245],
      },
    });

    doc.save("log_aktivitas.pdf");
  };

  return (
    <Box p={6} mt={20}>
      <Heading mb={4}>Log Aktivitas User</Heading>

      <Flex gap={4} mb={4} flexWrap="wrap">
        <Input
          type="text"
          placeholder="Cari aktivitas / ID user..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          maxW="300px"
        />
        <Input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          maxW="200px"
        />
        <Input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          maxW="200px"
        />
        <Button
          leftIcon={<DownloadIcon />}
          colorScheme="blue"
          onClick={handleDownloadPDF}
        >
          Download PDF
        </Button>
      </Flex>

      {loading ? (
        <Spinner size="lg" />
      ) : error ? (
        <Alert status="error" mb={4}>
          <AlertIcon />
          {error}
        </Alert>
      ) : filteredLogs.length === 0 ? (
        <Text>Tidak ada aktivitas ditemukan.</Text>
      ) : (
        <Box overflowX="auto">
          <Table variant="striped" size="md">
            <Thead>
              <Tr>
                <Th>ID</Th>
                <Th>Nama Lengkap</Th>
                <Th>Aktivitas</Th>
                <Th>IP Address</Th>
                <Th>User Agent</Th>
                <Th>Waktu</Th>
              </Tr>
            </Thead>
            <Tbody>
              {filteredLogs.map((log) => (
                <Tr key={log.id}>
                  <Td>{log.id}</Td>
                  <Td>{getUserName(log.user_id)}</Td>
                  <Td>{log.activity}</Td>
                  <Td>{log.ip_address}</Td>
                  <Td maxW="300px" whiteSpace="normal">
                    {log.user_agent}
                  </Td>
                  <Td>
                    {new Date(log.created_at).toLocaleString("id-ID", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Box>
      )}
    </Box>
  );
};

export default LogActivity;

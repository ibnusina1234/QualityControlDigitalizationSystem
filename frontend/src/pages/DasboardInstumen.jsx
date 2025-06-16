import React, { useState, useMemo } from 'react';
import {
      Box,
      Button,
      Input,
      Table,
      Text,
      Thead,
      Tbody,
      Tr,
      Th,
      Td,
      IconButton,
      HStack,
      VStack,
      Select,
      Modal,
      ModalOverlay,
      ModalContent,
      ModalHeader,
      ModalCloseButton,
      ModalBody,
      ModalFooter,
      useDisclosure,
} from '@chakra-ui/react';
import { FaPrint } from 'react-icons/fa';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const initialData = [
      {
            datetime: '2025-03-07 02:15:23',
            name: 'John Doe',
            material: 'Material A',
            batch: '12345',
            weightAvg: 50,
            unit: 'kg',
            serial: 'SN001',
            weights: [48.5, 50.2, 49.8, 50.1, 51, 48.7, 49.5, 50, 50.3, 49.9],
      },
      {
            datetime: '2025-03-06 14:12:45',
            name: 'Jane Smith',
            material: 'Material B',
            batch: '67890',
            weightAvg: 30,
            unit: 'kg',
            serial: 'SN002',
            weights: [29.8, 30.2, 30.1, 30.5, 29.7, 30.3, 30.6, 29.9, 30, 30.4],
      },
];

const columns = [
      { Header: 'Tanggal dan Waktu', accessor: 'datetime' },
      { Header: 'Nama', accessor: 'name' },
      { Header: 'Nama Material', accessor: 'material' },
      { Header: 'No. Batch Material', accessor: 'batch' },
      { Header: 'Rata-rata Bobot', accessor: 'weightAvg' },
      { Header: 'Satuan', accessor: 'unit' },
      { Header: 'No. Serial', accessor: 'serial' },
];

const DashboardInstrument = () => {
      const [searchInput, setSearchInput] = useState('');
      const [selectedSerial, setSelectedSerial] = useState('');
      const { isOpen, onOpen, onClose } = useDisclosure();
      const [selectedData, setSelectedData] = useState(null);

      const filteredData = useMemo(() => {
            return initialData.filter(
                  (item) =>
                        (selectedSerial ? item.serial.includes(selectedSerial) : true) &&
                        Object.values(item).some((value) =>
                              value.toString().toLowerCase().includes(searchInput.toLowerCase())
                        )
            );
      }, [searchInput, selectedSerial]);

      const handleRowClick = (row) => {
            setSelectedData(row);
            onOpen();
      };

      const handlePrintRowPDF = (row) => {
            const doc = new jsPDF();
            doc.text('Detail Timbangan', 14, 10);

            autoTable(doc, {
                  head: [['Label', 'Data']],
                  body: [
                        ['Tanggal & Waktu', row.datetime],
                        ['Nama', row.name],
                        ['Material', row.material],
                        ['Batch', row.batch],
                        ['Rata-rata Bobot', `${row.weightAvg} ${row.unit}`],
                        ['No. Serial', row.serial],
                  ],
                  startY: 20,
            });

            doc.text('Detail Bobot:', 14, doc.lastAutoTable.finalY + 10);
            autoTable(doc, {
                  head: [['No', 'Bobot (kg)']],
                  body: row.weights.map((weight, index) => [index + 1, weight]),
                  startY: doc.lastAutoTable.finalY + 15,
            });

            doc.save(`Timbangan_${row.serial}.pdf`);
      };

      const handlePrintPDF = () => {
            const doc = new jsPDF();
            doc.text('Laporan Timbangan', 14, 10);

            const tableData = filteredData.map((row) => [
                  row.datetime,
                  row.name,
                  row.material,
                  row.batch,
                  row.weightAvg + ' ' + row.unit,
                  row.serial,
            ]);

            autoTable(doc, {
                  head: [['Tanggal & Waktu', 'Nama', 'Material', 'Batch', 'Rata-rata Bobot', 'Serial']],
                  body: tableData,
                  startY: 20,
            });

            doc.save('Laporan_Timbangan.pdf');
      };

      return (
            <VStack spacing={4} align="stretch" mt={20}>
                  <HStack justify="space-between" w="100%" px={5}>
                        <HStack spacing={3}>
                              <Text fontWeight="bold">Search:</Text>
                              <Input
                                    borderColor="black"
                                    value={searchInput}
                                    onChange={(e) => setSearchInput(e.target.value)}
                                    placeholder="Cari data..."
                                    width="200px"
                              />
                              <Select
                                    placeholder="Pilih No. Serial"
                                    value={selectedSerial}
                                    onChange={(e) => setSelectedSerial(e.target.value)}
                                    width="200px"
                              >
                                    {[...new Set(initialData.map((d) => d.serial))].map((serial) => (
                                          <option key={serial} value={serial}>
                                                {serial}
                                          </option>
                                    ))}
                              </Select>
                        </HStack>
                        <Text fontWeight="bold" flexGrow={1} textAlign="center">
                              TIMBANGAN METTLER TOLEDO XPR 3200
                        </Text>
                        <IconButton icon={<FaPrint />} aria-label="Print PDF" colorScheme="red" onClick={handlePrintPDF} />
                  </HStack>

                  <Box overflowX="auto">
                        <Table variant="striped">
                              <Thead>
                                    <Tr>
                                          {columns.map((col) => (
                                                <Th key={col.accessor}>{col.Header}</Th>
                                          ))}
                                          <Th>Aksi</Th>
                                    </Tr>
                              </Thead>
                              <Tbody>
                                    {filteredData.map((row, idx) => (
                                          <Tr key={idx} onClick={() => handleRowClick(row)} cursor="pointer">
                                                {columns.map((col) => (
                                                      <Td key={col.accessor}>{row[col.accessor]}</Td>
                                                ))}
                                                <Td>
                                                      <IconButton
                                                            icon={<FaPrint />}
                                                            aria-label="Print Row"
                                                            colorScheme="blue"
                                                            size="sm"
                                                            onClick={(e) => {
                                                                  e.stopPropagation();
                                                                  handlePrintRowPDF(row);
                                                            }}
                                                      />
                                                </Td>
                                          </Tr>
                                    ))}
                              </Tbody>
                        </Table>
                  </Box>

                  <Modal isOpen={isOpen} onClose={onClose}>
                        <ModalOverlay />
                        <ModalContent>
                              <ModalHeader>Detail Timbangan</ModalHeader>
                              <ModalCloseButton />
                              <ModalBody>
                                    {selectedData && (
                                          <>
                                                <Text><strong>No. Batch:</strong> {selectedData.batch}</Text>
                                                <Text><strong>No. Serial:</strong> {selectedData.serial}</Text>
                                                <Text><strong>Nama Material:</strong> {selectedData.material}</Text>

                                                <Box mt={3}>
                                                      <Text fontWeight="bold">Rincian Bobot Timbangan:</Text>
                                                      <Table size="sm" variant="simple">
                                                            <Tbody>
                                                                  {selectedData.weights.map((weight, i) => (
                                                                        <Tr key={i}>
                                                                              <Td>{i + 1}</Td>
                                                                              <Td>{weight} kg</Td>
                                                                        </Tr>
                                                                  ))}
                                                            </Tbody>
                                                      </Table>
                                                </Box>
                                          </>
                                    )}
                              </ModalBody>
                              <ModalFooter>
                                    <Button colorScheme="blue" onClick={onClose}>
                                          Tutup
                                    </Button>
                              </ModalFooter>
                        </ModalContent>
                  </Modal>
            </VStack>
      );
};

export default DashboardInstrument;

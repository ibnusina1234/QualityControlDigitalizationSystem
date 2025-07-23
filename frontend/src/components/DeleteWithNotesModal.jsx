import React, { useState } from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Textarea,
} from "@chakra-ui/react";

function DeleteWithNotesModal({ isOpen, onClose, onConfirm, title = "Konfirmasi Hapus Data", loading = false }) {
  const [notes, setNotes] = useState("");

  const handleConfirm = () => {
    onConfirm(notes);
    setNotes("");
  };

  const handleClose = () => {
    setNotes("");
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} isCentered>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader color="red.600">{title}</ModalHeader>
        <ModalBody>
          <p className="mb-2 text-gray-700 dark:text-gray-200">
            Apakah Anda yakin ingin menghapus data ini? Mohon berikan alasan/catatan penghapusan.
          </p>
          <Textarea
            placeholder="Catatan alasan penghapusan (wajib diisi)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            isRequired
          />
        </ModalBody>
        <ModalFooter>
          <Button onClick={handleClose} colorScheme="gray" mr={3}>
            Batal
          </Button>
          <Button
            colorScheme="red"
            onClick={handleConfirm}
            isLoading={loading}
            isDisabled={!notes.trim()}
          >
            Hapus
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

export default DeleteWithNotesModal;
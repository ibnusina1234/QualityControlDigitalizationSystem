import React, { useState, useEffect } from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  FormControl,
  FormLabel,
  Textarea,
  useToast
} from "@chakra-ui/react";

// Komponen Notes yang menerima onSuccess dan onClose sebagai props
const Notes = ({ 
  onSuccess, 
  onClose, 
  isLoading = false,
  title = "Alasan Penolakan",
  submitButtonText = "Submit",
  cancelButtonText = "Cancel",
  submitButtonColor = "red",
  initialValue = ""
}) => {
  const [notes, setNotes] = useState(initialValue);
  const toast = useToast();

  // Reset notes saat komponen dimount
  useEffect(() => {
    setNotes(initialValue);
  }, [initialValue]);

  const handleSubmit = () => {
    if (!notes.trim()) {
      toast({
        title: "Notes diperlukan",
        description: "Mohon berikan alasan penolakan",
        status: "error",
        duration: 3000,
        isClosable: true,
        position: "top",
      });
      return;
    }

    // Panggil onSuccess dengan notes sebagai parameter
    onSuccess(notes);
  };

  return (
    <Modal isOpen={true} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>{title}</ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          <FormControl isRequired>
            <FormLabel>Notes</FormLabel>
            <Textarea
              placeholder="Berikan alasan penolakan"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={5}
            />
          </FormControl>
        </ModalBody>

        <ModalFooter>
          <Button 
            colorScheme={submitButtonColor} 
            mr={3} 
            onClick={handleSubmit}
            isLoading={isLoading}
          >
            {submitButtonText}
          </Button>
          <Button onClick={onClose}>
            {cancelButtonText}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default Notes;
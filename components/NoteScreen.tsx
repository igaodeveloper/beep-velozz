import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useAppTheme } from "@/utils/useAppTheme";

interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  tags?: string[];
  priority?: "low" | "medium" | "high";
}

interface NoteScreenProps {
  note?: Note;
  onSave?: (note: Omit<Note, "id" | "createdAt" | "updatedAt">) => void;
  onUpdate?: (id: string, note: Partial<Note>) => void;
  onDelete?: (id: string) => void;
  onCancel?: () => void;
  readOnly?: boolean;
  placeholder?: string;
  autoSave?: boolean;
}

export function NoteScreen({
  note,
  onSave,
  onUpdate,
  onDelete,
  onCancel,
  readOnly = false,
  placeholder = "Comece a escrever sua nota...",
  autoSave = true,
}: NoteScreenProps) {
  const { colors } = useAppTheme();
  const [title, setTitle] = useState(note?.title || "");
  const [content, setContent] = useState(note?.content || "");
  const [isEditing, setIsEditing] = useState(!note);
  const [dimensions, setDimensions] = useState(Dimensions.get("window"));
  const contentRef = useRef<TextInput>(null);
  const titleRef = useRef<TextInput>(null);

  useEffect(() => {
    const onChange = () => {
      setDimensions(Dimensions.get("window"));
    };

    const subscription = Dimensions.addEventListener("change", onChange);
    return () => subscription?.remove();
  }, []);

  useEffect(() => {
    if (
      autoSave &&
      !isEditing &&
      (title !== note?.title || content !== note?.content)
    ) {
      const timeoutId = setTimeout(() => {
        handleSave();
      }, 1000);
      return () => clearTimeout(timeoutId);
    }
  }, [title, content, isEditing, autoSave]);

  const handleSave = () => {
    if (!title.trim() && !content.trim()) {
      Alert.alert("Aviso", "A nota não pode estar vazia.");
      return;
    }

    const noteData = {
      title: title.trim(),
      content: content.trim(),
      tags: note?.tags || [],
      priority: note?.priority || "medium",
    };

    if (note) {
      onUpdate?.(note.id, noteData);
    } else {
      onSave?.(noteData);
    }
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (note) {
      Alert.alert(
        "Confirmar Exclusão",
        "Tem certeza que deseja excluir esta nota?",
        [
          { text: "Cancelar", style: "cancel" },
          {
            text: "Excluir",
            style: "destructive",
            onPress: () => onDelete?.(note.id),
          },
        ],
      );
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    if (!title.trim()) {
      titleRef.current?.focus();
    } else {
      contentRef.current?.focus();
    }
  };

  const getKeyboardBehavior = () => {
    return Platform.OS === "ios" ? "padding" : "height";
  };

  const isLandscape = dimensions.width > dimensions.height;
  const isTablet = dimensions.width >= 768;

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.bg }]}
      behavior={getKeyboardBehavior()}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
    >
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.headerLeft}>
          {onCancel && (
            <TouchableOpacity
              onPress={onCancel}
              style={[styles.headerButton, { backgroundColor: colors.surface }]}
            >
              <Text style={[styles.headerButtonText, { color: colors.text }]}>
                Voltar
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.headerCenter}>
          {!readOnly && (
            <View style={styles.actionButtons}>
              {isEditing ? (
                <TouchableOpacity
                  onPress={handleSave}
                  style={[
                    styles.saveButton,
                    { backgroundColor: colors.primary },
                  ]}
                >
                  <Text style={[styles.saveButtonText, { color: "#000" }]}>
                    Salvar
                  </Text>
                </TouchableOpacity>
              ) : (
                <>
                  <TouchableOpacity
                    onPress={handleEdit}
                    style={[
                      styles.editButton,
                      { backgroundColor: colors.surface },
                    ]}
                  >
                    <Text
                      style={[styles.editButtonText, { color: colors.text }]}
                    >
                      Editar
                    </Text>
                  </TouchableOpacity>
                  {onDelete && (
                    <TouchableOpacity
                      onPress={handleDelete}
                      style={[
                        styles.deleteButton,
                        { backgroundColor: colors.danger },
                      ]}
                    >
                      <Text
                        style={[styles.deleteButtonText, { color: "#fff" }]}
                      >
                        Excluir
                      </Text>
                    </TouchableOpacity>
                  )}
                </>
              )}
            </View>
          )}
        </View>
      </View>

      <ScrollView
        style={[styles.content, { backgroundColor: colors.bg }]}
        contentContainerStyle={[
          styles.contentContainer,
          isLandscape && styles.contentContainerLandscape,
          isTablet && styles.contentContainerTablet,
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.noteContainer}>
          <TextInput
            ref={titleRef}
            style={[
              styles.titleInput,
              {
                color: colors.text,
                borderColor: isEditing ? colors.primary : "transparent",
                backgroundColor: colors.surface,
              },
              !isEditing && styles.titleInputReadOnly,
            ]}
            value={title}
            onChangeText={setTitle}
            placeholder="Título da nota"
            placeholderTextColor={colors.textSubtle}
            editable={isEditing}
            multiline={false}
            maxLength={100}
          />

          <TextInput
            ref={contentRef}
            style={[
              styles.contentInput,
              {
                color: colors.text,
                borderColor: isEditing ? colors.primary : "transparent",
                backgroundColor: colors.surface,
              },
              !isEditing && styles.contentInputReadOnly,
            ]}
            value={content}
            onChangeText={setContent}
            placeholder={placeholder}
            placeholderTextColor={colors.textSubtle}
            editable={isEditing}
            multiline={true}
            textAlignVertical="top"
          />

          {note && (
            <View style={[styles.metadata, { borderTopColor: colors.border }]}>
              <Text style={[styles.metadataText, { color: colors.textSubtle }]}>
                Criado: {new Date(note.createdAt).toLocaleDateString("pt-BR")}
              </Text>
              <Text style={[styles.metadataText, { color: colors.textSubtle }]}>
                Atualizado:{" "}
                {new Date(note.updatedAt).toLocaleDateString("pt-BR")}
              </Text>
              {note.tags && note.tags.length > 0 && (
                <View style={styles.tagsContainer}>
                  {note.tags.map((tag, index) => (
                    <View
                      key={`${note.id}-tag-${index}`}
                      style={[styles.tag, { backgroundColor: colors.primary }]}
                    >
                      <Text style={[styles.tagText, { color: "#000" }]}>
                        {tag}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flex: 1,
  },
  headerCenter: {
    flex: 2,
    alignItems: "center",
  },
  headerButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  headerButtonText: {
    fontSize: 14,
    fontWeight: "500",
  },
  actionButtons: {
    flexDirection: "row",
    gap: 8,
  },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  editButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  deleteButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  deleteButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  contentContainerLandscape: {
    paddingHorizontal: 32,
  },
  contentContainerTablet: {
    paddingHorizontal: 48,
    maxWidth: 800,
    alignSelf: "center",
    width: "100%",
  },
  noteContainer: {
    flex: 1,
  },
  titleInput: {
    fontSize: 24,
    fontWeight: "bold",
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 2,
  },
  titleInputReadOnly: {
    borderWidth: 0,
    backgroundColor: "transparent",
    padding: 0,
    marginBottom: 16,
  },
  contentInput: {
    fontSize: 16,
    lineHeight: 24,
    padding: 16,
    borderRadius: 12,
    minHeight: 300,
    borderWidth: 2,
  },
  contentInputReadOnly: {
    borderWidth: 0,
    backgroundColor: "transparent",
    padding: 0,
    minHeight: 200,
  },
  metadata: {
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
  },
  metadataText: {
    fontSize: 12,
    marginBottom: 4,
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 8,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 12,
    fontWeight: "500",
  },
});

export default NoteScreen;

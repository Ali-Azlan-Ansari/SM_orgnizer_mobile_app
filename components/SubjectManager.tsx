import React, { useCallback, useEffect, useRef, useState } from 'react';
import { BackHandler, StyleSheet, View } from 'react-native';
import {
  Layout,
  Input,
  Button,
  List,
  ListItem,
  Text,
  Modal,
  Card,
  Toggle,
} from '@ui-kitten/components';
import FontAwesome6 from '@react-native-vector-icons/fontawesome6';
import { TopNavigationAccessoriesShowcase } from './TopNavigationAccessoriesShowcase';
import { useFocusEffect, useIsFocused, useNavigation } from '@react-navigation/native';
import {
  deleteSubjectById,
  getAllSubjects,
  getDBConnection,
  updateSubject,         // ✅ import updateSubject
  Subject,
} from '../DataBase/db';
import { ModalKitten, ModalKittenHandle } from './Modal';
import { backgroundColor, baseBGColor } from './Color';
import Loader from './Loader';

// ICONS
const PlusIcon = () => (
  <FontAwesome6 name="plus" style={[styles.icon]} iconStyle="solid" />
);
const EditIcon = () => (
  <FontAwesome6 name="pen" style={[styles.icon]} iconStyle="solid" />
);
const DeleteIcon = () => (
  <FontAwesome6 name="trash" style={[styles.icon]} iconStyle="solid" />
);
const SearchIcon = () => (
  <FontAwesome6 name="magnifying-glass" style={[styles.icon]} iconStyle="solid" />
);

const SubjectManager = () => {
  const [value, setValue] = useState('');
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const navigation = useNavigation<any>();
  const isFocused = useIsFocused();
  const modalRef = useRef<ModalKittenHandle>(null);

   useFocusEffect(
      useCallback(() => {
        const onBackPress = () => {
          // 👇 Back press → go to "Home" screen
          navigation.navigate('Active');  
          return true; // default back ko cancel kar do
        };
  
        const subscription = BackHandler.addEventListener(
          'hardwareBackPress',
          onBackPress
        );
  
        return () => subscription.remove();
      }, [navigation])
    );

  const fetchData = async () => {
    try {
      setLoading(true);
      const db = await getDBConnection();
      const result = await getAllSubjects(db);
      setSubjects(result);
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePress = (id: number) => {
    setSelectedId(id);
    setConfirmVisible(true);
  };

  const deleteSubject = async () => {
    if (!selectedId) return;
    try {
      setLoading(true);
      const db = await getDBConnection();
      await deleteSubjectById(db, selectedId);
      await fetchData();
      modalRef.current?.show('Subject deleted successfully!', 2000, 'success');
    } catch (error) {
      console.error('Error deleting subject:', error);
      modalRef.current?.show('Failed to delete subject', 3000, 'error');
    } finally {
      setConfirmVisible(false);
      setSelectedId(null);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isFocused) {
      fetchData();
    }
  }, [isFocused]);

  // ✅ Toggle handler per row
  const onToggleActive = async (subject: Subject, nextChecked: boolean) => {
    try {
      setLoading(true);
      const db = await getDBConnection();
      const updated = {
        ...subject,
        active_subject: nextChecked ? 1 : 0,
      };
      await updateSubject(db, subject.id!, updated);
    

      // Update local list to reflect the change instantly
      setSubjects(prev =>
        prev.map(s => (s.id === subject.id ? { ...s, active_subject: updated.active_subject } : s)),
      );
    } catch (e) {
      console.error('Toggle update failed:', e);
      modalRef.current?.show('Failed to update subject status', 2000, 'error');
    } finally {
      setLoading(false);
    }
  };

  const filteredSubjects = subjects.filter(s => {
    const q = value.toLowerCase();
    return (
      s.name?.toLowerCase().includes(q) ||
      s.abbreviation?.toLowerCase().includes(q) ||
      s.teacher_name?.toLowerCase().includes(q)
    );
  });

  const renderItem = ({ item }: { item: Subject }) => (
    <ListItem
      title={`${item.name}`}
      description={`${item.abbreviation ?? ''} | ${item.date?.slice(0, 10) ?? ''}`}
      accessoryRight={() => (
        <View style={styles.iconButtonContainer}>
          {/* ✅ Per-row Toggle bound to this subject */}
          <Toggle
            style={styles.toggle}
            status="success"
            checked={item.active_subject === 1}
            onChange={nextChecked => onToggleActive(item, !!nextChecked)}
          />
          <Button
            onPress={() => navigation.navigate('EditSubject', { id: item.id })}
            style={styles.iconButton}
            size="tiny"
            status="primary"
            accessoryLeft={EditIcon}
          />
          <Button
            onPress={() => handleDeletePress(item.id!)}
            style={styles.iconButton}
            size="tiny"
            status="danger"
            accessoryLeft={DeleteIcon}
          />
        </View>
      )}
    />
  );

  return (
    <>
      <View>
        <TopNavigationAccessoriesShowcase title="Subject Management" />
      </View>

      <Layout style={styles.mainContainer} level="1">
        {/* Toolbar */}
        <View style={styles.topBar}>
          <Input
            style={styles.searchInput}
            value={value}
            placeholder="Search Subject"
            accessoryLeft={SearchIcon}
            onChangeText={setValue}
            status="success"
          />
          <Button
            style={styles.addButton}
            status="success"
            accessoryLeft={PlusIcon}
            onPress={() => navigation.navigate('AddSubject')}
          />
        </View>

        {/* Subject List */}
        <List style={styles.list} data={filteredSubjects} renderItem={renderItem} />
      </Layout>

      {/* Loader */}
      <Loader visible={loading} animationSpeedMultiplier={1.0} />

      {/* Success/Error Toast */}
      <ModalKitten ref={modalRef} />

      {/* Confirmation Modal */}
      <Modal
        visible={confirmVisible}
        backdropStyle={styles.backdrop}
        onBackdropPress={() => setConfirmVisible(false)}
      >
        <Card disabled={true} style={styles.confirmCard}>
          <Text category="h6" style={styles.confirmTitle}>
            Confirm Deletion
          </Text>
          <Text appearance="hint" style={styles.confirmMessage}>
            Are you sure you want to delete this subject? This action cannot be undone.
          </Text>
          <View style={styles.confirmButtons}>
            <Button
              style={[styles.confirmButton, { backgroundColor: '#ff3d71' }]}
              onPress={deleteSubject}
              status="danger"
            >
              Yes, Delete
            </Button>
            <Button
              style={styles.confirmButton}
              onPress={() => setConfirmVisible(false)}
              appearance="outline"
              status="basic"
            >
              Cancel
            </Button>
          </View>
        </Card>
      </Modal>
    </>
  );
};

export default SubjectManager;

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: baseBGColor,
    paddingHorizontal: 12,
    paddingTop: 20,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    marginRight: 8,
    backgroundColor: baseBGColor,
    borderRadius: 8,
  },
  addButton: {
    borderRadius: 50,
    height: 48,
    width: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    backgroundColor: backgroundColor,
    borderRadius: 12,
  },
  icon: {
    fontSize: 12,
    color: '#fff',
  },
  iconButtonContainer: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  iconButton: {
    borderRadius: 25,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  confirmCard: {
    width: 300,
    borderRadius: 12,
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  confirmTitle: {
    marginBottom: 8,
    fontWeight: 'bold',
    color: '#ffffffff',
  },
  confirmMessage: {
    marginBottom: 20,
    color: '#ffffffff',
  },
  confirmButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  confirmButton: {
    borderRadius: 8,
    minWidth: 100,
  },
  toggle: {
    marginRight: 6,
  },
});

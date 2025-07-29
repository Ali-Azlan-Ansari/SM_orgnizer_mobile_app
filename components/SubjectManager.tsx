import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import {
  Layout,
  Input,
  Button,
  List,
  ListItem,
  Icon,
  IconElement,
  Text,
} from '@ui-kitten/components';
import FontAwesome6 from '@react-native-vector-icons/fontawesome6';
import { TopNavigationAccessoriesShowcase } from './TopNavigationAccessoriesShowcase';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import {
  deleteSubjectById,
  getAllSubjects,
  getDBConnection,
  Subject,
} from '../DataBase/db';
import { ModalKitten, ModalKittenHandle } from './Modal';

// COLORS
const primaryColor = '#7ebe4b';
const backgroundColor = '#353f5dd5';
const baseBGColor = '#212b46';

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
  <FontAwesome6
    name="magnifying-glass"
    style={[styles.icon]}
    iconStyle="solid"
  />
);

// COMPONENT
const SubjectManager = () => {
  const [value, setValue] = useState('');
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const navigation = useNavigation<any>();
  const isFocused = useIsFocused();
  const modalRef = useRef<ModalKittenHandle>(null);
  const handlePress = (massge: string, time: number, status: string) => {
    modalRef.current?.show(massge, time, status);
  };
  const fetchData = async () => {
    const db = await getDBConnection();
    const result = await getAllSubjects(db);
    setSubjects(result);
  };
  const deleteSubject = async (id: number) => {
    try {
      const db = await getDBConnection(); // 1. Connect DB
      await deleteSubjectById(db, id); // 2. Delete
      await fetchData(); // 3. Refresh list

      // 4. Success Message (if using ModalKitten)
      modalRef.current?.show('Subject deleted successfully!', 2000, 'success');
      console.log('Subject deleted successfully');
    } catch (error) {
      console.error('Error deleting subject:', error);
      modalRef.current?.show('Failed to delete subject', 3000, 'error');
    }
  };
  useEffect(() => {
    const fetchData = async () => {
      const db = await getDBConnection();
      const result = await getAllSubjects(db);
      setSubjects(result);
    };
    if (isFocused) {
      fetchData();
    }
  }, [isFocused]);

  const renderItem = ({ item, index }: any) => (
    <ListItem
      title={`${item.name}`}
      description={`${item.abbreviation} | ${item.date?.slice(0, 10)}`}
      accessoryRight={() => (
        <View style={styles.iconButtonContainer}>
          <Button
            onPress={() => {
              navigation.navigate('EditSubject', { id: item.id });
            }}
            style={styles.iconButton}
            size="tiny"
            status="primery"
            accessoryLeft={EditIcon}
          />
          <Button
            onPress={() => {
              deleteSubject(item.id);
            }}
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
        <TopNavigationAccessoriesShowcase rout="" title='Subject Management' />
      </View>
      <Layout style={styles.mainContainer} level="1">
        {/* Toolbar with Search and Add */}

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

        <List
          style={styles.list}
          data={subjects.filter(
            subject =>
              subject.name.toLowerCase().includes(value.toLowerCase()) ||
              subject.abbreviation
                ?.toLowerCase()
                .includes(value.toLowerCase()) ||
              subject.teacher_name?.toLowerCase().includes(value.toLowerCase()),
          )}
          renderItem={renderItem}
        />
      </Layout>
      <ModalKitten ref={modalRef} />
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
    color: '#000000',
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
  },
  iconButton: {
    borderRadius: 25,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

import React, { useEffect, useRef, useState } from 'react';
import {
  StyleSheet,
  View,
  Platform,
  PermissionsAndroid,
  Alert,
  Linking,
} from 'react-native';
import {
  Layout,
  Input,
  Button,
  List,
  ListItem,
  Text,
  Modal,
  Card,
} from '@ui-kitten/components';
import FontAwesome6 from '@react-native-vector-icons/fontawesome6';
import { TopNavigationAccessoriesShowcase } from './TopNavigationAccessoriesShowcase';
import RNFS from 'react-native-fs';
import { ModalKitten, ModalKittenHandle } from './Modal';
import { backgroundColor, baseBGColor } from './Color';
import Loader from './Loader';

// ✅ ICONS
const RenameIcon = () => (
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

// ✅ unique pdf name generator
const generateUniquePdfName = () => {
  const timestamp = new Date().getTime();
  return `pdf_${timestamp}.pdf`;
};

// ✅ PDF type
interface PdfFile {
  name: string;
  path: string;
}

const PdfManager = () => {
  const [value, setValue] = useState('');
  const [pdfs, setPdfs] = useState<PdfFile[]>([]);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [renameVisible, setRenameVisible] = useState(false);
  const [renameInput, setRenameInput] = useState('');
  const [selectedPdf, setSelectedPdf] = useState<PdfFile | null>(null);
  const [loading, setLoading] = useState(false);
  const [renameError, setRenameError] = useState<string>('');

  const modalRef = useRef<ModalKittenHandle>(null);

  const downloadPath =
    Platform.OS === 'android'
      ? RNFS.ExternalDirectoryPath + '/PDFs'
      : RNFS.DocumentDirectoryPath + '/PDFs';

  // ✅ Request storage permission (Android only)
  const requestStoragePermissions = async (): Promise<boolean> => {
    if (Platform.OS !== 'android') return true;

    const sdkInt = parseInt(String(Platform.Version), 10);
    const permissions: any[] = [];

    if (sdkInt >= 33) {
      permissions.push(PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES);
      permissions.push(PermissionsAndroid.PERMISSIONS.READ_MEDIA_VIDEO);
      permissions.push(PermissionsAndroid.PERMISSIONS.READ_MEDIA_AUDIO);
    } else {
      permissions.push(PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE);
      permissions.push(PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE);
    }

    try {
      const granted: any = await PermissionsAndroid.requestMultiple(
        permissions,
      );

      for (let perm of permissions) {
        if (granted[perm] === 'never_ask_again') {
          Alert.alert(
            'Permission Required',
            'Permission is permanently denied. Please enable it in settings.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Open Settings', onPress: () => Linking.openSettings() },
            ],
          );
          return false;
        } else if (granted[perm] !== 'granted') {
          return false;
        }
      }

      return true;
    } catch (err) {
      console.warn('Permission error:', err);
      return false;
    }
  };

  // ✅ Load all PDFs from Download folder
  const fetchPdfs = async () => {
    try {
      setLoading(true);
      const hasPermission = await requestStoragePermissions();
      if (!hasPermission) {
        modalRef.current?.show('Storage permission denied ❌', 3000, 'error');
        return;
      }

      const exists = await RNFS.exists(downloadPath);
      if (!exists) {
        await RNFS.mkdir(downloadPath);
      }
      const files = await RNFS.readDir(downloadPath);

      const pdfFiles = files
        .filter(file => file.isFile() && file.name.endsWith('.pdf'))
        .map(file => ({
          name: file.name,
          path: file.path,
        }));
      setPdfs(pdfFiles);
    } catch (err) {
      console.error('Error fetching PDFs:', err);
      modalRef.current?.show('Failed to load PDFs', 3000, 'error');
    } finally {
      setLoading(false);
    }
  };

  // ✅ Delete PDF
  const deletePdf = async () => {
    if (!selectedPdf) return;
    try {
      setLoading(true);
      await RNFS.unlink(selectedPdf.path);
      await fetchPdfs();
      modalRef.current?.show('PDF deleted successfully!', 2000, 'success');
    } catch (error) {
      console.error('Error deleting PDF:', error);
      modalRef.current?.show('Failed to delete PDF', 3000, 'error');
    } finally {
      setConfirmVisible(false);
      setSelectedPdf(null);
      setLoading(false);
    }
  };

  // ✅ Rename PDF
  const renamePdf = async () => {
    if (!selectedPdf) return;

    try {
      setLoading(true);
      setRenameError('');

      let finalName =
        renameInput.trim().length > 0
          ? `${renameInput.trim()}.pdf`
          : generateUniquePdfName();

      const newPath = `${downloadPath}/${finalName}`;

      // ✅ Check if file already exists
      const exists = await RNFS.exists(newPath);
      if (exists) {
        setRenameError('A file with this name already exists.');
        setLoading(false);
        return;
      }

      await RNFS.moveFile(selectedPdf.path, newPath);
      await fetchPdfs();

      modalRef.current?.show(`Renamed to ${finalName}`, 2000, 'success');
      setRenameVisible(false);
      setRenameInput('');
      setSelectedPdf(null);
    } catch (err) {
      console.error('Rename failed:', err);
      modalRef.current?.show('Failed to rename PDF', 3000, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPdfs();
  }, []);

  const filteredPdfs = pdfs.filter(s => {
    const q = value.toLowerCase();
    return s.name.toLowerCase().includes(q);
  });

  const renderItem = ({ item }: { item: PdfFile }) => (
    <ListItem
      title={`${item.name}`}
      accessoryRight={() => (
        <View style={styles.iconButtonContainer}>
          <Button
            onPress={() => {
              setSelectedPdf(item);
              setRenameVisible(true);
            }}
            style={styles.iconButton}
            size="tiny"
            status="primary"
            accessoryLeft={RenameIcon}
          />
          <Button
            onPress={() => {
              setSelectedPdf(item);
              setConfirmVisible(true);
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
        <TopNavigationAccessoriesShowcase title="PDF Management" />
      </View>

      <Layout style={styles.mainContainer} level="1">
        {/* Toolbar */}
        <View style={styles.topBar}>
          <Input
            style={styles.searchInput}
            value={value}
            placeholder="Search PDF"
            accessoryLeft={SearchIcon}
            onChangeText={setValue}
            status="success"
          />
        </View>

        {/* PDF List */}
        <List style={styles.list} data={filteredPdfs} renderItem={renderItem} />
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
            Are you sure you want to delete this PDF? This action cannot be
            undone.
          </Text>
          <View style={styles.confirmButtons}>
            <Button
              style={[styles.confirmButton, { backgroundColor: '#ff3d71' }]}
              onPress={deletePdf}
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

      {/* Rename Modal */}
      <Modal
        visible={renameVisible}
        backdropStyle={styles.backdrop}
        onBackdropPress={() => setRenameVisible(false)}
      >
        <Card disabled={true} style={styles.confirmCard}>
          <Text category="h6" style={styles.confirmTitle}>
            Rename PDF
          </Text>
          <Input
            placeholder="Enter new name"
            value={renameInput}
            onChangeText={text => {
              setRenameInput(text);
              setRenameError(''); // 🔹 clear error when typing
            }}
            style={{ marginBottom: 8 }}
            status={renameError ? 'danger' : 'success'} // 🔹 change status if error
          />
          {renameError ? (
            <Text style={{ color: 'red', marginBottom: 8 }}>{renameError}</Text>
          ) : null}

          <View style={styles.confirmButtons}>
            <Button
              style={styles.confirmButton}
              onPress={renamePdf}
              status="primary"
            >
              Save
            </Button>
            <Button
              style={styles.confirmButton}
              onPress={() => setRenameVisible(false)}
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

export default PdfManager;

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
});

import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Image,
  FlatList,
  Platform,
  PermissionsAndroid,
  Linking,
  Alert,
} from 'react-native';
import ImageView from 'react-native-image-viewing';
import { TopNavigationAccessoriesShowcase } from './TopNavigationAccessoriesShowcase';
import { baseBGColor, info, primaryColor } from './Color';
import { Button, Modal, Card, Text, Input } from '@ui-kitten/components'; // <-- added Input
import FontAwesome6 from '@react-native-vector-icons/fontawesome6';
import RNHTMLtoPDF from 'react-native-html-to-pdf';
import RNFS from 'react-native-fs';
import FileViewer from 'react-native-file-viewer';
import { useIsFocused, useRoute } from '@react-navigation/native';
import {
  deleteImagesByUri,
  getDBConnection,
  getImagesBySubjectId,
  addImages,
} from '../DataBase/db';
import Share from 'react-native-share';
import Loader from './Loader'; // added loader import
import ImagePicker from 'react-native-image-crop-picker';
import { ModalKitten, ModalKittenHandle } from './Modal';

const DeleteIcon = () => (
  <FontAwesome6 name="trash" style={styles.icon} iconStyle="solid" />
);

const CloseIcon = () => (
  <FontAwesome6 name="xmark" style={styles.closeIcon} iconStyle="solid" />
);

const ShareIcon = () => (
  <FontAwesome6 name="share-nodes" style={styles.icon} iconStyle="solid" />
);

const PdfIcon = () => (
  <FontAwesome6 name="file-pdf" style={styles.icon} iconStyle="solid" />
);

const ImageIcon = () => (
  <FontAwesome6 name="images" style={styles.icon} iconStyle="solid" />
);

const MyGallery = () => {
  const route = useRoute();
  const { subjectId } = route.params as { subjectId: number };
  const [images, setImages] = useState<{ uri: string }[]>([]);
  const [visible, setIsVisible] = useState<boolean>(false);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [selected, setSelected] = useState<number[]>([]);
  const [loading, setLoading] = useState(false); // loader state

  // confirmation modal states
  const [confirmVisible, setConfirmVisible] = useState(false); // modal visibility for deletion
  const [pendingDeleteUris, setPendingDeleteUris] = useState<string[]>([]); // uris waiting to be deleted

  // PDF opener modal states
  const [PDFOpenerVisible, setPDFOpenerVisible] = useState(false);
  const [lastSavedPdfPath, setLastSavedPdfPath] = useState<string | null>(null);

  // New: name-pdf modal states
  const [nameModalVisible, setNameModalVisible] = useState(false); // <-- added
  const [pdfNameInput, setPdfNameInput] = useState(''); // <-- added
  const [pdfNameError, setPdfNameError] = useState(''); // <-- added

  const isFocused = useIsFocused();

   const modalRef = useRef<ModalKittenHandle>(null);

  useEffect(() => {
    if (isFocused) {
      // initial fetch on focus
      fetchData();
    }
  }, [isFocused]);

  // fetchData now RETURNS the fetched array for callers
  const fetchData = async () => {
    setLoading(true);
    try {
      const db = await getDBConnection();
      const result = await getImagesBySubjectId(db, subjectId);
      const arr = result.map(img => ({ uri: `file://${img.image_uri}` }));
      setImages(arr);
      return arr;
    } finally {
      setLoading(false);
    }
  };

  const toggleSelect = (index: number) => {
    setSelected((prev: any) =>
      prev.includes(index) ? prev.filter((i: any) => i !== index) : [...prev, index],
    );
  };

  // Helper: delete given URIs (normalize), refresh UI from DB, clamp index safely
  const deleteUrisAndRefresh = async (uris: string[]) => {
    if (!uris || uris.length === 0) return;
    setLoading(true);
    try {
      const db = await getDBConnection();

      // Normalize URIs for DB matching (remove file:// if present)
      const normalizedUris = uris.map(u => (typeof u === 'string' ? u.replace(/^file:\/\//, '') : u));

      // delete from DB (and files) — your db helper should remove files too
      await deleteImagesByUri(db, normalizedUris);

      // re-fetch from DB (single source of truth)
      const freshImages = await fetchData(); // fetchData returns array

      // clear selection
      setSelected([]);

      // safe viewer update
      if (!freshImages || freshImages.length === 0) {
        setIsVisible(false);
        setCurrentIndex(0);
      } else {
        const clamped = Math.min(currentIndex, freshImages.length - 1);
        setCurrentIndex(clamped);
      }
    } catch (err) {
      console.error('deleteUrisAndRefresh error:', err);
      // Alert.alert('Error', 'Could not delete image(s).');
       modalRef.current?.show('Could not delete image(s).', 2000, 'error');
    } finally {
      setLoading(false);
    }
  };

  // deleteSelected now ASK for confirmation first
  const deleteSelected = async () => {
    const selectedUris = selected.map(i => images[i].uri);
    if (selectedUris.length === 0) return;

    // open confirmation modal instead of deleting immediately
    setPendingDeleteUris(selectedUris); // store URIs to delete on confirm
    setConfirmVisible(true);
  };

  // Called when user confirms deletion in modal
  const confirmDelete = async () => {
    const urisToDelete = [...pendingDeleteUris];
    setConfirmVisible(false);
    setPendingDeleteUris([]);
    await deleteUrisAndRefresh(urisToDelete);
  };

  // Cancel deletion
  const cancelDelete = () => {
    setPendingDeleteUris([]);
    setSelected([]); // optional: clear selection on cancel
    setConfirmVisible(false);
  };

  // PDF modal cancel
  const cancelPDFOpener = () => {
    setLastSavedPdfPath(null);
    setPDFOpenerVisible(false);
  };

  const shareSelected = async () => {
    const selectedUris = selected.map(i => images[i].uri);
    if (selectedUris.length === 0) return;
    try {
      const copiedImagePaths: string[] = [];

      for (let i = 0; i < selectedUris.length; i++) {
        const uri = selectedUris[i];
        const cleanPath = uri.replace('file://', '');
        const destPath = `${RNFS.CachesDirectoryPath}/shared_image_${Date.now()}_${i}.jpg`;

        await RNFS.copyFile(cleanPath, destPath);
        copiedImagePaths.push(`file://${destPath}`);
      }

      await Share.open({
        urls: copiedImagePaths,
        type: 'image/jpeg',
      });
    } catch (err: any) {
      console.error('Share error:', err);
      // Alert.alert('Share failed', err.message);
       modalRef.current?.show('Share failed', 2000, 'error');
    } finally {
      setSelected([]);
    }
  };

  const openAppSettings = () => {
    Alert.alert(
      'Permission Required',
      'Please enable storage permissions in settings.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Open Settings', onPress: () => Linking.openSettings() },
      ],
      { cancelable: true },
    );
  };

  const requestImagePermissions = async (): Promise<boolean> => {
    if (Platform.OS !== 'android') return true;

    const sdkInt = parseInt(String(Platform.Version), 10);
    const permissions: any[] = [];

    if (sdkInt >= 33) {
      permissions.push(PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES);
    } else {
      permissions.push(PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE);
    }

    try {
      const granted: any = await PermissionsAndroid.requestMultiple(permissions);

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

  const generateUniquePdfName = () => {
    const timestamp = new Date().getTime(); // milliseconds since 1970
    return `document_${timestamp}`;
  };

  // NOTE: keep this function for compatibility if used elsewhere (not used by the new "name" flow)
  const generatePDF = async (images: { uri: string }[]) => {
    setLoading(true);
    try {
      const hasPermission = await requestImagePermissions();
      if (!hasPermission) {
        Alert.alert('Permission Denied', 'Cannot save PDF without permission.');
        return;
      }

      let htmlContent = `
      <html>
        <head>
          <style>
            body { margin: 0; padding: 0; }
            .page {
              page-break-after: always;
              display: flex;
              justify-content: center;
              align-items: center;
              height: 100vh;
            }
            img { max-width: 100%; max-height: 100%; }
          </style>
        </head>
        <body>
      `;

      images.forEach(img => {
        htmlContent += `
          <div class="page">
            <img src="${img.uri}" />
          </div>
        `;
      });

      htmlContent += `
        </body>
      </html>
      `;
      const downloadPath =
        Platform.OS === 'android'
          ? RNFS.ExternalDirectoryPath + '/PDFs'
          : RNFS.DocumentDirectoryPath + '/PDFs';

      const exists = await RNFS.exists(downloadPath); // ensure folder exists
      if (!exists) {
        await RNFS.mkdir(downloadPath); // create folder if missing
      }

      const filePath = `${downloadPath}/${generateUniquePdfName()}`;
      const options = {
        html: htmlContent,
        fileName: generateUniquePdfName(),
        filePath: filePath,
        directory: 'PDFs',
        base64: true,
      };

      const file = await RNHTMLtoPDF.convert(options);
      console.log('====================================');
      console.log(file.filePath);
      console.log('====================================');

      // show PDF opener modal instead of alert
      setLastSavedPdfPath(file.filePath ?? null);
      setPDFOpenerVisible(true);
    } catch (err: any) {
      // Alert.alert('PDF Error ❌', err.message || 'Something went wrong');
        modalRef.current?.show(err.message || 'Something went wrong', 2000, 'error');
      
    } finally {
      setLoading(false);
    }
  };

  // ---------- NEW: Save PDF with a given name (called from the name modal)
  const savePdfWithName = async () => {
    setPdfNameError('');
    setLoading(true);
    try {
      const hasPermission = await requestImagePermissions();
      if (!hasPermission) {
        setLoading(false);
        Alert.alert('Permission Denied', 'Cannot save PDF without permission.');
        return;
      }

      // Prepare download folder
      const downloadPath =
        Platform.OS === 'android'
          ? RNFS.ExternalDirectoryPath + '/PDFs'
          : RNFS.DocumentDirectoryPath + '/PDFs';

      const existsFolder = await RNFS.exists(downloadPath);
      if (!existsFolder) {
        await RNFS.mkdir(downloadPath);
      }

      // determine final filename
      const trimmed = pdfNameInput.trim();
      const finalName =
        trimmed.length > 0 ? `${trimmed}` : generateUniquePdfName();

      // check for existing file
      const finalPath = `${downloadPath}/${finalName}`;
      const existsFile = await RNFS.exists(`${finalPath}.pdf`);
      if (existsFile) {
        setPdfNameError('A file with this name already exists.'); // show inline error
        setLoading(false);
        return;
      }

      // Build HTML from current images
      let htmlContent = `
      <html>
        <head>
          <style>
            body { margin: 0; padding: 0; }
            .page {
              page-break-after: always;
              display: flex;
              justify-content: center;
              align-items: center;
              height: 100vh;
            }
            img { max-width: 100%; max-height: 100%; }
          </style>
        </head>
        <body>
      `;
      images.forEach(img => {
        htmlContent += `
          <div class="page">
            <img src="${img.uri}" />
          </div>
        `;
      });
      htmlContent += `</body></html>`;

      // Convert and save
      const options = {
        html: htmlContent,
        fileName: finalName, // including .pdf (works with your previous usage)
        filePath: finalPath,
        directory: 'PDFs',
        base64: true,
      };

      const file = await RNHTMLtoPDF.convert(options);

      // Show PDF opener modal
      setLastSavedPdfPath(file.filePath ?? finalPath);
      setPDFOpenerVisible(true);

      // close name modal and reset input
      setNameModalVisible(false);
      setPdfNameInput('');
      setPdfNameError('');
    } catch (err: any) {
      console.error('savePdfWithName error:', err);
      // Alert.alert('PDF Error ❌', err.message || 'Something went wrong');
      modalRef.current?.show(`PDF Error :${err.message}` || 'Something went wrong', 2000, 'error');
      
    } finally {
      setLoading(false);
    }
  };
  // ---------- END new savePdfWithName

  const copyScannedImages = async (scannedImages: string[]) => {
    const hasPermission = await requestImagePermissions();
    if (!hasPermission) {
      Alert.alert('Permission Denied', 'Cannot save Image without permission.');
      return;
    }


    const targetFolder =
      Platform.OS === 'android'
        ? RNFS.ExternalDirectoryPath + '/Images'
        : RNFS.DocumentDirectoryPath + '/Images';

    const exists = await RNFS.exists(targetFolder);
    if (!exists) {
      await RNFS.mkdir(targetFolder);
    }

    const newPaths: string[] = [];

    for (let srcPath of scannedImages) {
      const fileName = srcPath.split('/').pop();
      const destPath = `${targetFolder}/${fileName}`;
      try {
        await RNFS.copyFile(srcPath, destPath); // ✅ copy instead of move
        newPaths.push(destPath);
        console.log(`Copied: ${srcPath} -> ${destPath}`);
      } catch (err) {
        console.error('Copy error:', err);
      }
    }

    return newPaths;
  };

  const pickImagesFromGallery = async () => {
    const hasPermission = await requestImagePermissions();
    if (!hasPermission) {
      Alert.alert('Permission Denied', 'Cannot access gallery.');
      
      return;
    }
    try {
      const images = await ImagePicker.openPicker({
        multiple: true,
        maxFiles: 20,
        mediaType: 'photo',
      });
      const uris = images.map(i => i.path);
      const downloadedUris = await copyScannedImages(uris);
      const db = await getDBConnection();
      await addImages(db, subjectId, downloadedUris!);
      await fetchData();
    } catch (e) {
      // Alert.alert('Picker error', 'Failed to select images');
       modalRef.current?.show('Picker Error: Failed to select images', 2000, 'error');
    }
  };

  const openFile = (filePath: any) => {
    if (!filePath) return;
    FileViewer.open(filePath)
      .then(() => {})
      .catch(error => {
        console.error('File open error:', error);
        // Alert.alert('Open failed', 'Could not open file.');
          modalRef.current?.show('Open failed: Could not open file.', 2000, 'error');
      });
  };

  const openPDF = () => {
    if (lastSavedPdfPath) {
      openFile(lastSavedPdfPath);
      setPDFOpenerVisible(false);
      setLastSavedPdfPath(null);
    }
  };

  const Header = () => (
    <View style={styles.header}>
      <Button
        style={styles.closeButton}
        size="tiny"
        status="basic"
        accessoryLeft={CloseIcon}
        onPress={() => setIsVisible(false)}
        disabled={loading}
      />
      <Text style={styles.indexText}>
        {currentIndex + 1}/{images.length}
      </Text>
    </View>
  );

  const Footer = () => (
    <View style={styles.footer}>
      <Button
        style={styles.iconButton}
        size="tiny"
        status="danger"
        accessoryLeft={DeleteIcon}
        onPress={async () => {
          // use the shared helper for deleting the currently visible image
          const uriToDelete = images[currentIndex]?.uri;
          if (!uriToDelete) return;
          // open confirmation modal for single image deletion
          setPendingDeleteUris([uriToDelete]); // store uri
          setConfirmVisible(true); // show modal
        }}
        disabled={loading}
      />
    </View>
  );

  const renderItem = ({ item, index }: any) => (
    <TouchableOpacity
      onLongPress={() => toggleSelect(index)}
      onPress={() => {
        setCurrentIndex(index);
        setIsVisible(true);
      }}
      style={styles.thumbnailWrapper}
    >
      <Image source={{ uri: item.uri }} style={styles.thumbnail} />
      {selected.includes(index) && (
        <View style={styles.overlay}>
          <FontAwesome6 name="check" color="white" iconStyle="solid" />
        </View>
      )}
    </TouchableOpacity>
  );

  // Opens the name modal (instead of generating PDF directly)
  const openNameModal = () => {
    setPdfNameInput(''); // reset
    setPdfNameError('');
    setNameModalVisible(true);
  };

  return (
    <>
      <TopNavigationAccessoriesShowcase title="Image Gallery" />
      <Loader visible={loading} animationSpeedMultiplier={1.0} />
      <View style={styles.container}>
        {/* Toolbar */}
        <View style={styles.toolbar}>
          {selected.length > 0 && (
            <>
              <TouchableOpacity
                onPress={deleteSelected} // opens confirm modal
                style={styles.toolbarBtn}
                disabled={loading}
              >
                <DeleteIcon />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={shareSelected}
                style={styles.toolbarBtn}
                disabled={loading}
              >
                <ShareIcon />
              </TouchableOpacity>
            </>
          )}
          <TouchableOpacity
            onPress={openNameModal} // <-- changed: open name modal instead of directly generating
            style={styles.toolbarBtn}
            disabled={loading}
          >
            <PdfIcon />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={pickImagesFromGallery}
            style={styles.toolbarBtn}
            disabled={loading}
          >
            <ImageIcon />
          </TouchableOpacity>
        </View>

        {/* Thumbnails grid */}
        <FlatList
          data={images}
          keyExtractor={(_, i) => i.toString()}
          renderItem={renderItem}
          numColumns={3}
          contentContainerStyle={styles.grid}
          extraData={images}
        />

        {/* Fullscreen Viewer */}
        <ImageView
          images={images}
          imageIndex={currentIndex}
          visible={visible}
          onRequestClose={() => setIsVisible(false)}
          onImageIndexChange={setCurrentIndex}
          FooterComponent={Footer}
          HeaderComponent={Header}
        />
      </View>

      {/* pdf OPEN modal (shows after saving PDF) */}
      <Modal visible={PDFOpenerVisible} backdropStyle={styles.backdrop} onBackdropPress={cancelPDFOpener}>
        <Card disabled={true} style={styles.confirmCard}>
          <Text category="h6" style={styles.confirmTitle}>
            PDF Saved
          </Text>
          <Text appearance="hint" style={styles.confirmMessage}>
            PDF saved to:
          </Text>
          <Text style={{ marginBottom: 12, color: '#fff' }} numberOfLines={2}>
            {lastSavedPdfPath ?? '—'}
          </Text>
          <View style={styles.confirmButtons}>
            <Button
              style={styles.confirmButton}
              onPress={cancelPDFOpener}
              appearance="outline"
              status="basic"
            >
              Cancel
            </Button>
            <Button
              style={[styles.confirmButton]}
              onPress={openPDF}
              status="primary"
            >
              Open
            </Button>
          </View>
        </Card>
      </Modal>

      {/* Confirmation modal (used for both multi and single deletes) */}
      <Modal visible={confirmVisible} backdropStyle={styles.backdrop} onBackdropPress={cancelDelete}>
        <Card disabled={true} style={styles.confirmCard}>
          <Text category="h6" style={styles.confirmTitle}>
            Confirm Deletion
          </Text>
          <Text appearance="hint" style={styles.confirmMessage}>
            Are you sure you want to delete selected image(s)? This action cannot be
            undone.
          </Text>
          <View style={styles.confirmButtons}>
            <Button
              style={[styles.confirmButton, { backgroundColor: '#ff3d71' }]}
              onPress={confirmDelete}
              status="danger"
            >
              Yes, Delete
            </Button>
            <Button
              style={styles.confirmButton}
              onPress={cancelDelete}
              appearance="outline"
              status="basic"
            >
              Cancel
            </Button>
          </View>
        </Card>
      </Modal>

      {/* NAME PDF modal (NEW) */}
      <Modal visible={nameModalVisible} backdropStyle={styles.backdrop} onBackdropPress={() => setNameModalVisible(false)}>
        <Card disabled={true} style={styles.confirmCard}>
          <Text category="h6" style={styles.confirmTitle}>
            Name PDF
          </Text>

          <Input
            placeholder="Enter file name"
            value={pdfNameInput}
            onChangeText={text => {
              setPdfNameInput(text);
              setPdfNameError(''); // clear error on edit
            }}
            style={{ marginBottom: 8 }}
            status={pdfNameError ? 'danger' : 'basic'}
          />

          {pdfNameError ? <Text style={{ color:'red', marginBottom: 8 }}>{pdfNameError}</Text> : null}

          <View style={styles.confirmButtons}>
            <Button
              style={styles.confirmButton}
              onPress={() => {
                setNameModalVisible(false);
              }}
              appearance="outline"
              status="basic"
            >
              Cancel
            </Button>
            <Button
              style={[styles.confirmButton]}
              onPress={savePdfWithName}
              status="primary"
            >
              Save
            </Button>
          </View>
        </Card>
      </Modal>
      <ModalKitten ref={modalRef} />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 10,
    backgroundColor: baseBGColor,
    flex: 1,
  },
  grid: {
    paddingBottom: 20,
  },
  thumbnailWrapper: {
    flex: 1 / 3,
    aspectRatio: 1,
    margin: 5,
    position: 'relative',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#00000066',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  toolbar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 10,
  },
  toolbarBtn: {
    marginLeft: 10,
    backgroundColor: '#7ebe4b',
    borderRadius: 8,
    padding: 10,
  },
  icon: {
    fontSize: 18,
    color: 'white',
  },
  closeIcon: {
    fontSize: 20,
    color: '#ffffff',
  },
  header: {
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  closeButton: {
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
  indexText: {
    color: 'white',
    fontSize: 16,
    marginRight: 10,
  },
  iconButton: {
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer: {
    padding: 12,
    justifyContent: 'flex-end',
    flexDirection: 'row',
    alignItems: 'center',
  },

  /* confirmation modal styles (from your snippet) */
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

export default MyGallery;

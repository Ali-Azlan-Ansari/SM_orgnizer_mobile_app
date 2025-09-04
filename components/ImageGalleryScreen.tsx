import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  Text,
  FlatList,
  Platform,
  PermissionsAndroid,
  Linking,
} from 'react-native';
import ImageView from 'react-native-image-viewing';
import { TopNavigationAccessoriesShowcase } from './TopNavigationAccessoriesShowcase';
import { baseBGColor } from './Color';
import { Button } from '@ui-kitten/components';
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
  const isFocused = useIsFocused();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const db = await getDBConnection();
        const result = await getImagesBySubjectId(db, subjectId);
        setImages(result.map(img => ({ uri: img.image_uri })));
        console.log(images);
      } finally {
        setLoading(false);
      }
    };
    if (isFocused) {
      fetchData();
    }
  }, [isFocused]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const db = await getDBConnection();
      const result = await getImagesBySubjectId(db, subjectId);
      setImages(result.map(img => ({ uri: img.image_uri })));
      console.log(images);
    } finally {
      setLoading(false);
    }
  };

  const toggleSelect = (index: number) => {
    setSelected((prev: any) =>
      prev.includes(index)
        ? prev.filter((i: any) => i !== index)
        : [...prev, index],
    );
  };

  const deleteSelected = async () => {
    const selectedUris = selected.map(i => images[i].uri);
    if (selectedUris.length === 0) return;

    setLoading(true);
    try {
      const db = await getDBConnection();
      await deleteImagesByUri(db, selectedUris);
      const newImages = images.filter((_, idx) => !selected.includes(idx));
      setImages(newImages);
      setSelected([]);

      if (newImages.length === 0) {
        setIsVisible(false);
      } else if (currentIndex >= newImages.length) {
        setCurrentIndex(newImages.length - 1);
      }
    } catch (error) {
      console.error('Failed to delete from DB:', error);
    } finally {
      setSelected([])
      setLoading(false);
    }
  };

  const shareSelected = async () => {
    const selectedUris = selected.map(i => images[i].uri);
    if (selectedUris.length === 0) return;
    try {
      const copiedImagePaths: string[] = [];

      for (let i = 0; i < selectedUris.length; i++) {
        const uri = selectedUris[i];
        const cleanPath = uri.replace('file://', '');
        const destPath = `${
          RNFS.CachesDirectoryPath
        }/shared_image_${Date.now()}_${i}.jpg`;

        await RNFS.copyFile(cleanPath, destPath);
        copiedImagePaths.push(`file://${destPath}`);
      }

      await Share.open({
        urls: copiedImagePaths,
        type: 'image/jpeg',
      });
    } catch (err: any) {
      console.error('Share error:', err);
      Alert.alert('Share failed', err.message);
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
        RNFS.DownloadDirectoryPath ||
        RNFS.ExternalStorageDirectoryPath + '/Download';
      const filePath = `${downloadPath}/MyImages.pdf`;

      const options = {
        html: htmlContent,
        fileName: 'MyImages',
        filePath: filePath,
        directory: 'Download',
        base64: true,
      };

      const file = await RNHTMLtoPDF.convert(options);

      Alert.alert(
        'PDF Saved ✅',
        `Saved to:\n${file.filePath}`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Open',
            onPress: () => {
              openFile(file.filePath);
            },
          },
        ],
        { cancelable: true },
      );
    } catch (err: any) {
      Alert.alert('PDF Error ❌', err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  // const pickImagesFromGallery = async () => {
  //   try {
  //     const hasPermission = await requestImagePermissions();
  //     if (!hasPermission) {
  //       Alert.alert('Permission Denied', 'Cannot access gallery.');
  //       return;
  //     }

  //     const result = await (await import('react-native-image-picker')).launchImageLibrary({
  //       mediaType: 'photo',
  //       selectionLimit: 20,
  //     });

  //     if (result.didCancel || !result.assets) return;

  //     const uris = result.assets.map((asset: any) => asset.uri!).filter(Boolean);

  //     if (uris.length > 0) {
  //       const db = await getDBConnection();
  //       await addImages(db, subjectId, uris);
  //       await fetchData();
  //     }
  //   } catch (err) {
  //     Alert.alert('Error', 'Could not save selected images');
  //   }
  // };
const pickImagesFromGallery = async () => {
  // reuse existing permission logic exactly as you had it
  
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
    const db = await getDBConnection();
    await addImages(db, subjectId, uris);
    await fetchData();
  } catch (e) {
    Alert.alert('Picker error', 'Failed to select images');
  }

};
  const openFile = (filePath: any) => {
    FileViewer.open(filePath)
      .then(() => {})
      .catch(error => {});
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
          setLoading(true);
          try {
            const uriToDelete = images[currentIndex].uri;
            const db = await getDBConnection();
            await deleteImagesByUri(db, [uriToDelete]);

            const newImages = images.filter((_, idx) => idx !== currentIndex);
            setImages(newImages);
            setSelected(prev => prev.filter(i => i !== currentIndex));

            if (newImages.length === 0) {
              setIsVisible(false);
            } else if (currentIndex >= newImages.length) {
              setCurrentIndex(newImages.length - 1);
            }
          } catch (err) {
            console.error('Delete failed:', err);
            Alert.alert('Error', 'Could not delete the image.');
          } finally {
            setLoading(false);
          }
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

  return (
    <>
      <TopNavigationAccessoriesShowcase rout="Active" title="Image Gallery" />
      <Loader visible={loading} animationSpeedMultiplier={1.0} />
      <View style={styles.container}>
        {/* Toolbar */}
        <View style={styles.toolbar}>
          {selected.length > 0 && (
            <>
              <TouchableOpacity
                onPress={deleteSelected}
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
            onPress={() => {
              generatePDF(images);
            }}
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
});

export default MyGallery;

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Image,
  StyleSheet,
  ScrollView,
  Dimensions,
  FlatList,
  View,
  Alert,
  Linking,
  Platform,
  PermissionsAndroid,
  BackHandler,
} from 'react-native';
import DocumentScanner, {
  ScanDocumentResponse,
} from 'react-native-document-scanner-plugin';
import { Button, Layout } from '@ui-kitten/components';
import {
  useFocusEffect,
  useIsFocused,
  useNavigation,
} from '@react-navigation/native';
import { baseBGColor } from './Color';
import { TopNavigationAccessoriesShowcase } from './TopNavigationAccessoriesShowcase';
import {
  addImages,
  getActiveSubjects,
  getDBConnection,
  Subject,
} from '../DataBase/db';
import { ModalKitten, ModalKittenHandle } from './Modal';
import Loader from './Loader';
import RNFS from 'react-native-fs';

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  imageContainer: {
    flex: 0.9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width,
    height: '100%',
    resizeMode: 'contain',
  },
  buttonScrollContainer: {
    flex: 0.1,
    paddingVertical: 6,
    backgroundColor: baseBGColor,
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  circularButton: {
    borderRadius: 25,
    marginHorizontal: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  middle: {
    flex: 0.1,
    paddingHorizontal: 10,
    justifyContent: 'center',
  },
  containerButton: {
    width: '100%',
  },
});

export const Scanner = () => {
  const [loading, setLoading] = useState(false); // loader state
  const [scannedImages, setScannedImages] = useState<string[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  let res: ScanDocumentResponse;
  const isFocused = useIsFocused();
  const modalRef = useRef<ModalKittenHandle>(null);
  const navigation = useNavigation<any>();

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        // 👇 Back press → go to "Home" screen
        navigation.navigate('Active');
        return true; // default back ko cancel kar do
      };

      const subscription = BackHandler.addEventListener(
        'hardwareBackPress',
        onBackPress,
      );

      return () => subscription.remove();
    }, [navigation]),
  );

  const handlePress = (massge: string, time: number, status: string) => {
    modalRef.current?.show(massge, time, status);
  };

  const scanDocument = async () => {
    const result = await DocumentScanner.scanDocument({
      croppedImageQuality: 100,
      responseType: 'imageFilePath',
    });

    setScannedImages(result.scannedImages!);

    if (result?.scannedImages?.length) {
      if (result?.scannedImages?.length > 0) {
        setScannedImages(result.scannedImages);
        setCurrentIndex(0); // reset to first
      }
    }
  };

  // const addImagesInSubject =async(subId: number, scannedImages?: string[])=>{
  //   setLoading(true);
  //   try {
  //     if (scannedImages?.length != undefined && scannedImages?.length > 0) {
  //       const db = await getDBConnection();

  //     const downloadPath =
  //            RNFS.DownloadDirectoryPath ||
  //            RNFS.ExternalStorageDirectoryPath + '/Images';

  //       await addImages(db, subId, scannedImages);
  //       handlePress('Image add in subject', 1000, 'success');
  //        navigation.navigate('ImageGalleryScreen', {
  //                   subjectId: subId,
  //        })
  //     } else {
  //       handlePress('some thing want wrong', 1000, 'error');
  //     }
  //   } catch (err) {
  //     console.error('Add images error:', err);
  //     handlePress('some thing want wrong', 1000, 'error');
  //   } finally {
  //     setLoading(false);
  //   }
  // }

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

  const addImagesInSubject = async (
    subId: number,
    scannedImages?: string[],
  ) => {
    if (!scannedImages?.length) return;
    setLoading(true);
    const db = await getDBConnection();
    const movedPaths = await copyScannedImages(scannedImages);
    try {
      if (movedPaths !== undefined && movedPaths.length > 0) {
        const db = await getDBConnection();
        await addImages(db, subId, movedPaths);
        handlePress('Image added in subject', 1000, 'success');
        navigation.navigate('ImageGalleryScreen', {
          subjectId: subId,
        });
      } else {
        handlePress('some thing want wrong', 1000, 'error');
      }
    } catch (err) {
      console.error('Add images error:', err);
      handlePress('some thing want wrong', 1000, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchActiveSubjects = async () => {
      setLoading(true);
      try {
        const db = await getDBConnection();
        const result = await getActiveSubjects(db);
        setSubjects(result);
      } catch (err) {
        console.error('Fetching subjects failed:', err);
        handlePress('Failed to load subjects', 1500, 'error');
      } finally {
        setLoading(false);
      }
    };

    if (isFocused) {
      fetchActiveSubjects();
      scanDocument();
    }
  }, [isFocused]);

  const renderItem = ({ item }: { item: string }) => (
    <Image source={{ uri: item }} style={styles.image} />
  );

  return (
    <Layout style={styles.container} level="1">
      {/* Header */}
      <Layout>
        <TopNavigationAccessoriesShowcase title="Scanner" />
      </Layout>

      {/* Image Section */}
      <Layout style={styles.imageContainer} level="1">
        {Array.isArray(scannedImages) && scannedImages.length > 0 && (
          <FlatList
            data={scannedImages}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            renderItem={renderItem}
            keyExtractor={(item, index) => index.toString()}
            onMomentumScrollEnd={event => {
              const index = Math.floor(
                event.nativeEvent.contentOffset.x / width,
              );
              setCurrentIndex(index);
            }}
          />
        )}
      </Layout>

      {/* Scan Button */}
      <Layout style={styles.middle}>
        <Button
          onPress={scanDocument}
          style={styles.containerButton}
          status="success"
        >
          Scan
        </Button>
      </Layout>

      {/* Subjects Scroll */}
      <Layout style={styles.buttonScrollContainer} level="1">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.buttonRow}
        >
          {subjects.map((label: Subject) => (
            <Button
              key={label.id}
              style={styles.circularButton}
              appearance="outline"
              status="success"
              size="small"
              onPress={() => {
                addImagesInSubject(label.id!, scannedImages);
              }}
            >
              {label.abbreviation}
            </Button>
          ))}
        </ScrollView>
      </Layout>
      <ModalKitten ref={modalRef} />

      <Loader visible={loading} animationSpeedMultiplier={1.0} />
    </Layout>
  );
};

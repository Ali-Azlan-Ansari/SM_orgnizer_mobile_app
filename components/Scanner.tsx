import React, { useState, useEffect, useRef } from 'react';
import {
  Image,
  StyleSheet,
  ScrollView,
  Dimensions,
  FlatList,
  View,
} from 'react-native';
import DocumentScanner, { ScanDocumentResponse } from 'react-native-document-scanner-plugin';
import { Button, Layout } from '@ui-kitten/components';
import { useIsFocused } from '@react-navigation/native';
import { baseBGColor } from './Color';
import { TopNavigationAccessoriesShowcase } from './TopNavigationAccessoriesShowcase';
import { addImages, getActiveSubjects, getDBConnection, Subject } from '../DataBase/db';
import { ModalKitten, ModalKittenHandle } from './Modal';

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
  const [scannedImages, setScannedImages] = useState<string[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  let res: ScanDocumentResponse;
  const isFocused = useIsFocused();
  const modalRef = useRef<ModalKittenHandle>(null);
  const handlePress = (massge: string, time: number, status: string) => {
      modalRef.current?.show(massge, time, status);
  };

  const scanDocument = async () => {
    const result = await DocumentScanner.scanDocument({
      croppedImageQuality: 100,
      responseType: "imageFilePath",
    });
     setScannedImages(result.scannedImages!)

    if(result?.scannedImages?.length){

    if ( result?.scannedImages?.length > 0) {
      setScannedImages(result.scannedImages);
      setCurrentIndex(0); // reset to first
    }
  }
  };

  const addImagesInSubject =async(subId: number, scannedImages?: string[])=>{
    debugger
    if (scannedImages?.length != undefined && scannedImages?.length > 0) {
    const db = await getDBConnection();
    await addImages(db, subId, scannedImages);
    handlePress("Image add in subject",1000,'success')
    }else{
       handlePress("some thing want wrong",1000,'error')
    }
  }

  useEffect(() => {
    const fetchActiveSubjects = async () => {
      const db = await getDBConnection();
      const result = await getActiveSubjects(db);
      setSubjects(result);
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
        <TopNavigationAccessoriesShowcase rout="" title='Scanner' />
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
            onMomentumScrollEnd={(event) => {
              const index = Math.floor(
                event.nativeEvent.contentOffset.x / width
              );
              setCurrentIndex(index);
            }}
          />
        )}
      </Layout>

      {/* Scan Button */}
      <Layout style={styles.middle}>
        <Button onPress={scanDocument} style={styles.containerButton} status="success">
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
              onPress={()=>{
                addImagesInSubject(label.id!,scannedImages)}}
            >
              {label.abbreviation}
            </Button>
          ))}
        </ScrollView>
      </Layout>
       <ModalKitten ref={modalRef} />
    </Layout>
  );
};

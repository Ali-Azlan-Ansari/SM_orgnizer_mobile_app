import React, { forwardRef, useImperativeHandle, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Card, Layout, Modal, Text } from '@ui-kitten/components';
import { error, errorFade, info, infoFade, success, successFade } from './Color';
import FontAwesome6 from '@react-native-vector-icons/fontawesome6';

// Define the props for the show function
export type ModalKittenHandle = {
  show: (message: string, time?: number, status?: string) => void;
};

// ModalKitten component
export const ModalKitten = forwardRef<ModalKittenHandle>((_, ref) => {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState('info'); // ✅ added status tracking

  useImperativeHandle(ref, () => ({
    show(msg: string, time: number = 2000, newStatus: string = 'info') {
      setMessage(msg);
      setStatus(newStatus); // ✅ save status
      setVisible(true);
      setTimeout(() => {
        setVisible(false);
      }, time);
    },
  }));

  return (
    <Layout style={styles.container} level='1'>
      <Modal visible={visible} animationType='fade' backdropStyle={styles.backdrop}>
        {
          status === 'success' ? (
            <Card style={styles.cardS} disabled={true}>
              <View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={styles.statusS}>Success</Text>
                <FontAwesome6
                  name='circle-check'
                  size={20}
                  color={success}
                  iconStyle="solid"
                />
              </View>
              <Text style={styles.massage}>{message}</Text>
            </Card>
          ) : status === 'error' ? (
            <Card style={styles.cardE} disabled={true}>
              <View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={styles.statusE}>Error</Text>
                <FontAwesome6
                  name='circle-xmark'
                  size={20}
                  color={error}
                  iconStyle="solid"
                />
              </View>
              <Text style={styles.massage}>{message}</Text>
            </Card>
          ) : (
            <Card style={styles.cardI} disabled={true}>
              <View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={styles.statusI}>Info</Text>
                <FontAwesome6
                  name='circle-info'
                  size={20}
                  color={info}
                  iconStyle="solid"
                />
              </View>
              <Text style={styles.massage}>{message}</Text>
            </Card>
          )
        }
      </Modal>
    </Layout>
  );
});

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: 0,
    width: 0,
  },
  backdrop: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  cardS: {
    padding: 10,
    borderRadius: 10,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: successFade,
    borderColor: success,
    borderWidth: 3
  },
  statusS: {
    color: success,
  },
  massage: {
    color: '#000000'
  },
  cardE: {
    padding: 10,
    borderRadius: 10,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: errorFade,
    borderColor: error,
    borderWidth: 3
  },
  statusE: {
    color: error,
  },
  cardI: {
    padding: 10,
    borderRadius: 10,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: infoFade,
    borderColor: info,
    borderWidth: 3
  },
  statusI: {
    color: info,
  },
});

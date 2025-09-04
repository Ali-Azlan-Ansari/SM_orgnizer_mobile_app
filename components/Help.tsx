import React from 'react';
import { StyleSheet, View, ScrollView, Linking, Alert, Platform } from 'react-native';
import { Layout, Card, Text, Button } from '@ui-kitten/components';
import FontAwesome6 from '@react-native-vector-icons/fontawesome6';
// OPTIONAL: for richer device info, install react-native-device-info and uncomment
// import DeviceInfo from 'react-native-device-info';

const Step = ({ number, title, description, iconName }: any) => (
  <Card style={styles.card}>
    <View style={styles.stepHeader}>
      <FontAwesome6 name={iconName} style={styles.icon} />
      <Text category="h6" style={styles.stepTitle}>
        {number}. {title}
      </Text>
    </View>
    <Text style={styles.stepDescription}>{description}</Text>
  </Card>
);

const HelpGuide = () => {
  const sendBugReport = async () => {
    try {
      // Basic context (upgrade to DeviceInfo for more)
      const appName = 'SM_organizer'; // replace with actual app name or pull from config
      const appVersion = '1.0.0'; // optionally get from package / DeviceInfo.getVersion()
      const platformInfo = `${Platform.OS} ${Platform.Version}`;
      // If using react-native-device-info, you could do:
      // const appVersion = DeviceInfo.getVersion();
      // const deviceModel = await DeviceInfo.getModel();
      const timestamp = new Date().toISOString();

      const bodyLines = [
        'Please describe the bug here:\n',
        'Steps to reproduce:',
        '--- ',
        '',
        'Expected behavior:',
        '---',
        'Actual behavior:',
        '',
        '---',
        `App: ${appName}`,
        `Version: ${appVersion}`,
        `Platform: level ${platformInfo}`,
        `Time: ${timestamp}`,
      ];
      const body = encodeURIComponent(bodyLines.join('\n'));
      const subject = encodeURIComponent(`Bug Report: ${appName} v${appVersion}`);
      const to = 'aliazlanansari@gmail.com'; // TODO: replace with your real support email
      const mailtoUrl = `mailto:${to}?subject=${subject}&body=${body}`;

      const canOpen = await Linking.canOpenURL(mailtoUrl);
      if (!canOpen) {
        Alert.alert('No Email App', 'Could not open email client on this device.'); 
        return;
      }
      await Linking.openURL(mailtoUrl);
    } catch (err) {
      console.warn('sendBugReport error', err);
      Alert.alert('Error', 'Unable to compose bug report email.');
    }
  };

  return (
    <Layout style={styles.container}>
      <Text category="h4" style={styles.heading}>
        Application User Guide
      </Text>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Step
          number={1}
          iconName="folder-plus"
          title="Add a Subject"
          description="Go to Subject Management and tap the plus button at the top to create a new subject. Provide necessary details and save."
        />
        <Step
          number={2}
          iconName="check-circle"
          title="Activate Subject"
          description="Open Set Active Subject, select the desired subject(s) from the dropdown, and press Activate. Active subjects are marked with a check."
        />
        <Step
          number={3}
          iconName="camera"
          title="Scan Notebook Pages"
          description="Navigate to the Scanner. Use the Scan button to capture notebook pages. Scans are associated with the currently active subject(s)."
        />
        <Step
          number={4}
          iconName="images"
          title="Manage Scanned Images"
          description="Open the Image Gallery for an active subject. Tap thumbnails to view fullscreen, long-press to select, and use the toolbar to generate PDFs, share or delete images, and import more."
        />

        {/* New Report Bug section */}
        <Card style={styles.card}>
          <Text category="h6" style={{ marginBottom: 6 }}>
            Found a problem?
          </Text>
          <Text>
            If something isn’t working right, send us a bug report. The email will prefill useful context — just explain what happened, steps to reproduce, and optionally attach a screenshot. 
          </Text>
          <Button style={styles.reportButton} onPress={sendBugReport}>
            Report a Bug
          </Button>
          <Text appearance="hint" style={{ marginTop: 6, fontSize: 12 }}>
            Note: Screenshots can’t be auto-attached via the default email link; you can attach them manually in the email composer. For richer reporting (with automatic logs/screen capture), consider integrating a reporting SDK like Instabug or Bugsnag. 
          </Text>
        </Card>

        <Card style={styles.card}>
          <Text category="s1" style={styles.tipsTitle}>
            Tips
          </Text>
          <View style={styles.tipItem}>
            <Text>• Activate subjects before scanning to ensure proper categorization.</Text>
          </View>
          <View style={styles.tipItem}>
            <Text>• Use multi-select for batch operations like sharing or deleting.</Text>
          </View>
          <View style={styles.tipItem}>
            <Text>• Grant storage/gallery permissions when prompted to enable full functionality.</Text>
          </View>
        </Card>
      </ScrollView>
    </Layout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  heading: {
    marginBottom: 12,
    fontWeight: '700',
  },
  scroll: {
    paddingBottom: 24,
    gap: 12,
  },
  card: {
    marginBottom: 12,
    borderRadius: 12,
    padding: 12,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 8,
  },
  icon: {
    fontSize: 24,
    color: '#7ebe4b',
  },
  stepTitle: {
    flex: 1,
    fontWeight: '600',
  },
  stepDescription: {
    marginTop: 4,
    fontSize: 14,
    lineHeight: 20,
  },
  tipsTitle: {
    marginBottom: 6,
    fontWeight: '600',
  },
  tipItem: {
    marginBottom: 4,
  },
  reportButton: {
    marginTop: 8,
    alignSelf: 'flex-start',
  },
});

export default HelpGuide;

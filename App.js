import { useEffect, useState, useRef } from 'react';
import { StyleSheet, View, Text, Button, Alert } from 'react-native';
import { Camera, useCameraDevice, useCameraPermission } from 'react-native-vision-camera';
import AudioRecorderPlayer from 'react-native-audio-recorder-player';
import RNFS from 'react-native-fs';

const audioRecorderPlayer = new AudioRecorderPlayer();

export default function App() {
  const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice('external');
  const [photoBinary, setPhotoBinary] = useState(null); // Photo as binary data
  const [audioBinary, setAudioBinary] = useState(null); // Audio as binary data
  const [isRecording, setIsRecording] = useState(false);
  const [hasMicPermission, setHasMicPermission] = useState(false);
  const cameraRef = useRef(null); // Reference for the Camera

  useEffect(() => {
    checkPermissions();
  }, []);

  const checkPermissions = async () => {
    try {
      if (!hasPermission) {
        const granted = await requestPermission();
        if (!granted) {
          console.error('Camera permission was denied');
          return;
        }
      }
  
      const micGranted = await request(PERMISSIONS.ANDROID.RECORD_AUDIO);
      if (micGranted !== RESULTS.GRANTED) {
        console.error('Microphone permission was denied');
        return;
      }
      setHasMicPermission(true);
  
      console.log('All permissions granted');
    } catch (err) {
      console.error('Error requesting permissions:', err);
    }
  };

  const capturePhotoAndAudio = async () => {
    try {
      if (hasPermission && hasMicPermission) {
        if (isRecording) {
          // Stop audio recording
          console.log('Stopping audio recording...');
          const result = await audioRecorderPlayer.stopRecorder();
          setIsRecording(false);
  
          // Read audio file as binary (base64)
          const audioBinary = await RNFS.readFile(result, 'base64');
          setAudioBinary(audioBinary);
          console.log('Audio binary (base64):', audioBinary);
        } else {
          // Ensure the camera reference is valid
          if (!cameraRef.current) {
            console.error('Camera reference is null . Cannot capture photo.');
            return;
          }
  
          // Capture photo and get base64 binary data
          try {
            console.log('Capturing photo...');
            const photo = await cameraRef.current.takeSnapshot({
              quality: 0.5,
              base64: true,
            })
            console.log('Get photo in raw: ', photo);
            // Set the photo binary data
            const img = await RNFS.readFile(photo.path, 'base64');
            console.log('IMG binary (base64):', img);
          } catch (error) {
            console.error('Error capturing photo:', error);
            setErrorMessage(`Error:${error.message}`);
          }
  
          // Start audio recording
          console.log('Starting audio recording...');
          const audioUri = `${RNFS.DocumentDirectoryPath}/audio.m4a`;
          await audioRecorderPlayer.startRecorder(audioUri);
          setIsRecording(true);
        }
      }
    } catch (err) {
      console.error('Error during photo or audio capture:', err);
      Alert.alert('Error', 'An error occurred during photo or audio capture.');
    }
  };

  if (!hasPermission) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>No access to camera</Text>
      </View>
    );
  }
  
  // if (!hasMicPermission) {
  //   return (
  //     <View style={styles.container}>
  //       <Text style={styles.text}>No access to mic</Text>
  //     </View>
  //   );
  // }

  if (!device) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Loading camera...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Camera
        style={styles.preview}
        device={device}
        isActive={true}
        ref={(ref) => (cameraRef.current = ref)}
        photo={true} // Enable photo capture
      />
      <Button
        title={isRecording ? 'Stop Recording' : 'Capture Photo and Record Audio'}
        onPress={capturePhotoAndAudio}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  preview: {
    width: '100%',
    height: '100%',
  },
  text: {
    marginTop: 10,
    fontSize: 16,
    textAlign: 'center',
  },
});

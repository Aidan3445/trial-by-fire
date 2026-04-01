import { View, Text, Pressable } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { useState } from 'react';
import { ScrollText, ExternalLink } from 'lucide-react-native';
import Modal from '~/components/common/modal';

interface NotesCellProps {
  notes: string[] | null;
}

export default function NotesCell({ notes }: NotesCellProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const filteredNotes = notes?.filter((note) => !!note);

  if (!filteredNotes || filteredNotes.length === 0) {
    return (
      <View className='w-20 items-end justify-center'>
        <ScrollText size={32} color='#888' />
      </View>
    );
  }

  const handleLinkPress = (url: string) => {
    WebBrowser.openBrowserAsync(url);
  };

  return (
    <View className='w-20 items-end justify-center'>
      <Pressable onPress={() => setModalVisible(true)} className='active:opacity-50'>
        <ScrollText size={32} className='text-primary' />
      </Pressable>

      <Modal visible={modalVisible} onClose={() => setModalVisible(false)}>
        <Text className='mb-2 text-center text-sm font-semibold uppercase tracking-wide'>
          Notes
        </Text>
        <View className='gap-2'>
          {filteredNotes.map((note, index) => (
            <View key={index} className='flex-row items-start'>
              <Text className='mr-2 text-sm scale-[2]'>•</Text>
              {note.startsWith('https://') ? (
                <Pressable
                  onPress={() => handleLinkPress(note)}
                  className='flex-1 flex-row items-center gap-1'>
                  <Text className='flex-1 text-base font-medium text-primary'>{note}</Text>
                  <ExternalLink size={12} className='text-primary' />
                </Pressable>
              ) : (
                <Text className='flex-1 text-base text-foreground'>{note}</Text>
              )}
            </View>
          ))}
        </View>
      </Modal>
    </View>
  );
}

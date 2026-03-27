import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { Send, Image as ImageIcon, MapPin, Phone } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useAuth } from '@/contexts/AuthContext';
import { useDataStore } from '@/contexts/DataStoreContext';

export default function ChatScreen() {
  const { id, shipmentId } = useLocalSearchParams<{ id: string; shipmentId?: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { 
    getConversationMessages, 
    sendMessage, 
    getShipmentById,
    conversations 
  } = useDataStore();
  
  const scrollViewRef = useRef<ScrollView>(null);
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState(getConversationMessages(id || ''));

  const conversation = conversations.find(c => c.id === id);
  const shipment = shipmentId ? getShipmentById(shipmentId) : 
    (conversation?.shipmentId ? getShipmentById(conversation.shipmentId) : null);

  useEffect(() => {
    setMessages(getConversationMessages(id || ''));
  }, [id, getConversationMessages]);

  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputText.trim() || !user || !id) return;

    await sendMessage(
      id,
      user.id,
      user.name,
      user.activeRole,
      inputText.trim()
    );

    setInputText('');
    setMessages(getConversationMessages(id));
  };

  const getOtherParticipantName = () => {
    if (!shipment) return 'Chat';
    if (user?.activeRole === 'sender') {
      return shipment.assignedTravelerName || 'Traveler';
    }
    return shipment.senderName || 'Sender';
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
      keyboardVerticalOffset={90}
    >
      <Stack.Screen 
        options={{ 
          title: getOtherParticipantName(),
          headerStyle: { backgroundColor: Colors.primary },
          headerTintColor: Colors.textInverse,
        }} 
      />

      {shipment && (
        <View style={styles.shipmentBanner}>
          <View style={styles.shipmentInfo}>
            <Text style={styles.shipmentLabel}>Parcel #{shipment.parcelRequestId}</Text>
            <Text style={styles.shipmentRoute}>
              {shipment.pickupCity} → {shipment.destinationCity}
            </Text>
          </View>
          <View style={styles.shipmentActions}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => router.push(`/tracking/${shipment.id}` as any)}
            >
              <MapPin size={18} color={Colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <Phone size={18} color={Colors.primary} />
            </TouchableOpacity>
          </View>
        </View>
      )}

      <ScrollView
        ref={scrollViewRef}
        style={styles.chatContainer}
        contentContainerStyle={styles.chatContent}
        showsVerticalScrollIndicator={false}
      >
        {messages.length === 0 ? (
          <View style={styles.emptyChat}>
            <Text style={styles.emptyChatText}>
              Start the conversation by sending a message
            </Text>
          </View>
        ) : (
          messages.map((message) => {
            const isOwn = message.senderId === user?.id;
            return (
              <View
                key={message.id}
                style={[
                  styles.messageBubble,
                  isOwn ? styles.ownBubble : styles.otherBubble,
                ]}
              >
                {!isOwn && (
                  <Text style={styles.senderName}>{message.senderName}</Text>
                )}
                {message.imageUrl && (
                  <Image 
                    source={{ uri: message.imageUrl }} 
                    style={styles.messageImage}
                    resizeMode="cover"
                  />
                )}
                <Text style={[
                  styles.messageText,
                  isOwn && styles.ownMessageText,
                ]}>
                  {message.text}
                </Text>
                <Text style={[
                  styles.messageTime,
                  isOwn && styles.ownMessageTime,
                ]}>
                  {formatTime(message.timestamp)}
                </Text>
              </View>
            );
          })
        )}
      </ScrollView>

      <View style={styles.inputContainer}>
        <TouchableOpacity style={styles.attachButton}>
          <ImageIcon size={22} color={Colors.textSecondary} />
        </TouchableOpacity>
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.textInput}
            placeholder="Type a message..."
            placeholderTextColor={Colors.textTertiary}
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={1000}
          />
        </View>
        <TouchableOpacity
          style={[
            styles.sendButton,
            !inputText.trim() && styles.sendButtonDisabled,
          ]}
          onPress={handleSendMessage}
          disabled={!inputText.trim()}
        >
          <Send size={20} color={inputText.trim() ? Colors.textInverse : Colors.textTertiary} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  shipmentBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  shipmentInfo: {
    flex: 1,
  },
  shipmentLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  shipmentRoute: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
    marginTop: 2,
  },
  shipmentActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primaryLight + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatContainer: {
    flex: 1,
  },
  chatContent: {
    padding: 16,
    paddingBottom: 20,
  },
  emptyChat: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyChatText: {
    fontSize: 14,
    color: Colors.textTertiary,
    textAlign: 'center',
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
    marginBottom: 8,
  },
  ownBubble: {
    alignSelf: 'flex-end',
    backgroundColor: Colors.primary,
    borderBottomRightRadius: 4,
  },
  otherBubble: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.surface,
    borderBottomLeftRadius: 4,
  },
  senderName: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.primary,
    marginBottom: 4,
  },
  messageImage: {
    width: 200,
    height: 150,
    borderRadius: 8,
    marginBottom: 8,
  },
  messageText: {
    fontSize: 15,
    color: Colors.text,
    lineHeight: 20,
  },
  ownMessageText: {
    color: Colors.textInverse,
  },
  messageTime: {
    fontSize: 10,
    color: Colors.textTertiary,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  ownMessageTime: {
    color: 'rgba(255,255,255,0.7)',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    paddingBottom: 24,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: 8,
  },
  attachButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputWrapper: {
    flex: 1,
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxHeight: 100,
  },
  textInput: {
    fontSize: 15,
    color: Colors.text,
    maxHeight: 80,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: Colors.border,
  },
});

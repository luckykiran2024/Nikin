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
} from 'react-native';
import { Stack } from 'expo-router';
import {
  Send,
  Package,
  Wallet,
  UserX,
  Clock,
  HelpCircle,
  ChevronRight,
  Bot,
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import { SupportMessage } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { useDataStore } from '@/contexts/DataStoreContext';

const issueCategories = [
  { id: 'shipment', name: 'Shipment Issues', icon: Package, color: Colors.primary },
  { id: 'payment', name: 'Payment Problems', icon: Wallet, color: Colors.success },
  { id: 'traveler', name: 'Traveler Concerns', icon: UserX, color: Colors.warning },
  { id: 'delay', name: 'Delivery Delays', icon: Clock, color: Colors.error },
  { id: 'other', name: 'Other Issues', icon: HelpCircle, color: Colors.info },
];

const botResponses: Record<string, { message: string; options?: string[] }> = {
  greeting: {
    message: "Hello! I'm your support assistant. How can I help you today? Please select a category below or describe your issue.",
    options: issueCategories.map(c => c.name),
  },
  shipment: {
    message: "I understand you have a shipment issue. What specific problem are you facing?",
    options: ["Parcel not picked up", "Wrong delivery address", "Damaged parcel", "Shipment cancelled", "Other"],
  },
  payment: {
    message: "I see you're having payment problems. What's the issue?",
    options: ["Payment failed", "Refund not received", "Double charged", "COD issue", "Other"],
  },
  traveler: {
    message: "You have concerns about a traveler. What happened?",
    options: ["Traveler not responding", "Unprofessional behavior", "Identity verification", "Route mismatch", "Other"],
  },
  delay: {
    message: "Delivery delays can be frustrating. Let me help you.",
    options: ["No updates on tracking", "Missed delivery date", "Traveler delayed", "Request faster delivery", "Other"],
  },
  other: {
    message: "Please describe your issue in detail and I'll try to help you.",
  },
  resolution_pending: {
    message: "I've noted your concern. Here's what you can do:\n\n1. Check your shipment status in 'My Shipments'\n2. Contact the traveler directly through the app\n3. Wait for 24-48 hours for resolution\n\nWould you like to escalate this to a human agent?",
    options: ["Yes, escalate to agent", "No, I'll wait", "Start a new issue"],
  },
  escalated: {
    message: "Your issue has been escalated to our support team. You'll receive a response within 24 hours via email. Your ticket number is #SUP" + Math.floor(100000 + Math.random() * 900000) + ".",
  },
  closing: {
    message: "Thank you for reaching out! Is there anything else I can help you with?",
    options: ["Yes, I have another issue", "No, thank you"],
  },
};

export default function SupportScreen() {
  const scrollViewRef = useRef<ScrollView>(null);
  const { user } = useAuth();
  const { createTicket } = useDataStore();
  const [messages, setMessages] = useState<SupportMessage[]>([
    {
      id: '1',
      text: botResponses.greeting.message,
      isBot: true,
      timestamp: new Date().toISOString(),
      options: botResponses.greeting.options,
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [currentContext, setCurrentContext] = useState('greeting');
  const [ticketCreated, setTicketCreated] = useState(false);
  const [currentCategory, setCurrentCategory] = useState('');

  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages]);

  const addMessage = (text: string, isBot: boolean, options?: string[]) => {
    const newMessage: SupportMessage = {
      id: Date.now().toString(),
      text,
      isBot,
      timestamp: new Date().toISOString(),
      options,
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const handleOptionSelect = (option: string) => {
    addMessage(option, false);

    setTimeout(() => {
      let response = botResponses.resolution_pending;
      let newContext = 'resolution_pending';

      if (option === 'Shipment Issues' || option.includes('Shipment')) {
        response = botResponses.shipment;
        newContext = 'shipment';
      } else if (option === 'Payment Problems' || option.includes('Payment')) {
        response = botResponses.payment;
        newContext = 'payment';
      } else if (option === 'Traveler Concerns' || option.includes('Traveler')) {
        response = botResponses.traveler;
        newContext = 'traveler';
      } else if (option === 'Delivery Delays' || option.includes('Delay')) {
        response = botResponses.delay;
        newContext = 'delay';
      } else if (option === 'Other Issues' || option === 'Other') {
        response = botResponses.other;
        newContext = 'other';
      } else if (option === 'Yes, escalate to agent') {
        handleEscalateToAdmin();
        response = botResponses.escalated;
        newContext = 'escalated';
      } else if (option === "No, I'll wait" || option === 'No, thank you') {
        response = botResponses.closing;
        newContext = 'closing';
      } else if (option === 'Yes, I have another issue' || option === 'Start a new issue') {
        response = botResponses.greeting;
        newContext = 'greeting';
      } else {
        response = botResponses.resolution_pending;
        newContext = 'resolution_pending';
      }

      setCurrentContext(newContext);
      addMessage(response.message, true, response.options);
    }, 800);
  };

  const handleEscalateToAdmin = async () => {
    if (!user || ticketCreated) return;
    
    try {
      const ticket = await createTicket({
        userId: user.id,
        userName: user.name,
        userRole: user.activeRole,
        category: currentCategory || 'General Support',
        description: messages.filter(m => !m.isBot).map(m => m.text).join(' | '),
        status: 'open',
        priority: 'medium',
      });
      
      setTicketCreated(true);
      console.log('Ticket created:', ticket.ticketNumber);
    } catch (error) {
      console.log('Error creating ticket:', error);
    }
  };

  const handleSendMessage = () => {
    if (!inputText.trim()) return;

    addMessage(inputText.trim(), false);
    setInputText('');

    setTimeout(() => {
      const response = botResponses.resolution_pending;
      addMessage(response.message, true, response.options);
      setCurrentContext('resolution_pending');
    }, 1000);
  };

  const handleCategoryPress = (categoryId: string) => {
    const category = issueCategories.find(c => c.id === categoryId);
    if (category) {
      setCurrentCategory(category.name);
      handleOptionSelect(category.name);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
      keyboardVerticalOffset={90}
    >
      <Stack.Screen options={{ title: 'Support Chat' }} />
      
      <View style={styles.header}>
        <View style={styles.botAvatar}>
          <Bot size={24} color={Colors.textInverse} />
        </View>
        <View>
          <Text style={styles.botName}>Support Assistant</Text>
          <Text style={styles.botStatus}>Online • Typically replies instantly</Text>
        </View>
      </View>

      <ScrollView
        ref={scrollViewRef}
        style={styles.chatContainer}
        contentContainerStyle={styles.chatContent}
        showsVerticalScrollIndicator={false}
      >
        {currentContext === 'greeting' && (
          <View style={styles.categoriesSection}>
            <Text style={styles.categoriesTitle}>Quick Categories</Text>
            <View style={styles.categoriesGrid}>
              {issueCategories.map((category) => {
                const Icon = category.icon;
                return (
                  <TouchableOpacity
                    key={category.id}
                    style={styles.categoryCard}
                    onPress={() => handleCategoryPress(category.id)}
                  >
                    <View style={[styles.categoryIcon, { backgroundColor: category.color + '15' }]}>
                      <Icon size={22} color={category.color} />
                    </View>
                    <Text style={styles.categoryName}>{category.name}</Text>
                    <ChevronRight size={16} color={Colors.textTertiary} />
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {messages.map((message) => (
          <View key={message.id}>
            <View
              style={[
                styles.messageBubble,
                message.isBot ? styles.botBubble : styles.userBubble,
              ]}
            >
              {message.isBot && (
                <View style={styles.bubbleAvatar}>
                  <Bot size={14} color={Colors.textInverse} />
                </View>
              )}
              <View style={[
                styles.bubbleContent,
                message.isBot ? styles.botContent : styles.userContent,
              ]}>
                <Text style={[
                  styles.messageText,
                  !message.isBot && styles.userMessageText,
                ]}>
                  {message.text}
                </Text>
              </View>
            </View>

            {message.options && message.options.length > 0 && (
              <View style={styles.optionsContainer}>
                {message.options.map((option, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.optionButton}
                    onPress={() => handleOptionSelect(option)}
                  >
                    <Text style={styles.optionText}>{option}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        ))}
      </ScrollView>

      <View style={styles.inputContainer}>
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.textInput}
            placeholder="Type your message..."
            placeholderTextColor={Colors.textTertiary}
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={500}
          />
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
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 12,
  },
  botAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  botName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  botStatus: {
    fontSize: 12,
    color: Colors.success,
    marginTop: 2,
  },
  chatContainer: {
    flex: 1,
  },
  chatContent: {
    padding: 16,
    paddingBottom: 20,
  },
  categoriesSection: {
    marginBottom: 20,
  },
  categoriesTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  categoriesGrid: {
    gap: 10,
  },
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 14,
    gap: 12,
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500' as const,
    color: Colors.text,
  },
  messageBubble: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-end',
  },
  botBubble: {
    justifyContent: 'flex-start',
  },
  userBubble: {
    justifyContent: 'flex-end',
  },
  bubbleAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  bubbleContent: {
    maxWidth: '75%',
    padding: 14,
    borderRadius: 18,
  },
  botContent: {
    backgroundColor: Colors.surface,
    borderBottomLeftRadius: 4,
  },
  userContent: {
    backgroundColor: Colors.primary,
    borderBottomRightRadius: 4,
    marginLeft: 'auto',
  },
  messageText: {
    fontSize: 15,
    color: Colors.text,
    lineHeight: 22,
  },
  userMessageText: {
    color: Colors.textInverse,
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginLeft: 36,
    marginBottom: 12,
  },
  optionButton: {
    backgroundColor: Colors.primaryLight + '20',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  optionText: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: Colors.primary,
  },
  inputContainer: {
    padding: 16,
    paddingBottom: 24,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    color: Colors.text,
    maxHeight: 100,
    paddingVertical: 8,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: Colors.border,
  },
});

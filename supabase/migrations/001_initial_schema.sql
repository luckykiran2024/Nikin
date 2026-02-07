-- Supabase Database Schema for Parcel Marketplace

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20) UNIQUE NOT NULL,
  roles TEXT[] DEFAULT ARRAY['sender'],
  avatar_url TEXT,
  rating DECIMAL(3,2) DEFAULT 0,
  total_deliveries INTEGER DEFAULT 0,
  total_shipments INTEGER DEFAULT 0,
  is_verified BOOLEAN DEFAULT false,
  kyc_status VARCHAR(20) DEFAULT 'not_submitted',
  bank_account_number VARCHAR(50),
  bank_ifsc VARCHAR(20),
  bank_account_holder VARCHAR(255),
  upi_id VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Shipments table
CREATE TABLE shipments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  parcel_request_id VARCHAR(50) UNIQUE NOT NULL,
  sender_id UUID REFERENCES users(id) ON DELETE CASCADE,
  assigned_traveler_id UUID REFERENCES users(id) ON DELETE SET NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(50) NOT NULL,
  weight DECIMAL(10,2) NOT NULL,
  dimensions JSONB,
  pickup_address TEXT NOT NULL,
  pickup_city VARCHAR(100) NOT NULL,
  pickup_pincode VARCHAR(10) NOT NULL,
  destination_address TEXT NOT NULL,
  destination_city VARCHAR(100) NOT NULL,
  destination_pincode VARCHAR(10) NOT NULL,
  sender_name VARCHAR(255),
  sender_phone VARCHAR(20),
  receiver_name VARCHAR(255),
  receiver_phone VARCHAR(20),
  preferred_date DATE,
  flexible_dates BOOLEAN DEFAULT false,
  budget_min DECIMAL(10,2),
  budget_max DECIMAL(10,2),
  images TEXT[],
  parcel_image TEXT,
  status VARCHAR(50) DEFAULT 'created',
  quotes_count INTEGER DEFAULT 0,
  accepted_quote_id UUID,
  final_price DECIMAL(10,2),
  pickup_otp VARCHAR(6),
  delivery_otp VARCHAR(6),
  pickup_verified BOOLEAN DEFAULT false,
  delivery_verified BOOLEAN DEFAULT false,
  traveler_transport_mode VARCHAR(50),
  traveler_expected_delivery DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Quotes table
CREATE TABLE quotes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shipment_id UUID REFERENCES shipments(id) ON DELETE CASCADE,
  traveler_id UUID REFERENCES users(id) ON DELETE CASCADE,
  price DECIMAL(10,2) NOT NULL,
  estimated_delivery DATE NOT NULL,
  message TEXT,
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Travel Routes table
CREATE TABLE travel_routes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  traveler_id UUID REFERENCES users(id) ON DELETE CASCADE,
  from_city VARCHAR(100) NOT NULL,
  to_city VARCHAR(100) NOT NULL,
  travel_date DATE NOT NULL,
  available_capacity DECIMAL(10,2) NOT NULL,
  price_per_kg DECIMAL(10,2) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payments table
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shipment_id UUID REFERENCES shipments(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES users(id) ON DELETE CASCADE,
  traveler_id UUID REFERENCES users(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  platform_fee DECIMAL(10,2) NOT NULL,
  traveler_payout DECIMAL(10,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  payment_method VARCHAR(50),
  transaction_id VARCHAR(100),
  razorpay_order_id VARCHAR(100),
  razorpay_payment_id VARCHAR(100),
  payout_status VARCHAR(20) DEFAULT 'pending',
  payout_transaction_id VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- KYC Requests table
CREATE TABLE kyc_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  document_type VARCHAR(50) NOT NULL,
  document_number VARCHAR(100) NOT NULL,
  document_front_image TEXT NOT NULL,
  document_back_image TEXT,
  selfie_image TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  rejection_reason TEXT,
  reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reviewed_at TIMESTAMP WITH TIME ZONE
);

-- Chat Conversations table
CREATE TABLE chat_conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shipment_id UUID REFERENCES shipments(id) ON DELETE CASCADE,
  participants UUID[] NOT NULL,
  is_active BOOLEAN DEFAULT true,
  unread_count JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chat Messages table
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID REFERENCES chat_conversations(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  message_type VARCHAR(20) DEFAULT 'text',
  read BOOLEAN DEFAULT false,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications table
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) NOT NULL,
  data JSONB,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Escalated Tickets table
CREATE TABLE escalated_tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_number VARCHAR(20) UNIQUE NOT NULL,
  shipment_id UUID REFERENCES shipments(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  category VARCHAR(50) NOT NULL,
  priority VARCHAR(20) DEFAULT 'medium',
  subject VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'open',
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
  resolution TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better query performance
CREATE INDEX idx_shipments_sender ON shipments(sender_id);
CREATE INDEX idx_shipments_traveler ON shipments(assigned_traveler_id);
CREATE INDEX idx_shipments_status ON shipments(status);
CREATE INDEX idx_quotes_shipment ON quotes(shipment_id);
CREATE INDEX idx_quotes_traveler ON quotes(traveler_id);
CREATE INDEX idx_travel_routes_traveler ON travel_routes(traveler_id);
CREATE INDEX idx_payments_shipment ON payments(shipment_id);
CREATE INDEX idx_kyc_user ON kyc_requests(user_id);
CREATE INDEX idx_chat_messages_conversation ON chat_messages(conversation_id);
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_tickets_user ON escalated_tickets(user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_shipments_updated_at
  BEFORE UPDATE ON shipments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conversations_updated_at
  BEFORE UPDATE ON chat_conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tickets_updated_at
  BEFORE UPDATE ON escalated_tickets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to generate parcel request ID
CREATE OR REPLACE FUNCTION generate_parcel_request_id()
RETURNS TRIGGER AS $$
BEGIN
  NEW.parcel_request_id := 'PRC' || TO_CHAR(NOW(), 'YYYYMMDDHH24') || LPAD(FLOOR(RANDOM() * 1000)::TEXT, 3, '0');
  NEW.pickup_otp := LPAD(FLOOR(1000 + RANDOM() * 9000)::TEXT, 4, '0');
  NEW.delivery_otp := LPAD(FLOOR(1000 + RANDOM() * 9000)::TEXT, 4, '0');
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER set_parcel_request_id
  BEFORE INSERT ON shipments
  FOR EACH ROW EXECUTE FUNCTION generate_parcel_request_id();

-- Function to generate ticket number
CREATE OR REPLACE FUNCTION generate_ticket_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.ticket_number := 'SUP' || SUBSTRING(EXTRACT(EPOCH FROM NOW())::TEXT FROM 8 FOR 6);
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER set_ticket_number
  BEFORE INSERT ON escalated_tickets
  FOR EACH ROW EXECUTE FUNCTION generate_ticket_number();

-- Row Level Security (RLS) Policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE travel_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE kyc_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE escalated_tickets ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies (adjust based on your auth setup)
-- Users can read their own data
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid()::text = id::text);

-- Shipments policies
CREATE POLICY "Users can view own shipments" ON shipments
  FOR SELECT USING (
    auth.uid()::text = sender_id::text OR 
    auth.uid()::text = assigned_traveler_id::text
  );

CREATE POLICY "Senders can create shipments" ON shipments
  FOR INSERT WITH CHECK (auth.uid()::text = sender_id::text);

-- Service role bypass for Edge Functions
CREATE POLICY "Service role full access users" ON users
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access shipments" ON shipments
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access quotes" ON quotes
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access travel_routes" ON travel_routes
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access payments" ON payments
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access kyc_requests" ON kyc_requests
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access chat_conversations" ON chat_conversations
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access chat_messages" ON chat_messages
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access notifications" ON notifications
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access escalated_tickets" ON escalated_tickets
  FOR ALL USING (auth.role() = 'service_role');

-- Helper functions for the application

-- Function to increment quotes count on shipment
CREATE OR REPLACE FUNCTION increment_quotes_count(shipment_uuid UUID)
RETURNS void AS $
BEGIN
  UPDATE shipments 
  SET 
    quotes_count = quotes_count + 1,
    status = CASE WHEN status = 'created' THEN 'quoted' ELSE status END
  WHERE id = shipment_uuid;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user statistics
CREATE OR REPLACE FUNCTION get_user_stats(user_id UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_shipments', (SELECT COUNT(*) FROM shipments WHERE sender_id = user_id),
    'total_deliveries', (SELECT COUNT(*) FROM shipments WHERE assigned_traveler_id = user_id AND status = 'delivered'),
    'active_shipments', (SELECT COUNT(*) FROM shipments WHERE (sender_id = user_id OR assigned_traveler_id = user_id) AND status NOT IN ('delivered', 'completed', 'cancelled')),
    'total_earned', (SELECT COALESCE(SUM(traveler_payout), 0) FROM payments WHERE traveler_id = user_id AND status = 'completed'),
    'total_spent', (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE sender_id = user_id AND status = 'completed'),
    'average_rating', (SELECT COALESCE(AVG(rating), 0) FROM users WHERE id = user_id)
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to search shipments
CREATE OR REPLACE FUNCTION search_shipments(
  search_from_city TEXT DEFAULT NULL,
  search_to_city TEXT DEFAULT NULL,
  search_status TEXT DEFAULT NULL,
  search_limit INTEGER DEFAULT 50
)
RETURNS SETOF shipments AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM shipments s
  WHERE 
    (search_from_city IS NULL OR s.pickup_city ILIKE '%' || search_from_city || '%')
    AND (search_to_city IS NULL OR s.destination_city ILIKE '%' || search_to_city || '%')
    AND (search_status IS NULL OR s.status = search_status)
  ORDER BY s.created_at DESC
  LIMIT search_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update user stats after shipment status change
CREATE OR REPLACE FUNCTION update_user_stats_on_delivery()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'delivered' AND OLD.status != 'delivered' THEN
    -- Update traveler's total deliveries
    UPDATE users 
    SET total_deliveries = total_deliveries + 1 
    WHERE id = NEW.assigned_traveler_id;
    
    -- Update sender's total shipments
    UPDATE users 
    SET total_shipments = total_shipments + 1 
    WHERE id = NEW.sender_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_user_stats
  AFTER UPDATE ON shipments
  FOR EACH ROW EXECUTE FUNCTION update_user_stats_on_delivery();

-- Function to get dashboard stats for a user
CREATE OR REPLACE FUNCTION get_dashboard_stats(p_user_id UUID, p_role TEXT)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  IF p_role = 'sender' THEN
    SELECT json_build_object(
      'active_shipments', (SELECT COUNT(*) FROM shipments WHERE sender_id = p_user_id AND status NOT IN ('delivered', 'completed', 'cancelled')),
      'completed_shipments', (SELECT COUNT(*) FROM shipments WHERE sender_id = p_user_id AND status IN ('delivered', 'completed')),
      'pending_quotes', (SELECT COUNT(*) FROM shipments WHERE sender_id = p_user_id AND status = 'quoted'),
      'total_spent', (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE sender_id = p_user_id AND status = 'completed')
    ) INTO result;
  ELSE
    SELECT json_build_object(
      'active_deliveries', (SELECT COUNT(*) FROM shipments WHERE assigned_traveler_id = p_user_id AND status NOT IN ('delivered', 'completed', 'cancelled')),
      'completed_deliveries', (SELECT COUNT(*) FROM shipments WHERE assigned_traveler_id = p_user_id AND status IN ('delivered', 'completed')),
      'pending_quotes', (SELECT COUNT(*) FROM quotes WHERE traveler_id = p_user_id AND status = 'pending'),
      'total_earned', (SELECT COALESCE(SUM(traveler_payout), 0) FROM payments WHERE traveler_id = p_user_id AND payout_status = 'completed')
    ) INTO result;
  END IF;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

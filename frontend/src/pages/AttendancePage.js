import React, { useState } from 'react';
import Layout from '../components/Layout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import axios from 'axios';
import { toast } from 'sonner';
import { MapPin, Clock } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AttendancePage = () => {
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState(null);

  const getLocation = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'));
      }
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const loc = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setLocation(loc);
          resolve(loc);
        },
        (error) => reject(error)
      );
    });
  };

  const handleCheckIn = async () => {
    setLoading(true);
    try {
      const loc = await getLocation();
      await axios.post(`${API}/attendance/check-in`, {
        location_lat: loc.lat,
        location_lng: loc.lng,
        location_address: 'Office Location'
      });
      toast.success('Checked in successfully');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to check in');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckOut = async () => {
    setLoading(true);
    try {
      await axios.post(`${API}/attendance/check-out`);
      toast.success('Checked out successfully');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to check out');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div data-testid="attendance-page" className="space-y-8">
        <div>
          <h1 className="text-4xl font-serif font-bold tracking-tight mb-2">Attendance</h1>
          <p className="text-muted-foreground">Mark your attendance with GPS location</p>
        </div>

        <Card className="p-8 bg-card border border-border/60 shadow-sm rounded-md max-w-md">
          <div className="space-y-6">
            <div className="flex items-center gap-3 text-muted-foreground">
              <Clock className="w-5 h-5" strokeWidth={1.5} />
              <span className="text-lg font-mono">{new Date().toLocaleTimeString()}</span>
            </div>
            
            {location && (
              <div className="flex items-center gap-3 text-muted-foreground">
                <MapPin className="w-5 h-5" strokeWidth={1.5} />
                <span className="text-sm">Location: {location.lat.toFixed(4)}, {location.lng.toFixed(4)}</span>
              </div>
            )}

            <div className="flex gap-4">
              <Button
                data-testid="check-in-button"
                onClick={handleCheckIn}
                disabled={loading}
                className="flex-1 rounded-sm uppercase tracking-wider"
              >
                {loading ? 'Processing...' : 'Check In'}
              </Button>
              <Button
                data-testid="check-out-button"
                onClick={handleCheckOut}
                disabled={loading}
                variant="outline"
                className="flex-1 rounded-sm uppercase tracking-wider"
              >
                Check Out
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </Layout>
  );
};

export default AttendancePage;

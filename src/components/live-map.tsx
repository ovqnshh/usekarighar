import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { supabase } from '@/integrations/supabase/client';
import L from 'leaflet';

// Fix for default marker icons in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom(), { animate: true });
  }, [center, map]);
  return null;
}

export function LiveMap({ professionalId, fallbackLat = 19.0760, fallbackLng = 72.8777 }: { professionalId: string, fallbackLat?: number, fallbackLng?: number }) {
  const [position, setPosition] = useState<[number, number]>([fallbackLat, fallbackLng]);

  useEffect(() => {
    // 1. Fetch initial location
    const fetchLocation = async () => {
      const { data } = await supabase
        .from('professional_locations')
        .select('latitude, longitude')
        .eq('professional_id', professionalId)
        .single();
        
      if (data) {
        setPosition([data.latitude, data.longitude]);
      }
    };
    
    fetchLocation();

    // 2. Subscribe to real-time changes
    const subscription = supabase
      .channel('public:professional_locations')
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'professional_locations',
        filter: `professional_id=eq.${professionalId}`
      }, (payload) => {
        const newLat = payload.new.latitude;
        const newLng = payload.new.longitude;
        if (newLat && newLng) {
          setPosition([newLat, newLng]);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [professionalId]);

  return (
    <div className="h-[300px] w-full rounded-2xl overflow-hidden border border-border shadow-sm">
      <MapContainer center={position} zoom={14} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />
        <Marker position={position}>
          <Popup>
            The Karighar is currently here.
          </Popup>
        </Marker>
        <MapUpdater center={position} />
      </MapContainer>
    </div>
  );
}

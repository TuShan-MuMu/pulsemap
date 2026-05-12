'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import Navbar from '@/components/Navbar';
import PulseMap from '@/components/PulseMap';
import LayerControls from '@/components/LayerControls';
import Legend from '@/components/Legend';
import OutbreakDetail from '@/components/OutbreakDetail';
import Feed from '@/components/Feed';
import StatsBar from '@/components/StatsBar';
import TimelineSlider from '@/components/TimelineSlider';
import { FeedItem } from '@/lib/seed-data';
import { seedOutbreaks, seedFeedItems } from '@/lib/seed-data';
import { loadDashboardData, DataSource } from '@/lib/api-client';
import { OutbreakGeoJSON, OutbreakGeoFeature, LayerVisibility } from '@/types';

export default function Home() {
    const [layers, setLayers] = useState<LayerVisibility>({
        heatmap: true,
        hotspots: true,
        spread: false,
        newsPins: false,
    });

    const [outbreakData, setOutbreakData] = useState<OutbreakGeoJSON>(seedOutbreaks);
    const [feedItems, setFeedItems] = useState<FeedItem[]>(seedFeedItems);
    const [selectedFeature, setSelectedFeature] = useState<OutbreakGeoFeature | null>(null);
    const [selectedFeedItem, setSelectedFeedItem] = useState<FeedItem | null>(null);
    const [flyTo, setFlyTo] = useState<[number, number] | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [dataSource, setDataSource] = useState<DataSource>('loading');
    const [timelineValue, setTimelineValue] = useState(100);

    useEffect(() => {
        loadDashboardData().then((result) => {
            setOutbreakData(result.outbreakData);
            setFeedItems(result.feedItems);
            setDataSource(result.dataSource);
        });
    }, []);

    const { timestamps, minTs, maxTs } = useMemo(() => {
        const ts = outbreakData.features.map((f) => new Date(f.properties.reported_at).getTime());
        if (ts.length === 0) return { timestamps: ts, minTs: 0, maxTs: 0 };
        let lo = ts[0], hi = ts[0];
        for (let i = 1; i < ts.length; i++) {
            if (ts[i] < lo) lo = ts[i];
            if (ts[i] > hi) hi = ts[i];
        }
        return { timestamps: ts, minTs: lo, maxTs: hi };
    }, [outbreakData]);

    const filteredData = useMemo(() => {
        if (timelineValue >= 100) return outbreakData;
        const cutoff = minTs + ((maxTs - minTs) * timelineValue) / 100;
        return {
            ...outbreakData,
            features: outbreakData.features.filter((_, i) => timestamps[i] <= cutoff),
        };
    }, [outbreakData, timelineValue, timestamps, minTs, maxTs]);

    const filteredFeed = useMemo(() => {
        if (timelineValue >= 100) return feedItems;
        const visibleIds = new Set(filteredData.features.map((f) => f.properties.outbreak_id));
        return feedItems.filter((item) => visibleIds.has(item.outbreak_id));
    }, [feedItems, filteredData, timelineValue]);

    const handleLayerToggle = useCallback((layer: keyof LayerVisibility) => {
        setLayers((prev) => ({ ...prev, [layer]: !prev[layer] }));
    }, []);

    const handleFeatureClick = useCallback((feature: OutbreakGeoFeature) => {
        setSelectedFeature(feature);
        setFlyTo(feature.geometry.coordinates);
    }, []);

    const handleFeedItemClick = useCallback((outbreakId: string) => {
        const feature = outbreakData.features.find((f) => f.properties.outbreak_id === outbreakId);
        if (feature) {
            handleFeatureClick(feature);
        }
    }, [handleFeatureClick, outbreakData]);

    const handleSearch = useCallback((query: string) => {
        setSearchQuery(query);
    }, []);
    return (
        <div className="flex flex-col h-screen">
            <Navbar onSearch={handleSearch} />

            <div className="relative flex-1" style={{ minHeight: '55vh' }}>
                <PulseMap data={filteredData} layers={layers} onFeatureClick={handleFeatureClick} flyTo={flyTo} />

                <LayerControls layers={layers} onToggle={handleLayerToggle} />
                <Legend layers={layers} />

                <OutbreakDetail feature={selectedFeature} onClose={() => setSelectedFeature(null)} />
            </div>

            <StatsBar data={filteredData} />

            <TimelineSlider features={filteredData.features} value={timelineValue} onChange={setTimelineValue} />

            <div className="flex-none border-t border-border" style={{ height: "calc(35vh - 68px)" }}>
                <Feed items={filteredFeed} searchQuery={searchQuery} onItemClick={handleFeedItemClick} />
            </div>
        </div>
    );
}

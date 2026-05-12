'use client';

import { useEffect, useRef, useCallback, useState } from 'react';

// 声明高德地图全局类型
declare global {
    interface Window {
        AMap: any;
    }
}

// 类型定义
interface OutbreakGeoFeature {
    geometry: {
        coordinates: [number, number];
        type: string;
    };
    properties: {
        severity: string;
        case_count: number;
        disease_name: string;
        country: string;
        severity_score?: number;
        name?: string;
    };
}

interface OutbreakGeoJSON {
    features: OutbreakGeoFeature[];
}

interface PulseMapProps {
    data: OutbreakGeoJSON;
    layers: {
        heatmap: boolean;
        hotspots: boolean;
        spread: boolean;
    };
    onFeatureClick: (feature: OutbreakGeoFeature) => void;
    flyTo?: [number, number] | null;
}

const SEVERITY_COLORS: Record<string, string> = {
    low: "#22c55e",
    moderate: "#eab308",
    severe: "#ef4444",
    critical: "#dc2626",
};

export default function PulseMap({
    data,
    layers,
    onFeatureClick,
    flyTo,
}: PulseMapProps) {
    const mapContainer = useRef<HTMLDivElement>(null);
    const mapRef = useRef<any>(null);
    const markersRef = useRef<any[]>([]);
    const heatmapRef = useRef<any>(null);
    const [isScriptLoaded, setIsScriptLoaded] = useState(false);

    // 清除所有标记点
    const clearMarkers = useCallback(() => {
        markersRef.current.forEach((marker) => {
            if (marker && marker.destroy) marker.destroy();
        });
        markersRef.current = [];
    }, []);

    // 添加热点标记点
    const addHotspotMarkers = useCallback(
        (mapInstance: any, features: OutbreakGeoFeature[]) => {
            clearMarkers();
            if (!layers.hotspots) return;

            if (!features || features.length === 0) return;

            features.forEach((feature) => {
                try {
                    const { severity, case_count, disease_name, country } = feature.properties;
                    const [lng, lat] = feature.geometry.coordinates;

                    const color = SEVERITY_COLORS[severity] || SEVERITY_COLORS.moderate;
                    const size = Math.max(16, Math.min(48, 10 + Math.log10(case_count + 1) * 8));

                    // 创建自定义 HTML 标记
                    const content = document.createElement('div');
                    content.style.width = `${size}px`;
                    content.style.height = `${size}px`;
                    content.style.cursor = 'pointer';
                    content.style.position = 'relative';

                    // 脉冲环
                    const ring = document.createElement('div');
                    ring.style.position = 'absolute';
                    ring.style.top = '0';
                    ring.style.left = '0';
                    ring.style.width = '100%';
                    ring.style.height = '100%';
                    ring.style.borderRadius = '50%';
                    ring.style.border = `2px solid ${color}`;
                    ring.style.animation = 'pulse 1.5s ease-out infinite';
                    content.appendChild(ring);

                    // 中心点
                    const dot = document.createElement('div');
                    dot.style.position = 'absolute';
                    dot.style.top = '50%';
                    dot.style.left = '50%';
                    dot.style.transform = 'translate(-50%, -50%)';
                    dot.style.width = '40%';
                    dot.style.height = '40%';
                    dot.style.borderRadius = '50%';
                    dot.style.backgroundColor = color;
                    dot.style.opacity = '0.85';
                    content.appendChild(dot);

                    // 点击事件
                    content.addEventListener('click', (e) => {
                        e.stopPropagation();
                        onFeatureClick(feature);
                    });

                    // 鼠标悬浮显示信息窗口
                    let infoWindow: any = null;
                    content.addEventListener('mouseenter', () => {
                        infoWindow = new window.AMap.InfoWindow({
                            content: `<div style="font-size:12px; padding:8px;">
                                <strong>${disease_name}</strong><br/>
                                <span style="color:#64748b">${country}</span>
                                <br/>病例数: ${case_count.toLocaleString()}
                            </div>`,
                            offset: new window.AMap.Pixel(0, -size / 2 - 10),
                        });
                        infoWindow.open(mapInstance, [lng, lat]);
                    });

                    content.addEventListener('mouseleave', () => {
                        if (infoWindow) infoWindow.close();
                    });

                    const marker = new window.AMap.Marker({
                        position: [lng, lat],
                        content: content,
                        anchor: 'center',
                    });

                    marker.setMap(mapInstance);
                    markersRef.current.push(marker);
                } catch (error) {
                    console.error('创建标记点失败:', error);
                }
            });
        },
        [layers.hotspots, onFeatureClick, clearMarkers]
    );

    // 创建或更新热力图
    const updateHeatmap = useCallback((mapInstance: any, features: OutbreakGeoFeature[]) => {
        try {
            if (!features || features.length === 0) {
                // 如果没有数据，移除热力图
                if (heatmapRef.current) {
                    heatmapRef.current.setMap(null);
                    heatmapRef.current = null;
                }
                return;
            }

            // 准备热力图数据
            const heatmapData = features.map((feature) => ({
                lng: feature.geometry.coordinates[0],
                lat: feature.geometry.coordinates[1],
                count: feature.properties.severity_score ||
                    Math.min(feature.properties.case_count / 100, 100) || 1,
            }));

            // 如果热力图不存在，创建它
            if (!heatmapRef.current) {
                // 高德地图热力图配置
                const heatmapConfig = {
                    radius: 40,
                    opacity: [0, 0.8],
                    zooms: [3, 18],
                    gradient: {
                        0.1: '#22c55e',
                        0.3: '#8bc34a',
                        0.5: '#ffeb3b',
                        0.7: '#ff9800',
                        0.9: '#f44336',
                    },
                };

                // 创建热力图
                heatmapRef.current = new window.AMap.Heatmap(mapInstance, heatmapConfig);
            }

            // 设置热力图数据
            if (heatmapRef.current.setDataSet) {
                heatmapRef.current.setDataSet({
                    data: heatmapData,
                    max: Math.max(...heatmapData.map(d => d.count), 1)
                });
            } else if (heatmapRef.current.setData) {
                heatmapRef.current.setData(heatmapData);
            }

            // 根据图层可见性显示或隐藏热力图
            if (layers.heatmap) {
                // 显示热力图 - 使用 setMap 方法
                if (heatmapRef.current.setMap) {
                    heatmapRef.current.setMap(mapInstance);
                }
            } else {
                // 隐藏热力图 - 使用 setMap(null)
                if (heatmapRef.current.setMap) {
                    heatmapRef.current.setMap(null);
                }
            }
        } catch (error) {
            console.error('热力图操作失败:', error);
        }
    }, [layers.heatmap]);

    // 添加 CSS 动画样式
    useEffect(() => {
        const style = document.createElement('style');
        style.textContent = `
            @keyframes pulse {
                0% {
                    transform: scale(1);
                    opacity: 1;
                }
                100% {
                    transform: scale(2.5);
                    opacity: 0;
                }
            }
            .hotspot-marker:hover .ring {
                animation: pulse 0.8s ease-out infinite !important;
            }
        `;
        document.head.appendChild(style);
        return () => {
            document.head.removeChild(style);
        };
    }, []);

    // 加载高德地图脚本并初始化
    useEffect(() => {
        if (mapRef.current || !mapContainer.current) return;

        const key = process.env.NEXT_PUBLIC_AMAP_KEY;
        if (!key) {
            console.error("NEXT_PUBLIC_AMAP_KEY is not set");
            return;
        }

        const initMap = () => {
            if (!mapContainer.current || mapRef.current) return;

            try {
                const map = new window.AMap.Map(mapContainer.current, {
                    zoom: 2.2,
                    center: [20, 10],
                    resizeEnable: true,
                    mapStyle: 'amap://styles/dark',
                    viewMode: '2D',
                });

                mapRef.current = map;

                map.on('complete', () => {
                    setIsScriptLoaded(true);

                    // 添加数据
                    if (data.features.length > 0) {
                        updateHeatmap(map, data.features);
                        addHotspotMarkers(map, data.features);
                    }
                });
            } catch (error) {
                console.error('地图初始化失败:', error);
            }
        };

        // 检查是否已加载
        if (window.AMap) {
            initMap();
            return;
        }

        // 加载脚本
        const script = document.createElement('script');
        script.src = `https://webapi.amap.com/maps?v=2.0&key=${key}&plugin=AMap.Heatmap,AMap.InfoWindow`;
        script.async = true;
        script.onload = initMap;
        script.onerror = () => console.error("高德地图脚本加载失败");

        document.body.appendChild(script);

        return () => {
            if (mapRef.current) {
                mapRef.current.destroy();
                mapRef.current = null;
            }
            if (heatmapRef.current) {
                heatmapRef.current.setMap(null);
                heatmapRef.current = null;
            }
            clearMarkers();
        };
    }, []);

    // 监听图层可见性变化
    useEffect(() => {
        if (!mapRef.current || !isScriptLoaded) return;
        updateHeatmap(mapRef.current, data.features);
    }, [layers.heatmap, isScriptLoaded]);

    // 监听热点可见性变化
    useEffect(() => {
        if (!mapRef.current || !isScriptLoaded) return;
        addHotspotMarkers(mapRef.current, data.features);
    }, [layers.hotspots, data.features, addHotspotMarkers, isScriptLoaded]);

    // 飞往指定位置
    useEffect(() => {
        if (!mapRef.current || !flyTo || !isScriptLoaded) return;
        mapRef.current.setZoomAndCenter(5, flyTo, true, 1500);
    }, [flyTo, isScriptLoaded]);

    // 数据更新时刷新
    useEffect(() => {
        if (!mapRef.current || !isScriptLoaded) return;
        updateHeatmap(mapRef.current, data.features);
        addHotspotMarkers(mapRef.current, data.features);
    }, [data, isScriptLoaded]);

    return (
        <div
            ref={mapContainer}
            className="w-full h-full"
            style={{ minHeight: "400px", width: "100%", height: "100%" }}
        />
    );
}
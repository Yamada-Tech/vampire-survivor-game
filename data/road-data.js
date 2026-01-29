// ============================================================================
// Preset Route Road Data
// Static road data for preset routes to minimize API calls
// ============================================================================

const ROAD_DATA = {
    // Tokyo: Shibuya to Shinjuku
    'tokyo-shibuya-shinjuku': {
        ways: [
            // Main route along Route 246 and major roads
            // Simplified representation - would contain actual OSM way data
            {
                id: 'way1',
                nodes: [
                    { lat: 35.6580, lon: 139.7016 }, // Shibuya Station
                    { lat: 35.6600, lon: 139.7000 },
                    { lat: 35.6650, lon: 139.6980 },
                    { lat: 35.6700, lon: 139.6960 },
                    { lat: 35.6750, lon: 139.6940 },
                    { lat: 35.6800, lon: 139.6920 },
                    { lat: 35.6850, lon: 139.6915 },
                    { lat: 35.6896, lon: 139.6917 }  // Shinjuku Station
                ]
            }
        ],
        bounds: {
            minLat: 35.6580,
            maxLat: 35.6896,
            minLon: 139.6915,
            maxLon: 139.7016
        }
    },
    
    // Osaka: Umeda to Namba
    'osaka-umeda-namba': {
        ways: [
            {
                id: 'way1',
                nodes: [
                    { lat: 34.7024, lon: 135.4959 }, // Umeda Station
                    { lat: 34.6980, lon: 135.4970 },
                    { lat: 34.6930, lon: 135.4980 },
                    { lat: 34.6880, lon: 135.4990 },
                    { lat: 34.6830, lon: 135.4995 },
                    { lat: 34.6780, lon: 135.5000 },
                    { lat: 34.6730, lon: 135.5005 },
                    { lat: 34.6681, lon: 135.5010 }  // Namba Station
                ]
            }
        ],
        bounds: {
            minLat: 34.6681,
            maxLat: 34.7024,
            minLon: 135.4959,
            maxLon: 135.5010
        }
    },
    
    // Kyoto: Kyoto Station to Kiyomizu Temple
    'kyoto-station-kiyomizu': {
        ways: [
            {
                id: 'way1',
                nodes: [
                    { lat: 34.9851, lon: 135.7589 }, // Kyoto Station
                    { lat: 34.9870, lon: 135.7620 },
                    { lat: 34.9890, lon: 135.7660 },
                    { lat: 34.9910, lon: 135.7710 },
                    { lat: 34.9930, lon: 135.7770 },
                    { lat: 34.9940, lon: 135.7810 },
                    { lat: 34.9949, lon: 135.7850 }  // Kiyomizu Temple
                ]
            }
        ],
        bounds: {
            minLat: 34.9851,
            maxLat: 34.9949,
            minLon: 135.7589,
            maxLon: 135.7850
        }
    },
    
    // Tokyo: Tower to Skytree
    'tokyo-tower-skytree': {
        ways: [
            {
                id: 'way1',
                nodes: [
                    { lat: 35.6586, lon: 139.7454 }, // Tokyo Tower
                    { lat: 35.6650, lon: 139.7500 },
                    { lat: 35.6700, lon: 139.7550 },
                    { lat: 35.6750, lon: 139.7600 },
                    { lat: 35.6800, lon: 139.7650 },
                    { lat: 35.6850, lon: 139.7700 },
                    { lat: 35.6900, lon: 139.7750 },
                    { lat: 35.6950, lon: 139.7800 },
                    { lat: 35.7000, lon: 139.7900 },
                    { lat: 35.7050, lon: 139.8000 },
                    { lat: 35.7101, lon: 139.8107 }  // Skytree
                ]
            }
        ],
        bounds: {
            minLat: 35.6586,
            maxLat: 35.7101,
            minLon: 139.7454,
            maxLon: 139.8107
        }
    },
    
    // Yokohama: Station to Chinatown
    'yokohama-station-chinatown': {
        ways: [
            {
                id: 'way1',
                nodes: [
                    { lat: 35.4657, lon: 139.6220 }, // Yokohama Station
                    { lat: 35.4630, lon: 139.6250 },
                    { lat: 35.4600, lon: 139.6280 },
                    { lat: 35.4570, lon: 139.6310 },
                    { lat: 35.4540, lon: 139.6340 },
                    { lat: 35.4510, lon: 139.6370 },
                    { lat: 35.4480, lon: 139.6400 },
                    { lat: 35.4460, lon: 139.6430 },
                    { lat: 35.4437, lon: 139.6458 }  // Chinatown
                ]
            }
        ],
        bounds: {
            minLat: 35.4437,
            maxLat: 35.4657,
            minLon: 139.6220,
            maxLon: 139.6458
        }
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ROAD_DATA;
}

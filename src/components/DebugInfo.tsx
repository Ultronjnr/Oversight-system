import React from 'react';

const DebugInfo: React.FC = () => {
    const envInfo = {
        NODE_ENV: process.env.NODE_ENV,
        REACT_APP_SUPABASE_URL: process.env.REACT_APP_SUPABASE_URL,
        REACT_APP_API_URL: process.env.REACT_APP_API_URL,
        REACT_APP_VERSION: process.env.REACT_APP_VERSION,
        location: window.location.href,
        userAgent: navigator.userAgent,
    };

    return (
        <div className="fixed bottom-4 right-4 bg-black bg-opacity-75 text-white p-4 rounded text-xs max-w-sm">
            <h3 className="font-bold mb-2">Debug Info</h3>
            <pre className="whitespace-pre-wrap">
                {JSON.stringify(envInfo, null, 2)}
            </pre>
        </div>
    );
};

export default DebugInfo;

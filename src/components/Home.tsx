import React from 'react';

export function Home({ appId }: { appId: string }) {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-8">
      <div className="text-3xl font-bold mb-4">Welcome to {appId.toUpperCase()}</div>
      <div className="text-default-500">Please authenticate to access full functionality.</div>
    </div>
  );
}

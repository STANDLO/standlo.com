import React from 'react';

export function Dashboard({ appId }: { appId: string }) {
  return (
    <div className="w-full h-full flex flex-col p-8">
      <div className="text-3xl font-bold mb-8">Dashboard: {appId.toUpperCase()}</div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="p-6 bg-default-100 rounded-xl">
          <div className="font-semibold mb-2">Recent Activity</div>
          <div className="text-sm text-default-500">No recent activity found.</div>
        </div>
        <div className="p-6 bg-default-100 rounded-xl">
          <div className="font-semibold mb-2">Quick Stats</div>
          <div className="text-sm text-default-500">System is running normally.</div>
        </div>
      </div>
    </div>
  );
}

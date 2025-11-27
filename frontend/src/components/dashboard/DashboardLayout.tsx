import { useState } from "react";
import { Outlet } from "react-router-dom";
import DashboardSidebar from "./DashboardSidebar";
import DashboardHeader from "./DashboardHeader";

const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black">
      {/* Sidebar */}
      <DashboardSidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
      
      {/* Main content */}
      <div 
        className={`flex flex-col ${sidebarOpen ? 'md:ml-64' : 'md:ml-20'} transition-all duration-300`}
      >
        {/* Header */}
        <DashboardHeader toggleSidebar={toggleSidebar} />
        
        {/* Main scrollable content */}
        <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-black">
          {/* Dashboard Content Wrapper - handles header spacing for all pages */}
          <div className="dashboard-content-wrapper pt-10 p-4 md:p-6 min-h-screen">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
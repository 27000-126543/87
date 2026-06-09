import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { ConfigProvider, App as AntdApp } from "antd";
import zhCN from "antd/locale/zh_CN";
import MainLayout from "@/components/layout/MainLayout";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import DataCenterDetail from "@/pages/DataCenterDetail";
import Alerts from "@/pages/Alerts";
import Reports from "@/pages/Reports";
import CapacityPlanning from "@/pages/CapacityPlanning";
import HealthReports from "@/pages/HealthReports";
import Settings from "@/pages/Settings";

const themeConfig = {
  token: {
    colorPrimary: "#00D4FF",
    colorSuccess: "#2ED573",
    colorWarning: "#FFA502",
    colorError: "#FF4757",
    colorInfo: "#00D4FF",
    borderRadius: 8,
    fontFamily: "'Inter', 'PingFang SC', 'Microsoft YaHei', sans-serif",
  },
  components: {
    Card: {
      colorBgContainer: "rgba(15, 30, 54, 0.8)",
      colorBorderSecondary: "rgba(0, 212, 255, 0.1)",
    },
    Modal: {
      colorBgElevated: "rgba(15, 30, 54, 0.95)",
    },
    Table: {
      colorBgContainer: "transparent",
      colorBgElevated: "rgba(15, 30, 54, 0.8)",
      colorBorderSecondary: "rgba(0, 212, 255, 0.1)",
    },
    Select: {
      colorBgContainer: "rgba(15, 30, 54, 0.8)",
      colorBorder: "rgba(0, 212, 255, 0.2)",
    },
    Input: {
      colorBgContainer: "rgba(15, 30, 54, 0.8)",
      colorBorder: "rgba(0, 212, 255, 0.2)",
    },
    InputNumber: {
      colorBgContainer: "rgba(15, 30, 54, 0.8)",
      colorBorder: "rgba(0, 212, 255, 0.2)",
    },
  },
};

export default function App() {
  return (
    <ConfigProvider locale={zhCN} theme={themeConfig}>
      <AntdApp>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<MainLayout />}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="data-center/:id" element={<DataCenterDetail />} />
              <Route path="alerts" element={<Alerts />} />
              <Route path="alerts/:id" element={<Alerts />} />
              <Route path="reports" element={<Reports />} />
              <Route path="capacity" element={<CapacityPlanning />} />
              <Route path="health-reports" element={<HealthReports />} />
              <Route path="settings" element={<Settings />} />
            </Route>
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Router>
      </AntdApp>
    </ConfigProvider>
  );
}

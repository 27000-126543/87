import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Form, Input, Button, Card, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { Zap } from 'lucide-react';
import { useUserStore } from '@/store/userStore';

export default function Login() {
  const [loading, setLoading] = useState(false);
  const { login, isAuthenticated, error, clearError } = useUserStore();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as any)?.from || '/dashboard';

  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  useEffect(() => {
    if (error) {
      message.error(error);
      clearError();
    }
  }, [error, clearError]);

  const onFinish = async (values: { username: string; password: string }) => {
    setLoading(true);
    try {
      const success = await login(values.username, values.password);
      if (success) {
        message.success('登录成功');
        navigate(from, { replace: true });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background-primary grid-bg overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple/10 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-md px-4"
      >
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
            className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-primary-dark mb-4 shadow-lg shadow-primary/20"
          >
            <Zap className="w-10 h-10 text-background-primary" />
          </motion.div>
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-3xl font-bold text-text-primary mb-2 font-display"
          >
            数据中心能效管理系统
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-text-tertiary"
          >
            DC Energy Efficiency Management System
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="glass-card border-border/50">
            <Form
              name="login"
              initialValues={{ username: 'cto', password: 'password123' }}
              onFinish={onFinish}
              size="large"
              className="pt-4"
            >
              <Form.Item
                name="username"
                rules={[{ required: true, message: '请输入用户名' }]}
              >
                <Input
                  prefix={<UserOutlined className="text-text-tertiary" />}
                  placeholder="用户名"
                  className="bg-background-tertiary/50 border-border"
                />
              </Form.Item>

              <Form.Item
                name="password"
                rules={[{ required: true, message: '请输入密码' }]}
              >
                <Input.Password
                  prefix={<LockOutlined className="text-text-tertiary" />}
                  placeholder="密码"
                  className="bg-background-tertiary/50 border-border"
                />
              </Form.Item>

              <Form.Item className="mb-0">
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  block
                  className="h-11 bg-gradient-to-r from-primary to-primary-light border-none hover:opacity-90"
                >
                  登 录
                </Button>
              </Form.Item>
            </Form>

            <div className="mt-6 pt-6 border-t border-border/50">
              <p className="text-xs text-text-tertiary text-center mb-2">
                测试账号（密码均为 password123）：
              </p>
              <div className="grid grid-cols-2 gap-2 text-xs text-text-tertiary">
                <span>cto - 集团管理员</span>
                <span>region_manager_north - 区域经理</span>
                <span>dc_manager_001 - 机房主管</span>
                <span>engineer_001 - 运维工程师</span>
              </div>
            </div>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
}

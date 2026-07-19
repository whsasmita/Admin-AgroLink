
import { Layout, Menu, Button, Avatar, Typography, Space } from 'antd';
import {
    DashboardOutlined,
    DollarCircleOutlined,
    SafetyCertificateOutlined,
    LogoutOutlined,
    UserOutlined,
    HistoryOutlined,
    TeamOutlined,
    BarChartOutlined
} from '@ant-design/icons';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const { Header, Sider, Content } = Layout;
const { Text, Title } = Typography;
import logo from '../assets/Logo.png';

const AdminLayout = () => {
    const { logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation(); // Hook untuk mendapatkan URL saat ini

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    // [PERBAIKAN] Hapus useState dan useEffect.
    // Hitung 'currentKey' secara langsung dari 'location.pathname'.
    // Ini disebut "Derivasi State" (Deriving State).
    const getCurrentKey = () => {
        const path = location.pathname;
        if (path.startsWith('/payouts')) {
            return '2';
        }
        if (path.startsWith('/verifications')) {
            return '3';
        }
        if (path.startsWith('/transactions')) {
            return '4';
        }
        if (path.startsWith('/users')) {
            return '5';
        }
        if (path.startsWith('/revenue')) {
            return '6';
        }
        if (path.startsWith('/profit')) {
            return '7';
        }
        
        return '1'; // Default ke Dashboard ('/')
    };

    const currentKey = getCurrentKey();

    // Menu items untuk sidebar
    const menuItems = [
        {
            key: '1',
            icon: <DashboardOutlined />,
            label: <Link to="/">Dashboard</Link>,
        },
        {
            key: '2',
            icon: <DollarCircleOutlined />,
            label: <Link to="/payouts">Manajemen Payout</Link>,
        },
        {
            key: '3',
            icon: <SafetyCertificateOutlined />,
            label: <Link to="/verifications">Verifikasi Dokumen</Link>,
        },
        {
            key: '4', // [ITEM BARU]
            icon: <HistoryOutlined />,
            label: <Link to="/transactions">Riwayat Transaksi</Link>,
        },
        {
            key: '5', // [ITEM BARU]
            icon: <TeamOutlined />,
            label: <Link to="/users">Manajemen Pengguna</Link>,
        },
        {
            key: '6', // [ITEM BARU]
            icon: <BarChartOutlined />,
            label: <Link to="/revenue">Analisis Transaksi</Link>,
        },
        {
            key: '7', // [ITEM BARU]
            icon: <DollarCircleOutlined />,
            label: <Link to="/profit">Keuntungan Platform</Link>,
        },
    ];

    return (
        <Layout style={{ minHeight: '100vh' }}>
            <Sider collapsible>
                <div style={{
                    height: '64px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '16px'
                }}>
                    <img
                        src={logo}
                        alt="AgroLink Logo"
                        style={{
                            height: '32px', // Sesuaikan tinggi logo
                            width: 'auto'    // Lebar akan menyesuaikan
                        }}
                    />
                </div>

                {/* [PERBAIKAN] Menu sekarang dinamis menggunakan variabel yang dihitung */}
                <Menu theme="dark" selectedKeys={[currentKey]} mode="inline" items={menuItems} />
            </Sider>

            <Layout style={{ background: '#f0f2f5' }}>
                <Header style={{ padding: '0 24px', background: '#fff', display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                    <Space size="middle">
                        <Space>
                            <Avatar icon={<UserOutlined />} />
                            <Text strong>Admin</Text>
                        </Space>
                        <Button
                            type="primary"
                            icon={<LogoutOutlined />}
                            onClick={handleLogout}
                            danger
                        >
                            Logout
                        </Button>
                    </Space>
                </Header>

                <Content style={{ margin: '24px 16px', padding: 24, minHeight: 280, background: '#fff', borderRadius: 8 }}>
                    <Outlet />
                </Content>
            </Layout>
        </Layout>
    );
};

export default AdminLayout;
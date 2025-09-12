import { MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons';
import { UserButton } from '@clerk/clerk-react';
import { Button, Drawer, Layout, Menu, theme } from 'antd';
import { useEffect, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';

import StorageInfoPopover from '@/components/FileManagement/StorageInfoPopover';
import UploadStatusButton from '@/components/Upload/UploadStatusButton';
import { getMenuItems, getSelectedKeys } from '@/lib/menu';
import { withAuth } from '@/lib/withAuth';
import router from '@/routes';

const { Header, Sider, Content, Footer } = Layout;

function BenchLayout() {
  // 侧边栏折叠状态
  const [collapsed, setCollapsed] = useState(false);
  // 抽屉可见状态
  const [drawerOpen, setDrawerOpen] = useState(false);
  // 屏幕尺寸
  const [screenSize, setScreenSize] = useState<'large' | 'medium' | 'small'>('large');

  const location = useLocation();
  const navigate = useNavigate();
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  // 获取菜单项
  const menuItems = getMenuItems(router.routes);

  // 获取当前选中的菜单项
  const selectedKeys = getSelectedKeys(location.pathname);

  // 菜单点击事件处理
  const handleMenuClick = (info: { key: string }) => {
    navigate(`/bench/${info.key}`);
    // 如果是在抽屉中点击菜单项，则关闭抽屉
    if (screenSize === 'small') {
      setDrawerOpen(false);
    }
  };

  // 响应式处理 - 监听窗口大小变化
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;

      // 判断屏幕尺寸
      if (width < 576) {
        // 很小的屏幕：使用抽屉组件
        setScreenSize('small');
        setCollapsed(true); // 确保侧边栏收起
      } else if (width < 992) {
        // 较小的屏幕：侧边栏默认收起（但显示图标）
        setScreenSize('medium');
        setCollapsed(true);
      } else {
        // 正常屏幕：侧边栏默认展开
        setScreenSize('large');
        setCollapsed(false);
      }
    };

    // 初始检查
    handleResize();

    // 添加监听
    window.addEventListener('resize', handleResize);

    // 清理监听
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <Layout className="!min-h-screen">
      {/* 在小屏幕时隐藏侧边栏，显示抽屉 */}
      {screenSize !== 'small' && (
        <Sider
          trigger={null}
          collapsible
          collapsed={collapsed}
          // 设置收起时的宽度，默认为图标模式宽度
          collapsedWidth={80}
          width={200}
        >
          <Link to={'/'}>
            <div className="demo-logo-vertical h-8 mx-4 my-4 bg-white/20 rounded-md flex items-center justify-center text-white">
              {collapsed ? '云匣' : '云匣 YunXia'}
            </div>
          </Link>
          <Menu
            theme="dark"
            mode="inline"
            selectedKeys={selectedKeys}
            onClick={handleMenuClick}
            items={menuItems}
          />
        </Sider>
      )}

      {/* 小屏幕时使用抽屉组件 */}
      <Drawer
        placement="left"
        closable={false}
        onClose={() => setDrawerOpen(false)}
        open={screenSize === 'small' && drawerOpen}
        styles={{
          body: { padding: 0, background: '#001529' },
        }}
        width={200}
      >
        <Link to={'/'}>
          <div className="demo-logo-vertical h-8 mx-4 my-4 bg-white/20 rounded-md flex items-center justify-center text-white cursor-pointer">
            云匣 YunXia
          </div>
        </Link>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={selectedKeys}
          onClick={handleMenuClick}
          items={menuItems}
        />
      </Drawer>

      <Layout>
        <Header
          className="!p-0 flex items-center justify-between shadow-sm"
          style={{ background: colorBgContainer }}
        >
          {/* 根据屏幕大小显示不同的按钮行为 */}
          <Button
            type="text"
            icon={
              screenSize === 'small' ? (
                <MenuUnfoldOutlined />
              ) : collapsed ? (
                <MenuUnfoldOutlined />
              ) : (
                <MenuFoldOutlined />
              )
            }
            onClick={() => {
              if (screenSize === 'small') {
                setDrawerOpen(true);
              } else {
                setCollapsed(!collapsed);
              }
            }}
            className="text-base !w-10 !h-10 ml-6 hover:bg-gray-100"
          />
          <div className="mr-4 flex items-center space-x-3">
            <StorageInfoPopover />
            <UploadStatusButton />
            <UserButton showName />
          </div>
        </Header>
        <Content
          className="mx-4 mt-6 mb-2 p-6 min-h-[280px] shadow-sm"
          style={{
            background: colorBgContainer,
            borderRadius: borderRadiusLG,
          }}
        >
          <Outlet />
        </Content>
        <Footer className="text-center text-gray-500 text-sm !py-2">
          Yunxia ©{new Date().getFullYear()} Created by HealWrap
        </Footer>
      </Layout>
    </Layout>
  );
}

const withAuthPage = withAuth(BenchLayout);
export default withAuthPage;

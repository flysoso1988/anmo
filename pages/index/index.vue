<template>
  <view class="app">
    <!-- 自定义导航栏 -->
    <wd-navbar title="首页" fixed placeholder safe-area-inset-top bordered @click-left="sidebarShow = true">
      <template #left>
        <view class="hamburger">
          <view class="hamburger-line"></view>
          <view class="hamburger-line"></view>
          <view class="hamburger-line"></view>
        </view>
      </template>
    </wd-navbar>
    <view style="height: 24rpx"></view>
    <!-- 今日营收 Hero -->
    <wd-card title="今日实时营收">
      <view class="revenue-hero">
        <view class="hero-amount">
          <text class="currency">¥</text>
          <text>{{ vk.pubfn.priceFilter(revenue.today, { format: 'thousandSeparator' }) }}</text>
        </view>
        <view class="hero-change" :class="revenue.change >= 0 ? 'up' : 'down'">
          <wd-icon :name="revenue.change >= 0 ? 'arrow-up' : 'arrow-down'" size="12px" :color="revenue.change >= 0 ? '#3d8c40' : '#b33a3a'"></wd-icon>
          <text>较昨日 {{ revenue.change >= 0 ? '+' : '' }}{{ revenue.change }}%</text>
        </view>
      </view>
      <template #footer>
        <view class="hero-meta">
          <view class="meta-item">
            <text class="meta-val">{{ revenue.orders }}</text>
            <text class="meta-label">今日订单</text>
          </view>
          <view class="meta-item">
            <text class="meta-val">{{ revenue.visitors }}</text>
            <text class="meta-label">客流人次</text>
          </view>
          <view class="meta-item">
            <text class="meta-val">{{ revenue.newMembers }}</text>
            <text class="meta-label">新增会员</text>
          </view>
        </view>
      </template>
    </wd-card>

    <!-- 房间列表 -->
    <wd-card title="房间">
      <view class="room-grid" v-if="roomList.length > 0">
        <room-card v-for="item in roomList" :key="item._id" :room="item" @click="onRoomClick" />
      </view>
      <view v-else class="empty-tip">暂无房间</view>
    </wd-card>

    <!-- 技师列表 -->
    <wd-card title="技师">
      <scroll-view scroll-x class="staff-scroll" v-if="staffList.length > 0">
        <view class="staff-grid">
          <view v-for="item in staffList" :key="item._id" class="staff-item">
            <wd-avatar :src="item.avatar" :text="item.name[0]"></wd-avatar>
            <view class="status-dot" :class="item.status === 1 ? 'busy' : 'idle'"></view>
          </view>
        </view>
      </scroll-view>
      <view v-else class="empty-tip">暂无技师</view>
    </wd-card>

    <!-- 侧边栏 -->
    <wd-popup v-model="sidebarShow" position="left" :modal="true" custom-style="width: 520rpx; height: 100%; background: #fff;">
      <view class="sidebar">
        <view class="sidebar-header">
          <text class="sidebar-title">足疗管理</text>
        </view>
        <view class="sidebar-menu">
          <view class="sidebar-item" @click="sidebarTo('/pages/index/index')">
            <text class="sidebar-item-text">首页</text>
          </view>
          <view class="sidebar-item" @click="sidebarTo('/pages/record/list')">
            <text class="sidebar-item-text">上钟记录</text>
          </view>
          <view class="sidebar-item" @click="sidebarTo('/pages/record/add')">
            <text class="sidebar-item-text">上钟</text>
          </view>
        </view>
      </view>
    </wd-popup>
  </view>
</template>

<script>
  import roomCard from './components/room-card.vue';

  let vk = uni.vk;
  export default {
    components: { roomCard },
    data() {
      return {
        sidebarShow: false,
        revenue: {
          today: 0,
          change: 0,
          orders: 0,
          visitors: 0,
          newMembers: 0,
        },
        roomList: [],
        staffList: [],
        scrollTop: 0,
      };
    },
    onPullDownRefresh() {
      this.toLoadData();
      uni.stopPullDownRefresh();
    },
    onLoad(options = {}) {
      vk = uni.vk;
      this.options = options;
      this.init(options);
    },
    methods: {
      init(options = {}) {
        console.log('init: ', options);
        this.toLoadData();
      },
      toLoadData() {
        vk.callFunction({
          url: 'client/home.getHome',
          success: (res) => {
            this.roomList = res.roomList || [];
            this.staffList = res.staffList || [];
            this.revenue = res.revenue;
          },
        });
      },
      async onRoomClick(room) {
        const { _id: room_id, name, status, record_id } = room;
        console.log(room);
        if (status === 0) {
          vk.navigateTo(`/pages/record/add?room_id=${room_id}&room_name=${encodeURIComponent(name)}`);
        } else {
          vk.navigateTo(`/pages/record/detail?id=${record_id}`);
          // vk.callFunction({
          //   url: 'client/record.getActiveByRoom',
          //   data: { room_id: room._id },
          //   success: (res) => {
          //     const { _id: record_id } = res.data;
          //     vk.navigateTo(`/pages/record/detail?id=${record_id}`);
          //   },
          // });
        }
      },
      sidebarTo(url) {
        this.sidebarShow = false;
        vk.navigateTo(url);
      },
    },
    watch: {},
    computed: {},
  };
</script>
<style lang="scss" scoped>
  .app {
    min-height: 100vh;
    background-color: #f5f5f5;
  }

  /* 汉堡菜单 */
  .hamburger {
    display: flex;
    flex-direction: column;
    gap: 8rpx;
  }
  .hamburger-line {
    width: 36rpx;
    height: 4rpx;
    background: #333;
    border-radius: 2rpx;
  }

  /* 侧边栏 */
  .sidebar {
    display: flex;
    flex-direction: column;
    height: 100%;
  }
  .sidebar-header {
    padding: 80rpx 40rpx 40rpx;
    border-bottom: 1rpx solid #e2e4e8;
  }
  .sidebar-title {
    font-size: 36rpx;
    font-weight: 700;
    color: #2a2d33;
  }
  .sidebar-menu {
    flex: 1;
    padding: 20rpx 0;
  }
  .sidebar-item {
    padding: 28rpx 40rpx;
    border-bottom: 1rpx solid #f5f5f5;
  }
  .sidebar-item-text {
    font-size: 30rpx;
    color: #2a2d33;
  }

  /* 内容 */
  .content {
    padding: 32rpx;
    padding-bottom: 40rpx;
  }

  /* 营收 */
  .revenue-hero {
    position: relative;
  }
  .hero-amount {
    font-size: 36px;
    font-weight: 700;
    font-family: 'JetBrains Mono', 'SF Mono', Consolas, monospace;
    color: #dc3545;
    line-height: 1;
    margin-bottom: 4px;
  }
  .hero-amount .currency {
    font-size: 18px;
    font-weight: 500;
    margin-right: 2px;
  }
  .hero-change {
    font-size: 12px;
    display: flex;
    align-items: center;
    gap: 4px;
  }
  .hero-change.up {
    color: #3d8c40;
  }
  .hero-change.down {
    color: #b33a3a;
  }
  .hero-meta {
    display: flex;
    justify-content: space-between;
    padding-top: 12px;
    border-top: 1px solid #e2e4e8;
  }
  .meta-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
  }
  .meta-val {
    font-size: 22px;
    font-weight: 700;
    font-family: 'JetBrains Mono', 'SF Mono', Consolas, monospace;
  }
  .meta-label {
    font-size: 11px;
    color: #999999;
  }

  /* 房间 */
  .room-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12rpx;
    padding-bottom: 24rpx;
  }

  /* 技师 */
  .staff-scroll {
    white-space: nowrap;
  }
  .staff-grid {
    display: inline-flex;
    gap: 20rpx;
    padding-bottom: 32rpx;
  }
  .staff-item {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .staff-avatar {
    width: 90rpx;
    height: 90rpx;
    border-radius: 12rpx;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #f0f0f0;
  }
  .avatar-img {
    width: 100%;
    height: 100%;
  }
  .avatar-text {
    font-size: 36rpx;
    color: #666;
    font-weight: 500;
  }
  .status-dot {
    position: absolute;
    bottom: 0;
    right: 0;
    width: 20rpx;
    height: 20rpx;
    border-radius: 50%;
    border: 4rpx solid #fff;
    &.busy {
      background-color: #ff4d4f;
    }
    &.idle {
      background-color: #52c41a;
    }
  }

  .empty-tip {
    width: 100%;
    text-align: center;
    padding: 40rpx 0;
    font-size: 28rpx;
    color: #999;
  }
</style>

<template>
  <view class="app">
    <!-- 页面内容开始 -->

    <!-- 今日营收 Hero -->
    <wd-card title="今日实时营收">
      <view class="revenue-hero">
        <view class="hero-amount"> <text class="currency">¥</text>{{ formatMoney(revenue.today) }} </view>
        <view class="hero-change" :class="revenue.change >= 0 ? 'up' : 'down'">
          <wd-icon :name="revenue.change >= 0 ? 'arrow-up' : 'arrow-down'" size="12px" :color="revenue.change >= 0 ? '#3d8c40' : '#b33a3a'"></wd-icon>
          较昨日 {{ revenue.change >= 0 ? '+' : '' }}{{ revenue.change }}%
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
        <view v-for="item in roomList" :key="item._id" class="room-card" :class="'status-' + item.status" @click="onRoomClick(item)">
          <text class="room-name">{{ item.name }}</text>
          <template v-if="item.status === 1">
            <text class="room-tech">{{ item.technician || '技师' }}</text>
            <text class="room-endtime">{{ item.end_time || '--:--' }}</text>
          </template>
        </view>
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

    <!-- 页面内容结束 -->
  </view>
</template>

<script>
  let vk = uni.vk;
  export default {
    data() {
      return {
        revenue: {
          today: 28650,
          change: 12.5,
          orders: 42,
          visitors: 68,
          newMembers: 5,
        },
        roomList: [],
        staffList: [],
        roomStatusText: {
          0: '空闲',
          1: '忙碌',
          2: '维护',
        },
        roomTagType: {
          0: 'success',
          1: 'warning',
          2: 'info',
        },
        staffStatusText: {
          0: '空闲',
          1: '上钟',
          2: '休假',
        },
        staffTagType: {
          0: 'success',
          1: 'warning',
          2: 'info',
        },
        scrollTop: 0,
      };
    },
    onPullDownRefresh() {
      vk.callFunction({
        url: 'client/select.getHomeList',
        success: (res) => {
          this.roomList = res.roomList;
          this.staffList = res.staffList;
          uni.stopPullDownRefresh();
        },
      });
    },
    onLoad(options = {}) {
      vk = uni.vk;
      this.options = options;
      this.init(options);
    },
    methods: {
      formatMoney(val) {
        return Number(val)
          .toFixed(0)
          .replace(/\B(?=(\d{3})+(?!\d))/g, ',');
      },
      init(options = {}) {
        console.log('init: ', options);
        this.toLoadData();
      },
      toLoadData() {
        vk.callFunction({
          url: 'client/select.getHomeList',
          title: '加载中',
          success: (res) => {
            this.roomList = res.roomList;
            this.staffList = res.staffList;
          },
        });
      },
      async onRoomClick(room) {
        const { _id: room_id, name, status } = room;

        if (status === 0) {
          vk.navigateTo(`/pages/record/add?room_id=${room_id}&room_name=${encodeURIComponent(name)}`);
        } else {
          vk.callFunction({
            url: 'client/record.getActiveByRoom',
            data: { room_id: room._id },
            success: (res) => {
              const { _id: record_id } = res.data;
              vk.navigateTo(`/pages/record/detail?id=${record_id}`);
            },
          });
        }
      },
    },
    watch: {},
    computed: {},
  };
</script>
<style lang="scss" scoped>
  /* ====== 营收 Hero 卡片 ====== */
  .revenue-hero {
    position: relative;
  }

  .revenue-hero::before {
    content: '';
    position: absolute;
    top: -50%;
    right: -30%;
    width: 200px;
    height: 200px;
    background: radial-gradient(circle, rgba(184, 148, 74, 0.08) 0%, transparent 70%);
    pointer-events: none;
  }

  .hero-amount {
    font-size: 36px;
    font-weight: 700;
    font-family: 'JetBrains Mono', 'SF Mono', Consolas, monospace;
    color: #b8944a;
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
    border-top: 1px solid rgba(184, 148, 74, 0.25);
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

  .app {
    min-height: 100vh;
    background-color: #f5f5f5;
  }

  .room-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12rpx;
    padding-bottom: 24rpx;
  }

  .room-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 4rpx;
    border-radius: 16rpx;
    padding: 24rpx 8rpx;
    border: 2rpx solid;
    transition: all 0.2s;
    width: 200rpx;
    height: 200rpx;
    justify-self: center;
    box-sizing: border-box;

    &.status-0 {
      background-color: #f0faf0;
      border-color: #b7eb8f;
    }

    &.status-1 {
      background-color: #fff2f0;
      border-color: #ffa39e;
    }

    &.status-2 {
      background-color: #fafafa;
      border-color: #d9d9d9;
    }
  }

  .room-name {
    font-size: 30rpx;
    font-weight: 700;
    color: #333;
  }

  .room-tech {
    font-size: 22rpx;
    color: #666;
  }

  .room-endtime {
    font-size: 20rpx;
    color: #999;
  }

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

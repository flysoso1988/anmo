<template>
  <view class="container">
    <!-- 房间列表 -->
    <view class="section">
      <view class="section-title">房间</view>
      <view class="card-wrap">
        <view v-for="item in roomList" :key="item._id" class="room-card" :class="'status-' + item.status" @click="onRoomClick(item)">
          <view class="room-tag">{{ roomStatusText[item.status] }}</view>
          <view class="room-name">{{ item.name }}</view>
          <view class="room-badge" v-if="item.type === 1">VIP</view>
        </view>
        <view v-if="roomList.length === 0" class="empty">暂无房间</view>
      </view>
    </view>

    <!-- 技师列表 -->
    <view class="section">
      <view class="section-title">技师</view>
      <view class="staff-list">
        <view v-for="item in staffList" :key="item._id" class="staff-item">
          <view class="staff-avatar" :class="'status-' + item.status">
            <image v-if="item.avatar" :src="item.avatar" mode="aspectFill" class="avatar-img" />
            <text v-else class="avatar-text">{{ item.name[0] }}</text>
          </view>
          <view class="staff-name">{{ item.name }}</view>
        </view>
        <view v-if="staffList.length === 0" class="empty">暂无技师</view>
      </view>
    </view>
  </view>
</template>

<script>
let vk = uni.vk;
export default {
  data() {
    return {
      roomList: [],
      staffList: [],
      roomStatusText: {
        0: '空闲',
        1: '使用中',
        2: '维护',
      },
      staffStatusText: {
        0: '空闲',
        1: '上钟',
        2: '休假',
      },
    };
  },
  onLoad(options = {}) {
    vk = uni.vk;
    this.options = options;
  },
  onShow() {
    this.loadData();
  },
  methods: {
    async onRoomClick(room) {
      if (room.status === 0) {
        // 空闲房间 → 添加记录页面，预选房间
        vk.navigateTo(`/pages/record/add?room_id=${room._id}&room_name=${encodeURIComponent(room.name)}`);
      } else if (room.status === 1) {
        // 使用中 → 获取进行中的记录详情
        uni.showLoading({ title: '加载中' });
        let res = await vk.callFunction({
          url: 'client/record.getActiveByRoom',
          data: { room_id: room._id },
        });
        uni.hideLoading();
        if (res.code === 0) {
          vk.navigateTo(`/pages/record/detail?id=${res.data._id}`);
        } else {
          vk.toast(res.msg, 'none');
        }
      }
    },
    async loadData() {
      let res = await vk.callFunction({ url: 'client/select.getHomeList' });
      if (res.code === 0) {
        this.roomList = res.roomList;
        this.staffList = res.staffList;
      }
    },
  },
};
</script>

<style lang="scss" scoped>
.container {
  min-height: 100vh;
  background-color: #f5f5f5;
  padding: 20rpx;
}

.section {
  margin-bottom: 20rpx;
  background-color: #fff;
  border-radius: 16rpx;
  padding: 24rpx;
}

.section-title {
  font-size: 28rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 20rpx;
}

.card-wrap {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}

.staff-list {
  display: flex;
  flex-wrap: wrap;
  gap: 24rpx;
}

.staff-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
  width: 100rpx;
}

.staff-avatar {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f0f0f0;

  &.status-0 {
    background-color: #e8f5e9;
  }

  &.status-1 {
    background-color: #fff3e0;
  }

  &.status-2 {
    background-color: #f5f5f5;
  }
}

.avatar-img {
  width: 100%;
  height: 100%;
}

.avatar-text {
  font-size: 32rpx;
  color: #666;
  font-weight: 500;
}

.staff-name {
  font-size: 24rpx;
  color: #333;
  text-align: center;
}

.empty {
  width: 100%;
  text-align: center;
  padding: 30rpx 0;
  font-size: 26rpx;
  color: #999;
}

.room-card {
  width: 140rpx;
  height: 140rpx;
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: #f5f5f5;
  border-radius: 12rpx;

  &.status-0 {
    background-color: #f0faf0;
  }

  &.status-1 {
    background-color: #fff8f0;
  }

  &.status-2 {
    background-color: #f5f5f5;
  }
}

.room-tag {
  position: absolute;
  top: 0;
  left: 0;
  font-size: 16rpx;
  padding: 4rpx 10rpx;
  border-radius: 12rpx 0 12rpx 0;
  color: #fff;

  .status-0 & {
    background-color: #4caf50;
  }

  .status-1 & {
    background-color: #ff9800;
  }

  .status-2 & {
    background-color: #999;
  }
}

.room-name {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
}

.room-badge {
  font-size: 18rpx;
  color: #ff6b6b;
  background-color: #ffe0e0;
  padding: 2rpx 8rpx;
  border-radius: 4rpx;
  margin-top: 4rpx;
}
</style>

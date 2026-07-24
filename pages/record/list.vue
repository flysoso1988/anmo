<template>
  <view class="container">
    <!-- 状态筛选 -->
    <view class="filter-bar">
      <view
        v-for="tab in tabs"
        :key="tab.value"
        class="tab-item"
        :class="{ active: currentTab === tab.value }"
        @click="switchTab(tab.value)"
      >
        {{ tab.label }}
      </view>
    </view>

    <!-- 记录列表 -->
    <scroll-view scroll-y class="record-list" @scrolltolower="loadMore">
      <view v-if="list.length > 0">
        <view v-for="item in list" :key="item._id" class="record-item" @click="goDetail(item._id)">
          <view class="record-header">
            <view class="record-status" :class="'status-' + item.status">
              {{ statusText[item.status] }}
            </view>
            <view class="record-time">{{ formatTime(item._add_time) }}</view>
          </view>
          <view class="record-body">
            <view class="record-row">
              <text class="record-label">技师</text>
              <text class="record-value">{{ item.staff_name }}</text>
            </view>
            <view class="record-row">
              <text class="record-label">房间</text>
              <text class="record-value">{{ item.room_name }}</text>
            </view>
            <view class="record-row">
              <text class="record-label">项目</text>
              <text class="record-value">{{ item.service_name }}</text>
            </view>
            <view class="record-row">
              <text class="record-label">时长</text>
              <text class="record-value">{{ item.duration }}分钟</text>
            </view>
          </view>
          <view class="record-footer">
            <view class="record-price">¥{{ item.price }}</view>
          </view>
        </view>
      </view>
      <view v-else class="empty-tip">
        <text>暂无记录</text>
      </view>
      <view v-if="loading" class="loading-tip">加载中...</view>
      <view v-if="noMore && list.length > 0" class="no-more">没有更多了</view>
    </scroll-view>
  </view>
</template>

<script>
let vk = uni.vk;
export default {
  data() {
    return {
      tabs: [
        { label: '全部', value: -1 },
        { label: '进行中', value: 0 },
        { label: '已完成', value: 1 },
        { label: '已取消', value: 2 },
      ],
      currentTab: -1,
      list: [],
      page: 1,
      pageSize: 20,
      loading: false,
      noMore: false,
      statusText: {
        0: '进行中',
        1: '已完成',
        2: '已取消',
      },
    };
  },
  onLoad(options) {
    vk = uni.vk;
    this.loadList();
  },
  onPullDownRefresh() {
    this.refresh();
    uni.stopPullDownRefresh();
  },
  methods: {
    // 切换标签
    switchTab(value) {
      if (this.currentTab === value) return;
      this.currentTab = value;
      this.refresh();
    },
    // 刷新
    refresh() {
      this.page = 1;
      this.noMore = false;
      this.list = [];
      this.loadList();
    },
    // 加载列表
    async loadList() {
      if (this.loading || this.noMore) return;
      this.loading = true;
      try {
        let data = {
          page: this.page,
          pageSize: this.pageSize,
        };
        if (this.currentTab !== -1) {
          data.status = this.currentTab;
        }
        let res = await vk.callFunction({
          url: 'client/record.getList',
          data,
        });
        if (res.code === 0) {
          this.list = [...this.list, ...res.list];
          if (res.list.length < this.pageSize) {
            this.noMore = true;
          }
          this.page++;
        }
      } catch (e) {
        console.error(e);
      } finally {
        this.loading = false;
      }
    },
    // 加载更多
    loadMore() {
      this.loadList();
    },
    // 跳转详情
    goDetail(id) {
      vk.navigateTo(`/pages/record/detail?id=${id}`);
    },
    // 格式化时间
    formatTime(timestamp) {
      if (!timestamp) return '';
      let date = new Date(timestamp);
      let month = (date.getMonth() + 1).toString().padStart(2, '0');
      let day = date.getDate().toString().padStart(2, '0');
      let hour = date.getHours().toString().padStart(2, '0');
      let minute = date.getMinutes().toString().padStart(2, '0');
      return `${month}-${day} ${hour}:${minute}`;
    },
  },
};
</script>

<style lang="scss" scoped>
.container {
  min-height: 100vh;
  background-color: #f5f5f5;
  display: flex;
  flex-direction: column;
}

.filter-bar {
  display: flex;
  background-color: #fff;
  padding: 20rpx 30rpx;
  border-bottom: 1rpx solid #eee;
}

.tab-item {
  flex: 1;
  text-align: center;
  padding: 16rpx 0;
  font-size: 28rpx;
  color: #666;
  position: relative;

  &.active {
    color: #ff6b6b;
    font-weight: bold;

    &::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 50%;
      transform: translateX(-50%);
      width: 40rpx;
      height: 4rpx;
      background-color: #ff6b6b;
      border-radius: 2rpx;
    }
  }
}

.record-list {
  flex: 1;
  padding: 20rpx 30rpx;
}

.record-item {
  background-color: #fff;
  border-radius: 16rpx;
  margin-bottom: 20rpx;
  overflow: hidden;

  &:active {
    background-color: #f9f9f9;
  }
}

.record-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx 24rpx;
  border-bottom: 1rpx solid #f5f5f5;
}

.record-status {
  font-size: 24rpx;
  padding: 4rpx 16rpx;
  border-radius: 8rpx;

  &.status-0 {
    background-color: #fff3e0;
    color: #ff9800;
  }

  &.status-1 {
    background-color: #e8f5e9;
    color: #4caf50;
  }

  &.status-2 {
    background-color: #f5f5f5;
    color: #999;
  }
}

.record-time {
  font-size: 24rpx;
  color: #999;
}

.record-body {
  padding: 20rpx 24rpx;
}

.record-row {
  display: flex;
  margin-bottom: 12rpx;

  &:last-child {
    margin-bottom: 0;
  }
}

.record-label {
  font-size: 26rpx;
  color: #999;
  width: 80rpx;
}

.record-value {
  font-size: 26rpx;
  color: #333;
  flex: 1;
}

.record-footer {
  display: flex;
  justify-content: flex-end;
  padding: 16rpx 24rpx;
  border-top: 1rpx solid #f5f5f5;
}

.record-price {
  font-size: 36rpx;
  font-weight: bold;
  color: #ff6b6b;
}

.empty-tip {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 100rpx 0;
  font-size: 28rpx;
  color: #999;
}

.loading-tip,
.no-more {
  text-align: center;
  padding: 30rpx 0;
  font-size: 24rpx;
  color: #999;
}
</style>

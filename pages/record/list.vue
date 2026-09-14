<template>
  <view class="app">
    <!-- 页面内容开始 -->

    <!-- 状态筛选 -->
    <wd-tabs v-model="currentTab" @change="switchTab" sticky>
      <wd-tab
        v-for="tab in tabs"
        :key="tab.value"
        :title="tab.label"
        :name="tab.value"
      />
    </wd-tabs>

    <!-- 记录列表 -->
    <scroll-view scroll-y class="record-list" @scrolltolower="loadMore">
      <view v-if="list.length > 0">
        <wd-card
          v-for="item in list"
          :key="item._id"
          @click="goDetail(item._id)"
        >
          <template #title>
            <view class="record-header">
              <view class="record-status">
                <wd-tag :type="statusType[item.status]" round>
                  {{ statusText[item.status] }}
                </wd-tag>
              </view>
              <view class="record-time">{{ formatTime(item._add_time) }}</view>
            </view>
          </template>

          <wd-cell-group border>
            <wd-cell title="技师" :value="item.staff_name" />
            <wd-cell title="房间" :value="item.room_name" />
            <wd-cell title="项目" :value="item.service_name" />
            <wd-cell title="时长" :value="item.duration + '分钟'" />
          </wd-cell-group>

          <template #footer>
            <view class="record-footer">
              <view class="record-price">¥{{ vk.pubfn.priceFilter(item.price, { format: 'thousandSeparator' }) }}</view>
            </view>
          </template>
        </wd-card>
      </view>
      <view v-else class="empty-tip">
        <text>暂无记录</text>
      </view>
      <view v-if="loading" class="loading-tip">加载中...</view>
      <view v-if="noMore && list.length > 0" class="no-more">没有更多了</view>
    </scroll-view>

    <!-- 页面内容结束 -->
  </view>
</template>

<script>
  let vk = uni.vk;
  export default {
    data() {
      return {
        tabs: [
          { label: '全部', value: 'all' },
          { label: '进行中', value: 0 },
          { label: '已完成', value: 1 },
          { label: '已支付', value: 2 },
          { label: '已取消', value: -1 },
        ],
        currentTab: 'all',
        list: [],
        page: 1,
        pageSize: 20,
        loading: false,
        noMore: false,
        statusText: {
          0: '进行中',
          1: '已完成',
          2: '已支付',
          '-1': '已取消',
        },
        statusType: {
          0: 'warning',
          1: 'success',
          2: 'primary',
          '-1': 'info',
        },
        scrollTop: 0,
      };
    },
    onPageScroll(e) {
      this.scrollTop = e.scrollTop;
    },
    onLoad(options) {
      vk = uni.vk;
      this.init(options);
    },
    onReady() {},
    onShow() {},
    onHide() {},
    onUnload() {},
    onPullDownRefresh() {
      this.refresh();
      uni.stopPullDownRefresh();
    },
    onShareAppMessage(options) {},
    methods: {
      init(options = {}) {
        console.log('init: ', options);
        this.loadList();
      },
      // 切换标签
      switchTab({ value }) {
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
          if (this.currentTab !== 'all') {
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
      formatTime(timestamp) {
        if (!timestamp) return '';
        return vk.pubfn.timeFormat(timestamp, 'MM-dd hh:mm');
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
    display: flex;
    flex-direction: column;
  }

  .record-list {
    flex: 1;
    padding: 20rpx 30rpx;
  }

  .record-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .record-time {
    font-size: 24rpx;
    color: #999;
  }

  .record-footer {
    display: flex;
    justify-content: flex-end;
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
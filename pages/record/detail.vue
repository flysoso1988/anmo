<template>
  <view class="app">
    <!-- 状态卡片 -->
    <view class="status-card">
      <view class="status-top">
        <view class="status-badge" :class="statusClass">
          <view class="dot"></view>
          <text class="badge-text">{{ statusText[detail.status] }}</text>
        </view>
        <view class="order-id">#{{ detail.order_no || detail._id }}</view>
      </view>
      <view class="service-highlight">
        <view class="service-info">
          <view class="service-name">{{ detail.service_name }}</view>
          <view class="service-duration">
            <text class="duration-text">{{ detail.duration }} 分钟</text>
          </view>
        </view>
        <view class="service-price">
          <text class="currency">¥</text>
          <text class="price-value">{{ vk.pubfn.priceFilter(detail.price) }}</text>
        </view>
      </view>
    </view>

    <!-- 技师卡片 -->
    <view class="tech-card" v-if="detail.staff_name">
      <view class="tech-avatar">{{ detail.staff_name ? detail.staff_name.charAt(0) : '?' }}</view>
      <view class="tech-info">
        <view class="tech-name">{{ detail.staff_name }}</view>
        <view class="tech-role">技师</view>
      </view>
      <view class="tech-badge" v-if="detail.status === 0">在岗</view>
    </view>

    <!-- 信息卡片 -->
    <view class="info-card">
      <view class="info-row">
        <view class="info-label">房间</view>
        <view class="info-value">
          <view class="room-tile">
            <text class="room-number">{{ detail.room_name }}</text>
          </view>
        </view>
      </view>
      <view class="info-row">
        <view class="info-label">日期</view>
        <view class="info-value">{{ formatDate(detail.start_time) }}</view>
      </view>
      <view class="info-row" v-if="detail.customer_name">
        <view class="info-label">顾客</view>
        <view class="info-value">{{ detail.customer_name }}</view>
      </view>
      <view class="info-row" v-if="detail.customer_phone">
        <view class="info-label">手机号</view>
        <view class="info-value">{{ detail.customer_phone }}</view>
      </view>
      <view class="info-row" v-if="detail.remark">
        <view class="info-label">备注</view>
        <view class="info-value">{{ detail.remark }}</view>
      </view>
    </view>

    <!-- 剩余时间 -->
    <view class="elapsed-bar" v-if="detail.status === 0 && detail.start_time">
      <view class="elapsed-left">
        <text class="elapsed-label">剩余时间</text>
        <wd-count-down
          ref="countDown"
          :time="remainingTime"
          format="HH:mm:ss"
          :auto-start="true"
          @change="onCountDownChange"
          @finish="onCountDownFinish"
        />
      </view>
      <view class="elapsed-progress">
        <wd-circle v-model="progressPct" :size="56" :stroke-width="4" color="#1a9a6c" layer-color="#e2e4e8">
          <template #default>
            <text class="pct">{{ progressPct }}%</text>
          </template>
        </wd-circle>
      </view>
    </view>

    <!-- 时间记录 -->
    <view class="info-card timeline-card">
      <view class="timeline-title">时间记录</view>
      <view class="timeline">
        <view class="timeline-item">
          <view class="timeline-dot start"></view>
          <view class="timeline-time">{{ formatTime(detail.start_time) }}</view>
          <view class="timeline-label">开始上钟</view>
        </view>
        <view class="timeline-item">
          <view class="timeline-dot end"></view>
          <view class="timeline-time">{{ detail.actual_end_time ? formatTime(detail.actual_end_time) : '—' }}</view>
          <view class="timeline-label">结束时间</view>
        </view>
      </view>
    </view>

    <!-- 操作按钮 -->
    <view class="actions" v-if="detail.status === 0">
      <view class="btn btn-danger" @click="endRecord">结束上钟</view>
      <view class="btn btn-secondary" @click="addService">追加项目</view>
    </view>
  </view>
</template>

<script>
  let vk = uni.vk;
  export default {
    data() {
      return {
        detail: {},
        statusText: {
          0: '进行中',
          1: '已完成',
          2: '已取消',
        },
        statusClass: '',
        progressPct: 0,
      };
    },
    computed: {
      totalDurationMs() {
        return (this.detail.duration || 60) * 60 * 1000;
      },
      remainingTime() {
        if (!this.detail.start_time) return 0;
        const elapsed = Date.now() - this.detail.start_time;
        return Math.max(0, this.totalDurationMs - elapsed);
      },
    },
    onLoad(options) {
      vk = uni.vk;
      if (options.id) {
        this.init(options);
      }
    },
    onPullDownRefresh() {
      setTimeout(() => {
        uni.stopPullDownRefresh();
      }, 1000);
    },
    methods: {
      init(options = {}) {
        if (options.id) {
          this.loadDetail(options.id);
        }
      },
      async loadDetail(id) {
        uni.showLoading({ title: '加载中' });
        let res = await vk.callFunction({
          url: 'client/record.getDetail',
          data: { id },
        });
        uni.hideLoading();
        if (res.code === 0) {
          this.detail = res.data;
          this.updateStatusClass();
          if (this.detail.status === 0 && this.detail.start_time) {
            const elapsed = Date.now() - this.detail.start_time;
            this.progressPct = Math.min(100, Math.round((elapsed / this.totalDurationMs) * 100));
          }
        } else {
          vk.toast({ title: res.msg });
        }
      },
      updateStatusClass() {
        const map = {
          0: 'active',
          1: 'completed',
          2: 'cancelled',
        };
        this.statusClass = map[this.detail.status] || '';
      },
      onCountDownChange(current) {
        const remainingMs = current.hours * 3600000 + current.minutes * 60000 + current.seconds * 1000 + current.milliseconds;
        const elapsed = this.totalDurationMs - remainingMs;
        this.progressPct = Math.min(100, Math.round((elapsed / this.totalDurationMs) * 100));
      },
      onCountDownFinish() {
        this.progressPct = 100;
      },
      formatDate(timestamp) {
        if (!timestamp) return '';
        let dateStr = vk.pubfn.timeFormat(timestamp, 'yyyy年M月d日');
        let weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
        let date = new Date(timestamp);
        return `${dateStr} ${weekDays[date.getDay()]}`;
      },
      formatTime(timestamp) {
        if (!timestamp) return '';
        return vk.pubfn.timeFormat(timestamp, 'hh:mm');
      },
      endRecord() {
        uni.showModal({
          title: '确认下钟',
          content: '确定要结束本次服务吗？',
          success: async (res) => {
            if (res.confirm) {
              uni.showLoading({ title: '处理中' });
              let result = await vk.callFunction({
                url: 'client/record.end',
                data: { id: this.detail._id },
              });
              uni.hideLoading();
              if (result.code === 0) {
                vk.toast({ title: '下钟成功' });
                this.detail.status = 1;
                this.detail.actual_end_time = Date.now();
                this.updateStatusClass();
              } else {
                vk.toast({ title: result.msg });
              }
            }
          },
        });
      },
      addService() {
        uni.navigateTo({
          url: `/pages/record/add?room_id=${this.detail.room_id}&room_name=${encodeURIComponent(this.detail.room_name || '')}`,
        });
      },
    },
  };
</script>

<style lang="scss" scoped>
  .app {
    --bg: #f5f6f8;
    --surface: #ffffff;
    --fg: #2a2d33;
    --muted: #7a7d85;
    --border: #e2e4e8;
    --accent: #1a9a6c;
    --accent-soft: #e8f7f0;
    --success: #1a9a6c;
    --success-soft: #e8f7f0;
    --warning: #d48806;
    --warning-soft: #fef3cd;
    --danger: #dc3545;
    --danger-soft: #fde8ea;
    --radius: 28rpx;

    min-height: 100vh;
    background: var(--bg);
    color: var(--fg);
    padding: 0 32rpx 160rpx;
  }

  /* Status card */
  .status-card {
    background: var(--surface);
    border: 3rpx solid var(--border);
    border-radius: var(--radius);
    padding: 40rpx;
    margin-bottom: 32rpx;
  }
  .status-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 32rpx;
  }
  .status-badge {
    display: inline-flex;
    align-items: center;
    gap: 12rpx;
    font-size: 26rpx;
    font-weight: 600;
    padding: 10rpx 28rpx;
    border-radius: 999rpx;
    letter-spacing: 1rpx;
  }
  .dot {
    width: 14rpx;
    height: 14rpx;
    border-radius: 50%;
    background: currentColor;
  }
  .status-badge.active {
    background: var(--accent-soft);
    color: var(--accent);
  }
  .status-badge.active .dot {
    animation: pulse-dot 2s ease-in-out infinite;
  }
  .status-badge.completed {
    background: var(--success-soft);
    color: var(--success);
  }
  .status-badge.cancelled {
    background: var(--danger-soft);
    color: var(--danger);
  }
  @keyframes pulse-dot {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.4; }
  }
  .badge-text {
    font-size: 26rpx;
    font-weight: 600;
  }
  .order-id {
    font-size: 24rpx;
    color: var(--muted);
    letter-spacing: 2rpx;
  }

  /* Service highlight */
  .service-highlight {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 32rpx;
  }
  .service-info {
    flex: 1;
  }
  .service-name {
    font-size: 40rpx;
    font-weight: 600;
    letter-spacing: -1rpx;
    line-height: 1.3;
    margin-bottom: 8rpx;
  }
  .service-duration {
    font-size: 26rpx;
    color: var(--muted);
    display: flex;
    align-items: center;
    gap: 8rpx;
  }
  .duration-text {
    font-size: 26rpx;
    color: var(--muted);
  }
  .service-price {
    color: var(--accent);
    flex-shrink: 0;
    line-height: 1.2;
  }
  .currency {
    font-size: 32rpx;
    font-weight: 500;
    margin-right: 2rpx;
  }
  .price-value {
    font-size: 52rpx;
    font-weight: 700;
    letter-spacing: -2rpx;
  }

  /* Tech card */
  .tech-card {
    background: var(--surface);
    border: 3rpx solid var(--border);
    border-radius: var(--radius);
    padding: 32rpx 40rpx;
    margin-bottom: 32rpx;
    display: flex;
    align-items: center;
    gap: 28rpx;
  }
  .tech-avatar {
    width: 96rpx;
    height: 96rpx;
    border-radius: 50%;
    background: var(--accent-soft);
    color: var(--accent);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 36rpx;
    font-weight: 600;
    flex-shrink: 0;
  }
  .tech-info {
    flex: 1;
    min-width: 0;
  }
  .tech-name {
    font-size: 32rpx;
    font-weight: 600;
    margin-bottom: 4rpx;
  }
  .tech-role {
    font-size: 24rpx;
    color: var(--muted);
  }
  .tech-badge {
    font-size: 22rpx;
    font-weight: 600;
    padding: 8rpx 20rpx;
    border-radius: 999rpx;
    background: var(--accent-soft);
    color: var(--accent);
    letter-spacing: 1rpx;
    flex-shrink: 0;
  }

  /* Info card */
  .info-card {
    background: var(--surface);
    border: 3rpx solid var(--border);
    border-radius: var(--radius);
    margin-bottom: 32rpx;
    overflow: hidden;
  }
  .info-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 28rpx 40rpx;
    min-height: 96rpx;
  }
  .info-row + .info-row {
    border-top: 1rpx solid var(--border);
  }
  .info-label {
    font-size: 28rpx;
    color: var(--muted);
    flex-shrink: 0;
  }
  .info-value {
    font-size: 30rpx;
    font-weight: 500;
    text-align: right;
    display: flex;
    align-items: center;
    gap: 12rpx;
  }
  .room-tile {
    display: inline-flex;
    align-items: center;
    gap: 16rpx;
    background: var(--surface);
    border: 3rpx solid var(--border);
    border-radius: 20rpx;
    padding: 12rpx 24rpx;
  }
  .room-number {
    font-size: 32rpx;
    font-weight: 700;
    letter-spacing: -1rpx;
  }

  /* Elapsed bar */
  .elapsed-bar {
    background: var(--surface);
    border: 3rpx solid var(--border);
    border-radius: var(--radius);
    padding: 32rpx 40rpx;
    margin-bottom: 32rpx;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .elapsed-left {
    display: flex;
    flex-direction: column;
    gap: 4rpx;
  }
  .elapsed-label {
    font-size: 24rpx;
    color: var(--muted);
    margin-bottom: 8rpx;
  }
  .elapsed-progress {
    flex-shrink: 0;
  }
  .pct {
    font-size: 22rpx;
    font-weight: 600;
    color: var(--accent);
  }

  /* Timeline */
  .timeline-card {
    padding: 40rpx;
  }
  .timeline-title {
    font-size: 26rpx;
    font-weight: 600;
    color: var(--muted);
    letter-spacing: 2rpx;
    margin-bottom: 32rpx;
  }
  .timeline {
    position: relative;
    padding-left: 40rpx;
  }
  .timeline::before {
    content: '';
    position: absolute;
    left: 10rpx;
    top: 16rpx;
    bottom: 16rpx;
    width: 4rpx;
    background: var(--border);
    border-radius: 2rpx;
  }
  .timeline-dot {
    position: absolute;
    left: 0;
    top: 12rpx;
    width: 24rpx;
    height: 24rpx;
    border-radius: 50%;
    border: 4rpx solid var(--accent);
    background: var(--surface);
  }
  .timeline-dot.end {
    border-color: var(--success);
  }
  .timeline-time {
    font-size: 34rpx;
    font-weight: 600;
    margin-bottom: 4rpx;
  }
  .timeline-label {
    font-size: 24rpx;
    color: var(--muted);
  }
  .timeline-item + .timeline-item {
    margin-top: 40rpx;
  }

  /* Actions */
  .actions {
    display: flex;
    gap: 20rpx;
    margin-top: 16rpx;
  }
  .btn {
    flex: 1;
    padding: 26rpx 0;
    border-radius: 24rpx;
    font-size: 30rpx;
    font-weight: 600;
    text-align: center;
    letter-spacing: 1rpx;
  }
  .btn-danger {
    background: var(--danger-soft);
    color: var(--danger);
  }
  .btn-secondary {
    background: var(--surface);
    color: var(--fg);
    border: 3rpx solid var(--border);
  }
</style>

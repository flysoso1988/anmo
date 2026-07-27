<template>
  <view class="app">
    <!-- 选择房间 -->
    <view class="section">
      <view class="section-title">选择房间</view>
      <view v-if="fixedRoomId" class="room-grid">
        <view class="room-tile selected">
          <text class="room-number">{{ form.room_name }}</text>
          <text class="room-label">已选择</text>
        </view>
      </view>
      <view v-else class="room-grid">
        <view v-for="room in roomList" :key="room._id" class="room-tile" :class="{ selected: form.room_id === room._id }" @click="selectRoom(room)">
          <text class="room-number">{{ room.name }}</text>
          <text class="room-label">{{ room.type === 1 ? 'VIP房' : '标准房' }}</text>
        </view>
      </view>
    </view>

    <!-- 选择技师 -->
    <view class="section">
      <view class="section-title">选择技师</view>
      <scroll-view scroll-x class="tech-scroll" :show-scrollbar="false">
        <view v-for="staff in staffList" :key="staff._id" class="tech-item" :class="{ selected: form.staff_id === staff._id }" @click="selectStaff(staff)">
          <view class="tech-avatar">
            <text class="tech-avatar-text">{{ staff.name ? staff.name.charAt(0) : '?' }}</text>
          </view>
          <text class="tech-name">{{ staff.name }}</text>
        </view>
      </scroll-view>
    </view>

    <!-- 选择服务项目 -->
    <view class="section">
      <view class="section-title">选择项目</view>
      <view class="service-list">
        <view v-for="service in serviceList" :key="service._id" class="service-card" :class="{ selected: form.service_id === service._id }" @click="selectService(service)">
          <view class="service-info">
            <text class="service-name">{{ service.name }}</text>
            <text class="service-meta">{{ service.duration }}分钟</text>
          </view>
          <text class="service-price">¥{{ service.price }}</text>
          <view class="service-check" :class="{ checked: form.service_id === service._id }">
            <text v-if="form.service_id === service._id" class="check-icon">✓</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 顾客信息 -->
    <view class="section">
      <view class="section-title">顾客信息（选填）</view>
      <view class="info-form">
        <view class="info-row">
          <text class="info-label">姓名</text>
          <input class="info-input" v-model="form.customer_name" placeholder="请输入顾客姓名" />
        </view>
        <view class="info-row">
          <text class="info-label">手机号</text>
          <input class="info-input" v-model="form.customer_phone" placeholder="请输入顾客手机号" type="number" :maxlength="11" />
        </view>
        <view class="info-row">
          <text class="info-label">备注</text>
          <input class="info-input" v-model="form.remark" placeholder="请输入备注" />
        </view>
      </view>
    </view>

    <!-- 底部固定栏 -->
    <view class="footer-bar">
      <view class="footer-summary">
        <text v-if="form.staff_name || form.service_name">
          已选 <text class="summary-bold">{{ form.staff_name || '—' }}</text>
          <text> · </text>
          <text class="summary-bold">{{ form.service_name || '—' }}</text>
        </text>
        <text v-else>请选择技师和服务项目</text>
      </view>
      <view class="btn-confirm" :class="{ disabled: !canSubmit }" @click="submit">
        <text class="btn-text">确认上钟</text>
      </view>
    </view>
  </view>
</template>

<script>
  import { useToast } from '@/uni_modules/wot-design-uni';

  let vk = uni.vk;
  export default {
    data() {
      return {
        staffList: [],
        roomList: [],
        serviceList: [],
        fixedRoomId: '',
        form: {
          staff_id: '',
          staff_name: '',
          room_id: '',
          room_name: '',
          service_id: '',
          service_name: '',
          customer_name: '',
          customer_phone: '',
          remark: '',
        },
        submitting: false,
      };
    },
    computed: {
      canSubmit() {
        return this.form.staff_id && this.form.room_id && this.form.service_id && !this.submitting;
      },
    },
    onLoad(options) {
      vk = uni.vk;
      this.toast = useToast();
      if (options.room_id) {
        this.fixedRoomId = options.room_id;
        this.form.room_id = options.room_id;
        this.form.room_name = decodeURIComponent(options.room_name || '');
      }
      this.init(options);
    },
    onPullDownRefresh() {
      setTimeout(() => {
        uni.stopPullDownRefresh();
      }, 1000);
    },
    methods: {
      init(options = {}) {
        this.loadData();
      },
      async loadData() {
        uni.showLoading({ title: '加载中' });
        try {
          let tasks = [this.loadStaffList(), this.loadServiceList()];
          if (!this.fixedRoomId) {
            tasks.push(this.loadRoomList());
          }
          await Promise.all(tasks);
        } catch (e) {
          console.error(e);
        } finally {
          uni.hideLoading();
        }
      },
      async loadStaffList() {
        let res = await vk.callFunction({ url: 'client/select.getStaffList' });
        if (res.code === 0) {
          this.staffList = res.list;
        }
      },
      async loadRoomList() {
        let res = await vk.callFunction({ url: 'client/select.getRoomList' });
        if (res.code === 0) {
          this.roomList = res.list;
        }
      },
      async loadServiceList() {
        let res = await vk.callFunction({ url: 'client/select.getServiceList' });
        if (res.code === 0) {
          this.serviceList = res.list;
        }
      },
      selectRoom(room) {
        this.form.room_id = room._id;
        this.form.room_name = room.name;
      },
      selectStaff(staff) {
        this.form.staff_id = staff._id;
        this.form.staff_name = staff.name;
      },
      selectService(service) {
        this.form.service_id = service._id;
        this.form.service_name = service.name;
      },
      async submit() {
        if (!this.canSubmit) return;
        if (!this.form.staff_id) {
          this.toast.show('请选择技师');
          return;
        }
        if (!this.form.room_id) {
          this.toast.show('请选择房间');
          return;
        }
        if (!this.form.service_id) {
          this.toast.show('请选择服务项目');
          return;
        }

        this.submitting = true;
        uni.showLoading({ title: '提交中' });
        try {
          let res = await vk.callFunction({
            url: 'client/record.add',
            data: {
              staff_id: this.form.staff_id,
              room_id: this.form.room_id,
              service_id: this.form.service_id,
              customer_name: this.form.customer_name,
              customer_phone: this.form.customer_phone,
              remark: this.form.remark,
            },
          });
          if (res.code === 0) {
            this.toast.success('上钟成功');
            setTimeout(() => {
              uni.navigateBack();
            }, 1500);
          } else {
            this.toast.show(res.msg);
          }
        } catch (e) {
          this.toast.show('提交失败');
          console.error(e);
        } finally {
          this.submitting = false;
          uni.hideLoading();
        }
      },
    },
  };
</script>

<style lang="scss" scoped>
  .app {
    --surface: #ffffff;
    --fg: #2a2d33;
    --muted: #7a7d85;
    --border: #e2e4e8;
    --accent: #1a9a6c;
    --accent-soft: #e8f7f0;
    --radius: 24rpx;

    min-height: 100vh;
    background: #f5f6f8;
    color: var(--fg);
    padding: 40rpx 32rpx 200rpx;
  }

  /* Section */
  .section {
    margin-bottom: 56rpx;
  }
  .section-title {
    font-size: 26rpx;
    font-weight: 600;
    color: var(--muted);
    letter-spacing: 2rpx;
    margin-bottom: 24rpx;
  }

  /* Room grid */
  .room-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 24rpx;
  }
  .room-tile {
    flex: 0 0 calc((100% - 48rpx) / 3);
    aspect-ratio: 1;
    background: var(--surface);
    border: 4rpx solid var(--border);
    border-radius: var(--radius);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    transition: border-color 0.15s, background 0.15s;
  }
  .room-tile.selected {
    border-color: var(--accent);
    background: var(--accent-soft);
  }
  .room-number {
    font-size: 56rpx;
    font-weight: 700;
    letter-spacing: -2rpx;
    line-height: 1;
    color: var(--fg);
  }
  .room-tile.selected .room-number {
    color: var(--accent);
  }
  .room-label {
    font-size: 24rpx;
    color: var(--muted);
    margin-top: 8rpx;
  }
  .room-tile.selected .room-label {
    color: var(--accent);
  }

  /* Tech scroll */
  .tech-scroll {
    display: flex;
    white-space: nowrap;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    padding-bottom: 16rpx;
  }
  .tech-item {
    display: inline-flex;
    flex-direction: column;
    align-items: center;
    gap: 16rpx;
    margin-right: 32rpx;
    flex-shrink: 0;
  }
  .tech-avatar {
    width: 128rpx;
    height: 128rpx;
    border-radius: 50%;
    background: var(--surface);
    border: 5rpx solid var(--border);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: border-color 0.15s;
  }
  .tech-item.selected .tech-avatar {
    border-color: var(--accent);
    background: var(--accent-soft);
  }
  .tech-avatar-text {
    font-size: 44rpx;
    color: var(--muted);
  }
  .tech-item.selected .tech-avatar-text {
    color: var(--accent);
  }
  .tech-name {
    font-size: 24rpx;
    color: var(--muted);
    text-align: center;
    line-height: 1.3;
  }
  .tech-item.selected .tech-name {
    color: var(--accent);
    font-weight: 600;
  }

  .service-list {
    display: flex;
    flex-direction: column;
    gap: 16rpx;
  }
  .service-card {
    background: var(--surface);
    border: 3rpx solid var(--border);
    border-radius: var(--radius);
    padding: 28rpx 32rpx;
    display: flex;
    align-items: center;
    justify-content: space-between;
    transition: border-color 0.15s, background 0.15s;
  }
  .service-card.selected {
    border-color: var(--accent);
    background: var(--accent-soft);
  }
  .service-info {
    display: flex;
    flex-direction: column;
    gap: 4rpx;
    flex: 1;
  }
  .service-name {
    font-size: 30rpx;
    font-weight: 500;
  }
  .service-meta {
    font-size: 24rpx;
    color: var(--muted);
  }
  .service-price {
    font-size: 34rpx;
    font-weight: 600;
    color: var(--accent);
    margin-left: 24rpx;
    margin-right: 24rpx;
  }
  .service-check {
    width: 44rpx;
    height: 44rpx;
    border-radius: 50%;
    border: 4rpx solid var(--border);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    transition: border-color 0.15s, background 0.15s;
  }
  .service-check.checked {
    border-color: var(--accent);
    background: var(--accent);
  }
  .check-icon {
    font-size: 24rpx;
    color: #ffffff;
    font-weight: 700;
  }

  /* Customer info form */
  .info-form {
    background: var(--surface);
    border-radius: var(--radius);
    overflow: hidden;
  }
  .info-row {
    display: flex;
    align-items: center;
    padding: 28rpx 32rpx;
    border-bottom: 1rpx solid var(--border);
  }
  .info-row:last-child {
    border-bottom: none;
  }
  .info-label {
    font-size: 30rpx;
    color: var(--fg);
    width: 140rpx;
    flex-shrink: 0;
  }
  .info-input {
    flex: 1;
    font-size: 30rpx;
    color: var(--fg);
  }

  /* Footer */
  .footer-bar {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    background: var(--surface);
    border-top: 1rpx solid var(--border);
    padding: 28rpx 32rpx;
    padding-bottom: calc(28rpx + env(safe-area-inset-bottom));
    display: flex;
    align-items: center;
    justify-content: space-between;
    z-index: 100;
  }
  .footer-summary {
    font-size: 26rpx;
    color: var(--muted);
    flex: 1;
  }
  .summary-bold {
    color: var(--fg);
    font-weight: 600;
  }
  .btn-confirm {
    background: var(--accent);
    border-radius: 20rpx;
    padding: 20rpx 48rpx;
    transition: opacity 0.15s;
    flex-shrink: 0;
  }
  .btn-confirm.disabled {
    opacity: 0.5;
  }
  .btn-text {
    font-size: 30rpx;
    font-weight: 600;
    color: #ffffff;
  }
</style>

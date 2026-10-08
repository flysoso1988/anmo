<template>
  <view class="app">
    <!-- 导航栏 start -->
    <wd-navbar
      title="房间管理"
      left-arrow
      fixed
      placeholder
      safe-area-inset-top
      custom-class="room-navbar"
      @click-left="handleBack"
    ></wd-navbar>
    <!-- 导航栏 end -->

    <!-- 房间列表 start -->
    <view class="room-list">
      <wd-card v-for="room in roomList" :key="room.id" custom-class="room-card">
        <view class="room" @click="onRoomClick(room)">
          <!-- 房间名 + 房态标签 -->
          <view class="room__head">
            <text class="room__name">{{ room.name }}</text>
            <wd-tag
              round
              size="small"
              variant="light"
              :color="room.tagColor"
              :bg-color="room.tagBg"
              :custom-style="tagStyle"
              >{{ room.status }}</wd-tag
            >
          </view>

          <!-- 技师 + 剩余时间 -->
          <text class="room__sub" v-if="room.sub">{{ room.sub }}</text>

          <!-- 服务中：单价 / 时长 + 服务进度 -->
          <view class="room__foot" v-if="room.price">
            <view class="room__price-row">
              <text class="room__price num">{{ room.price }}</text>
              <text class="room__duration num"> / {{ room.duration }}</text>
            </view>
            <!-- wd-circle 的 stroke-width 是视觉环厚的 2 倍（内部取一半为 lineWidth），6.8 对应设计稿 3.4px 环线 -->
            <wd-circle
              class="room-ring"
              :model-value="room.progress"
              :size="34"
              :stroke-width="6.8"
              color="#2979ff"
              layer-color="#e8f3ff"
              :text="room.progress + '%'"
            ></wd-circle>
          </view>

          <!-- 空闲 / 待清洁 / 维护中：说明 + 操作按钮 -->
          <view class="room__foot" v-else :class="{ 'room__foot--col': room.footCol }">
            <text class="room__note">{{ room.note }}</text>
            <wd-button
              round
              size="mini"
              type="primary"
              variant="soft"
              :custom-style="pillStyle"
              @click.stop="onRoomAction(room)"
              >{{ room.action }}</wd-button
            >
          </view>
        </view>
      </wd-card>
    </view>
    <!-- 房间列表 end -->
  </view>
</template>

<script>
  let vk = uni.vk;
  export default {
    data() {
      // 页面数据变量
      return {
        // init请求返回的数据
        data: {},
        // 表单请求数据
        form1: {},
        countdownTimer: null,
        tagStyle: 'padding: 3px 8px; border-radius: 999px; font-size: 11px; font-weight: 600; line-height: 1.55;',
        pillStyle: 'height: 30px; min-height: 30px; padding: 0 11px; border-radius: 999px; font-size: 12px; font-weight: 600; line-height: 1;',
        // 设计稿静态数据（后续接房间列表接口后替换）
        rooms: [
          { id: '101', name: '101 · 泰式厅', status: '服务中', sub: '林淑华 · 剩 22 分钟', remainSec: 22 * 60, price: '¥398', duration: '90分钟', progress: 76 },
          { id: '102', name: '102 · 中式厅', status: '服务中', sub: '周文博 · 剩 48 分钟', remainSec: 48 * 60, price: '¥268', duration: '60分钟', progress: 20 },
          { id: '103', name: '103 · 养生厅', status: '服务中', sub: '陈可欣 · 剩 11 分钟', remainSec: 11 * 60, price: '¥188', duration: '45分钟', progress: 76 },
          { id: '201', name: '201 · VIP 套房', status: '空闲', note: '可立即安排客人', action: '指派' },
          { id: '202', name: '202 · 日式厅', status: '空闲', note: '可立即安排客人', action: '指派' },
          { id: '203', name: '203 · 足疗厅', status: '空闲', note: '可立即安排客人', action: '指派' },
          { id: '301', name: '301 · 情侣厅', status: '空闲', note: '可立即安排客人', action: '指派' },
          { id: 'B1', name: 'B1 · 员工休息室', status: '待清洁', sub: '需完成清洁消毒', note: '上一单：韩式松骨 60 分钟', action: '去清洁', footCol: true },
          { id: '302', name: '302 · 泰式厅', status: '待清洁', sub: '需完成清洁消毒', note: '上一单：足底按摩 45 分钟', action: '去清洁', footCol: true },
          { id: '303', name: '303 · 头疗室', status: '维护中', sub: '暂停接待', note: '热水器故障 · 预计明日修复', action: '报修', footCol: true },
        ],
      };
    },
    // 监听 - 页面每次【加载时】执行(如：前进)
    onLoad(options = {}) {
      vk = uni.vk;
      this.options = options;
      this.init(options);
    },
    // 监听 - 页面【首次渲染完成时】执行。注意如果渲染速度快，会在页面进入动画完成前触发
    onReady() {},
    // 监听 - 页面每次【显示时】执行（如：前进和返回）（页面每次出现在屏幕上都触发，包括从下级页面点返回露出当前页面）
    onShow() {},
    // 监听 - 页面每次【隐藏时】执行（如：返回）
    onHide() {},
    // 监听 - 页面每次【卸载时】（一般用于取消页面上的监听器）
    onUnload() {
      this.stopCountdown();
    },
    // 监听 - 页面下拉刷新
    onPullDownRefresh() {
      setTimeout(() => {
        uni.stopPullDownRefresh();
      }, 1000);
    },
    /**
     * 监听 - 点击右上角转发时 文档 https://uniapp.dcloud.io/api/plugins/share?id=onshareappmessage
     * 如果删除onShareAppMessage函数，则微信小程序右上角转发按钮会自动变灰
     */
    onShareAppMessage(options) {},
    // 函数
    methods: {
      // 页面数据初始化函数
      init(options = {}) {
        console.log('init: ', options);
        this.startCountdown();
      },
      // 服务剩余时间倒计时
      startCountdown() {
        if (this.countdownTimer) return;
        this.countdownTimer = setInterval(() => {
          this.rooms.forEach((room) => {
            if (room.remainSec > 0) room.remainSec -= 1;
          });
        }, 1000);
      },
      stopCountdown() {
        if (this.countdownTimer) {
          clearInterval(this.countdownTimer);
          this.countdownTimer = null;
        }
      },
      remainMinute(room) {
        return Math.max(0, Math.ceil((room.remainSec || 0) / 60));
      },
      // 房态标签配色
      statusMeta(status) {
        if (status === '服务中') return { tagColor: '#2979ff', tagBg: '#e8f3ff' };
        if (status === '空闲') return { tagColor: '#86909c', tagBg: '#e8ffea' };
        if (status === '待清洁') return { tagColor: '#ff7d00', tagBg: '#fff7e8' };
        return { tagColor: '#f53f3f', tagBg: '#ffece8' };
      },
      // 返回上一页
      handleBack() {
        vk.navigateBack();
      },
      // 进入房间详情
      onRoomClick(room) {
        vk.navigateTo(`/pages_sub/room/detail/detail?id=${room.id}`);
      },
      // 卡片操作（指派 / 去清洁 / 报修）
      onRoomAction(room) {
        vk.toast(`${room.name} · ${room.action}`);
      },
    },
    // 监听器
    watch: {},
    // 计算属性
    computed: {
      roomList() {
        return this.rooms.map((room) => {
          const meta = this.statusMeta(room.status);
          return {
            ...room,
            tagColor: meta.tagColor,
            tagBg: meta.tagBg,
            sub: room.sub ? room.sub.replace(/剩 \d+ 分钟/, `剩 ${this.remainMinute(room)} 分钟`) : '',
          };
        });
      },
    },
  };
</script>
<style lang="scss">
  /* wot-ui 组件为 styleIsolation: shared，以下变量覆盖需写在非 scoped 作用域 */
  /* 主色对齐设计稿 #2979ff / #e8f3ff */
  .app {
    --wot-primary-6: #2979ff;
    --wot-primary-1: #e8f3ff;
  }
  .room-navbar {
    --wot-navbar-bg: #ffffff;
    --wot-navbar-color: #1d2129;
    --wot-navbar-title-font-size: 17px;
    --wot-navbar-title-font-weight: 600;
  }
  .room-card {
    --wot-card-bg: #ffffff;
    --wot-card-radius: 18px;
    --wot-card-shadow: none;
    --wot-card-margin-horizontal: 0;
    --wot-card-margin-bottom: 0;
    --wot-card-content-padding: 12px 14px;
    --wot-card-content-color: #1d2129;
    --wot-card-content-font-size: 12px;
    --wot-card-content-line-height: 1.55;
    border: 1px solid #e5e6eb;
    box-sizing: border-box;
  }
  /* 圆环：设计稿为 38x38 画布内嵌 33.4px 外径的环，故补 2px 内边距 */
  .room-ring {
    --wot-circle-text-font-size: 9px;
    --wot-circle-text-color: #1d2129;
    flex-shrink: 0;
    padding: 2px;
  }
  .room-ring .wd-circle__text {
    font-weight: 600;
  }
</style>
<style lang="scss" scoped>
  .app {
    min-height: 100vh;
    background: #f2f4f7;
  }
  .num {
    font-family: 'JetBrains Mono', 'DIN Alternate', ui-monospace, monospace;
  }

  /* 房间列表 */
  .room-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 16px 16px calc(24px + env(safe-area-inset-bottom));
    box-sizing: border-box;
  }
  .room {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .room__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }
  .room__name {
    font-size: 15px;
    font-weight: 600;
    color: #1d2129;
  }
  .room__sub {
    font-size: 12px;
    color: #86909c;
  }
  .room__foot {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 6px;
    padding-top: 11px;
    border-top: 1px solid #e5e6eb;
  }
  .room__foot--col {
    flex-direction: column;
    align-items: flex-start;
  }
  .room__price-row {
    display: flex;
    align-items: center;
  }
  .room__price,
  .room__duration {
    font-size: 15px;
    font-weight: 600;
    color: #1d2129;
  }
  .room__note {
    font-size: 12px;
    color: #86909c;
  }
</style>
